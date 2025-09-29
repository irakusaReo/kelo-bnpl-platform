// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BaseLiquidityReceiver
 * @dev LayerZero receiver contract for Base chain
 * This contract handles incoming cross-chain messages for loan disbursements
 * 
 * Features:
 * - Receives cross-chain loan disbursement messages
 * - Interacts with liquidity pools to disburse funds
 * - Message verification and security
 * - Event logging for audit trail
 */
contract BaseLiquidityReceiver is NonblockingLzApp, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Struct for loan disbursement payload
    struct LoanDisbursementPayload {
        address merchant;
        uint256 amount;
        string loanId;
        uint256 timestamp;
        bytes32 signature;
    }
    
    // Mapping from source chain to trusted sender
    mapping(uint16 => bytes) public trustedSenders;
    
    // Mapping from token address to liquidity pool
    mapping(address => address) public liquidityPools;
    
    // Events
    event TrustedSenderSet(uint16 srcChainId, bytes srcAddress);
    event LiquidityPoolSet(address token, address pool);
    event LoanDisbursementProcessed(
        uint16 srcChainId,
        address indexed merchant,
        address token,
        uint256 amount,
        string loanId,
        bool success
    );
    
    /**
     * @dev Constructor
     * @param _layerZeroEndpoint The LayerZero endpoint address
     */
    constructor(address _layerZeroEndpoint) NonblockingLzApp(_layerZeroEndpoint) {}
    
    /**
     * @dev Sets a trusted sender for a source chain
     * @param srcChainId The source chain ID
     * @param srcAddress The source address
     */
    function setTrustedSender(uint16 srcChainId, bytes calldata srcAddress) external onlyOwner {
        trustedSenders[srcChainId] = srcAddress;
        emit TrustedSenderSet(srcChainId, srcAddress);
    }
    
    /**
     * @dev Sets a liquidity pool for a token
     * @param token The token address
     * @param pool The liquidity pool address
     */
    function setLiquidityPool(address token, address pool) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(pool != address(0), "Invalid pool address");
        
        liquidityPools[token] = pool;
        emit LiquidityPoolSet(token, pool);
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
    ) internal override nonReentrant {
        // Verify trusted sender
        bytes memory trustedSender = trustedSenders[_srcChainId];
        require(trustedSender.length > 0, "Untrusted source chain");
        require(
            keccak256(_srcAddress) == keccak256(trustedSender),
            "Untrusted sender address"
        );
        
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
        bool success = processLoanDisbursement(payload);
        
        emit LoanDisbursementProcessed(
            _srcChainId,
            payload.merchant,
            address(0), // Token address would be determined in processLoanDisbursement
            payload.amount,
            payload.loanId,
            success
        );
    }
    
    /**
     * @dev Processes a loan disbursement
     * @param payload The loan disbursement payload
     * @return success Whether the disbursement was successful
     */
    function processLoanDisbursement(LoanDisbursementPayload memory payload) internal returns (bool) {
        // In a real implementation, this would:
        // 1. Determine which token to use (could be part of payload)
        // 2. Get the liquidity pool for that token
        // 3. Call the liquidity pool's disburse function
        
        // For now, we'll use a placeholder implementation
        address pool = liquidityPools[address(0)]; // Placeholder token address
        
        if (pool == address(0)) {
            return false; // No liquidity pool configured
        }
        
        // This would be replaced with actual pool interaction
        // IKeloLiquidityPool(pool).disburseToMerchant(token, payload.merchant, payload.amount, payload.loanId);
        
        return true;
    }
    
    /**
     * @dev Estimates the fee for cross-chain transfer
     * @param dstChainId The destination chain ID
     * @param payload The payload to send
     * @param useZro Whether to use ZRO token
     * @param adapterParams Additional adapter parameters
     * @return fee The estimated fee
     * @return zroPaymentAddress The ZRO payment address
     */
    function estimateFee(
        uint16 dstChainId,
        bytes memory payload,
        bool useZro,
        bytes memory adapterParams
    ) public view returns (uint256 fee, uint256 zroPaymentAddress) {
        return lzEndpoint.estimateFees(
            dstChainId,
            address(this),
            payload,
            0, // Amount (not used for messaging only)
            useZro,
            adapterParams
        );
    }
    
    /**
     * @dev Sends a cross-chain message
     * @param dstChainId The destination chain ID
     * @param payload The payload to send
     * @param refundAddress The address for refund in case of failure
     * @param adapterParams Additional adapter parameters
     */
    function sendCrossChainMessage(
        uint16 dstChainId,
        bytes memory payload,
        address payable refundAddress,
        bytes memory adapterParams
    ) external payable onlyOwner {
        (uint256 fee, ) = estimateFee(dstChainId, payload, false, adapterParams);
        require(msg.value >= fee, "Insufficient fee");
        
        _lzSend(
            dstChainId,
            payload,
            refundAddress,
            address(0), // zroPaymentAddress
            adapterParams,
            msg.value - fee // Remaining gas
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
     * @dev Emergency function to recover tokens sent by mistake
     * @param token The token address
     * @param amount The amount to recover
     */
    function recoverTokens(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).safeTransfer(owner(), amount);
    }
}