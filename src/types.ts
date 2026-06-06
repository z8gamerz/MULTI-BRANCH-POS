/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Branch {
  id: string;
  branchName: string;
  address: string;
  status: 'active' | 'inactive';
  timeInterval: string; // e.g. "10-20 min" or "15 mins"
  welcomeMessage: string;
}

export interface Staff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'cashier';
  branchName: string; // "All" or a specific branchName
}

export interface Category {
  id: string;
  categoryName: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  productName: string;
  category: string;
  sellingPrice: number;
  quantity: number;
  imageUrl?: string;
  branch: string; // Associated branch name
  status: 'active' | 'inactive';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  branchName: string;
  source: 'instore' | 'online';
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[]; // Parsed locally or stored as structured array
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'mobile_pay' | 'credit';
  paymentReference: string;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  estimatedReadyTime: string;
  cancelReason?: string;
  createdAt: string;
  isSplit?: boolean;
  splitDetails?: {
    method1: 'cash' | 'card' | 'mobile_pay' | 'credit';
    amount1: number;
    method2: 'cash' | 'card' | 'mobile_pay' | 'credit';
    amount2: number;
  };
}

export interface Supplier {
  id: string;
  supplierName: string;
  contactPerson: string;
  phone: string;
  notes: string;
}

export interface SupplierPurchase {
  id: string;
  date: string;
  supplierName: string;
  productName: string;
  branchName: string;
  quantity: number;
  remainingQuantity: number;
  costPrice: number;
  sellingPrice: number;
  totalCost: number;
}

export interface Expense {
  id: string;
  date: string;
  branchName: string;
  category: string;
  description: string;
  amount: number;
}

// Local Storage credit tracking system
export interface CreditPayment {
  id: string;
  orderId: string;
  customerName: string;
  amountPaid: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'card' | 'mobile_pay';
  paymentReference: string;
}

// Local Storage transfer system
export interface StockAllocation {
  id: string;
  date: string;
  fromBranch: string;
  toBranch: string;
  productName: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
}
