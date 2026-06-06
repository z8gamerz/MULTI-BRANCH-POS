/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, ArrowLeftRight, 
  DollarSign, CreditCard, Database, Eye, UtensilsCrossed 
} from 'lucide-react';
import { POSDatabase, isSupabaseConfigured } from './lib/supabase';
import { 
  Branch, Staff, Category, Product, Order, 
  Supplier, SupplierPurchase, Expense, CreditPayment, StockAllocation 
} from './types';

// Importing subcomponents
import Dashboard from './components/Dashboard';
import CustomerPortal from './components/CustomerPortal';
import POSInterface from './components/POSInterface';
import InventoryManager from './components/InventoryManager';
import StaffManager from './components/StaffManager';
import AllocationManager from './components/AllocationManager';
import ExpensesManager from './components/ExpensesManager';
import CreditManager from './components/CreditManager';
import SupabaseSyncPanel from './components/SupabaseSyncPanel';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'portal' | 'inventory' | 'staff' | 'allocations' | 'expenses' | 'credit' | 'supabase'>('pos');

  // Multi-branch state
  const [currentBranchName, setCurrentBranchName] = useState<string>('Makati CBD');

  // Selected Staff simulation State
  const [selectedStaffId, setSelectedStaffId] = useState<string>('st-1'); // Default to Owner Segar Rakim

  // Core POS states loaded from POSDatabase proxy layer
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<SupplierPurchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<CreditPayment[]>([]);
  const [allocations, setAllocations] = useState<StockAllocation[]>([]);

  // Reload everything from local/Supabase database
  const reloadAllData = () => {
    setBranches(POSDatabase.getBranches());
    setStaffList(POSDatabase.getStaff());
    setCategories(POSDatabase.getCategories());
    setProducts(POSDatabase.getProducts());
    setOrders(POSDatabase.getOrders());
    setSuppliers(POSDatabase.getSuppliers());
    setPurchases(POSDatabase.getSupplierPurchases());
    setExpenses(POSDatabase.getExpenses());
    setPayments(POSDatabase.getPayments());
    setAllocations(POSDatabase.getAllocations());
  };

  useEffect(() => {
    // Clean old hardcoded local storage dummy data on first load of this configuration
    if (!localStorage.getItem('pos_cleared_dummy_v3')) {
      localStorage.removeItem('pos_branches');
      localStorage.removeItem('pos_staff');
      localStorage.removeItem('pos_categories');
      localStorage.removeItem('pos_products');
      localStorage.removeItem('pos_orders');
      localStorage.removeItem('pos_suppliers');
      localStorage.removeItem('pos_sup_purchases');
      localStorage.removeItem('pos_expenses');
      localStorage.removeItem('pos_payments');
      localStorage.removeItem('pos_allocations');
      localStorage.setItem('pos_cleared_dummy_v3', 'true');
    }

    reloadAllData();

    // Pull from real Supabase on load to keep client fully synced
    if (isSupabaseConfigured) {
      const syncFromSupabaseOnStart = async () => {
        try {
          const dbBranches = await POSDatabase.fetchFromSupabase<Branch>('branches', POSDatabase.getBranches());
          const dbStaff = await POSDatabase.fetchFromSupabase<Staff>('staff', POSDatabase.getStaff());
          const dbCategories = await POSDatabase.fetchFromSupabase<Category>('categories', POSDatabase.getCategories());
          const dbProducts = await POSDatabase.fetchFromSupabase<Product>('products', POSDatabase.getProducts());
          const dbOrders = await POSDatabase.fetchFromSupabase<Order>('orders', POSDatabase.getOrders());
          const dbSuppliers = await POSDatabase.fetchFromSupabase<Supplier>('suppliers', POSDatabase.getSuppliers());
          const dbPurchases = await POSDatabase.fetchFromSupabase<SupplierPurchase>('supplier_purchases', POSDatabase.getSupplierPurchases());
          const dbExpenses = await POSDatabase.fetchFromSupabase<Expense>('expenses', POSDatabase.getExpenses());
          const dbPayments = await POSDatabase.fetchFromSupabase<CreditPayment>('credit_payments', POSDatabase.getPayments());
          const dbAllocations = await POSDatabase.fetchFromSupabase<StockAllocation>('allocations', POSDatabase.getAllocations());

          if (dbBranches !== null) POSDatabase.saveBranches(dbBranches);
          if (dbStaff !== null) POSDatabase.saveStaff(dbStaff);
          if (dbCategories !== null) POSDatabase.saveCategories(dbCategories);
          if (dbProducts !== null) POSDatabase.saveProducts(dbProducts);
          if (dbOrders !== null) POSDatabase.saveOrders(dbOrders);
          if (dbSuppliers !== null) POSDatabase.saveSuppliers(dbSuppliers);
          if (dbPurchases !== null) POSDatabase.saveSupplierPurchases(dbPurchases);
          if (dbExpenses !== null) POSDatabase.saveExpenses(dbExpenses);
          if (dbPayments !== null) POSDatabase.savePayments(dbPayments);
          if (dbAllocations !== null) POSDatabase.saveAllocations(dbAllocations);

          reloadAllData();
        } catch (e) {
          console.warn("Supabase startup refresh failed; running in offline/local storage sync mode:", e);
        }
      };
      
      // Pulse short delay to let browser mount primary states first
      setTimeout(syncFromSupabaseOnStart, 150);
    }
  }, []);

  // Compute active staff object
  const activeStaff = staffList.find(s => s.id === selectedStaffId) || {
    id: 'st-guest',
    email: 'guest@bistro.com',
    firstName: 'Guest',
    lastName: 'User',
    role: 'cashier' as const,
    branchName: 'Makati CBD'
  };

  // -------------------------------------------------------------
  // CONTROLLER TRANSACTIONS & MUTATORS (Persists & Syncs)
  // -------------------------------------------------------------

  const handleAddCategory = async (newCat: Category) => {
    await POSDatabase.insertOrUpdate('categories', newCat, POSDatabase.getCategories, POSDatabase.saveCategories);
    reloadAllData();
  };

  const handleAddProduct = async (newProd: Product) => {
    await POSDatabase.insertOrUpdate('products', newProd, POSDatabase.getProducts, POSDatabase.saveProducts);
    reloadAllData();
  };

  const handleUpdateProduct = async (updatedProd: Product) => {
    await POSDatabase.insertOrUpdate('products', updatedProd, POSDatabase.getProducts, POSDatabase.saveProducts);
    reloadAllData();
  };

  const handleDeleteProduct = async (id: string) => {
    await POSDatabase.deleteItem('products', id, POSDatabase.getProducts, POSDatabase.saveProducts);
    reloadAllData();
  };

  const handleAddOrder = async (newOrder: Order) => {
    await POSDatabase.insertOrUpdate('orders', newOrder, POSDatabase.getOrders, POSDatabase.saveOrders);
    reloadAllData();
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status'], cancelReason?: string) => {
    const list = POSDatabase.getOrders();
    const idx = list.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      list[idx] = { 
        ...list[idx], 
        status,
        cancelReason: cancelReason || list[idx].cancelReason 
      };
      
      // If order is cancelled, return items to inventory stock!
      if (status === 'cancelled') {
        const orderItems = list[idx].items;
        const currentProducts = POSDatabase.getProducts();
        orderItems.forEach(item => {
          const pIdx = currentProducts.findIndex(p => p.id === item.productId);
          if (pIdx !== -1) {
            currentProducts[pIdx].quantity += item.quantity;
          }
        });
        POSDatabase.saveProducts(currentProducts);
      }

      POSDatabase.saveOrders(list);
      reloadAllData();
    }
  };

  const handleUpdateOrderPaymentStatus = async (orderId: string, paymentStatus: Order['paymentStatus']) => {
    const list = POSDatabase.getOrders();
    const idx = list.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], paymentStatus };
      POSDatabase.saveOrders(list);
      reloadAllData();
    }
  };

  const handleSubtractProductStock = (productId: string, qtyToSubtract: number) => {
    const currentProducts = POSDatabase.getProducts();
    const idx = currentProducts.findIndex(p => p.id === productId);
    if (idx !== -1) {
      currentProducts[idx].quantity = Math.max(0, currentProducts[idx].quantity - qtyToSubtract);
      POSDatabase.saveProducts(currentProducts);
      reloadAllData();
    }
  };

  const handleAddSupplier = async (newSup: Supplier) => {
    await POSDatabase.insertOrUpdate('suppliers', newSup, POSDatabase.getSuppliers, POSDatabase.saveSuppliers);
    reloadAllData();
  };

  const handleAddPurchase = async (newPur: SupplierPurchase) => {
    await POSDatabase.insertOrUpdate('supplier_purchases', newPur, POSDatabase.getSupplierPurchases, POSDatabase.saveSupplierPurchases);
    reloadAllData();
  };

  const handleAddExpense = async (newExp: Expense) => {
    await POSDatabase.insertOrUpdate('expenses', newExp, POSDatabase.getExpenses, POSDatabase.saveExpenses);
    reloadAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    await POSDatabase.deleteItem('expenses', id, POSDatabase.getExpenses, POSDatabase.saveExpenses);
    reloadAllData();
  };

  const handleAddCreditPayment = async (newPayment: CreditPayment) => {
    await POSDatabase.insertOrUpdate('pos_payments', newPayment, POSDatabase.getPayments, POSDatabase.savePayments);
    reloadAllData();
  };

  const handleAddAllocation = async (newAlloc: StockAllocation) => {
    await POSDatabase.insertOrUpdate('allocations', newAlloc, POSDatabase.getAllocations, POSDatabase.saveAllocations);
    reloadAllData();
  };

  const handleApproveAllocation = (allocId: string, fromBranchName: string, toBranchName: string, productTxt: string, qty: number) => {
    const allocList = POSDatabase.getAllocations();
    const aIdx = allocList.findIndex(a => a.id === allocId);
    if (aIdx === -1) return;

    const currentProducts = POSDatabase.getProducts();

    // 1. Deduct stock from sending branch product
    const fromPIdx = currentProducts.findIndex(p => p.branch === fromBranchName && p.productName === productTxt);
    if (fromPIdx === -1 || currentProducts[fromPIdx].quantity < qty) {
      alert(`Approval error: Source branch ${fromBranchName} does not hold enough quantities of this product anymore!`);
      return;
    }

    // 2. Add stock to receiving branch product
    const toPIdx = currentProducts.findIndex(p => p.branch === toBranchName && p.productName === productTxt);

    currentProducts[fromPIdx].quantity -= qty;

    if (toPIdx !== -1) {
      currentProducts[toPIdx].quantity += qty;
    } else {
      // Destination branch does not list this product, auto-replicate it!
      const srcProduct = currentProducts[fromPIdx];
      const autoProduct: Product = {
        id: `prod-replicated-${Date.now()}`,
        productName: productTxt,
        category: srcProduct.category,
        sellingPrice: srcProduct.sellingPrice,
        quantity: qty,
        branch: toBranchName,
        status: 'active'
      };
      currentProducts.push(autoProduct);
    }

    // Update statuses
    allocList[aIdx].status = 'completed';

    POSDatabase.saveProducts(currentProducts);
    POSDatabase.saveAllocations(allocList);
    reloadAllData();
    alert('Stock transfer balance successfully recomputed & completed!');
  };

  const handleCancelAllocation = (allocId: string) => {
    const list = POSDatabase.getAllocations();
    const idx = list.findIndex(a => a.id === allocId);
    if (idx !== -1) {
      list[idx].status = 'cancelled';
      POSDatabase.saveAllocations(list);
      reloadAllData();
    }
  };

  const handleAddStaff = async (newStaff: Staff) => {
    await POSDatabase.insertOrUpdate('staff', newStaff, POSDatabase.getStaff, POSDatabase.saveStaff);
    reloadAllData();
  };

  const handleDeleteStaff = async (id: string) => {
    await POSDatabase.deleteItem('staff', id, POSDatabase.getStaff, POSDatabase.saveStaff);
    reloadAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800" id="applet-container">
      
      {/* BRAND & USER SIMULATORS HEADER NAVBAR */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-blue-500/20">
            <UtensilsCrossed className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-slate-900 font-bold text-sm tracking-tight flex items-center gap-1.5 leading-tight">
              Bite Bistro POS Enterprise
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider font-semibold uppercase">Enterprise Suite v4.5</p>
          </div>
        </div>

        {/* Dynamic handshakes simulation */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Active branch terminal selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 px-3 rounded-lg text-xs font-semibold">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Location Scope:</span>
            <select
              id="header-branch-select"
              value={currentBranchName}
              onChange={(e) => {
                const nextBranch = e.target.value;
                setCurrentBranchName(nextBranch);
              }}
              className="bg-transparent border-none text-slate-800 font-bold outline-none cursor-pointer pr-1 text-xs"
            >
              {branches.filter(b => b.status === 'active').map(b => (
                <option key={b.id} value={b.branchName} className="bg-white text-slate-800 font-sans">
                  📍 {b.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* SIMULATED STAFF SELECTOR COCKPIT */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 px-3 rounded-lg text-xs font-semibold">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Simulator:</span>
            <select
              id="header-staff-switcher"
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                const matched = staffList.find(s => s.id === e.target.value);
                if (matched && matched.branchName !== 'All') {
                  setCurrentBranchName(matched.branchName);
                }
              }}
              className="bg-transparent border-none text-slate-800 font-bold outline-none cursor-pointer pr-1 text-xs"
            >
              {staffList.map(st => (
                <option key={st.id} value={st.id} className="bg-white text-slate-800 font-sans">
                  👤 {st.firstName} ({st.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Connection status tag */}
          <div className="text-xs">
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-lg text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                SYNC ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold rounded-lg text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                LOCAL DEMO
              </span>
            )}
          </div>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-64 bg-slate-900 text-slate-400 border-r border-slate-850 p-4 space-y-6 shrink-0 hidden md:flex flex-col justify-between">
          <div className="space-y-4">
            <div className="px-2 py-1">
              <span className="text-[9px] uppercase font-extrabold text-slate-500 tracking-wider block mb-1">POS WORKSPACE</span>
              <p className="text-xs text-white font-medium truncate">Logged: {activeStaff.firstName} {activeStaff.lastName}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">{activeStaff.role} Scope</p>
            </div>

            <nav className="space-y-1.5" id="nav-group">
              {[
                { tab: 'pos' as const, label: 'POS Cashier Till', icon: ShoppingCart, roles: ['owner', 'admin', 'cashier'] },
                { tab: 'portal' as const, label: 'Customer Order Portal', icon: Eye, roles: ['owner', 'admin', 'cashier'] },
                { tab: 'dashboard' as const, label: 'Enterprise Dashboard', icon: LayoutDashboard, roles: ['owner', 'admin'] },
                { tab: 'inventory' as const, label: 'Stock & Suppliers', icon: Package, roles: ['owner', 'admin'] },
                { tab: 'allocations' as const, label: 'Stock Allocations', icon: ArrowLeftRight, roles: ['owner', 'admin'] },
                { tab: 'expenses' as const, label: 'Operating Costs', icon: DollarSign, roles: ['owner', 'admin'] },
                { tab: 'credit' as const, label: 'Credit ledgers', icon: CreditCard, roles: ['owner', 'admin', 'cashier'] },
                { tab: 'staff' as const, label: 'Staff Roster', icon: Users, roles: ['owner', 'admin'] },
                { tab: 'supabase' as const, label: 'Supabase Sync Cockpit', icon: Database, roles: ['owner', 'admin'] }
              ].map(item => {
                const Icon = item.icon;
                const hasAcess = item.roles.includes(activeStaff.role);
                if (!hasAcess) return null;

                const isActive = activeTab === item.tab;

                return (
                  <button
                    key={item.tab}
                    onClick={() => setActiveTab(item.tab)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isActive 
                        ? 'bg-blue-600/15 text-blue-400 font-bold border-l-2 border-blue-500 pl-2.5' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User badge + profile card aligned with theme */}
          <div className="p-4 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700/50 text-xs shrink-0 uppercase select-none">
                {activeStaff.firstName.substring(0, 1)}{activeStaff.lastName.substring(0, 1)}
              </div>
              <div className="flex flex-col overflow-hidden text-xs">
                <span className="text-white font-medium truncate leading-tight">{activeStaff.firstName} {activeStaff.lastName}</span>
                <span className="text-slate-500 font-semibold text-[10px] uppercase truncate tracking-wider mt-0.5">{activeStaff.role}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* SCROLLABLE MAIN LAYOUT VIEWPORT */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* RENDER ACTIVE TAB COCKPIT */}
              {activeTab === 'pos' && (
                <POSInterface
                  currentStaff={activeStaff}
                  currentBranchName={currentBranchName}
                  branches={branches}
                  categories={categories}
                  products={products}
                  orders={orders}
                  onAddOrder={handleAddOrder}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onUpdateProductStock={handleSubtractProductStock}
                />
              )}

              {activeTab === 'portal' && (
                <CustomerPortal
                  branches={branches}
                  categories={categories}
                  products={products}
                  onAddOrder={handleAddOrder}
                  onUpdateProductStock={handleSubtractProductStock}
                />
              )}

              {activeTab === 'dashboard' && (
                <Dashboard
                  currentStaff={activeStaff}
                  branches={branches}
                  orders={orders}
                  expenses={expenses}
                  products={products}
                  currentBranchName={currentBranchName}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryManager
                  branches={branches}
                  categories={categories}
                  products={products}
                  suppliers={suppliers}
                  purchases={purchases}
                  onAddCategory={handleAddCategory}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAddSupplier={handleAddSupplier}
                  onAddPurchase={handleAddPurchase}
                />
              )}

              {activeTab === 'staff' && (
                <StaffManager
                  staffList={staffList}
                  branches={branches}
                  onAddStaff={handleAddStaff}
                  onDeleteStaff={handleDeleteStaff}
                />
              )}

              {activeTab === 'allocations' && (
                <AllocationManager
                  branches={branches}
                  products={products}
                  allocations={allocations}
                  onAddAllocation={handleAddAllocation}
                  onApproveAllocation={handleApproveAllocation}
                  onCancelAllocation={handleCancelAllocation}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesManager
                  branches={branches}
                  expenses={expenses}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'credit' && (
                <CreditManager
                  orders={orders}
                  payments={payments}
                  onAddCreditPayment={handleAddCreditPayment}
                  onUpdateOrderPaymentStatus={handleUpdateOrderPaymentStatus}
                />
              )}

              {activeTab === 'supabase' && (
                <SupabaseSyncPanel
                  onDataRefreshed={reloadAllData}
                />
              )}

            </div>
          </main>

          {/* System Footer bar matching theme */}
          <footer className="h-10 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-[11px] text-slate-400 font-medium select-none grow-0 shrink-0">
            <div className="flex gap-4">
              <span>v4.5.1-stable (Supabase Active Link)</span>
              <span>Last audit checklist: Synchronous</span>
            </div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 
                Connection Status Stable
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
