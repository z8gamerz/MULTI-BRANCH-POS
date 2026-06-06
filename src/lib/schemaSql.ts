/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_SCHEMA_SQL = `-- Multi-Branch POS System Setup Script
-- Paste this script into your Supabase SQL Editor (https://supabase.com/dashboard)
-- to create all necessary tables with matching schema structures.

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Branches Table
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  "branchName" TEXT NOT NULL UNIQUE,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  "timeInterval" TEXT,
  "welcomeMessage" TEXT
);

-- 2. Staff Table
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  role TEXT DEFAULT 'cashier' CHECK (role IN ('owner', 'admin', 'cashier')),
  "branchName" TEXT NOT NULL
);

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  "categoryName" TEXT NOT NULL UNIQUE,
  "sortOrder" INTEGER DEFAULT 0
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  "productName" TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories("categoryName") ON UPDATE CASCADE,
  "sellingPrice" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  quantity INTEGER NOT NULL DEFAULT 0,
  "imageUrl" TEXT,
  branch TEXT NOT NULL REFERENCES branches("branchName") ON UPDATE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  "orderNumber" TEXT NOT NULL UNIQUE,
  "branchName" TEXT NOT NULL REFERENCES branches("branchName") ON UPDATE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('instore', 'online')),
  "customerName" TEXT,
  "customerPhone" TEXT,
  "customerEmail" TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  "paymentMethod" TEXT NOT NULL CHECK ("paymentMethod" IN ('cash', 'card', 'mobile_pay', 'credit')),
  "paymentReference" TEXT,
  "paymentStatus" TEXT DEFAULT 'unpaid' CHECK ("paymentStatus" IN ('paid', 'unpaid', 'partial')),
  "estimatedReadyTime" TEXT,
  "cancelReason" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  "supplierName" TEXT NOT NULL UNIQUE,
  "contactPerson" TEXT,
  phone TEXT,
  notes TEXT
);

-- 7. Supplier Purchases Table (Stock Purchases)
CREATE TABLE IF NOT EXISTS supplier_purchases (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "supplierName" TEXT NOT NULL REFERENCES suppliers("supplierName") ON UPDATE CASCADE,
  "productName" TEXT NOT NULL,
  "branchName" TEXT NOT NULL REFERENCES branches("branchName") ON UPDATE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  "remainingQuantity" INTEGER NOT NULL DEFAULT 0,
  "costPrice" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "sellingPrice" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "totalCost" NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 8. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "branchName" TEXT NOT NULL REFERENCES branches("branchName") ON UPDATE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

-- 9. Credit Payments History Table
CREATE TABLE IF NOT EXISTS credit_payments (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  "customerName" TEXT NOT NULL,
  "amountPaid" NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  "paymentDate" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "paymentMethod" TEXT CHECK ("paymentMethod" IN ('cash', 'card', 'mobile_pay')),
  "paymentReference" TEXT
);

-- 10. Allocations Table (Branch Stock Transfers)
CREATE TABLE IF NOT EXISTS allocations (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "fromBranch" TEXT NOT NULL REFERENCES branches("branchName") ON UPDATE CASCADE,
  "toBranch" TEXT NOT NULL REFERENCES branches("branchName") ON UPDATE CASCADE,
  "productName" TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Disable Row Level Security (RLS) or enable and add public access for simplicity in early testing
-- In production, write secure authenticated policies.
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE credit_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE allocations DISABLE ROW LEVEL SECURITY;

-- Insert Basic Seed Data (Categories)
INSERT INTO categories (id, "categoryName", "sortOrder") VALUES
  ('cat-1', 'Sizzling & Rice Meals', 1),
  ('cat-2', 'Classic Filipino Mains', 2),
  ('cat-3', 'Desserts & Merienda', 3),
  ('cat-4', 'Coolers & Milktea', 4)
ON CONFLICT (id) DO NOTHING;

-- Insert Seed Branches
INSERT INTO branches (id, "branchName", address, status, "timeInterval", "welcomeMessage") VALUES
  ('br-dt', 'Makati CBD', 'G/F Ayala Terraces, Makati City', 'active', '10-15 min', 'Welcome to Makati Bistro! Hot, authentic Filipino sizzlers ready in minutes.'),
  ('br-ns', 'Quezon City Hub', 'Katipunan Avenue, Loyola Heights, QC', 'active', '15-20 min', 'Greetings from Katipunan QC Branch! Perfect place for student barkada meals.')
ON CONFLICT (id) DO NOTHING;
`;
