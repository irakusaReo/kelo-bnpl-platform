// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IKeloLiquidityPool
 * @dev Interface for the KeloLiquidityPool contract
 * This interface defines the external functions and events for interacting with
 * the liquidity pool system
 */
interface IKeloLiquidityPool {

    // Events
    event LiquidityDeposited(
        address indexed provider,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event LiquidityWithdrawn(
        address indexed provider,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event MerchantDisbursed(
        address indexed merchant,
        address indexed token,
        uint256 amount,
        string indexed loanId,
        uint256 timestamp
    );

    event InterestAccrued(
        address indexed provider,
        address indexed token,
        uint256 amount,
        uint256 timestamp
    );

    event PoolCreated(
        address indexed token,
        string symbol,
        uint256 interestRate,
        uint256 timestamp
    );

    event InterestRateUpdated(
        address indexed token,
        uint256 oldRate,
        uint256 newRate,
        uint256 timestamp
    );

    // Functions

    /**
     * @dev Creates a new liquidity pool for a stablecoin
     * @param tokenAddress The address of the ERC20 token
     * @param symbol The symbol of the token
     * @param initialInterestRate The initial annual interest rate in basis points
     */
    function createPool(
        address tokenAddress,
        string calldata symbol,
        uint256 initialInterestRate
    ) external;

    /**
     * @dev Deposits liquidity into a pool
     * @param tokenAddress The address of the token to deposit
     * @param amount The amount to deposit
     */
    function depositLiquidity(
        address tokenAddress,
        uint256 amount
    ) external;

    /**
     * @dev Withdraws liquidity from a pool
     * @param tokenAddress The address of the token to withdraw
     * @param amount The amount to withdraw
     */
    function withdrawLiquidity(
        address tokenAddress,
        uint256 amount
    ) external;

    /**
     * @dev Disburses funds to a merchant for a loan
     * @param tokenAddress The address of the token to disburse
     * @param merchantAddress The address of the merchant
     * @param amount The amount to disburse
     * @param loanId The ID of the loan
     */
    function disburseToMerchant(
        address tokenAddress,
        address merchantAddress,
        uint256 amount,
        string calldata loanId
    ) external;

    /**
     * @dev Updates the interest rate for a pool
     * @param tokenAddress The address of the token
     * @param newInterestRate The new annual interest rate in basis points
     */
    function updateInterestRate(
        address tokenAddress,
        uint256 newInterestRate
    ) external;

    /**
     * @dev Gets the balance of a provider in a specific pool
     * @param providerAddress The address of the provider
     * @param tokenAddress The address of the token
     * @return The total balance (deposits + interest - withdrawals)
     */
    function getProviderBalance(
        address providerAddress,
        address tokenAddress
    ) external view returns (uint256);

    /**
     * @dev Gets the total liquidity in a pool
     * @param tokenAddress The address of the token
     * @return The total liquidity in the pool
     */
    function getPoolLiquidity(address tokenAddress) external view returns (uint256);

    /**
     * @dev Gets all supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory);

    /**
     * @dev Pauses all contract operations
     */
    function pause() external;

    /**
     * @dev Unpauses all contract operations
     */
    function unpause() external;
}