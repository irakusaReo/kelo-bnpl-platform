use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("KeloLiquidityPool11111111111111111111111111111111");

#[program]
pub mod kelo_liquidity_pool {
    use super::*;

    /// Creates a new liquidity pool for a specific token
    pub fn create_pool(
        ctx: Context<CreatePool>,
        token_mint: Pubkey,
        symbol: String,
        initial_interest_rate: u64,
    ) -> Result<()> {
        require!(initial_interest_rate > 0, ErrorCode::InvalidInterestRate);
        require!(!symbol.is_empty(), ErrorCode::InvalidSymbol);

        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.token_mint = token_mint;
        pool.symbol = symbol;
        pool.total_liquidity = 0;
        pool.total_deposits = 0;
        pool.total_withdrawals = 0;
        pool.total_interest_paid = 0;
        pool.interest_rate = initial_interest_rate;
        pool.last_interest_update = Clock::get()?.unix_timestamp;
        pool.is_active = true;
        pool.bump = ctx.bumps.pool;

        emit!(PoolCreatedEvent {
            token_mint,
            symbol: pool.symbol.clone(),
            interest_rate: initial_interest_rate,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Deposits liquidity into a pool
    pub fn deposit_liquidity(
        ctx: Context<DepositLiquidity>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let provider = &mut ctx.accounts.provider;
        let clock = Clock::get()?;

        // Check if pool is active
        require!(pool.is_active, ErrorCode::PoolNotActive);

        // Calculate and accrue interest for existing deposits
        if provider.total_deposited > 0 {
            accrue_interest(provider, pool, clock.unix_timestamp)?;
        }

        // Transfer tokens from provider to pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.provider_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: ctx.accounts.provider_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update provider information
        provider.total_deposited += amount;
        provider.is_active = true;
        provider.last_interest_calculation = clock.unix_timestamp;

        // Update pool information
        pool.total_liquidity += amount;
        pool.total_deposits += amount;

        emit!(LiquidityDepositedEvent {
            provider: provider.key(),
            token_mint: pool.token_mint,
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Withdraws liquidity from a pool
    pub fn withdraw_liquidity(
        ctx: Context<WithdrawLiquidity>,
        amount: u64,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pool = &mut ctx.accounts.pool;
        let provider = &mut ctx.accounts.provider;
        let clock = Clock::get()?;

        // Check if pool is active and provider is active
        require!(pool.is_active, ErrorCode::PoolNotActive);
        require!(provider.is_active, ErrorCode::ProviderNotActive);

        // Calculate and accrue interest
        accrue_interest(provider, pool, clock.unix_timestamp)?;

        let available_balance = provider.total_deposited + provider.interest_earned - provider.total_withdrawn;
        require!(amount <= available_balance, ErrorCode::InsufficientBalance);

        // Update provider information
        provider.total_withdrawn += amount;

        // Update pool information
        pool.total_liquidity -= amount;
        pool.total_withdrawals += amount;

        // Transfer tokens from pool to provider
        let seeds = &[
            b"pool".as_ref(),
            pool.token_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.provider_token_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        emit!(LiquidityWithdrawnEvent {
            provider: provider.key(),
            token_mint: pool.token_mint,
            amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Disburses funds to a merchant for a loan
    pub fn disburse_to_merchant(
        ctx: Context<DisburseToMerchant>,
        amount: u64,
        loan_id: String,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(!loan_id.is_empty(), ErrorCode::InvalidLoanId);

        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // Check if pool is active
        require!(pool.is_active, ErrorCode::PoolNotActive);
        require!(amount <= pool.total_liquidity, ErrorCode::InsufficientPoolLiquidity);

        // Update pool liquidity
        pool.total_liquidity -= amount;

        // Transfer tokens from pool to merchant
        let seeds = &[
            b"pool".as_ref(),
            pool.token_mint.as_ref(),
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];
        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.merchant_token_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        emit!(MerchantDisbursedEvent {
            merchant: ctx.accounts.merchant.key(),
            token_mint: pool.token_mint,
            amount,
            loan_id,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Updates the interest rate for a pool
    pub fn update_interest_rate(
        ctx: Context<UpdateInterestRate>,
        new_interest_rate: u64,
    ) -> Result<()> {
        require!(new_interest_rate > 0, ErrorCode::InvalidInterestRate);

        let pool = &mut ctx.accounts.pool;
        let clock = Clock::get()?;

        // Check if pool is active
        require!(pool.is_active, ErrorCode::PoolNotActive);

        let old_rate = pool.interest_rate;
        pool.interest_rate = new_interest_rate;
        pool.last_interest_update = clock.unix_timestamp;

        emit!(InterestRateUpdatedEvent {
            token_mint: pool.token_mint,
            old_rate,
            new_rate,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

/// Accrues interest for a provider
fn accrue_interest(
    provider: &mut Account<Provider>,
    pool: &mut Account<Pool>,
    current_time: i64,
) -> Result<()> {
    if provider.total_deposited == 0 {
        return Ok(());
    }

    let time_elapsed = current_time - provider.last_interest_calculation;
    if time_elapsed <= 0 {
        return Ok(());
    }

    // Calculate interest: principal * rate * time / (365 * 24 * 60 * 60 * 10000)
    let principal = provider.total_deposited - provider.total_withdrawn;
    let interest = principal
        .checked_mul(pool.interest_rate)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_mul(time_elapsed as u64)
        .ok_or(ErrorCode::MathOverflow)?
        .checked_div(3153600000000) // 365 days * 24 hours * 60 minutes * 60 seconds * 10000 (basis points)
        .ok_or(ErrorCode::MathOverflow)?;

    if interest > 0 {
        provider.interest_earned += interest;
        provider.last_interest_calculation = current_time;
        pool.total_interest_paid += interest;

        emit!(InterestAccruedEvent {
            provider: provider.key(),
            token_mint: pool.token_mint,
            amount: interest,
            timestamp: current_time,
        });
    }

    Ok(())
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Pool::LEN,
        seeds = [b"pool", token_mint.key().as_ref()],
        bump,
    )]
    pub pool: Account<'info, Pool>,

    pub token_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(mut)]
    pub provider_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.token_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        init_if_needed,
        payer = provider_authority,
        space = 8 + Provider::LEN,
        seeds = [b"provider", provider_authority.key().as_ref(), pool.token_mint.as_ref()],
        bump,
    )]
    pub provider: Account<'info, Provider>,

    #[account(
        mut,
        associated_token::mint = pool.token_mint,
        associated_token::authority = provider_authority,
    )]
    pub provider_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawLiquidity<'info> {
    #[account(mut)]
    pub provider_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.token_mint.as_ref()],
        bump = pool.bump,
    )]
    pub pool: Account<'info, Pool>,

    #[account(
        mut,
        seeds = [b"provider", provider_authority.key().as_ref(), pool.token_mint.as_ref()],
        bump,
    )]
    pub provider: Account<'info, Provider>,

    #[account(
        mut,
        associated_token::mint = pool.token_mint,
        associated_token::authority = provider_authority,
    )]
    pub provider_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct DisburseToMerchant<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.token_mint.as_ref()],
        bump = pool.bump,
        has_one = authority,
    )]
    pub pool: Account<'info, Pool>,

