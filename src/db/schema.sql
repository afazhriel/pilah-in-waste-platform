-- ============================================================================
-- PILAH.IN — Smart Waste Banking & IoT Management Platform
-- Normalized PostgreSQL Database Schema (Phase 1 & Production Ready)
-- Target: Supabase / PostgreSQL 15+ with Row Level Security (RLS)
-- Timezone Standard: Asia/Jakarta (TIMESTAMPTZ)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations (Multi-tenant support)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 2. Branches (Unit Bank Sampah)
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    city VARCHAR(100) DEFAULT 'Jakarta Selatan',
    manager_name VARCHAR(150),
    phone VARCHAR(32),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    CONSTRAINT uq_branch_code UNIQUE(organization_id, code)
);

-- 3. User Roles & Profiles
CREATE TYPE user_role_type AS ENUM ('super_admin', 'branch_admin', 'operator', 'finance', 'member');

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE, -- linked to Supabase auth.users if enabled
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    role user_role_type NOT NULL DEFAULT 'operator',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(32),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 4. Members (Nasabah Bank Sampah)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    member_code VARCHAR(32) UNIQUE NOT NULL,
    nik VARCHAR(16),
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    address TEXT NOT NULL,
    rt_rw VARCHAR(16) NOT NULL,
    kelurahan VARCHAR(100),
    registration_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    qr_code_token VARCHAR(64) UNIQUE NOT NULL,
    total_deposit_count INT DEFAULT 0,
    total_weight_kg NUMERIC(12, 3) DEFAULT 0.000,
    total_deposit_value BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 5. Waste Categories (Master Jenis Sampah & Harga)
CREATE TABLE waste_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(150) NOT NULL,
    category_group VARCHAR(50) NOT NULL, -- Plastik, Kertas, Logam, Kaca, Minyak, etc.
    unit VARCHAR(16) DEFAULT 'kg',
    buy_price_per_kg BIGINT NOT NULL CHECK (buy_price_per_kg >= 0),
    sell_price_per_kg BIGINT NOT NULL CHECK (sell_price_per_kg >= buy_price_per_kg),
    description TEXT,
    color VARCHAR(16) DEFAULT '#009CAC',
    is_active BOOLEAN DEFAULT TRUE,
    min_deposit_kg NUMERIC(6, 3) DEFAULT 0.100,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    CONSTRAINT uq_category_code UNIQUE(branch_id, code)
);

-- 6. Category Price History (Audit Snapshot Harga)
CREATE TABLE category_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES waste_categories(id) ON DELETE CASCADE,
    previous_buy_price BIGINT NOT NULL,
    new_buy_price BIGINT NOT NULL,
    previous_sell_price BIGINT NOT NULL,
    new_sell_price BIGINT NOT NULL,
    changed_by_profile_id UUID REFERENCES profiles(id),
    reason TEXT NOT NULL,
    effective_date TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 7. IoT Weighing Devices (Hardware Integration)
CREATE TABLE weighing_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    device_code VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    mac_address VARCHAR(32) UNIQUE NOT NULL,
    firmware_version VARCHAR(32) DEFAULT 'v1.4.2-esp32',
    api_key_hash VARCHAR(128) NOT NULL,
    location VARCHAR(150) DEFAULT 'Meja Timbang 1',
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'calibrating', 'error')),
    max_capacity_kg NUMERIC(8, 2) DEFAULT 150.00,
    precision_gram NUMERIC(6, 2) DEFAULT 10.00,
    calibration_factor NUMERIC(10, 4) DEFAULT 1.0000,
    tare_offset NUMERIC(8, 3) DEFAULT 0.000,
    is_simulated BOOLEAN DEFAULT FALSE,
    last_heartbeat TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 8. Device Telemetry Logs
