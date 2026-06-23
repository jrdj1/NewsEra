// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReputationSystem {
    function canValidate(address validator) external view returns (bool);
    function increaseReputation(address validator, uint256 amount) external;
    function decreaseReputation(address validator, uint256 amount) external;
}

contract ValidationRegistry {
    enum VoteType { TRUE, FALSE, UNVERIFIABLE }

    struct Validation {
        address  validator; // 20b ─┐ slot 1 (21b total)
        VoteType vote;      //  1b ─┘
    }

    IReputationSystem public immutable reputationSystem;
    uint256           public immutable quorumThreshold;

    uint256 private constant REPUTATION_REWARD  = 5;
    uint256 private constant REPUTATION_PENALTY = 3;

    mapping(bytes32 => Validation[])              private _validations;
    mapping(bytes32 => mapping(address => bool))  private _hasVoted;

    mapping(bytes32 => bool)     public consensusReached;
    mapping(bytes32 => VoteType) public consensusResult;

    event ValidationSubmitted(
        bytes32 indexed contentHash,
        address indexed validator,
        uint8           vote
    );
    event ConsensusReached(bytes32 indexed contentHash, uint8 result);

    error InsufficientReputation(address validator);
    error AlreadyValidated(bytes32 contentHash, address validator);
    error ConsensusAlreadyReached(bytes32 contentHash);

    constructor(address reputationSystem_, uint256 quorumThreshold_) {
        reputationSystem = IReputationSystem(reputationSystem_);
        quorumThreshold  = quorumThreshold_;
    }

    function submitValidation(bytes32 contentHash, uint8 vote) external {
        if (consensusReached[contentHash])
            revert ConsensusAlreadyReached(contentHash);
        if (!reputationSystem.canValidate(msg.sender))
            revert InsufficientReputation(msg.sender);
        if (_hasVoted[contentHash][msg.sender])
            revert AlreadyValidated(contentHash, msg.sender);

        VoteType voteType = VoteType(vote);
        _validations[contentHash].push(Validation({ validator: msg.sender, vote: voteType }));
        _hasVoted[contentHash][msg.sender] = true;

        emit ValidationSubmitted(contentHash, msg.sender, vote);

        _checkConsensus(contentHash);
    }

    function _checkConsensus(bytes32 contentHash) internal {
        Validation[] storage vals = _validations[contentHash];
        if (vals.length < quorumThreshold) return;

        uint256 trueVotes;
        uint256 falseVotes;
        for (uint256 i; i < vals.length; i++) {
            if      (vals[i].vote == VoteType.TRUE)  trueVotes++;
            else if (vals[i].vote == VoteType.FALSE) falseVotes++;
        }

        // Empate (incl. todos UNVERIFIABLE: 0 == 0) → sin consenso todavía
        if (trueVotes == falseVotes) return;

        VoteType result = trueVotes > falseVotes ? VoteType.TRUE : VoteType.FALSE;
        consensusReached[contentHash] = true;
        consensusResult[contentHash]  = result;

        emit ConsensusReached(contentHash, uint8(result));

        for (uint256 i; i < vals.length; i++) {
            if (vals[i].vote == VoteType.UNVERIFIABLE) continue;
            if (vals[i].vote == result) {
                reputationSystem.increaseReputation(vals[i].validator, REPUTATION_REWARD);
            } else {
                reputationSystem.decreaseReputation(vals[i].validator, REPUTATION_PENALTY);
            }
        }
    }

    function getValidations(bytes32 contentHash)
        external view returns (Validation[] memory)
    {
        return _validations[contentHash];
    }
}
