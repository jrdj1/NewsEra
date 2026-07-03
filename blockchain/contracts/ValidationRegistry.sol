// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReputationSystem {
    function canValidate(address validator) external view returns (bool);
    function increaseReputation(address validator, uint256 amount) external;
    function decreaseReputation(address validator, uint256 amount) external;
}

interface IPublicationRegistry {
    struct Publication {
        address author;
        uint96  timestamp;
        bool    exists;
    }
    function getPublication(bytes32 contentHash) external view returns (Publication memory);
}

contract ValidationRegistry {
    enum VoteType       { TRUE, FALSE, UNVERIFIABLE }
    enum ConsensusState { PENDING, DEFINITIVE, DISPUTED, PENDING_REOPEN }

    struct RoundInfo {
        VoteType       result;
        ConsensusState state;
        bool           completed;
    }

    IReputationSystem   public immutable reputationSystem;
    IPublicationRegistry public immutable publicationRegistry;
    uint256             public immutable quorumThreshold;
    uint256             public immutable superMajorityBps;  // e.g. 6667 = 66.67%
    uint256             public immutable reopenThreshold;

    uint256 private constant REPUTATION_REWARD  = 5;
    uint256 private constant REPUTATION_PENALTY = 3;
    uint256 private constant RETROACTIVE_DELTA  = 1;
    uint256 private constant RETROACTIVE_CAP    = 3;

    uint256 private constant PUBLISH_REPUTATION_REWARD               = 8;
    uint256 private constant PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE = 8;
    uint256 private constant PUBLISH_REPUTATION_PENALTY_FALSE        = 15;
    uint256 private constant PREDICTION_REWARD  = 1;
    uint256 private constant PREDICTION_PENALTY = 1;

    // Current article state
    mapping(bytes32 => ConsensusState) public consensusState;
    mapping(bytes32 => uint256)        public currentRound;

    // Per-round data
    mapping(bytes32 => mapping(uint256 => RoundInfo))                    public  rounds;
    mapping(bytes32 => mapping(uint256 => uint256))                      public  roundVoteCount;
    mapping(bytes32 => mapping(uint256 => address[]))                    private _roundVoters;
    mapping(bytes32 => mapping(uint256 => mapping(VoteType => uint256))) private _roundVoteCounts;

    // Per-voter (immutable once cast)
    mapping(bytes32 => mapping(address => bool))     private _hasVoted;
    mapping(bytes32 => mapping(address => VoteType)) private _vote;
    mapping(bytes32 => mapping(address => uint256))  public  voterRound;

    // Re-open requests
    mapping(bytes32 => uint256)                  public reopenRequestCount;
    mapping(bytes32 => mapping(address => bool)) public hasRequestedReopen;

    // Retroactive reputation tracking (pull model)
    mapping(bytes32 => mapping(address => uint256)) private _retroLastRound;
    mapping(bytes32 => mapping(address => uint256)) private _retroPositive;
    mapping(bytes32 => mapping(address => uint256)) private _retroNegative;

    // Publish reward: applied once per article, the first time it reaches DEFINITIVE
    mapping(bytes32 => bool) private _authorRewarded;

    // Predictions: practice votes from addresses not yet eligible to validate.
    // Do not count toward roundVoteCount/quorum; resolved automatically alongside
    // real voters when their round reaches DEFINITIVE.
    mapping(bytes32 => mapping(address => bool))     private _hasPredicted;
    mapping(bytes32 => mapping(address => VoteType)) private _prediction;
    mapping(bytes32 => mapping(uint256 => address[])) private _roundPredictors;

    event ValidationSubmitted(
        bytes32 indexed contentHash,
        address indexed validator,
        uint8           vote,
        uint256         round
    );
    event ConsensusReached(
        bytes32 indexed contentHash,
        uint8           result,
        uint8           state,
        uint256         round
    );
    event ReopenRequested(
        bytes32 indexed contentHash,
        address indexed requester,
        uint256         count
    );
    event VotingReopened(bytes32 indexed contentHash, uint256 newRound);
    event RetroactiveClaimed(
        bytes32 indexed contentHash,
        address indexed validator,
        int256          netDelta
    );
    event PredictionSubmitted(
        bytes32 indexed contentHash,
        address indexed predictor,
        uint8           vote,
        uint256         round
    );

    error InsufficientReputation(address validator);
    error AlreadyValidated(bytes32 contentHash, address validator);
    error VotingNotOpen(bytes32 contentHash);
    error ReopenNotAvailable(bytes32 contentHash);
    error AlreadyRequestedReopen(bytes32 contentHash, address requester);
    error NothingToClaim(bytes32 contentHash, address validator);
    error NotEligibleForPrediction(address predictor);

    constructor(
        address reputationSystem_,
        uint256 quorumThreshold_,
        uint256 superMajorityBps_,
        uint256 reopenThreshold_,
        address publicationRegistry_
    ) {
        reputationSystem     = IReputationSystem(reputationSystem_);
        quorumThreshold      = quorumThreshold_;
        superMajorityBps     = superMajorityBps_;
        reopenThreshold      = reopenThreshold_;
        publicationRegistry  = IPublicationRegistry(publicationRegistry_);
    }

    // -----------------------------------------------------------------------
    // Voting
    // -----------------------------------------------------------------------

    function submitValidation(bytes32 contentHash, uint8 vote) external {
        if (consensusState[contentHash] != ConsensusState.PENDING)
            revert VotingNotOpen(contentHash);
        if (!reputationSystem.canValidate(msg.sender))
            revert InsufficientReputation(msg.sender);
        if (_hasVoted[contentHash][msg.sender] || _hasPredicted[contentHash][msg.sender])
            revert AlreadyValidated(contentHash, msg.sender);

        VoteType voteType = VoteType(vote);
        uint256  round    = currentRound[contentHash];

        _hasVoted[contentHash][msg.sender]  = true;
        _vote[contentHash][msg.sender]      = voteType;
        voterRound[contentHash][msg.sender] = round;
        _roundVoters[contentHash][round].push(msg.sender);
        _roundVoteCounts[contentHash][round][voteType]++;
        roundVoteCount[contentHash][round]++;

        emit ValidationSubmitted(contentHash, msg.sender, vote, round);
        _checkConsensus(contentHash, round);
    }

    // -----------------------------------------------------------------------
    // Predictions — meritocratic access for addresses not yet eligible to vote
    // -----------------------------------------------------------------------

    /// @notice Registers a practice prediction for an address with canValidate == false.
    ///         Invisible to quorum/supermajority; resolved automatically alongside
    ///         real voters when the round reaches DEFINITIVE.
    function submitPrediction(bytes32 contentHash, uint8 vote) external {
        if (consensusState[contentHash] != ConsensusState.PENDING)
            revert VotingNotOpen(contentHash);
        if (reputationSystem.canValidate(msg.sender))
            revert NotEligibleForPrediction(msg.sender);
        if (_hasVoted[contentHash][msg.sender] || _hasPredicted[contentHash][msg.sender])
            revert AlreadyValidated(contentHash, msg.sender);

        VoteType voteType = VoteType(vote);
        uint256  round    = currentRound[contentHash];

        _hasPredicted[contentHash][msg.sender] = true;
        _prediction[contentHash][msg.sender]   = voteType;
        _roundPredictors[contentHash][round].push(msg.sender);

        emit PredictionSubmitted(contentHash, msg.sender, vote, round);
    }

    // -----------------------------------------------------------------------
    // Re-opening
    // -----------------------------------------------------------------------

    /// @notice Request to reopen voting on a concluded article.
    ///         Only validators who have not yet voted on this article may request.
    ///         Once `reopenThreshold` requests accumulate, a new voting round opens.
    function requestReopen(bytes32 contentHash) external {
        ConsensusState state = consensusState[contentHash];
        if (state != ConsensusState.DEFINITIVE && state != ConsensusState.DISPUTED)
            revert ReopenNotAvailable(contentHash);
        if (_hasVoted[contentHash][msg.sender])
            revert AlreadyValidated(contentHash, msg.sender);
        if (hasRequestedReopen[contentHash][msg.sender])
            revert AlreadyRequestedReopen(contentHash, msg.sender);
        if (!reputationSystem.canValidate(msg.sender))
            revert InsufficientReputation(msg.sender);

        hasRequestedReopen[contentHash][msg.sender] = true;
        uint256 count = ++reopenRequestCount[contentHash];
        emit ReopenRequested(contentHash, msg.sender, count);

        if (count >= reopenThreshold) {
            reopenRequestCount[contentHash] = 0;
            uint256 newRound = ++currentRound[contentHash];
            consensusState[contentHash] = ConsensusState.PENDING;
            emit VotingReopened(contentHash, newRound);
        }
    }

    // -----------------------------------------------------------------------
    // Retroactive reputation (pull model)
    // -----------------------------------------------------------------------

    /// @notice Claim retroactive reputation adjustments for all rounds completed
    ///         after the caller's voting round. Each subsequent DEFINITIVE round
    ///         that confirms or contradicts the caller's original round result
    ///         applies ±RETROACTIVE_DELTA, capped at ±RETROACTIVE_CAP total.
    ///         Caller pays gas; this keeps _checkConsensus O(voters) not O(all_voters).
    function claimRetroactiveReputation(bytes32 contentHash) external {
        if (!_hasVoted[contentHash][msg.sender])
            revert NothingToClaim(contentHash, msg.sender);

        uint256 myRound     = voterRound[contentHash][msg.sender];
        uint256 latestRound = currentRound[contentHash];
        uint256 startRound  = _retroLastRound[contentHash][msg.sender];
        if (startRound == 0) startRound = myRound + 1;

        if (startRound > latestRound)
            revert NothingToClaim(contentHash, msg.sender);

        RoundInfo storage myRI = rounds[contentHash][myRound];
        bool wasCorrect = myRI.completed &&
                          myRI.state == ConsensusState.DEFINITIVE &&
                          _vote[contentHash][msg.sender] == myRI.result;

        uint256 posUsed = _retroPositive[contentHash][msg.sender];
        uint256 negUsed = _retroNegative[contentHash][msg.sender];
        int256  net     = 0;

        for (uint256 r = startRound; r <= latestRound; r++) {
            RoundInfo storage ri = rounds[contentHash][r];
            if (!ri.completed || ri.state != ConsensusState.DEFINITIVE) continue;

            bool confirms = ri.result == myRI.result;

            if (confirms) {
                if (wasCorrect && posUsed < RETROACTIVE_CAP) {
                    reputationSystem.increaseReputation(msg.sender, RETROACTIVE_DELTA);
                    posUsed++;
                    net += int256(RETROACTIVE_DELTA);
                } else if (!wasCorrect && negUsed < RETROACTIVE_CAP) {
                    reputationSystem.decreaseReputation(msg.sender, RETROACTIVE_DELTA);
                    negUsed++;
                    net -= int256(RETROACTIVE_DELTA);
                }
            } else {
                // contradicts
                if (wasCorrect && negUsed < RETROACTIVE_CAP) {
                    reputationSystem.decreaseReputation(msg.sender, RETROACTIVE_DELTA);
                    negUsed++;
                    net -= int256(RETROACTIVE_DELTA);
                } else if (!wasCorrect && posUsed < RETROACTIVE_CAP) {
                    reputationSystem.increaseReputation(msg.sender, RETROACTIVE_DELTA);
                    posUsed++;
                    net += int256(RETROACTIVE_DELTA);
                }
            }
        }

        _retroPositive[contentHash][msg.sender]  = posUsed;
        _retroNegative[contentHash][msg.sender]  = negUsed;
        // latestRound + 1: la siguiente llamada arranca en la ronda genuinamente nueva,
        // evitando el re-procesado de la última ronda ya contabilizada.
        _retroLastRound[contentHash][msg.sender] = latestRound + 1;

        emit RetroactiveClaimed(contentHash, msg.sender, net);
    }

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    function _checkConsensus(bytes32 contentHash, uint256 round) internal {
        if (roundVoteCount[contentHash][round] < quorumThreshold) return;

        uint256 trueV  = _roundVoteCounts[contentHash][round][VoteType.TRUE];
        uint256 falseV = _roundVoteCounts[contentHash][round][VoteType.FALSE];
        uint256 unverV = _roundVoteCounts[contentHash][round][VoteType.UNVERIFIABLE];
        uint256 total  = roundVoteCount[contentHash][round];

        VoteType winner;
        uint256  winnerVotes;
        if (trueV >= falseV && trueV >= unverV) {
            winner = VoteType.TRUE;         winnerVotes = trueV;
        } else if (falseV >= trueV && falseV >= unverV) {
            winner = VoteType.FALSE;        winnerVotes = falseV;
        } else {
            winner = VoteType.UNVERIFIABLE; winnerVotes = unverV;
        }

        uint256 winnerBps = (winnerVotes * 10_000) / total;
        RoundInfo storage ri = rounds[contentHash][round];

        if (winnerBps >= superMajorityBps) {
            ri.result = winner; ri.state = ConsensusState.DEFINITIVE; ri.completed = true;
            consensusState[contentHash] = ConsensusState.DEFINITIVE;
            emit ConsensusReached(contentHash, uint8(winner), uint8(ConsensusState.DEFINITIVE), round);

            address[] storage voters = _roundVoters[contentHash][round];
            for (uint256 i; i < voters.length; i++) {
                if (_vote[contentHash][voters[i]] == winner)
                    reputationSystem.increaseReputation(voters[i], REPUTATION_REWARD);
                else
                    reputationSystem.decreaseReputation(voters[i], REPUTATION_PENALTY);
            }

            address[] storage predictors = _roundPredictors[contentHash][round];
            for (uint256 i; i < predictors.length; i++) {
                if (_prediction[contentHash][predictors[i]] == winner)
                    reputationSystem.increaseReputation(predictors[i], PREDICTION_REWARD);
                else
                    reputationSystem.decreaseReputation(predictors[i], PREDICTION_PENALTY);
            }

            if (!_authorRewarded[contentHash]) {
                _authorRewarded[contentHash] = true;
                address author = publicationRegistry.getPublication(contentHash).author;
                if (winner == VoteType.TRUE) {
                    reputationSystem.increaseReputation(author, PUBLISH_REPUTATION_REWARD);
                } else if (winner == VoteType.UNVERIFIABLE) {
                    reputationSystem.decreaseReputation(author, PUBLISH_REPUTATION_PENALTY_UNVERIFIABLE);
                } else {
                    reputationSystem.decreaseReputation(author, PUBLISH_REPUTATION_PENALTY_FALSE);
                }
            }
        } else {
            ri.result = winner; ri.state = ConsensusState.DISPUTED; ri.completed = true;
            consensusState[contentHash] = ConsensusState.DISPUTED;
            emit ConsensusReached(contentHash, uint8(winner), uint8(ConsensusState.DISPUTED), round);
        }
    }

    // -----------------------------------------------------------------------
    // View helpers
    // -----------------------------------------------------------------------

    function getVote(bytes32 contentHash, address validator)
        external view
        returns (VoteType vote_, uint256 round_)
    {
        return (_vote[contentHash][validator], voterRound[contentHash][validator]);
    }

    function getRoundVoters(bytes32 contentHash, uint256 round)
        external view
        returns (address[] memory)
    {
        return _roundVoters[contentHash][round];
    }

    function hasVoted(bytes32 contentHash, address validator)
        external view
        returns (bool)
    {
        return _hasVoted[contentHash][validator];
    }
}
