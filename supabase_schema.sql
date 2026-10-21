-- ==============================================================================
-- PORTIVA: Aplikasi Manajemen Muatan Kapal dan Penumpang
-- SUPABASE POSTGRESQL RELATIONAL SCHEMA & RELATIONSHIPS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Operator Pelabuhan',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SHIPS TABLE (Data Kapal)
CREATE TABLE IF NOT EXISTS ships (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    imo_number VARCHAR(50) UNIQUE NOT NULL,
    ship_type VARCHAR(100) NOT NULL,
    flag VARCHAR(100) DEFAULT 'Indonesia (ID)',
    gt NUMERIC(12, 2) NOT NULL,
    dwt NUMERIC(12, 2) NOT NULL,
    passenger_capacity INT DEFAULT 0,
    cargo_capacity NUMERIC(12, 2) DEFAULT 0,
    build_year INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Tidak Aktif', 'Maintenance')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PORTS TABLE (Data Pelabuhan)
CREATE TABLE IF NOT EXISTS ports (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    port_code VARCHAR(20) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Indonesia',
    port_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Non-Aktif')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PASSENGERS TABLE (Data Penumpang)
CREATE TABLE IF NOT EXISTS passengers (
    id VARCHAR(50) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(50) UNIQUE NOT NULL, -- NIK / Passport
    gender VARCHAR(20) CHECK (gender IN ('Laki-laki', 'Perempuan')),
    birth_date DATE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    nationality VARCHAR(100) DEFAULT 'Indonesia (WNI)',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CARGO TYPES TABLE (Data Jenis Muatan)
CREATE TABLE IF NOT EXISTS cargo_types (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'General Cargo', 'Container', 'Bulk Cargo', 'Liquid Cargo', 'Dangerous Goods', 'Kendaraan', 'Lainnya'
    )),
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CUSTOMERS / SHIPPERS TABLE (Data Customer/Shipper)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    pic VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. VOYAGES TABLE (Transaksi Perjalanan Kapal)
CREATE TABLE IF NOT EXISTS voyages (
    id VARCHAR(50) PRIMARY KEY,
    voyage_number VARCHAR(100) UNIQUE NOT NULL,
    ship_id VARCHAR(50) NOT NULL REFERENCES ships(id) ON DELETE RESTRICT,
    origin_port_id VARCHAR(50) NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    destination_port_id VARCHAR(50) NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    estimated_arrival VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN (
        'Scheduled', 'Boarding', 'Departed', 'Arrived', 'Cancelled'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PASSENGER TRANSACTIONS (Transaksi Penumpang per Perjalanan)
CREATE TABLE IF NOT EXISTS passenger_transactions (
    id VARCHAR(50) PRIMARY KEY,
    voyage_id VARCHAR(50) NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
    passenger_id VARCHAR(50) NOT NULL REFERENCES passengers(id) ON DELETE RESTRICT,
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    class VARCHAR(50) NOT NULL CHECK (class IN ('Ekonomi', 'Bisnis', 'VIP', 'First Class')),
    transaction_date DATE NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'Paid' CHECK (payment_status IN ('Unpaid', 'Paid')),
    boarding_status VARCHAR(50) DEFAULT 'Booked' CHECK (boarding_status IN (
        'Booked', 'Paid', 'Boarded', 'Cancelled'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CARGO TRANSACTIONS (Transaksi Muatan per Perjalanan)
CREATE TABLE IF NOT EXISTS cargo_transactions (
    id VARCHAR(50) PRIMARY KEY,
    voyage_id VARCHAR(50) NOT NULL REFERENCES voyages(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    cargo_type_id VARCHAR(50) NOT NULL REFERENCES cargo_types(id) ON DELETE RESTRICT,
    item_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL,
    weight_ton NUMERIC(12, 2) NOT NULL DEFAULT 0,
    volume_m3 NUMERIC(12, 2) NOT NULL DEFAULT 0,
    loading_port_id VARCHAR(50) NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    discharge_port_id VARCHAR(50) NOT NULL REFERENCES ports(id) ON DELETE RESTRICT,
    document_number VARCHAR(100) NOT NULL, -- Bill of Lading / Resi
    status VARCHAR(50) DEFAULT 'Booked' CHECK (status IN (
        'Booked', 'Loaded', 'On Board', 'Discharged', 'Cancelled'
    )),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MANIFESTS TABLE (Manifest Kapal Resmi)
CREATE TABLE IF NOT EXISTS manifests (
    id VARCHAR(50) PRIMARY KEY,
    manifest_number VARCHAR(100) UNIQUE NOT NULL,
    voyage_id VARCHAR(50) NOT NULL UNIQUE REFERENCES voyages(id) ON DELETE CASCADE,
    total_passengers INT NOT NULL DEFAULT 0,
    total_cargo_items INT NOT NULL DEFAULT 0,
    total_weight_ton NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_volume_m3 NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Validated', 'Certified', 'Revoked')),
    certified_by VARCHAR(255),
    certified_at TIMESTAMPTZ,
    qr_code_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOGS TABLE (Audit Trail Integritas Data)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'CERTIFY')),
    old_value JSONB,
    new_value JSONB,
    details TEXT
);

-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_voyages_ship ON voyages(ship_id);
CREATE INDEX IF NOT EXISTS idx_voyages_status ON voyages(status);
CREATE INDEX IF NOT EXISTS idx_passenger_trx_voyage ON passenger_transactions(voyage_id);
CREATE INDEX IF NOT EXISTS idx_cargo_trx_voyage ON cargo_transactions(voyage_id);
CREATE INDEX IF NOT EXISTS idx_manifest_voyage ON manifests(voyage_id);
CREATE INDEX IF NOT EXISTS idx_audit_table_time ON audit_logs(table_name, timestamp DESC);
