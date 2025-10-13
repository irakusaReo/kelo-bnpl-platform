
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
    program_pack::{IsInitialized, Pack, Sealed},
    system_instruction,
};
use spl_token::instruction::transfer;
use borsh::{BorshDeserialize, BorshSerialize};

// State for an individual user's deposit
#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct DepositInfo {
    pub is_initialized: bool,
    pub amount: u64,
}

// State for the entire pool's configuration
#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct PoolState {
    pub is_initialized: bool,
    pub relayer_pubkey: Pubkey,
}

impl Sealed for DepositInfo {}
impl IsInitialized for DepositInfo {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
impl Pack for DepositInfo {
    const LEN: usize = 9; // 1 byte for bool, 8 bytes for u64

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(src).map_err(|_| ProgramError::InvalidAccountData)
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let packed = self.try_to_vec().unwrap();
        dst[..packed.len()].copy_from_slice(&packed);
    }
}

impl Sealed for PoolState {}
impl IsInitialized for PoolState {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
impl Pack for PoolState {
    const LEN: usize = 33; // 1 byte for bool, 32 bytes for Pubkey

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        Self::try_from_slice(src).map_err(|_| ProgramError::InvalidAccountData)
    }

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let packed = self.try_to_vec().unwrap();
        dst[..packed.len()].copy_from_slice(&packed);
    }
}

// Define the program's instruction set
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum KeloInstruction {
    Initialize { relayer_pubkey: Pubkey },
    Deposit { amount: u64 },
    Withdraw { amount: u64 },
    Disburse { amount: u64 },
}

// Program entrypoint
entrypoint!(process_instruction);

// Instruction processor
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = KeloInstruction::try_from_slice(instruction_data)?;

    match instruction {
        KeloInstruction::Initialize { relayer_pubkey } => {
            msg!("Instruction: Initialize");
            process_initialize(accounts, relayer_pubkey, program_id)
        }
        KeloInstruction::Deposit { amount } => {
            msg!("Instruction: Deposit");
            process_deposit(accounts, amount, program_id)
        }
        KeloInstruction::Withdraw { amount } => {
            msg!("Instruction: Withdraw");
            process_withdraw(accounts, amount, program_id)
        }
        KeloInstruction::Disburse { amount } => {
            msg!("Instruction: Disburse");
            process_disburse(accounts, amount, program_id)
        }
    }
}

