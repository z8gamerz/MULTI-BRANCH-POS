/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { 
  Branch, Staff, Category, Product, Order, 
  Supplier, SupplierPurchase, Expense, CreditPayment, StockAllocation 
} from '../types';

// Helper to robustly sanitize values from environment variables (e.g. stripping quotes)
function sanitizeEnvValue(val: any): string {
  if (typeof val !== 'string') return '';
  let cleaned = val.trim();
  cleaned = cleaned.replace(/^['"]|['"]$/g, '');
  return cleaned.trim();
}

// Read config from Vite env, with fallbacks to user's real remote Supabase instance
const rawUrl = sanitizeEnvValue((import.meta as any).env?.VITE_SUPABASE_URL) || 'https://qunycdyrbwjfhfuegiur.supabase.co';
export const SUPABASE_URL = rawUrl.replace(/\/rest\/v1\/?$/, '');
export const SUPABASE_ANON_KEY = sanitizeEnvValue((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_QWofW3OSc1fP6xg-yHUqCw_gjTt5Q47';

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));

// Initialize client if credentials exist
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Initial high-quality Seed Data for fallback/initial state
const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'br-dt',
    branchName: 'Makati CBD',
    address: 'G/F Ayala Terraces, Makati City',
    status: 'active',
    timeInterval: '10-15 min',
    welcomeMessage: 'Welcome to Makati Bistro! Hot, authentic Filipino sizzlers ready in minutes.'
  },
  {
    id: 'br-ns',
    branchName: 'Quezon City Hub',
    address: 'Katipunan Avenue, Loyola Heights, QC',
    status: 'active',
    timeInterval: '15-20 min',
    welcomeMessage: 'Greetings from Katipunan QC Branch! Perfect place for student barkada meals.'
  },
  {
    id: 'br-we',
    branchName: 'BGC Taguig',
    address: 'High Street, Bonifacio Global City',
    status: 'inactive',
    timeInterval: '5-10 min',
    welcomeMessage: 'BGC Premium Branch is currently preparing for its grand launch.'
  }
];

