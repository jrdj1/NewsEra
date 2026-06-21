// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PublicationRegistry
/// @notice Registro inmutable de hashes keccak256 de publicaciones.
///         Cualquier dirección puede registrar; nadie puede modificar ni borrar.
contract PublicationRegistry {
    // address (20 b) + uint96 (12 b) = 32 b → un slot de almacenamiento
    struct Publication {
        address author;
        uint96  timestamp;
        bool    exists;   // slot 2 (1 b) — separa lógicamente "vacío" de "registrado"
    }

    mapping(bytes32 => Publication) public publications;

    event PublicationRegistered(
        bytes32 indexed contentHash,
        address indexed author,
        uint256         timestamp
    );

    error PublicationAlreadyExists(bytes32 contentHash);
    error PublicationNotFound(bytes32 contentHash);

    /// @notice Registra el hash de una publicación. Revierte si ya existe.
    function registerPublication(bytes32 contentHash) external {
        if (publications[contentHash].exists) {
            revert PublicationAlreadyExists(contentHash);
        }

        uint96 ts = uint96(block.timestamp);

        publications[contentHash] = Publication({
            author:    msg.sender,
            timestamp: ts,
            exists:    true
        });

        emit PublicationRegistered(contentHash, msg.sender, ts);
    }

    /// @notice Devuelve los datos de una publicación. Revierte si no existe.
    function getPublication(bytes32 contentHash)
        external
        view
        returns (Publication memory)
    {
        if (!publications[contentHash].exists) {
            revert PublicationNotFound(contentHash);
        }
        return publications[contentHash];
    }
}
