// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title SignatureRegistry
/// @notice Guarda el hash de una firma manuscrita vinculada a una wallet.
contract SignatureRegistry {
    event SignatureStored(address indexed user, bytes32 signatureHash, uint256 timestamp);

    mapping(address => bytes32) public lastSignature;

    /// @notice Guarda el hash de la firma
    /// @param signatureHash keccak256 del PNG de la firma manuscrita
    function storeSignature(bytes32 signatureHash) external {
        lastSignature[msg.sender] = signatureHash;
        emit SignatureStored(msg.sender, signatureHash, block.timestamp);
    }

    /// @notice Recupera el último hash guardado por un usuario
    function getSignature(address user) external view returns (bytes32) {
        return lastSignature[user];
    }
}
