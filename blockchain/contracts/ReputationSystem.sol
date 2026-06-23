// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ReputationSystem is AccessControl {
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    uint256 public constant MIN_REPUTATION_TO_VALIDATE = 10;
    uint256 public constant REPUTATION_REWARD           = 5;
    uint256 public constant REPUTATION_PENALTY          = 3;

    mapping(address => uint256) private _reputation;
    mapping(address => bool)    private _registered;

    event ReputationUpdated(
        address indexed validator,
        uint256 newScore,
        bool    increased
    );

    error ValidatorAlreadyRegistered(address validator);
    error ValidatorNotRegistered(address validator);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function registerValidator(address validator, uint256 initialReputation)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (_registered[validator]) revert ValidatorAlreadyRegistered(validator);
        _registered[validator] = true;
        _reputation[validator] = initialReputation;
        emit ReputationUpdated(validator, initialReputation, true);
    }

    function increaseReputation(address validator, uint256 amount)
        external onlyRole(VALIDATOR_ROLE)
    {
        _reputation[validator] += amount;
        emit ReputationUpdated(validator, _reputation[validator], true);
    }

    function decreaseReputation(address validator, uint256 amount)
        external onlyRole(VALIDATOR_ROLE)
    {
        uint256 current = _reputation[validator];
        _reputation[validator] = current > amount ? current - amount : 0;
        emit ReputationUpdated(validator, _reputation[validator], false);
    }

    function getReputation(address validator) external view returns (uint256) {
        return _reputation[validator];
    }

    function canValidate(address validator) external view returns (bool) {
        return _reputation[validator] >= MIN_REPUTATION_TO_VALIDATE;
    }

    function isRegisteredValidator(address validator) public view returns (bool) {
        return _registered[validator];
    }
}
