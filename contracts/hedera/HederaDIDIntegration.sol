// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HederaDIDIntegration
 * @dev Integration layer for Hedera DID (Decentralized Identifier) operations
 * This contract provides methods to verify and manage DIDs on the Hedera network
 * 
 * Note: This is a simplified implementation. In production, you would integrate with
 * the official Hedera DID Registry and follow the W3C DID specification.
 */
contract HederaDIDIntegration is Ownable {
    
    // Struct for DID document
    struct DIDDocument {
        string did;
        address controller;
        string publicKey;
        uint256 createdAt;
        uint256 updatedAt;
        bool isActive;
    }
    
    // Mapping from DID to DID document
    mapping(string => DIDDocument) public didDocuments;
    
    // Mapping from address to their DID
    mapping(address => string) public addressToDID;
    
    // Events
    event DIDRegistered(
        string indexed did,
        address indexed controller,
        string publicKey
    );
    
    event DIDUpdated(
        string indexed did,
        address indexed controller,
        string publicKey
    );
    
    event DIDDeactivated(
        string indexed did,
        address indexed controller
    );
    
    /**
     * @dev Registers a new DID
     * @param did The decentralized identifier
     * @param publicKey The public key associated with the DID
     */
    function registerDID(string calldata did, string calldata publicKey) external {
        require(bytes(did).length > 0, "DID cannot be empty");
        require(bytes(publicKey).length > 0, "Public key cannot be empty");
        require(!didDocuments[did].isActive, "DID already registered");
        require(bytes(addressToDID[msg.sender]).length == 0, "Address already has a DID");
        
        didDocuments[did] = DIDDocument({
            did: did,
            controller: msg.sender,
            publicKey: publicKey,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            isActive: true
        });
        
        addressToDID[msg.sender] = did;
        
        emit DIDRegistered(did, msg.sender, publicKey);
    }
    
    /**
     * @dev Updates an existing DID
     * @param did The decentralized identifier
     * @param newPublicKey The new public key
     */
    function updateDID(string calldata did, string calldata newPublicKey) external {
        require(bytes(did).length > 0, "DID cannot be empty");
        require(bytes(newPublicKey).length > 0, "Public key cannot be empty");
        require(didDocuments[did].isActive, "DID not active");
        require(didDocuments[did].controller == msg.sender, "Not authorized");
        
        DIDDocument storage doc = didDocuments[did];
        doc.publicKey = newPublicKey;
        doc.updatedAt = block.timestamp;
        
        emit DIDUpdated(did, msg.sender, newPublicKey);
    }
    
    /**
     * @dev Deactivates a DID
     * @param did The decentralized identifier
     */
    function deactivateDID(string calldata did) external {
        require(bytes(did).length > 0, "DID cannot be empty");
        require(didDocuments[did].isActive, "DID not active");
        require(didDocuments[did].controller == msg.sender, "Not authorized");
        
        didDocuments[did].isActive = false;
        didDocuments[did].updatedAt = block.timestamp;
        
        delete addressToDID[msg.sender];
        
        emit DIDDeactivated(did, msg.sender);
    }
    
    /**
     * @dev Verifies if a DID is valid and active
     * @param did The decentralized identifier
     * @return bool True if the DID is valid and active
     */
    function verifyDID(string calldata did) external view returns (bool) {
        return didDocuments[did].isActive;
    }
    
    /**
     * @dev Gets the DID for an address
     * @param addr The address to query
     * @return The DID associated with the address
     */
    function getDIDByAddress(address addr) external view returns (string memory) {
        return addressToDID[addr];
    }
    
    /**
     * @dev Gets the controller address for a DID
     * @param did The decentralized identifier
     * @return The controller address
     */
    function getDIDController(string calldata did) external view returns (address) {
        return didDocuments[did].controller;
    }
}