CREATE TABLE device_telemetry (
    id BIGSERIAL PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES weighing_devices(id) ON DELETE CASCADE,
    raw_adc_value INT NOT NULL,
    weight_kg NUMERIC(8, 3) NOT NULL,
    is_stable BOOLEAN DEFAULT FALSE,
    stability_score INT CHECK (stability_score BETWEEN 0 AND 100),
    temperature_c NUMERIC(4, 1),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 9. Calibration Records
CREATE TABLE calibration_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES weighing_devices(id) ON DELETE CASCADE,
    calibrated_by UUID REFERENCES profiles(id),
    reference_weight_kg NUMERIC(8, 3) NOT NULL,
    measured_weight_kg NUMERIC(8, 3) NOT NULL,
    old_factor NUMERIC(10, 4) NOT NULL,
    new_factor NUMERIC(10, 4) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 10. Digital Wallet Accounts (Tabungan Nasabah)
CREATE TABLE wallet_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID UNIQUE NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    current_balance BIGINT DEFAULT 0 CHECK (current_balance >= 0),
    total_deposited BIGINT DEFAULT 0,
    total_withdrawn BIGINT DEFAULT 0,
    last_transaction_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 11. Wallet Ledger (Append-Only Mutasi Tabungan)
CREATE TABLE wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_account_id UUID NOT NULL REFERENCES wallet_accounts(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    reference_type VARCHAR(32) NOT NULL CHECK (reference_type IN ('deposit', 'withdrawal', 'adjustment', 'bonus', 'reversal')),
    reference_id UUID NOT NULL,
    reference_code VARCHAR(64) NOT NULL,
    amount BIGINT NOT NULL, -- Positif untuk Kredit, Negatif untuk Debit
    balance_before BIGINT NOT NULL,
    balance_after BIGINT NOT NULL,
    operator_id UUID REFERENCES profiles(id),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 12. Deposit Transactions (Setoran Sampah)
CREATE TABLE deposit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    transaction_code VARCHAR(64) UNIQUE NOT NULL,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES profiles(id),
    weighing_device_id UUID REFERENCES weighing_devices(id),
    is_iot_verified BOOLEAN DEFAULT FALSE,
    total_weight_kg NUMERIC(10, 3) NOT NULL CHECK (total_weight_kg > 0),
    total_value BIGINT NOT NULL CHECK (total_value >= 0),
    payment_method VARCHAR(20) DEFAULT 'tabungan' CHECK (payment_method IN ('tabungan', 'tunai')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'pending')),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 13. Deposit Items (Detail Barang Setoran & Snapshot Harga)
CREATE TABLE deposit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_id UUID NOT NULL REFERENCES deposit_transactions(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES waste_categories(id) ON DELETE RESTRICT,
    weight_kg NUMERIC(8, 3) NOT NULL CHECK (weight_kg > 0),
    price_per_kg_snapshot BIGINT NOT NULL, -- Snapshot harga beli saat transaksi
    subtotal BIGINT NOT NULL CHECK (subtotal >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 14. Inventory Movements (Gudang Sampah Append-Only)
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES waste_categories(id) ON DELETE RESTRICT,
    movement_type VARCHAR(32) NOT NULL CHECK (movement_type IN ('deposit', 'collector_sale', 'adjustment_plus', 'adjustment_minus', 'damage_loss')),
    reference_id UUID NOT NULL,
    reference_code VARCHAR(64) NOT NULL,
    quantity_kg NUMERIC(10, 3) NOT NULL, -- Positif untuk masuk, Negatif untuk keluar
    stock_before_kg NUMERIC(10, 3) NOT NULL,
    stock_after_kg NUMERIC(10, 3) NOT NULL,
    cost_per_kg_snapshot BIGINT NOT NULL,
    total_valuation_change BIGINT NOT NULL,
    operator_id UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 15. Collectors (Pengepul / Off-taker)
CREATE TABLE collectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    address TEXT NOT NULL,
    payment_terms VARCHAR(32) DEFAULT 'transfer',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 16. Collector Sales (Penjualan Sampah ke Pengepul)
CREATE TABLE collector_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    invoice_code VARCHAR(64) UNIQUE NOT NULL,
    collector_id UUID NOT NULL REFERENCES collectors(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES profiles(id),
    total_weight_kg NUMERIC(12, 3) NOT NULL,
    total_cost_amount BIGINT NOT NULL, -- Total HPP
    total_sale_amount BIGINT NOT NULL, -- Pendapatan dari pengepul
    total_gross_margin BIGINT NOT NULL, -- Laba Kotor Realisasi
    payment_status VARCHAR(20) DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    payment_method VARCHAR(20) DEFAULT 'transfer',
    vehicle_number VARCHAR(32),
    driver_name VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 17. Collector Sale Items (Detail Penjualan Pengepul)
CREATE TABLE collector_sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES collector_sales(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES waste_categories(id) ON DELETE RESTRICT,
    weight_kg NUMERIC(10, 3) NOT NULL CHECK (weight_kg > 0),
    cost_price_per_kg BIGINT NOT NULL, -- HPP
    selling_price_per_kg BIGINT NOT NULL,
    total_cost BIGINT NOT NULL,
    total_revenue BIGINT NOT NULL,
    gross_margin BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 18. Operational Expenses (Beban Operasional Bank Sampah)
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    expense_code VARCHAR(64) UNIQUE NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(50) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    receipt_number VARCHAR(100),
    operator_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 19. Withdrawal Requests (Penarikan Tunai Saldo Tabungan)
CREATE TABLE withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    withdrawal_code VARCHAR(64) UNIQUE NOT NULL,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    amount BIGINT NOT NULL CHECK (amount > 0),
    request_date TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW()),
    processed_date TIMESTAMPTZ,
    operator_id UUID REFERENCES profiles(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    payout_method VARCHAR(32) DEFAULT 'tunai',
    account_details TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- 20. Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES profiles(id),
    actor_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('Asia/Jakarta', NOW())
);

-- Indexes for performance
CREATE INDEX idx_deposit_tx_created ON deposit_transactions(created_at DESC);
CREATE INDEX idx_deposit_tx_member ON deposit_transactions(member_id);
CREATE INDEX idx_wallet_ledger_member ON wallet_ledger(member_id, created_at DESC);
CREATE INDEX idx_inventory_category ON inventory_movements(category_id, created_at DESC);
CREATE INDEX idx_telemetry_device ON device_telemetry(device_id, created_at DESC);
CREATE INDEX idx_members_code ON members(member_code);
