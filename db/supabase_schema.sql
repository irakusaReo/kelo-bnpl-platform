-- Kelo Supabase Schema
-- This script sets up the database schema, roles, and RLS policies for the Kelo platform.

--
-- 1. Tables
--

-- Custom type for user roles
CREATE TYPE public.user_role AS ENUM (
    'user',
    'merchant',
    'admin'
);

-- Profiles Table
-- Stores public-facing user information and links to Supabase auth.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL DEFAULT 'user',
    wallet_address TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    did TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing user information and links to Supabase auth.';

-- Merchants Table
-- Stores information about merchants. Linked one-to-one with profiles.
CREATE TABLE public.merchants (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_registration_number TEXT,
    business_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.merchants IS 'Stores information about merchants. Linked one-to-one with profiles.';

-- Merchant Stores Table
-- Stores information about a merchant's online or physical stores.
CREATE TABLE public.merchant_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    store_url TEXT,
    store_address TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.merchant_stores IS 'Stores information about a merchant''s online or physical stores.';

-- Products Table
-- Stores information about products sold by merchants.
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_store_id UUID NOT NULL REFERENCES public.merchant_stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    sku TEXT,
    images TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.products IS 'Stores information about products sold by merchants.';

-- Orders Table
-- Stores information about orders placed by users.
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    merchant_store_id UUID NOT NULL REFERENCES public.merchant_stores(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- e.g., pending, completed, cancelled
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.orders IS 'Stores information about orders placed by users.';

-- Order Items Table
-- A join table linking orders and products.
CREATE TABLE public.order_items (
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC(10, 2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);
COMMENT ON TABLE public.order_items IS 'A join table linking orders and products.';

-- Loans Table
-- Stores information about BNPL loans.
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    principal_amount NUMERIC(10, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- e.g., active, paid_off, defaulted
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.loans IS 'Stores information about BNPL loans.';

-- Repayments Table
-- Stores repayment records for each loan.
CREATE TABLE public.repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    repayment_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.repayments IS 'Stores repayment records for each loan.';

-- Liquidity Pools Table
-- Stores information about the available liquidity pools.
CREATE TABLE public.liquidity_pools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    total_staked NUMERIC(15, 2) NOT NULL DEFAULT 0,
    apy NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.liquidity_pools IS 'Stores information about the available liquidity pools.';

-- User Investments Table
-- A join table linking users/merchants to liquidity pools.
CREATE TABLE public.user_investments (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pool_id UUID NOT NULL REFERENCES public.liquidity_pools(id) ON DELETE CASCADE,
    staked_amount NUMERIC(15, 2) NOT NULL,
    PRIMARY KEY (user_id, pool_id)
);
COMMENT ON TABLE public.user_investments IS 'A join table linking users/merchants to liquidity pools.';


--
-- 2. Indexes
--
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX idx_merchants_business_name ON public.merchants(business_name);
CREATE INDEX idx_merchant_stores_merchant_id ON public.merchant_stores(merchant_id);
CREATE INDEX idx_products_merchant_store_id ON public.products(merchant_store_id);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_merchant_store_id ON public.orders(merchant_store_id);
CREATE INDEX idx_loans_user_id ON public.loans(user_id);
CREATE INDEX idx_repayments_loan_id ON public.repayments(loan_id);
CREATE INDEX idx_user_investments_user_id ON public.user_investments(user_id);
CREATE INDEX idx_user_investments_pool_id ON public.user_investments(pool_id);

--
-- 3. Functions and Triggers for Role Syncing
--
-- Function to sync user role from app_metadata to profiles table
-- Function to sync user role and basic info from app_metadata to profiles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, first_name, last_name, phone)
  VALUES (
    NEW.id,
    (NEW.raw_app_meta_data->>'role')::public.user_role,
    NEW.raw_app_meta_data->>'first_name',
    NEW.raw_app_meta_data->>'last_name',
    NEW.raw_app_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Trigger to call the function on new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

--
-- 4. Row-Level Security (RLS) Policies
--
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidity_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_investments ENABLE ROW LEVEL SECURITY;

--
-- RLS Policies for Admins (Super-user access)
--
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all merchants" ON public.merchants FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all merchant_stores" ON public.merchant_stores FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all order_items" ON public.order_items FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all loans" ON public.loans FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all repayments" ON public.repayments FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all liquidity_pools" ON public.liquidity_pools FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
CREATE POLICY "Admins can manage all user_investments" ON public.user_investments FOR ALL TO authenticated USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

--
-- RLS Policies for Users
--
-- Profiles
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- Orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
-- (Users should not be able to create orders directly, this is handled by backend logic)

-- Order Items
CREATE POLICY "Users can view items in their own orders" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  )
);

-- Loans
CREATE POLICY "Users can view their own loans" ON public.loans FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Repayments
CREATE POLICY "Users can view their own repayments" ON public.repayments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = repayments.loan_id AND loans.user_id = auth.uid()
  )
);

-- User Investments
CREATE POLICY "Users can view their own investments" ON public.user_investments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own investments" ON public.user_investments FOR ALL TO authenticated USING (user_id = auth.uid());

--
-- RLS Policies for Merchants
--
-- Merchants are users, so they inherit user policies. These are additional policies.
CREATE POLICY "Merchants can view their own merchant data" ON public.merchants FOR SELECT TO authenticated USING (id = auth.uid());

-- Merchant Stores
CREATE POLICY "Merchants can manage their own stores" ON public.merchant_stores FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.merchants
    WHERE merchants.id = merchant_stores.merchant_id AND merchants.id = auth.uid()
  )
);

-- Products
CREATE POLICY "Merchants can manage products in their own stores" ON public.products FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.merchant_stores
    WHERE merchant_stores.id = products.merchant_store_id AND merchant_stores.merchant_id = auth.uid()
  )
);

-- Orders
CREATE POLICY "Merchants can view orders for their stores" ON public.orders FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.merchant_stores
    WHERE merchant_stores.id = orders.merchant_store_id AND merchant_stores.merchant_id = auth.uid()
  )
);

--
-- RLS Policies for Public/Anonymous Access
--
-- By default, no public access is granted.
-- Allow public read access to liquidity pools.
CREATE POLICY "Public can view liquidity pools" ON public.liquidity_pools FOR SELECT TO anon, authenticated USING (true);


--
-- 5. Transactions Table (added from migration)
--
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    amount NUMERIC(20, 8) NOT NULL,
    token_address TEXT,
    token_symbol TEXT,
    chain_id TEXT,
    transaction_hash TEXT NOT NULL,
    block_number BIGINT,
    status TEXT NOT NULL DEFAULT 'pending',
    gas_used BIGINT,
    gas_price NUMERIC(20, 8),
    fee NUMERIC(20, 8),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.transactions IS 'Stores records of on-chain transactions for credit scoring analysis.';
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE UNIQUE INDEX idx_transactions_hash ON public.transactions(transaction_hash);

-- Enable RLS for the new table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Admins
CREATE POLICY "Admins can manage all transactions" ON public.transactions FOR ALL
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- RLS Policies for Users
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());