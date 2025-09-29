// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CrossChainMessageExample
 * @dev Example contract demonstrating cross-chain message payloads for Kelo
 * This contract shows various message types and their structures for cross-chain communication
 */
contract CrossChainMessageExample is Ownable {
    
    // Enum for message types
    enum MessageType {
        LOAN_APPROVAL,
        LOAN_DISBURSEMENT,
        REPAYMENT_CONFIRMATION,
        LIQUIDITY_TRANSFER,
        CREDIT_SCORE_UPDATE,
        MERCHANT_REGISTRATION,
        POOL_CONFIGURATION,
        EMERGENCY_PAUSE
    }
    
    // Struct for loan approval message
    struct LoanApprovalMessage {
        MessageType messageType;
        uint256 loanId;
        address borrower;
        address merchant;
        uint256 amount;
        uint256 interestRate;
        uint256 duration;
        string borrowerDID;
        string merchantDID;
        uint256 timestamp;
        bytes32 signature;
    }
    
    // Struct for loan disbursement message
    struct LoanDisbursementMessage {
        MessageType messageType;
        uint256 loanId;
        address merchant;
        address token;
        uint256 amount;
        string referenceId;
        uint256 timestamp;
        bytes32 signature;
    }
    
    // Struct for repayment confirmation message
    struct RepaymentConfirmationMessage {
        MessageType messageType;
        uint256 loanId;
        address payer;
        address token;
        uint256 amount;
        uint256 totalRepaid;
        string transactionHash;
        uint256 timestamp;
        bytes32 signature;
    }
    
    // Struct for liquidity transfer message
    struct LiquidityTransferMessage {
        MessageType messageType;
        address fromPool;
        address toPool;
        address token;
        uint256 amount;
        string reason;
        uint256 timestamp;
        bytes32 signature;
    }
    
    // Struct for credit score update message
    struct CreditScoreUpdateMessage {
        MessageType messageType;
        string userDID;
        uint256 newScore;
        uint256 previousScore;
        string updateReason;
        uint256 timestamp;
        bytes32 signature;
    }
    
    // Array to store message examples
    bytes[] public messageExamples;
    
    // Events
    event MessageExampleCreated(
        MessageType messageType,
        bytes payload,
        uint256 timestamp
    );
    
    /**
     * @dev Creates a loan approval message example
     * @param loanId The loan ID
     * @param borrower The borrower address
     * @param merchant The merchant address
     * @param amount The loan amount
     * @param interestRate The interest rate
     * @param duration The loan duration
     * @param borrowerDID The borrower's DID
     * @param merchantDID The merchant's DID
     * @return The encoded message payload
     */
    function createLoanApprovalMessage(
        uint256 loanId,
        address borrower,
        address merchant,
        uint256 amount,
        uint256 interestRate,
        uint256 duration,
        string calldata borrowerDID,
        string calldata merchantDID
    ) external onlyOwner returns (bytes memory) {
        LoanApprovalMessage memory message = LoanApprovalMessage({
            messageType: MessageType.LOAN_APPROVAL,
            loanId: loanId,
            borrower: borrower,
            merchant: merchant,
            amount: amount,
            interestRate: interestRate,
            duration: duration,
            borrowerDID: borrowerDID,
            merchantDID: merchantDID,
            timestamp: block.timestamp,
            signature: keccak256(abi.encodePacked(
                loanId,
                borrower,
                merchant,
                amount,
                interestRate,
                duration,
                block.timestamp
            ))
        });
        
        bytes memory payload = abi.encode(message);
        messageExamples.push(payload);
        
        emit MessageExampleCreated(MessageType.LOAN_APPROVAL, payload, block.timestamp);
        
        return payload;
    }
    
    /**
     * @dev Creates a loan disbursement message example
     * @param loanId The loan ID
     * @param merchant The merchant address
     * @param token The token address
     * @param amount The disbursement amount
     * @param referenceId The reference ID
     * @return The encoded message payload
     */
    function createLoanDisbursementMessage(
        uint256 loanId,
        address merchant,
        address token,
        uint256 amount,
        string calldata referenceId
    ) external onlyOwner returns (bytes memory) {
        LoanDisbursementMessage memory message = LoanDisbursementMessage({
            messageType: MessageType.LOAN_DISBURSEMENT,
            loanId: loanId,
            merchant: merchant,
            token: token,
            amount: amount,
            referenceId: referenceId,
            timestamp: block.timestamp,
            signature: keccak256(abi.encodePacked(
                loanId,
                merchant,
                token,
                amount,
                referenceId,
                block.timestamp
            ))
        });
        
        bytes memory payload = abi.encode(message);
        messageExamples.push(payload);
        
        emit MessageExampleCreated(MessageType.LOAN_DISBURSEMENT, payload, block.timestamp);
        
        return payload;
    }
    
    /**
     * @dev Creates a repayment confirmation message example
     * @param loanId The loan ID
     * @param payer The payer address
     * @param token The token address
     * @param amount The repayment amount
     * @param totalRepaid The total amount repaid
     * @param transactionHash The transaction hash
     * @return The encoded message payload
     */
    function createRepaymentConfirmationMessage(
        uint256 loanId,
        address payer,
        address token,
        uint256 amount,
        uint256 totalRepaid,
        string calldata transactionHash
    ) external onlyOwner returns (bytes memory) {
        RepaymentConfirmationMessage memory message = RepaymentConfirmationMessage({
            messageType: MessageType.REPAYMENT_CONFIRMATION,
            loanId: loanId,
            payer: payer,
            token: token,
            amount: amount,
            totalRepaid: totalRepaid,
            transactionHash: transactionHash,
            timestamp: block.timestamp,
            signature: keccak256(abi.encodePacked(
                loanId,
                payer,
                token,
                amount,
                totalRepaid,
                transactionHash,
                block.timestamp
            ))
        });
        
        bytes memory payload = abi.encode(message);
        messageExamples.push(payload);
        
        emit MessageExampleCreated(MessageType.REPAYMENT_CONFIRMATION, payload, block.timestamp);
        
        return payload;
    }
    
    /**
     * @dev Creates a liquidity transfer message example
     * @param fromPool The source pool address
     * @param toPool The destination pool address
     * @param token The token address
     * @param amount The transfer amount
     * @param reason The transfer reason
     * @return The encoded message payload
     */
    function createLiquidityTransferMessage(
        address fromPool,
        address toPool,
        address token,
        uint256 amount,
        string calldata reason
    ) external onlyOwner returns (bytes memory) {
        LiquidityTransferMessage memory message = LiquidityTransferMessage({
            messageType: MessageType.LIQUIDITY_TRANSFER,
            fromPool: fromPool,
            toPool: toPool,
            token: token,
            amount: amount,
            reason: reason,
            timestamp: block.timestamp,
            signature: keccak256(abi.encodePacked(
                fromPool,
                toPool,
                token,
                amount,
                reason,
                block.timestamp
            ))
        });
        
        bytes memory payload = abi.encode(message);
        messageExamples.push(payload);
        
        emit MessageExampleCreated(MessageType.LIQUIDITY_TRANSFER, payload, block.timestamp);
        
        return payload;
    }
    
    /**
     * @dev Creates a credit score update message example
     * @param userDID The user's DID
     * @param newScore The new credit score
     * @param previousScore The previous credit score
     * @param updateReason The reason for the update
     * @return The encoded message payload
     */
    function createCreditScoreUpdateMessage(
        string calldata userDID,
        uint256 newScore,
        uint256 previousScore,
        string calldata updateReason
    ) external onlyOwner returns (bytes memory) {
        CreditScoreUpdateMessage memory message = CreditScoreUpdateMessage({
            messageType: MessageType.CREDIT_SCORE_UPDATE,
            userDID: userDID,
            newScore: newScore,
            previousScore: previousScore,
            updateReason: updateReason,
            timestamp: block.timestamp,
            signature: keccak256(abi.encodePacked(
                userDID,
                newScore,
                previousScore,
                updateReason,
                block.timestamp
            ))
        });
        
        bytes memory payload = abi.encode(message);
        messageExamples.push(payload);
        
        emit MessageExampleCreated(MessageType.CREDIT_SCORE_UPDATE, payload, block.timestamp);
        
        return payload;
    }
    
    /**
     * @dev Gets all message examples
     * @return Array of message payloads
     */
    function getMessageExamples() external view returns (bytes[] memory) {
        return messageExamples;
    }
    
    /**
     * @dev Gets a specific message example
     * @param index The index of the message
     * @return The message payload
     */
    function getMessageExample(uint256 index) external view returns (bytes memory) {
        require(index < messageExamples.length, "Index out of bounds");
        return messageExamples[index];
    }
    
    /**
     * @dev Decodes a loan approval message
     * @param payload The encoded payload
     * @return The decoded loan approval message
     */
    function decodeLoanApprovalMessage(bytes calldata payload) external pure returns (LoanApprovalMessage memory) {
        return abi.decode(payload, (LoanApprovalMessage));
    }
    
    /**
     * @dev Decodes a loan disbursement message
     * @param payload The encoded payload
     * @return The decoded loan disbursement message
     */
    function decodeLoanDisbursementMessage(bytes calldata payload) external pure returns (LoanDisbursementMessage memory) {
        return abi.decode(payload, (LoanDisbursementMessage));
    }
    
    /**
     * @dev Decodes a repayment confirmation message
     * @param payload The encoded payload
     * @return The decoded repayment confirmation message
     */
    function decodeRepaymentConfirmationMessage(bytes calldata payload) external pure returns (RepaymentConfirmationMessage memory) {
        return abi.decode(payload, (RepaymentConfirmationMessage));
    }
    
    /**
     * @dev Decodes a liquidity transfer message
     * @param payload The encoded payload
     * @return The decoded liquidity transfer message
     */
    function decodeLiquidityTransferMessage(bytes calldata payload) external pure returns (LiquidityTransferMessage memory) {
        return abi.decode(payload, (LiquidityTransferMessage));
    }
    
    /**
     * @dev Decodes a credit score update message
     * @param payload The encoded payload
     * @return The decoded credit score update message
     */
    function decodeCreditScoreUpdateMessage(bytes calldata payload) external pure returns (CreditScoreUpdateMessage memory) {
        return abi.decode(payload, (CreditScoreUpdateMessage));
    }
}