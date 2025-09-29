// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HCSMessageExample
 * @dev Example contract demonstrating Hedera Consensus Service (HCS) message submission
 * 
 * Note: This is a conceptual example. In production, HCS messages are submitted
 * through the Hedera SDK or API, not directly through smart contracts.
 * This contract shows the structure and data that would be submitted to HCS.
 */
contract HCSMessageExample is Ownable {
    
    // Enum for message types
    enum MessageType {
        LoanCreated,
        LoanApproved,
        LoanDisbursed,
        RepaymentMade,
        LoanRepaid,
        LoanDefaulted,
        DIDRegistered,
        CreditScoreUpdated
    }
    
    // Struct for HCS message
    struct HCSMessage {
        uint256 timestamp;
        MessageType messageType;
        string topicId; // HCS Topic ID
        bytes32 messageHash;
        address submitter;
        string data; // JSON-encoded message data
    }
    
    // Array to store submitted messages (for demonstration)
    HCSMessage[] public submittedMessages;
    
    // Mapping from message hash to message
    mapping(bytes32 => HCSMessage) public messageByHash;
    
    // Events
    event MessageSubmitted(
        bytes32 indexed messageHash,
        MessageType indexed messageType,
        string topicId,
        address indexed submitter
    );
    
    /**
     * @dev Submits a message to HCS (conceptual)
     * @param messageType The type of message
     * @param topicId The HCS Topic ID
     * @param data The message data (JSON string)
     * @return messageHash The hash of the submitted message
     */
    function submitMessage(
        MessageType messageType,
        string calldata topicId,
        string calldata data
    ) external onlyOwner returns (bytes32) {
        require(bytes(topicId).length > 0, "Topic ID cannot be empty");
        require(bytes(data).length > 0, "Data cannot be empty");
        
        // Create message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            block.timestamp,
            messageType,
            topicId,
            data,
            msg.sender
        ));
        
        // Create message structure
        HCSMessage memory message = HCSMessage({
            timestamp: block.timestamp,
            messageType: messageType,
            topicId: topicId,
            messageHash: messageHash,
            submitter: msg.sender,
            data: data
        });
        
        // Store message
        submittedMessages.push(message);
        messageByHash[messageHash] = message;
        
        emit MessageSubmitted(messageHash, messageType, topicId, msg.sender);
        
        return messageHash;
    }
    
    /**
     * @dev Creates a loan creation message for HCS
     * @param tokenId The loan token ID
     * @param borrower The borrower address
     * @param merchant The merchant address
     * @param amount The loan amount
     * @param did The borrower's DID
     * @return messageHash The hash of the submitted message
     */
    function submitLoanCreationMessage(
        uint256 tokenId,
        address borrower,
        address merchant,
        uint256 amount,
        string calldata did
    ) external onlyOwner returns (bytes32) {
        // Create JSON data
        string memory data = string(abi.encodePacked(
            '{"eventType":"LoanCreated","tokenId":"',
            uintToString(tokenId),
            '","borrower":"',
            addressToString(borrower),
            '","merchant":"',
            addressToString(merchant),
            '","amount":"',
            uintToString(amount),
            '","did":"',
            did,
            '","timestamp":"',
            uintToString(block.timestamp),
            '"}'
        ));
        
        return submitMessage(MessageType.LoanCreated, "0.0.1234", data);
    }
    
    /**
     * @dev Creates a repayment message for HCS
     * @param tokenId The loan token ID
     * @param amount The repayment amount
     * @param totalRepaid The total amount repaid so far
     * @return messageHash The hash of the submitted message
     */
    function submitRepaymentMessage(
        uint256 tokenId,
        uint256 amount,
        uint256 totalRepaid
    ) external onlyOwner returns (bytes32) {
        string memory data = string(abi.encodePacked(
            '{"eventType":"RepaymentMade","tokenId":"',
            uintToString(tokenId),
            '","amount":"',
            uintToString(amount),
            '","totalRepaid":"',
            uintToString(totalRepaid),
            '","timestamp":"',
            uintToString(block.timestamp),
            '"}'
        ));
        
        return submitMessage(MessageType.RepaymentMade, "0.0.1234", data);
    }
    
    /**
     * @dev Gets a message by its hash
     * @param messageHash The hash of the message
     * @return The HCS message
     */
    function getMessage(bytes32 messageHash) external view returns (HCSMessage memory) {
        return messageByHash[messageHash];
    }
    
    /**
     * @dev Gets all submitted messages
     * @return Array of HCS messages
     */
    function getAllMessages() external view returns (HCSMessage[] memory) {
        return submittedMessages;
    }
    
    // Helper functions
    
    function uintToString(uint256 v) internal pure returns (string memory) {
        if (v == 0) {
            return "0";
        }
        uint256 j = v;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (v != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(v - (v / 10) * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            v /= 10;
        }
        return string(bstr);
    }
    
    function addressToString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}