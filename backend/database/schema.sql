-- Kelo BNPL Platform Database Schema
-- This schema defines the database structure for the Kelo Buy Now, Pay Later platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE loan_status AS ENUM ('pending', 'approved', 'active', 'repaid', 'defaulted');
CREATE TYPE repayment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed');
CREATE TYPE payment_method AS ENUM ('mpesa', 'bank_transfer', 'crypto');
CREATE TYPE business_type AS ENUM ('retail', 'restaurant', 'service', 'ecommerce', 'other');
CREATE TYPE data_source AS ENUM ('on_chain', 'off_chain', 'combined');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    did VARCHAR(255), -- Decentralized Identifier
    wallet_address VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Merchants table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type business_type,
    description TEXT,
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    did VARCHAR(255), -- Merchant DID
    wallet_address VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Loans table
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    interest_rate DECIMAL(10, 4) NOT NULL,
    duration INTEGER NOT NULL, -- in days
    status loan_status DEFAULT 'pending',
    purpose TEXT,
    token_id VARCHAR(255), -- NFT token ID on Hedera
    chain_id VARCHAR(50),
    transaction_hash VARCHAR(255),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    disbursed_at TIMESTAMP WITH TIME ZONE,
    repaid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Repayments table
CREATE TABLE repayments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount DECIMAL(20, 8) NOT NULL,
    transaction_hash VARCHAR(255),
    chain_id VARCHAR(50),
    status repayment_status DEFAULT 'pending',
    payment_method payment_method,
    reference_number VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Liquidity pools table
CREATE TABLE liquidity_pools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_address VARCHAR(255) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    chain_id VARCHAR(50) NOT NULL,
    total_liquidity DECIMAL(20, 8) DEFAULT 0,
    total_deposits DECIMAL(20, 8) DEFAULT 0,
    total_withdrawals DECIMAL(20, 8) DEFAULT 0,
    total_interest_paid DECIMAL(20, 8) DEFAULT 0,
    interest_rate DECIMAL(10, 4) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    contract_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Liquidity providers table
CREATE TABLE liquidity_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pool_id UUID NOT NULL REFERENCES liquidity_pools(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_deposited DECIMAL(20, 8) DEFAULT 0,
    total_withdrawn DECIMAL(20, 8) DEFAULT 0,
    interest_earned DECIMAL(20, 8) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_interest_calc TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credit scores table
CREATE TABLE credit_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    previous_score INTEGER,
    max_score INTEGER DEFAULT 850,
    factors TEXT, -- JSON string of scoring factors
    update_reason TEXT,
    data_source data_source DEFAULT 'combined',
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- deposit, withdrawal, disbursement, repayment
    amount DECIMAL(20, 8) NOT NULL,
    token_address VARCHAR(255),
    token_symbol VARCHAR(20),
    chain_id VARCHAR(50),
    transaction_hash VARCHAR(255) NOT NULL,
    block_number BIGINT,
    status transaction_status DEFAULT 'pending',
    gas_used BIGINT,
    gas_price DECIMAL(20, 8),
    fee DECIMAL(20, 8),
    metadata TEXT, -- JSON string for additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    old_values TEXT, -- JSON string
    new_values TEXT, -- JSON string
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API keys table for external integrations
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions TEXT, -- JSON string of permissions
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Webhooks table for event notifications
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    events TEXT[] NOT NULL, -- Array of event types
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_did ON users(did);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_merchants_user_id ON merchants(user_id);
CREATE INDEX idx_merchants_business_name ON merchants(business_name);
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_merchant_id ON loans(merchant_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX idx_repayments_status ON repayments(status);
CREATE INDEX idx_liquidity_pools_token_address ON liquidity_pools(token_address);
CREATE INDEX idx_liquidity_pools_chain_id ON liquidity_pools(chain_id);
CREATE INDEX idx_liquidity_providers_pool_id ON liquidity_providers(pool_id);
CREATE INDEX idx_liquidity_providers_user_id ON liquidity_providers(user_id);
CREATE INDEX idx_credit_scores_user_id ON credit_scores(user_id);
CREATE INDEX idx_credit_scores_valid_until ON credit_scores(valid_until);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_transaction_hash ON transactions(transaction_hash);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_events ON webhooks USING GIN(events);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repayments_updated_at BEFORE UPDATE ON repayments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_liquidity_pools_updated_at BEFORE UPDATE ON liquidity_pools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_liquidity_providers_updated_at BEFORE UPDATE ON liquidity_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_scores_updated_at BEFORE UPDATE ON credit_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create default admin user (password should be changed immediately)
-- Password: 'admin123' (hashed with bcrypt)
INSERT INTO users (email, password_hash, first_name, last_name, is_active) 
VALUES ('admin@kelo.ke', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', true)
ON CONFLICT (email) DO NOTHING;

-- Create default liquidity pools for supported tokens
INSERT INTO liquidity_pools (token_address, token_symbol, chain_id, interest_rate) 
VALUES 
    ('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 'USDC', 'ethereum', 500),
    ('0xdAC17F958D2ee523a2206206994597C13D831ec7', 'USDT', 'ethereum', 500),
    ('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'USDC', 'base', 500),
    ('0x50c5725949A6F0c72E6C4a641F24049A9fDB7520', 'USDT', 'base', 500)
ON CONFLICT DO NOTHING;

-- Create default credit score ranges for reference
CREATE TABLE credit_score_ranges (
    id SERIAL PRIMARY KEY,
    min_score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    rating VARCHAR(50) NOT NULL,
    description TEXT,
    max_loan_amount DECIMAL(20, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO credit_score_ranges (min_score, max_score, rating, description, max_loan_amount) VALUES
    (750, 850, 'Excellent', 'Excellent credit history, eligible for maximum loan amounts', 1000000),
    (700, 749, 'Good', 'Good credit history, eligible for high loan amounts', 750000),
    (650, 699, 'Fair', 'Fair credit history, eligible for moderate loan amounts', 500000),
    (600, 649, 'Poor', 'Poor credit history, eligible for limited loan amounts', 250000),
    (300, 599, 'Very Poor', 'Very poor credit history, limited loan options', 100000);

-- Create loan statistics view
CREATE VIEW loan_statistics AS
SELECT 
    COUNT(*) as total_loans,
    SUM(amount) as total_loan_amount,
    AVG(amount) as average_loan_amount,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_loans,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_loans,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_loans,
    COUNT(CASE WHEN status = 'repaid' THEN 1 END) as repaid_loans,
    COUNT(CASE WHEN status = 'defaulted' THEN 1 END) as defaulted_loans,
    COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'repaid' THEN 1 END) as overdue_loans
FROM loans;

-- Create user statistics view
CREATE VIEW user_statistics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as new_users_30d,
    COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as new_users_7d,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN did IS NOT NULL THEN 1 END) as users_with_did,
    COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END) as users_with_wallet
FROM users;

-- Create merchant statistics view
CREATE VIEW merchant_statistics AS
SELECT 
    COUNT(*) as total_merchants,
    COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1 END) as new_merchants_30d,
    COUNT(CASE WHEN created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as new_merchants_7d,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_merchants,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_merchants
FROM merchants;

-- Create liquidity statistics view
CREATE VIEW liquidity_statistics AS
SELECT 
    COUNT(*) as total_pools,
    SUM(total_liquidity) as total_liquidity,
    SUM(total_deposits) as total_deposits,
    SUM(total_withdrawals) as total_withdrawals,
    SUM(total_interest_paid) as total_interest_paid,
    AVG(interest_rate) as average_interest_rate,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_pools
FROM liquidity_pools;