// Initializes the pool's state
fn process_initialize(
    accounts: &[AccountInfo],
    relayer_pubkey: Pubkey,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let initializer = next_account_info(account_info_iter)?;
    let pool_state_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;

    let (pda, bump_seed) = Pubkey::find_program_address(&[b"pool_state"], program_id);
    if pool_state_account.key != &pda {
        return Err(ProgramError::InvalidAccountData);
    }

    if pool_state_account.owner != program_id {
        invoke_signed(
            &system_instruction::create_account(
                initializer.key,
                pool_state_account.key,
                rent.minimum_balance(PoolState::LEN),
                PoolState::LEN as u64,
                program_id,
            ),
            &[
                initializer.clone(),
                pool_state_account.clone(),
                system_program.clone(),
            ],
            &[&[b"pool_state", &[bump_seed]]],
        )?;
    }

    let mut pool_state = PoolState::unpack_unchecked(&pool_state_account.data.borrow())?;
    if pool_state.is_initialized() {
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    pool_state.is_initialized = true;
    pool_state.relayer_pubkey = relayer_pubkey;
    PoolState::pack(pool_state, &mut pool_state_account.data.borrow_mut())?;

    Ok(())
}


// Processes a deposit instruction (logic remains similar)
fn process_deposit(
    accounts: &[AccountInfo],
    amount: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user_account = next_account_info(account_info_iter)?;
    let user_token_account = next_account_info(account_info_iter)?;
    let pool_token_account = next_account_info(account_info_iter)?;
    let user_deposit_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    let rent = &Rent::from_account_info(next_account_info(account_info_iter)?)?;

    let (pda, bump_seed) = Pubkey::find_program_address(&[b"deposit", user_account.key.as_ref()], program_id);
    if user_deposit_account.key != &pda {
        return Err(ProgramError::InvalidAccountData);
    }
    if user_deposit_account.owner != program_id {
        invoke_signed(
            &system_instruction::create_account(
                user_account.key,
                user_deposit_account.key,
                rent.minimum_balance(DepositInfo::LEN),
                DepositInfo::LEN as u64,
                program_id,
            ),
            &[
                user_account.clone(),
                user_deposit_account.clone(),
                system_program.clone(),
            ],
            &[&[b"deposit", user_account.key.as_ref(), &[bump_seed]]],
        )?;
    }

    let transfer_instruction = transfer(
        token_program.key,
        user_token_account.key,
        pool_token_account.key,
        user_account.key,
        &[],
        amount,
    )?;
    invoke(
        &transfer_instruction,
        &[
            user_token_account.clone(),
            pool_token_account.clone(),
            user_account.clone(),
            token_program.clone(),
        ],
    )?;

    let mut deposit_info = DepositInfo::unpack_unchecked(&user_deposit_account.data.borrow())?;
    if !deposit_info.is_initialized() {
        deposit_info.is_initialized = true;
        deposit_info.amount = 0;
    }
    deposit_info.amount += amount;
    DepositInfo::pack(deposit_info, &mut user_deposit_account.data.borrow_mut())?;

    Ok(())
}

// Processes a withdraw instruction (logic remains similar)
fn process_withdraw(
    accounts: &[AccountInfo],
    amount: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let user_account = next_account_info(account_info_iter)?;
    let user_token_account = next_account_info(account_info_iter)?;
    let pool_token_account = next_account_info(account_info_iter)?;
    let pool_authority = next_account_info(account_info_iter)?;
    let user_deposit_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    let (pda, bump_seed) = Pubkey::find_program_address(&[b"kelo_pool"], program_id);
    if pool_authority.key != &pda {
        return Err(ProgramError::InvalidAccountData);
    }

    let mut deposit_info = DepositInfo::unpack(&user_deposit_account.data.borrow())?;
    if deposit_info.amount < amount {
        return Err(ProgramError::InsufficientFunds);
    }
    deposit_info.amount -= amount;
    DepositInfo::pack(deposit_info, &mut user_deposit_account.data.borrow_mut())?;

    let transfer_instruction = transfer(
        token_program.key,
        pool_token_account.key,
        user_token_account.key,
        pool_authority.key,
        &[],
        amount,
    )?;
    invoke_signed(
        &transfer_instruction,
        &[
            pool_token_account.clone(),
            user_token_account.clone(),
            pool_authority.clone(),
            token_program.clone(),
        ],
        &[&[b"kelo_pool", &[bump_seed]]],
    )?;

    Ok(())
}

// Processes a disburse instruction
fn process_disburse(
    accounts: &[AccountInfo],
    amount: u64,
    program_id: &Pubkey,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    let relayer_account = next_account_info(account_info_iter)?;
    let merchant_token_account = next_account_info(account_info_iter)?;
    let pool_token_account = next_account_info(account_info_iter)?;
    let pool_authority = next_account_info(account_info_iter)?;
    let pool_state_account = next_account_info(account_info_iter)?;
    let token_program = next_account_info(account_info_iter)?;

    if !relayer_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let pool_state = PoolState::unpack(&pool_state_account.data.borrow())?;
    if !pool_state.is_initialized() {
        return Err(ProgramError::UninitializedAccount);
    }
    if relayer_account.key != &pool_state.relayer_pubkey {
        return Err(ProgramError::InvalidAccountData);
    }

    let (pda, bump_seed) = Pubkey::find_program_address(&[b"kelo_pool"], program_id);
    if pool_authority.key != &pda {
        return Err(ProgramError::InvalidAccountData);
    }

    let transfer_instruction = transfer(
        token_program.key,
        pool_token_account.key,
        merchant_token_account.key,
        pool_authority.key,
        &[],
        amount,
    )?;
    invoke_signed(
        &transfer_instruction,
        &[
            pool_token_account.clone(),
            merchant_token_account.clone(),
            pool_authority.clone(),
            token_program.clone(),
        ],
        &[&[b"kelo_pool", &[bump_seed]]],
    )?;

    Ok(())
}
