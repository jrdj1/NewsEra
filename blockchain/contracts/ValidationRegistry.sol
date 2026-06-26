// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReputationSystem {
    function canValidate(address validator) external view returns (bool);
    function increaseReputation(address validator, uint256 amount) external;
    function decreaseReputation(address validator, uint256 amount) external;
}

contract ValidationRegistry {
    enum VoteType      { TRUE, FALSE, UNVERIFIABLE }
    enum ConsensusState { PENDING, DEFINITIVE, DISPUTED }

    struct Validation {
        address  validator; // 20b ─┐ slot 1 (21b total, packed)
        VoteType vote;      //  1b ─┘
    }

    IReputationSystem public immutable reputationSystem;
    uint256           public immutable quorumThreshold;
    uint256           public immutable superMajorityBps; // e.g. 6667 = 66.67%

    uint256 private constant REPUTATION_REWARD  = 5;
    uint256 private constant REPUTATION_PENALTY = 3;

    mapping(bytes32 => Validation[])             private _validations;
    mapping(bytes32 => mapping(address => bool)) private _hasVoted;

    mapping(bytes32 => ConsensusState) public consensusState;
    mapping(bytes32 => VoteType)       public consensusResult;

    event ValidationSubmitted(
        bytes32 indexed contentHash,
        address indexed validator,
        uint8           vote
    );
    event ConsensusReached(bytes32 indexed contentHash, uint8 result, uint8 state);

    error InsufficientReputation(address validator);
    error AlreadyValidated(bytes32 contentHash, address validator);
    error ConsensusAlreadyReached(bytes32 contentHash);

    constructor(
        address reputationSystem_,
        uint256 quorumThreshold_,
        uint256 superMajorityBps_
    ) {
        reputationSystem = IReputationSystem(reputationSystem_);
        quorumThreshold  = quorumThreshold_;
        superMajorityBps = superMajorityBps_;
    }

    function submitValidation(bytes32 contentHash, uint8 vote) external {
        if (consensusState[contentHash] != ConsensusState.PENDING)
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
        uint256 total = vals.length;
        if (total < quorumThreshold) return;

        uint256 trueVotes;
        uint256 falseVotes;
        uint256 unverifiableVotes;
        for (uint256 i; i < total; i++) {
            if      (vals[i].vote == VoteType.TRUE)          trueVotes++;
            else if (vals[i].vote == VoteType.FALSE)         falseVotes++;
            else                                             unverifiableVotes++;
        }

        // Determinar opción ganadora (mayor número de votos)
        uint256 winnerVotes;
        VoteType result;
        if (trueVotes >= falseVotes && trueVotes >= unverifiableVotes) {
            winnerVotes = trueVotes;
            result = VoteType.TRUE;
        } else if (falseVotes >= trueVotes && falseVotes >= unverifiableVotes) {
            winnerVotes = falseVotes;
            result = VoteType.FALSE;
        } else {
            winnerVotes = unverifiableVotes;
            result = VoteType.UNVERIFIABLE;
        }

        uint256 winnerBps = (winnerVotes * 10_000) / total;

        if (winnerBps >= superMajorityBps) {
            consensusState[contentHash]  = ConsensusState.DEFINITIVE;
            consensusResult[contentHash] = result;
            emit ConsensusReached(contentHash, uint8(result), uint8(ConsensusState.DEFINITIVE));

            // Efectos reputacionales simétricos: todos los que no votaron result son penalizados
            for (uint256 i; i < total; i++) {
                if (vals[i].vote == result) {
                    reputationSystem.increaseReputation(vals[i].validator, REPUTATION_REWARD);
                } else {
                    reputationSystem.decreaseReputation(vals[i].validator, REPUTATION_PENALTY);
                }
            }
        } else {
            consensusState[contentHash]  = ConsensusState.DISPUTED;
            consensusResult[contentHash] = result;
            emit ConsensusReached(contentHash, uint8(result), uint8(ConsensusState.DISPUTED));
            // Sin efectos reputacionales en DISPUTED
        }
    }

    function getValidations(bytes32 contentHash)
        external view returns (Validation[] memory)
    {
        return _validations[contentHash];
    }

    function hasValidated(bytes32 contentHash, address validator)
        external view returns (bool)
    {
        return _hasVoted[contentHash][validator];
    }
}
