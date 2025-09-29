// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/oft/OFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HederaOFTAdapter
 * @dev LayerZero OFT (Omnichain Fungible Token) Adapter for Hedera
 * This contract enables cross-chain transfers of tokens between Hedera and other chains
 * 
 * Features:
 * - Cross-chain token transfers using LayerZero
 * - Fee management for cross-chain operations
 * - Support for multiple destination chains
 * - Security measures and access controls
 */
contract HederaOFTAdapter is OFT, Ownable {
    
    // Mapping to track supported destination chains
    mapping(uint16 => bool) public supportedChains;
    
    // Struct for cross-chain loan disbursement payload
    struct LoanDisbursementPayload {
        address merchant;
        uint256 amount;
        string loanId;
        uint256 timestamp;
        bytes32 signature;
    }
    
    // Events
    event ChainSupported(uint16 chainId, bool supported);
    event LoanDisbursementInitiated(
        uint16 dstChainId,
        address indexed merchant,
        uint256 amount,
        string loanId,
        bytes payloadHash
    );
    event LoanDisbursementReceived(
        uint16 srcChainId,
        address indexed merchant,
        uint256 amount,
        string loanId,
        bytes payloadHash
    );
    
    /**
     * @dev Constructor
     * @param _layerZeroEndpoint The LayerZero endpoint address
     * @param _token The underlying token address
     */
    constructor(address _layerZeroEndpoint, address _token) 
        OFT("Kelo Cross-Chain Token", "kCCT", _layerZeroEndpoint, _token) {}
    
    /**
     * @dev Adds support for a destination chain
     * @param chainId The LayerZero chain ID
     * @param supported Whether the chain is supported
     */
    function setSupportedChain(uint16 chainId, bool supported) external onlyOwner {
        supportedChains[chainId] = supported;
        emit ChainSupported(chainId, supported);
    }
    
    /**
     * @dev Initiates a cross-chain loan disbursement
     * @param dstChainId The destination chain ID
     * @param merchant The merchant address on destination chain
     * @param amount The amount to disburse
     * @param loanId The loan ID
     * @param refundAddress The address for refund in case of failure
     */
    function initiateLoanDisbursement(
        uint16 dstChainId,
        address merchant,
        uint256 amount,
        string calldata loanId,
        address payable refundAddress
    ) external payable onlyOwner {
        require(supportedChains[dstChainId], "Destination chain not supported");
        require(merchant != address(0), "Invalid merchant address");
        require(amount > 0, "Amount must be greater than 0");
        require(!bytes(loanId).length == 0, "Loan ID cannot be empty");
        
        // Create payload
        LoanDisbursementPayload memory payload = LoanDisbursementPayload({
            merchant: merchant,
            amount: amount,
            loanId: loanId,
            timestamp: block.timestamp,
            signature: keccak256(abi.encodePacked(merchant, amount, loanId, block.timestamp))
        });
        
        // Encode payload
        bytes memory payloadBytes = abi.encode(payload);
        
        // Estimate fee
        (uint256 fee, ) = estimateSendFee(
            dstChainId,
            address(this), // Use contract address as sender
            amount,
            false, // useZro
            payloadBytes
        );
        
        require(msg.value >= fee, "Insufficient fee");
        
        // Send tokens across chain
        _send(
            payable(msg.sender),
            dstChainId,
            address(this), // Send to this contract on destination chain
            amount,
            refundAddress,
            address(0), // zroPaymentAddress
            payloadBytes,
            msg.value - fee // Remaining gas
        );
        
        emit LoanDisbursementInitiated(
            dstChainId,
            merchant,
            amount,
            loanId,
            keccak256(payloadBytes)
        );
    }
    
    /**
     * @dev Handles incoming cross-chain messages
     * @param _srcChainId The source chain ID
     * @param _srcAddress The source address
     * @param _nonce The message nonce
     * @param _payload The message payload
     */
    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) internal override {
        // Decode payload
        LoanDisbursementPayload memory payload = abi.decode(_payload, (LoanDisbursementPayload));
        
        // Verify payload signature
        bytes32 expectedSignature = keccak256(abi.encodePacked(
            payload.merchant,
            payload.amount,
            payload.loanId,
            payload.timestamp
        ));
        require(payload.signature == expectedSignature, "Invalid payload signature");
        
        // Process the loan disbursement
        // In a real implementation, this would interact with the liquidity pool
        // For now, we'll just emit an event
        emit LoanDisbursementReceived(
            _srcChainId,
            payload.merchant,
            payload.amount,
            payload.loanId,
            keccak256(_payload)
        );
    }
    
    /**
     * @dev Estimates the fee for cross-chain transfer
     * @param dstChainId The destination chain ID
     * @param toAddress The destination address
     * @param amount The amount to transfer
     * @param useZro Whether to use ZRO token
     * @param adapterParams Additional adapter parameters
     * @return fee The estimated fee
     * @return zroPaymentAddress The ZRO payment address
     */
    function estimateSendFee(
        uint16 dstChainId,
        address toAddress,
        uint256 amount,
        bool useZro,
        bytes memory adapterParams
    ) public view returns (uint256 fee, uint256 zroPaymentAddress) {
        return lzEndpoint.estimateFees(
            dstChainId,
            address(this),
            bytes(""), // Empty bytes for toAddress since we're using OFT
            amount,
            useZro,
            adapterParams
        );
    }
    
    /**
     * @dev Withdraws accumulated fees
     * @param to The address to send fees to
     * @param amount The amount to withdraw
     */
    function withdrawFees(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient balance");
        
        to.transfer(amount);
    }
    
    /**
     * @dev Returns the supported chains
     * @return Array of supported chain IDs
     */
    function getSupportedChains() external view returns (uint16[] memory) {
        uint256 count = 0;
        for (uint16 i = 0; i < type(uint16).max; i++) {
            if (supportedChains[i]) {
                count++;
            }
        }
        
        uint16[] memory chains = new uint16[](count);
        uint256 index = 0;
        for (uint16 i = 0; i < type(uint16).max; i++) {
            if (supportedChains[i]) {
                chains[index] = i;
                index++;
            }
        }
        
        return chains;
    }
}