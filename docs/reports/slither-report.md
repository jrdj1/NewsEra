<!-- Generado automáticamente por .github/workflows/slither.yml — no editar a mano. -->
# Informe de Slither

- **Commit:** testsha123
- **Fecha:** 2026-07-04T11:31:30Z

**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [reentrancy-no-eth](#reentrancy-no-eth) (1 results) (Medium)
 - [calls-loop](#calls-loop) (8 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (1 results) (Low)
 - [reentrancy-events](#reentrancy-events) (1 results) (Low)
 - [pragma](#pragma) (1 results) (Informational)
 - [solc-version](#solc-version) (1 results) (Informational)
 - [missing-inheritance](#missing-inheritance) (2 results) (Informational)
## reentrancy-no-eth
Impact: Medium
Confidence: Medium
 - [ ] ID-0
Reentrancy in [ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280):
	External calls:
	- [reputationSystem.increaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L251)
	- [reputationSystem.decreaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L255)
	- [reputationSystem.decreaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L262)
	- [reputationSystem.increaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L266)
	State variables written after the call(s):
	- [_retroLastRound[contentHash][msg.sender] = latestRound + 1](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L277)
	[ValidationRegistry._retroLastRound](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L66) can be used in cross function reentrancies:
	- [ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280)
	- [_retroNegative[contentHash][msg.sender] = negUsed](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L274)
	[ValidationRegistry._retroNegative](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L68) can be used in cross function reentrancies:
	- [ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280)
	- [_retroPositive[contentHash][msg.sender] = posUsed](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L273)
	[ValidationRegistry._retroPositive](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L67) can be used in cross function reentrancies:
	- [ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280


## calls-loop
Impact: Low
Confidence: Medium
 - [ ] ID-1
[ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280) has external calls inside a loop: [reputationSystem.increaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L251)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280


 - [ ] ID-2
[ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280) has external calls inside a loop: [reputationSystem.increaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L266)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280


 - [ ] ID-3
[ValidationRegistry._checkConsensus(bytes32,uint256)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344) has external calls inside a loop: [reputationSystem.increaseReputation(voters[i],REPUTATION_REWARD)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L315)
	Calls stack containing the loop:
		ValidationRegistry.submitValidation(bytes32,uint8)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344


 - [ ] ID-4
[ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280) has external calls inside a loop: [reputationSystem.decreaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L262)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280


 - [ ] ID-5
[ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280) has external calls inside a loop: [reputationSystem.decreaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L255)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280


 - [ ] ID-6
[ValidationRegistry._checkConsensus(bytes32,uint256)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344) has external calls inside a loop: [reputationSystem.decreaseReputation(voters[i],REPUTATION_PENALTY)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L317)
	Calls stack containing the loop:
		ValidationRegistry.submitValidation(bytes32,uint8)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344


 - [ ] ID-7
[ValidationRegistry._checkConsensus(bytes32,uint256)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344) has external calls inside a loop: [reputationSystem.decreaseReputation(predictors[i_scope_0],PREDICTION_PENALTY)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L325)
	Calls stack containing the loop:
		ValidationRegistry.submitValidation(bytes32,uint8)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344


 - [ ] ID-8
[ValidationRegistry._checkConsensus(bytes32,uint256)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344) has external calls inside a loop: [reputationSystem.increaseReputation(predictors[i_scope_0],PREDICTION_REWARD)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L323)
	Calls stack containing the loop:
		ValidationRegistry.submitValidation(bytes32,uint8)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-9
Reentrancy in [ValidationRegistry._checkConsensus(bytes32,uint256)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344):
	External calls:
	- [reputationSystem.increaseReputation(voters[i],REPUTATION_REWARD)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L315)
	- [reputationSystem.decreaseReputation(voters[i],REPUTATION_PENALTY)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L317)
	- [reputationSystem.increaseReputation(predictors[i_scope_0],PREDICTION_REWARD)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L323)
	- [reputationSystem.decreaseReputation(predictors[i_scope_0],PREDICTION_PENALTY)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L325)
	State variables written after the call(s):
	- [_authorRewarded[contentHash] = true](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L329)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L286-L344


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-10
Reentrancy in [ValidationRegistry.claimRetroactiveReputation(bytes32)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280):
	External calls:
	- [reputationSystem.increaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L251)
	- [reputationSystem.decreaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L255)
	- [reputationSystem.decreaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L262)
	- [reputationSystem.increaseReputation(msg.sender,RETROACTIVE_DELTA)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L266)
	Event emitted after the call(s):
	- [RetroactiveClaimed(contentHash,msg.sender,net)](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L279)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L222-L280


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-11
3 different versions of Solidity are used:
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4)
		-[^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
		-[^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4)
		-[^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/PublicationRegistry.sol#L2)
		-[^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ReputationSystem.sol#L2)
		-[^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L2)
	- Version constraint >=0.8.4 is used by:
		-[>=0.8.4](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/access/IAccessControl.sol#L4)
	- Version constraint >=0.4.16 is used by:
		-[>=0.4.16](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-12
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4)
	- [^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
	- [^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4)
	- [^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/PublicationRegistry.sol#L2)
	- [^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ReputationSystem.sol#L2)
	- [^0.8.20](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L2)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4


## missing-inheritance
Impact: Informational
Confidence: High
 - [ ] ID-13
[ReputationSystem](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ReputationSystem.sol#L6-L64) should inherit from [IReputationSystem](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L4-L8)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ReputationSystem.sol#L6-L64


 - [ ] ID-14
[PublicationRegistry](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/PublicationRegistry.sol#L7-L54) should inherit from [IPublicationRegistry](https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/ValidationRegistry.sol#L10-L17)

https://github.com/jrdj1/NewsEra/blob/develop/blockchain/contracts/PublicationRegistry.sol#L7-L54


