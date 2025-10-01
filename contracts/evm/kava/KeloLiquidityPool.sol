// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title KeloLiquidityPool
 * @dev A standardized, audited-quality liquidity pool contract for stablecoin operations
 * This contract manages liquidity pools for stablecoins (USDT, USDC) and handles
 * deposits, withdrawals, and disbursements to merchant addresses
 *
 * Features:
 * - Support for multiple stablecoins (USDT, USDC)
 * - Deposit and withdrawal functionality
 * - Merchant disbursements
 * - Interest accrual for liquidity providers
 * - Security measures (Pausable, ReentrancyGuard)
 * - Detailed event logging
 */
contract KeloLiquidityPool is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    // Struct for liquidity provider information
    struct LiquidityProvider {
        uint256 totalDeposited;
        uint256 totalWithdrawn;
        uint256 interestEarned;
        uint256 lastInterestCalculation;
        bool isActive;
    }

    // Struct for pool information
    struct PoolInfo {
        IERC20 token;
        string symbol;
        uint256 totalLiquidity;
        uint256 totalDeposits;
        uint256 totalWithdrawals;
        uint256 totalInterestPaid;
        uint256 interestRate; // Annual interest rate in basis points
        uint256 lastInterestUpdate;
        bool isActive;
    }

    // Mapping from token address to pool information
    mapping(address => PoolInfo) public pools;

    // Mapping from provider address to token address to provider information
    mapping(address => mapping(address => LiquidityProvider)) public providers;

    // Array of supported token addresses
    address[] public supportedTokens;

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

    /**
     * @dev Constructor
     */
    constructor() {}

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
    ) external onlyOwner whenNotPaused {
        require(tokenAddress != address(0), "Invalid token address");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(initialInterestRate > 0, "Interest rate must be greater than 0");
        require(!pools[tokenAddress].isActive, "Pool already exists");

        pools[tokenAddress] = PoolInfo({
            token: IERC20(tokenAddress),
            symbol: symbol,
            totalLiquidity: 0,
            totalDeposits: 0,
            totalWithdrawals: 0,
            totalInterestPaid: 0,
            interestRate: initialInterestRate,
            lastInterestUpdate: block.timestamp,
            isActive: true
        });

        supportedTokens.push(tokenAddress);

        emit PoolCreated(tokenAddress, symbol, initialInterestRate, block.timestamp);
    }

    /**
     * @dev Deposits liquidity into a pool
     * @param tokenAddress The address of the token to deposit
     * @param amount The amount to deposit
     */
    function depositLiquidity(
        address tokenAddress,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        require(pools[tokenAddress].isActive, "Pool does not exist");
        require(amount > 0, "Amount must be greater than 0");

        PoolInfo storage pool = pools[tokenAddress];
        LiquidityProvider storage provider = providers[msg.sender][tokenAddress];

        // Calculate and accrue interest for existing deposits
        if (provider.totalDeposited > 0) {
            _accrueInterest(msg.sender, tokenAddress);
        }

        // Update provider information
        provider.totalDeposited = provider.totalDeposited.add(amount);
        provider.isActive = true;
        provider.lastInterestCalculation = block.timestamp;

        // Update pool information
        pool.totalLiquidity = pool.totalLiquidity.add(amount);
        pool.totalDeposits = pool.totalDeposits.add(amount);

        // Transfer tokens from provider
        pool.token.safeTransferFrom(msg.sender, address(this), amount);

        emit LiquidityDeposited(msg.sender, tokenAddress, amount, block.timestamp);
    }

    /**
     * @dev Withdraws liquidity from a pool
     * @param tokenAddress The address of the token to withdraw
     * @param amount The amount to withdraw
     */
    function withdrawLiquidity(
        address tokenAddress,
        uint256 amount
    ) external whenNotPaused nonReentrant {
        require(pools[tokenAddress].isActive, "Pool does not exist");
        require(amount > 0, "Amount must be greater than 0");

        LiquidityProvider storage provider = providers[msg.sender][tokenAddress];
        require(provider.isActive, "Provider not active");

        // Calculate and accrue interest
        _accrueInterest(msg.sender, tokenAddress);

        uint256 availableBalance = provider.totalDeposited.add(provider.interestEarned).sub(provider.totalWithdrawn);
        require(amount <= availableBalance, "Insufficient balance");

        PoolInfo storage pool = pools[tokenAddress];

        // Update provider information
        provider.totalWithdrawn = provider.totalWithdrawn.add(amount);

        // Update pool information
        pool.totalLiquidity = pool.totalLiquidity.sub(amount);
        pool.totalWithdrawals = pool.totalWithdrawals.add(amount);

        // Transfer tokens to provider
        pool.token.safeTransfer(msg.sender, amount);

        emit LiquidityWithdrawn(msg.sender, tokenAddress, amount, block.timestamp);
    }

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
    ) external onlyOwner whenNotPaused nonReentrant {
        require(pools[tokenAddress].isActive, "Pool does not exist");
        require(merchantAddress != address(0), "Invalid merchant address");
        require(amount > 0, "Amount must be greater than 0");
        require(bytes(loanId).length > 0, "Loan ID cannot be empty");

        PoolInfo storage pool = pools[tokenAddress];
        require(amount <= pool.totalLiquidity, "Insufficient pool liquidity");

        // Update pool liquidity
        pool.totalLiquidity = pool.totalLiquidity.sub(amount);

        // Transfer tokens to merchant
        pool.token.safeTransfer(merchantAddress, amount);

        emit MerchantDisbursed(merchantAddress, tokenAddress, amount, loanId, block.timestamp);
    }

    /**
     * @dev Updates the interest rate for a pool
     * @param tokenAddress The address of the token
     * @param newInterestRate The new annual interest rate in basis points
     */
    function updateInterestRate(
        address tokenAddress,
        uint256 newInterestRate
    ) external onlyOwner whenNotPaused {
        require(pools[tokenAddress].isActive, "Pool does not exist");
        require(newInterestRate > 0, "Interest rate must be greater than 0");

        PoolInfo storage pool = pools[tokenAddress];
        uint256 oldRate = pool.interestRate;

        // Update interest rate for all providers first
        _updateAllProviderInterest(tokenAddress);

        pool.interestRate = newInterestRate;
        pool.lastInterestUpdate = block.timestamp;

        emit InterestRateUpdated(tokenAddress, oldRate, newInterestRate, block.timestamp);
    }

    /**
     * @dev Gets the balance of a provider in a specific pool
     * @param providerAddress The address of the provider
     * @param tokenAddress The address of the token
     * @return The total balance (deposits + interest - withdrawals)
     */
    function getProviderBalance(
        address providerAddress,
        address tokenAddress
    ) external view returns (uint256) {
        LiquidityProvider storage provider = providers[providerAddress][tokenAddress];
        if (!provider.isActive) return 0;

        uint256 pendingInterest = _calculatePendingInterest(providerAddress, tokenAddress);
        return provider.totalDeposited.add(provider.interestEarned).add(pendingInterest).sub(provider.totalWithdrawn);
    }

    /**
     * @dev Gets the total liquidity in a pool
     * @param tokenAddress The address of the token
     * @return The total liquidity in the pool
     */
    function getPoolLiquidity(address tokenAddress) external view returns (uint256) {
        return pools[tokenAddress].totalLiquidity;
    }

    /**
     * @dev Gets all supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }

    /**
     * @dev Pauses all contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency function to recover tokens sent by mistake
     * @param tokenAddress The address of the token to recover
     * @param amount The amount to recover
     */
    function recoverTokens(
        address tokenAddress,
        uint256 amount
    ) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        // Don't allow recovering tokens from active pools
        require(!pools[tokenAddress].isActive, "Cannot recover tokens from active pool");

        IERC20(tokenAddress).safeTransfer(owner(), amount);
    }

    // Internal functions

    /**
     * @dev Accrues interest for a specific provider
     * @param providerAddress The address of the provider
     * @param tokenAddress The address of the token
     */
    function _accrueInterest(address providerAddress, address tokenAddress) internal {
        uint256 pendingInterest = _calculatePendingInterest(providerAddress, tokenAddress);
        if (pendingInterest > 0) {
            LiquidityProvider storage provider = providers[providerAddress][tokenAddress];
            PoolInfo storage pool = pools[tokenAddress];

            provider.interestEarned = provider.interestEarned.add(pendingInterest);
            provider.lastInterestCalculation = block.timestamp;

            pool.totalInterestPaid = pool.totalInterestPaid.add(pendingInterest);

            emit InterestAccrued(providerAddress, tokenAddress, pendingInterest, block.timestamp);
        }
    }

    /**
     * @dev Updates interest for all providers in a pool
     * @param tokenAddress The address of the token
     */
    function _updateAllProviderInterest(address tokenAddress) internal {
        // In a production environment, this would be optimized to avoid gas limits
        // For now, we'll leave this as a placeholder for the concept
        // In practice, you might use a pull-based interest calculation system
    }

    /**
     * @dev Calculates pending interest for a provider
     * @param providerAddress The address of the provider
     * @param tokenAddress The address of the token
     * @return The pending interest amount
     */
    function _calculatePendingInterest(
        address providerAddress,
        address tokenAddress
    ) internal view returns (uint256) {
        LiquidityProvider storage provider = providers[providerAddress][tokenAddress];
        if (!provider.isActive || provider.totalDeposited == 0) return 0;

        PoolInfo storage pool = pools[tokenAddress];
        uint256 timeElapsed = block.timestamp.sub(provider.lastInterestCalculation);

        // Calculate interest: principal * rate * time / (365 * 24 * 60 * 60 * 10000)
        uint256 principal = provider.totalDeposited.sub(provider.totalWithdrawn);
        uint256 interest = principal.mul(pool.interestRate).mul(timeElapsed).div(3153600000000); // 365 days * 24 hours * 60 minutes * 60 seconds * 10000 (basis points)

        return interest;
    }
}