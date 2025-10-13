module KeloLiquidityPool::KeloLiquidityPool {
    use Std::Signer;
    use AptosFramework::Coin::{Self, Coin};
    use AptosFramework::Table::{Self, Table};

    struct Pool<phantom CoinType> has key {
        balance: Coin<CoinType>,
    }

    // A resource to hold the table of deposits for a given coin type.
    // This allows the contract to manage balances for all users in one place.
    struct Deposits<phantom CoinType> has key {
        user_deposits: Table<address, u64>,
    }

    struct AdminCap has key {}

    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_POOL_NOT_INITIALIZED: u64 = 3;
    const E_DEPOSITS_NOT_INITIALIZED: u64 = 4;

    fun init_module(sender: &signer) {
        let sender_addr = Signer::address_of(sender);
        // Create admin capability for the deployer
        move_to(sender, AdminCap {});
    }

    // Initializes the pool for a new coin type. Must be called by the admin.
    public fun initialize_pool<CoinType>(admin: &signer) {
        assert!(exists<AdminCap>(Signer::address_of(admin)), E_NOT_AUTHORIZED);
        let admin_addr = Signer::address_of(admin);
        // Publish the main pool resource and the deposits table under the admin's (contract's) account
        move_to(admin, Pool<CoinType> { balance: Coin::zero<CoinType>() });
        move_to(admin, Deposits<CoinType> { user_deposits: Table::new<address, u64>() });
    }

    public fun deposit<CoinType>(account: &signer, amount: u64) acquires Deposits, Pool {
        let account_addr = Signer::address_of(account);
        let contract_addr = @KeloLiquidityPool; // The address where the pool is stored

        // Ensure the pool has been initialized for this coin type
        assert!(exists<Pool<CoinType>>(contract_addr), E_POOL_NOT_INITIALIZED);
        assert!(exists<Deposits<CoinType>>(contract_addr), E_DEPOSITS_NOT_INITIALIZED);

        // Withdraw from user and deposit into the central pool
        let coin = Coin::withdraw<CoinType>(account, amount);
        let pool = borrow_global_mut<Pool<CoinType>>(contract_addr);
        Coin::merge(&mut pool.balance, coin);

        // Update the user's deposit amount in the table
        let deposits = borrow_global_mut<Deposits<CoinType>>(contract_addr);
        let user_deposits_table = &mut deposits.user_deposits;

        let current_balance = if (Table::contains(user_deposits_table, account_addr)) {
            *Table::borrow(user_deposits_table, account_addr)
        } else {
            0
        };
        let new_balance = current_balance + amount;
        if (Table::contains(user_deposits_table, account_addr)) {
            let entry = Table::borrow_mut(user_deposits_table, account_addr);
            *entry = new_balance;
        } else {
            Table::add(user_deposits_table, account_addr, new_balance);
        }
    }

    public fun withdraw<CoinType>(account: &signer, amount: u64) acquires Deposits, Pool {
        let account_addr = Signer::address_of(account);
        let contract_addr = @KeloLiquidityPool;

        // Ensure the pool exists
        assert!(exists<Pool<CoinType>>(contract_addr), E_POOL_NOT_INITIALIZED);
        assert!(exists<Deposits<CoinType>>(contract_addr), E_DEPOSITS_NOT_INITIALIZED);

        // Check if the user has enough balance in the deposit table
        let deposits = borrow_global_mut<Deposits<CoinType>>(contract_addr);
        let user_deposits_table = &mut deposits.user_deposits;
        assert!(Table::contains(user_deposits_table, account_addr), E_INSUFFICIENT_BALANCE);

        let user_balance = Table::borrow_mut(user_deposits_table, account_addr);
        assert!(*user_balance >= amount, E_INSUFFICIENT_BALANCE);

        // Update user's balance
        *user_balance = *user_balance - amount;

        // Withdraw from the central pool and deposit to the user
        let pool = borrow_global_mut<Pool<CoinType>>(contract_addr);
        assert!(Coin::value(&pool.balance) >= amount, E_INSUFFICIENT_BALANCE); // Pool sanity check
        let coin = Coin::extract(&mut pool.balance, amount);
        Coin::deposit(account_addr, coin);
    }

    public fun disburse<CoinType>(admin: &signer, to: address, amount: u64) acquires Pool {
        assert!(exists<AdminCap>(Signer::address_of(admin)), E_NOT_AUTHORIZED);
        let contract_addr = @KeloLiquidityPool;
        assert!(exists<Pool<CoinType>>(contract_addr), E_POOL_NOT_INITIALIZED);

        let pool = borrow_global_mut<Pool<CoinType>>(contract_addr);
        assert!(Coin::value(&pool.balance) >= amount, E_INSUFFICIENT_BALANCE);

        let coin = Coin::extract(&mut pool.balance, amount);
        Coin::deposit(to, coin);
    }
}