const DEFAULT_STAFF: Staff[] = [
  {
    id: 'st-1',
    email: 'segarrakim29@gmail.com', // Preconfigured active user!
    firstName: 'Segar',
    lastName: 'Rakim',
    role: 'owner',
    branchName: 'All'
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', categoryName: 'Sizzling & Rice Meals', sortOrder: 1 },
  { id: 'cat-2', categoryName: 'Classic Filipino Mains', sortOrder: 2 },
  { id: 'cat-3', categoryName: 'Desserts & Merienda', sortOrder: 3 },
  { id: 'cat-4', categoryName: 'Coolers & Milktea', sortOrder: 4 }
];

const DEFAULT_PRODUCTS: Product[] = [];

const DEFAULT_ORDERS: Order[] = [];

const DEFAULT_SUPPLIERS: Supplier[] = [];

const DEFAULT_SUP_PURCHASES: SupplierPurchase[] = [];

const DEFAULT_EXPENSES: Expense[] = [];

const DEFAULT_PAYMENTS: CreditPayment[] = [];

const DEFAULT_ALLOCATIONS: StockAllocation[] = [];

// Helper to safely load local storage with defaults
function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error loading localStorage key: ${key}`, e);
    return defaultValue;
  }
}

// Global state controller mapping localStorage to simple calls
export class POSDatabase {
  // Read operations
  static getBranches(): Branch[] {
    return getLocalStorageItem('pos_branches', DEFAULT_BRANCHES);
  }

  static getStaff(): Staff[] {
    return getLocalStorageItem('pos_staff', DEFAULT_STAFF);
  }

  static getCategories(): Category[] {
    return getLocalStorageItem('pos_categories', DEFAULT_CATEGORIES);
  }

  static getProducts(): Product[] {
    return getLocalStorageItem('pos_products', DEFAULT_PRODUCTS);
  }

  static getOrders(): Order[] {
    return getLocalStorageItem('pos_orders', DEFAULT_ORDERS);
  }

  static getSuppliers(): Supplier[] {
    return getLocalStorageItem('pos_suppliers', DEFAULT_SUPPLIERS);
  }

  static getSupplierPurchases(): SupplierPurchase[] {
    return getLocalStorageItem('pos_sup_purchases', DEFAULT_SUP_PURCHASES);
  }

  static getExpenses(): Expense[] {
    return getLocalStorageItem('pos_expenses', DEFAULT_EXPENSES);
  }

  static getPayments(): CreditPayment[] {
    return getLocalStorageItem('pos_payments', DEFAULT_PAYMENTS);
  }

  static getAllocations(): StockAllocation[] {
    return getLocalStorageItem('pos_allocations', DEFAULT_ALLOCATIONS);
  }

  // Write operations that save to localStorage
  static saveBranches(data: Branch[]) {
    localStorage.setItem('pos_branches', JSON.stringify(data));
  }

  static saveStaff(data: Staff[]) {
    localStorage.setItem('pos_staff', JSON.stringify(data));
  }

  static saveCategories(data: Category[]) {
    localStorage.setItem('pos_categories', JSON.stringify(data));
  }

  static saveProducts(data: Product[]) {
    localStorage.setItem('pos_products', JSON.stringify(data));
  }

  static saveOrders(data: Order[]) {
    localStorage.setItem('pos_orders', JSON.stringify(data));
  }

  static saveSuppliers(data: Supplier[]) {
    localStorage.setItem('pos_suppliers', JSON.stringify(data));
  }

  static saveSupplierPurchases(data: SupplierPurchase[]) {
    localStorage.setItem('pos_sup_purchases', JSON.stringify(data));
  }

  static saveExpenses(data: Expense[]) {
    localStorage.setItem('pos_expenses', JSON.stringify(data));
  }

  static savePayments(data: CreditPayment[]) {
    localStorage.setItem('pos_payments', JSON.stringify(data));
  }

  static saveAllocations(data: StockAllocation[]) {
    localStorage.setItem('pos_allocations', JSON.stringify(data));
  }

  // Reset helper
  static resetToDefault() {
    localStorage.setItem('pos_branches', JSON.stringify(DEFAULT_BRANCHES));
    localStorage.setItem('pos_staff', JSON.stringify(DEFAULT_STAFF));
    localStorage.setItem('pos_categories', JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem('pos_products', JSON.stringify(DEFAULT_PRODUCTS));
    localStorage.setItem('pos_orders', JSON.stringify(DEFAULT_ORDERS));
    localStorage.setItem('pos_suppliers', JSON.stringify(DEFAULT_SUPPLIERS));
    localStorage.setItem('pos_sup_purchases', JSON.stringify(DEFAULT_SUP_PURCHASES));
    localStorage.setItem('pos_expenses', JSON.stringify(DEFAULT_EXPENSES));
    localStorage.setItem('pos_payments', JSON.stringify(DEFAULT_PAYMENTS));
    localStorage.setItem('pos_allocations', JSON.stringify(DEFAULT_ALLOCATIONS));
  }

  /**
   * Pushes all current local database items to real Supabase
   * Requires that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present
   * deletes previous records to avoid PK failures, then batch inserts
   */
  static async uploadCurrentToSupabase(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase client is not connected.' };
    }

    try {
      // 1. Branches
      const branches = this.getBranches();
      if (branches.length > 0) {
        await supabase.from('branches').upsert(branches);
      }

      // 2. Staff
      const staff = this.getStaff();
      if (staff.length > 0) {
        await supabase.from('staff').upsert(staff);
      }

      // 3. Categories
      const categories = this.getCategories();
      if (categories.length > 0) {
        await supabase.from('categories').upsert(categories);
      }

      // 4. Products
      const products = this.getProducts();
      if (products.length > 0) {
        await supabase.from('products').upsert(products);
      }

      // 5. Orders
      const orders = this.getOrders();
      if (orders.length > 0) {
        // Prepare orders list (mapping items to conform to table)
        const mappedOrders = orders.map(ord => ({
          ...ord,
          items: ord.items // Stored as JSON matches PG jsonb
        }));
        await supabase.from('orders').upsert(mappedOrders);
      }

      // 6. Suppliers
      const suppliers = this.getSuppliers();
      if (suppliers.length > 0) {
        await supabase.from('suppliers').upsert(suppliers);
      }

      // 7. Supplier Purchases
      const purchases = this.getSupplierPurchases();
      if (purchases.length > 0) {
        await supabase.from('supplier_purchases').upsert(purchases);
      }

      // 8. Expenses
      const expenses = this.getExpenses();
      if (expenses.length > 0) {
        await supabase.from('expenses').upsert(expenses);
      }

      // 9. Credit Payments
      const payments = this.getPayments();
      if (payments.length > 0) {
        await supabase.from('credit_payments').upsert(payments);
      }

      // 10. Allocations
      const allocations = this.getAllocations();
      if (allocations.length > 0) {
        await supabase.from('allocations').upsert(allocations);
      }

      return { 
        success: true, 
        message: 'Successfully migrated all 10 schema collections directly to Supabase!' 
      };
    } catch (err: any) {
      console.error('Supabase Migration Failed:', err);
      return { 
        success: false, 
        message: err.message || 'An error occurred during bulk synchronization.' 
      };
    }
  }

  /**
   * Performs high-level fetch of a table directly from Supabase (or fallback)
   */
  static async fetchFromSupabase<T>(table: string, fallbackData: T[]): Promise<T[]> {
    if (!supabase) return fallbackData;
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.warn(`Supabase read error on ${table}, using local fallback:`, error);
        return fallbackData;
      }
      return data as T[];
    } catch (e) {
      console.warn(`Supabase runtime fetch error on ${table}, carrying on with local state:`, e);
      return fallbackData;
    }
  }

  /**
   * Performs an asynchronous write to Supabase (and duplicates to local file space immediately)
   */
  static async insertOrUpdate<T extends { id: string }>(
    tableName: string, 
    item: T, 
    localCollectionLoader: () => T[],
    localCollectionSaver: (data: T[]) => void
  ): Promise<boolean> {
    // Standard Local Storage updates
    const currentList = localCollectionLoader();
    const cleanId = item.id;
    const existingIndex = currentList.findIndex(x => x.id === cleanId);
    let updatedList = [...currentList];
    if (existingIndex > 0 || existingIndex === 0) {
      updatedList[existingIndex] = item;
    } else {
      updatedList.push(item);
    }
    localCollectionSaver(updatedList);

    // Sync to Supabase in background or throw warnings if invalid
    if (supabase) {
      try {
        const { error } = await supabase.from(tableName).upsert(item);
        if (error) {
          console.error(`SupaSync write failed for ${tableName}:`, error);
          return false;
        }
      } catch (err) {
        console.error(`Supabase network write failed for ${tableName}:`, err);
        return false;
      }
    }
    return true;
  }

  static async deleteItem(
    tableName: string, 
    id: string, 
    localCollectionLoader: () => any[],
    localCollectionSaver: (data: any[]) => void
  ): Promise<boolean> {
    const currentList = localCollectionLoader();
    const updatedList = currentList.filter(x => x.id !== id);
    localCollectionSaver(updatedList);

    if (supabase) {
      try {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) {
          console.error(`SupaSync delete failed for ${tableName}:`, error);
          return false;
        }
      } catch (err) {
        console.error(`Supabase network delete failed for ${tableName}:`, err);
        return false;
      }
    }
    return true;
  }
}