    /// CHECK: This is not dangerous because we don't read or write from this account
    pub merchant: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = pool.token_mint,
        associated_token::authority = merchant,
    )]
    pub merchant_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.token_mint,
        associated_token::authority = pool,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateInterestRate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pool", pool.token_mint.as_ref()],
        bump = pool.bump,
        has_one = authority,
    )]
    pub pool: Account<'info, Pool>,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub symbol: String,
    pub total_liquidity: u64,
    pub total_deposits: u64,
    pub total_withdrawals: u64,
    pub total_interest_paid: u64,
    pub interest_rate: u64,
    pub last_interest_update: i64,
    pub is_active: bool,
    pub bump: u8,
}

impl Pool {
    pub const LEN: usize = 32 + // authority
        32 + // token_mint
        4 + 32 + // symbol (string)
        8 + // total_liquidity
        8 + // total_deposits
        8 + // total_withdrawals
        8 + // total_interest_paid
        8 + // interest_rate
        8 + // last_interest_update
        1 + // is_active
        1; // bump
}

#[account]
pub struct Provider {
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub interest_earned: u64,
    pub last_interest_calculation: i64,
    pub is_active: bool,
    pub bump: u8,
}

impl Provider {
    pub const LEN: usize = 8 + // total_deposited
        8 + // total_withdrawn
        8 + // interest_earned
        8 + // last_interest_calculation
        1 + // is_active
        1; // bump
}

#[event]
pub struct PoolCreatedEvent {
    pub token_mint: Pubkey,
    pub symbol: String,
    pub interest_rate: u64,
    pub timestamp: i64,
}

#[event]
pub struct LiquidityDepositedEvent {
    pub provider: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct LiquidityWithdrawnEvent {
    pub provider: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct MerchantDisbursedEvent {
    pub merchant: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub loan_id: String,
    pub timestamp: i64,
}

#[event]
pub struct InterestAccruedEvent {
    pub provider: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct InterestRateUpdatedEvent {
    pub token_mint: Pubkey,
    pub old_rate: u64,
    pub new_rate: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid interest rate")]
    InvalidInterestRate,
    #[msg("Invalid symbol")]
    InvalidSymbol,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Pool is not active")]
    PoolNotActive,
    #[msg("Provider is not active")]
    ProviderNotActive,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Insufficient pool liquidity")]
    InsufficientPoolLiquidity,
    #[msg("Invalid loan ID")]
    InvalidLoanId,
    #[msg("Math overflow")]
    MathOverflow,
}