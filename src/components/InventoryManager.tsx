/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, Layers, Package, Truck, Clipboard, 
  Search, Trash2, Edit2, AlertCircle, ShoppingCart 
} from 'lucide-react';
import { Branch, Category, Product, Supplier, SupplierPurchase } from '../types';

interface InventoryManagerProps {
  branches: Branch[];
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  purchases: SupplierPurchase[];
  onAddCategory: (cat: Category) => void;
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddSupplier: (sup: Supplier) => void;
  onAddPurchase: (pur: SupplierPurchase) => void;
}

export default function InventoryManager({
  branches,
  categories,
  products,
  suppliers,
  purchases,
  onAddCategory,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddSupplier,
  onAddPurchase
}: InventoryManagerProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'suppliers' | 'purchases'>('products');

  // Search filter inside lists
  const [searchQuery, setSearchQuery] = useState('');

  // 1. PRODUCTS STATES
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState(categories[0]?.categoryName || '');
  const [pPrice, setPPrice] = useState<number>(0);
  const [pQuantity, setPQuantity] = useState<number>(0);
  const [pBranch, setPBranch] = useState(branches[0]?.branchName || '');
  const [pStatus, setPStatus] = useState<'active' | 'inactive'>('active');
  const [pImage, setPImage] = useState('');

  // 2. CATEGORIES STATES
  const [newCatName, setNewCatName] = useState('');
  const [newCatOrder, setNewCatOrder] = useState<number>(1);

  // 3. SUPPLIER STATES
  const [showSupForm, setShowSupForm] = useState(false);
  const [sName, setSName] = useState('');
  const [sContact, setSContact] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sNotes, setSNotes] = useState('');

  // 4. PURCHASES WORKFLOW
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purSupplier, setPurSupplier] = useState(suppliers[0]?.supplierName || '');
  const [purProduct, setPurProduct] = useState('');
  const [purBranch, setPurBranch] = useState(branches[0]?.branchName || '');
  const [purQty, setPurQty] = useState<number>(10);
  const [purCost, setPurCost] = useState<number>(5);
  const [purPrice, setPurPrice] = useState<number>(10);

  // Sync state values when options arrays arrive after initial mounting delay
  React.useEffect(() => {
    if (!pCategory && categories.length > 0) {
      setPCategory(categories[0].categoryName);
    }
  }, [categories, pCategory]);

  React.useEffect(() => {
    if (!pBranch && branches.length > 0) {
      setPBranch(branches[0].branchName);
    }
  }, [branches, pBranch]);

  React.useEffect(() => {
    if (!purSupplier && suppliers.length > 0) {
      setPurSupplier(suppliers[0].supplierName);
    }
  }, [suppliers, purSupplier]);

  React.useEffect(() => {
    if (!purBranch && branches.length > 0) {
      setPurBranch(branches[0].branchName);
    }
  }, [branches, purBranch]);

  // Clean filtered lists
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.productName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => s.supplierName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [suppliers, searchQuery]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(pu => 
      pu.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pu.supplierName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [purchases, searchQuery]);

  // Submit Category
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const isDuplicate = categories.some(c => c.categoryName.toLowerCase() === newCatName.toLowerCase());
    if (isDuplicate) {
      alert('This Category Name already exists!');
      return;
    }

    const nextId = `cat-${Date.now()}`;
    const newCatObj: Category = {
      id: nextId,
      categoryName: newCatName.trim(),
      sortOrder: Number(newCatOrder)
    };

    onAddCategory(newCatObj);
    setNewCatName('');
    setNewCatOrder(categories.length + 2);
    // Auto set defaults in prod creation
    if (!pCategory) setPCategory(newCatName.trim());
  };

  // Submit Product Add/Edit
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    if (editingProduct) {
      const updatedObj: Product = {
        ...editingProduct,
        productName: pName.trim(),
        category: pCategory || categories[0]?.categoryName,
        sellingPrice: Number(pPrice),
        quantity: Number(pQuantity),
        branch: pBranch || branches[0]?.branchName,
        status: pStatus,
        imageUrl: pImage.trim() || undefined
      };
      onUpdateProduct(updatedObj);
      setEditingProduct(null);
    } else {
      const isDuplicate = products.some(p => p.branch === pBranch && p.productName.toLowerCase() === pName.toLowerCase());
      if (isDuplicate) {
        alert('A product with this name is already registered for this branch. Consider editing or logging stock purchases instead.');
        return;
      }
      const newObj: Product = {
        id: `prod-add-${Date.now()}`,
        productName: pName.trim(),
        category: pCategory || categories[0]?.categoryName,
        sellingPrice: Number(pPrice),
        quantity: Number(pQuantity),
        branch: pBranch || branches[0]?.branchName,
        status: pStatus,
        imageUrl: pImage.trim() || undefined
      };
      onAddProduct(newObj);
    }

    // Reset Form Fields
    setPName('');
    setPPrice(0);
    setPQuantity(0);
    setPImage('');
    setShowProductForm(false);
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setPName(prod.productName);
    setPCategory(prod.category);
    setPPrice(prod.sellingPrice);
    setPQuantity(prod.quantity);
    setPBranch(prod.branch);
    setPStatus(prod.status);
    setPImage(prod.imageUrl || '');
    setShowProductForm(true);
  };

  // Submit Supplier
  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName.trim()) return;
    const isDuplicate = suppliers.some(s => s.supplierName.toLowerCase() === sName.toLowerCase());
    if (isDuplicate) {
      alert('This Supplier Vendor is already registered.');
      return;
    }

    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      supplierName: sName.trim(),
      contactPerson: sContact.trim(),
      phone: sPhone.trim(),
      notes: sNotes.trim()
    };
    onAddSupplier(newSup);
    
    // reset form fields
    setSName('');
    setSContact('');
    setSPhone('');
    setSNotes('');
    setShowSupForm(false);
  };

  // Submit Supplier Stock Purchases Order
  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purSupplier || !purProduct.trim()) {
      alert('Please select a Supplier and provide a Product Name!');
      return;
    }

    const valCost = Number(purCost);
    const valQty = Number(purQty);
    const valTotalCost = Number((valCost * valQty).toFixed(2));

    const newPurchase: SupplierPurchase = {
      id: `pur-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      supplierName: purSupplier,
      productName: purProduct.trim(),
      branchName: purBranch,
      quantity: valQty,
      remainingQuantity: valQty,
      costPrice: valCost,
      sellingPrice: Number(purPrice),
      totalCost: valTotalCost
    };

    onAddPurchase(newPurchase);

    // Auto update/add POS product catalog stocks
    // Find matching product in target branch
    const matchedIdx = products.findIndex(p => p.branch === purBranch && p.productName.toLowerCase() === purProduct.trim().toLowerCase());
    if (matchedIdx !== -1) {
      // Product exists, increment quantity and update price
      const existing = products[matchedIdx];
      const updatedProductObj: Product = {
        ...existing,
        quantity: existing.quantity + valQty,
        sellingPrice: Number(purPrice)
      };
      onUpdateProduct(updatedProductObj);
    } else {
      // Product does not exist, auto-create product record under current category template OR default "Beverages"
      const autoProduct: Product = {
        id: `prod-auto-${Date.now()}`,
        productName: purProduct.trim(),
        category: categories[0]?.categoryName || 'Beverages',
        sellingPrice: Number(purPrice),
        quantity: valQty,
        branch: purBranch,
        status: 'active'
      };
      onAddProduct(autoProduct);
    }

    // Reset fields
    setPurProduct('');
    setPurQty(10);
    setPurCost(5);
    setPurPrice(10);
    setShowPurchaseForm(false);
    alert('Stock Purchase logged! Product catalogs automatically updated with new quantities.');
  };

  return (
    <div className="space-y-6" id="inventory-manager">
      
      {/* Tab Navigation header */}
      <div className="flex border-b border-slate-100 bg-white p-2 rounded-xl text-xs font-semibold gap-1">
        {[
          { key: 'products' as const, label: 'Products Catalog', icon: Package },
          { key: 'categories' as const, label: 'Categories Dial', icon: Layers },
          { key: 'suppliers' as const, label: 'Supplier Vendors', icon: Truck },
          { key: 'purchases' as const, label: 'Stock Purchases (Goods In)', icon: Clipboard }
        ].map(tb => {
          const Icon = tb.icon;
          return (
            <button
              key={tb.key}
              onClick={() => {
                setActiveTab(tb.key);
                setSearchQuery('');
              }}
              className={`flex items-center gap-1.5 py-2 px-4 rounded-lg cursor-pointer transition-colors ${
                activeTab === tb.key 
                  ? 'bg-slate-900 text-white' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* Main Search Input */}
      {activeTab !== 'categories' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="inv-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-900 text-slate-700"
          />
        </div>
      )}

      {/* TAB SUB-PANELS */}
      
      {/* 1. PRODUCTS SUBSYSTEM */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 border border-slate-50 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Master Product Catalog</h3>
              <p className="text-xs text-slate-400">Total listed templates: {products.length}</p>
            </div>
            <button
              id="btn-add-product-form"
              onClick={() => {
                setEditingProduct(null);
                setPName('');
                setPPrice(5);
                setPQuantity(20);
                setPImage('');
                setShowProductForm(!showProductForm);
              }}
              className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {showProductForm && (
            <form onSubmit={handleProductSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 gap-4 grid grid-cols-1 md:grid-cols-4 font-sans text-xs">
              <div className="md:col-span-4 flex items-center justify-between border-b pb-2 mb-1">
                <strong className="text-[13px] font-sans font-bold text-slate-800">
                  {editingProduct ? `Edit ${editingProduct.productName}` : 'Add New Product Option'}
                </strong>
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  Close X
                </button>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Product Name *</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Avocado Toast"
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Category Group</label>
                <select
                  value={pCategory}
                  onChange={(e) => setPCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.categoryName}>{c.categoryName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Selling Price (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={pPrice || ''}
                  onChange={(e) => setPPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Initial Stock Level *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={pQuantity || '0'}
                  onChange={(e) => setPQuantity(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Host Branch Location *</label>
                <select
                  value={pBranch}
                  onChange={(e) => setPBranch(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.branchName}>{b.branchName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Inventory Status *</label>
                <select
                  value={pStatus}
                  onChange={(e) => setPStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
                >
                  <option value="active">Active (On POS Menu)</option>
                  <option value="inactive">Suspended (Hidden)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Product Unsplash Photo URL (Optional)</label>
                <input
                  type="url"
                  value={pImage}
                  onChange={(e) => setPImage(e.target.value)}
                  placeholder="https://images.unsplash.com/promo..."
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div className="md:col-span-4 justify-end flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-product-save"
                  className="py-1.5 px-4 bg-slate-900 text-white hover:bg-slate-800 rounded font-bold cursor-pointer"
                >
                  {editingProduct ? 'Save Product Changes' : 'Register Product'}
                </button>
              </div>
            </form>
          )}

          {/* Product Data Table */}
          <div className="bg-white border border-slate-150 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
                  <th className="p-3">Product Menu Details</th>
                  <th className="p-3">Associated Branch</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">In-Stock Qty</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-slate-100">
                          <img
                            src={p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=80&q=80'}
                            alt={p.productName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <strong className="text-slate-800 block text-xs">{p.productName}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-700">{p.branch}</span>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-600 uppercase">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold font-mono text-slate-900">₱{p.sellingPrice.toFixed(2)}</td>
                    <td className="p-3 font-semibold font-mono">
                      <span className={p.quantity <= 5 ? 'text-red-600 bg-red-50 px-1.5 py-0.5 rounded' : 'text-slate-700'}>
                        {p.quantity} Units
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        p.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => startEditProduct(p)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded cursor-pointer"
                        title="Edit specifications"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${p.productName} entirely from POS memory?`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="p-1 hover:bg-red-50 text-red-500 rounded cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CATEGORIES SUBSYSTEM */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans text-xs">
          {/* Category adder panel */}
          <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs h-fit">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b pb-3 mb-4">
              <Layers className="w-4 h-4 text-slate-500" />
              Register New Category
            </h4>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Category Name *</label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Pasta Specialities"
                  className="w-full px-2.5 py-1.5 border rounded outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">General Sort Index</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newCatOrder}
                  onChange={(e) => setNewCatOrder(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border rounded outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <button
                type="submit"
                id="btn-category-save"
                className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white rounded font-bold cursor-pointer transition-colors"
              >
                Create Category
              </button>
            </form>
          </div>

          {/* Categories list */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-3">POS Categories Sorting order</h4>
            
            <div className="divide-y divide-slate-100">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="py-3 flex items-center justify-between">
                  <div>
                    <strong className="text-sm text-slate-800 font-semibold">{cat.categoryName}</strong>
                    <p className="text-[10px] text-slate-400">ID: {cat.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs bg-slate-50 text-slate-500 py-1 px-2.5 rounded font-mono font-medium">
                      Sort index #{cat.sortOrder}
                    </span>
                    <span className="text-slate-300 text-xs font-mono">Row #{idx+1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. SUPPLIER INDEX */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4 font-sans text-xs">
          <div className="flex justify-between items-center bg-white p-3 border border-slate-50 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Supplier Partnerships Registry</h3>
              <p className="text-xs text-slate-400">Total verified vendors: {suppliers.length}</p>
            </div>
            <button
              onClick={() => setShowSupForm(!showSupForm)}
              className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Register Supplier
            </button>
          </div>

          {showSupForm && (
            <form onSubmit={handleSupplierSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 gap-4 grid grid-cols-1 md:grid-cols-4">
              <div className="md:col-span-4 flex justify-between border-b pb-2 mb-1">
                <strong className="text-slate-800 font-bold">Register New Corporate Vendor</strong>
                <button type="button" onClick={() => setShowSupForm(false)} className="text-slate-400 hover:text-slate-700">Close X</button>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  placeholder="e.g. Tyson Foods Ltd"
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Primary Agent / Contact *</label>
                <input
                  type="text"
                  required
                  value={sContact}
                  onChange={(e) => setSContact(e.target.value)}
                  placeholder="e.g. Robert Tyson"
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Contact Mobile Phone *</label>
                <input
                  type="text"
                  required
                  value={sPhone}
                  onChange={(e) => setSPhone(e.target.value)}
                  placeholder="e.g. +1-555-5555"
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Vendor Category / Notes</label>
                <input
                  type="text"
                  value={sNotes}
                  onChange={(e) => setSNotes(e.target.value)}
                  placeholder="Supplies bulk ingredients etc."
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div className="md:col-span-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowSupForm(false)} className="py-1.5 bg-slate-100 hover:bg-slate-200 px-3 rounded text-slate-600">Cancel</button>
                <button type="submit" id="btn-supplier-save" className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 font-bold text-white rounded">Submit Registry</button>
              </div>
            </form>
          )}

          {/* Suppliers Cards Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map(sup => (
              <div key={sup.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs relative">
                <div className="flex items-start justify-between gap-2 border-b border-slate-50 pb-2 mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{sup.supplierName}</h4>
                    <span className="text-[10px] text-slate-400">ID: {sup.id}</span>
                  </div>
                  <span className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 cursor-pointer font-bold text-[9px] text-slate-600 rounded uppercase">
                    Partner Supplier
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 font-sans mt-2">
                  <p>👤 Primary Agent: <strong className="text-slate-800">{sup.contactPerson}</strong></p>
                  <p>📞 Phone: 🔬 <strong className="text-slate-800 font-mono">{sup.phone}</strong></p>
                  <p>📝 Sourcing Specs: <span className="text-slate-500 font-medium">{sup.notes || 'No notes saved'}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. STOCK PURCHASES ORDER (GOODS IN) */}
      {activeTab === 'purchases' && (
        <div className="space-y-4 font-sans text-xs">
          <div className="flex justify-between items-center bg-white p-3 border border-slate-50 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Supplier Stock Purchases Ledger (Goods In)</h3>
              <p className="text-xs text-slate-400">Log incoming wholesale items from verified corporate suppliers.</p>
            </div>
            <button
              onClick={() => {
                if (suppliers.length === 0) {
                  alert('Please register at least one Supplier Vendor first!');
                  return;
                }
                setShowPurchaseForm(!showPurchaseForm);
              }}
              className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              File Incoming stock
            </button>
          </div>

          {showPurchaseForm && suppliers.length > 0 && (
            <form onSubmit={handlePurchaseSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 gap-4 grid grid-cols-1 md:grid-cols-4 font-sans">
              <div className="md:col-span-4 flex justify-between border-b pb-2 mb-1">
                <strong className="text-slate-800 font-bold">Write Cargo Receipt purchase Invoice</strong>
                <button type="button" onClick={() => setShowPurchaseForm(false)} className="text-slate-400 hover:text-slate-700">Close X</button>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Select Sourcing Supplier *</label>
                <select
                  value={purSupplier}
                  onChange={(e) => setPurSupplier(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.supplierName}>{s.supplierName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Product Name *</label>
                <input
                  type="text"
                  required
                  value={purProduct}
                  onChange={(e) => setPurProduct(e.target.value)}
                  placeholder="e.g. Truffle Burger"
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Target Branch Stock *</label>
                <select
                  value={purBranch}
                  onChange={(e) => setPurBranch(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.branchName}>{b.branchName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Purchase Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={purQty}
                  onChange={(e) => setPurQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Wholesale Unit Cost Price (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={purCost}
                  onChange={(e) => setPurCost(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Wholesale Retail selling price (₱) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={purPrice}
                  onChange={(e) => setPurPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
                />
              </div>

              <div className="md:col-span-2 flex items-center pt-2 text-[10px] text-slate-500">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mr-1.5" />
                <span>
                  Logistics automation: Logs cargo costs, establishes supplier reference histories, and pushes stock addition into POS product templates!
                </span>
              </div>

              <div className="md:col-span-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowPurchaseForm(false)} className="py-1.5 bg-slate-100 hover:bg-slate-200 px-3 rounded text-slate-600">Cancel</button>
                <button type="submit" id="btn-purchase-save" className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 font-bold text-white rounded">
                  File Purchase Invoice
                </button>
              </div>
            </form>
          )}

          {/* Supplier Purchases Data Table */}
          <div className="bg-white border border-slate-150 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3">Wholesale Vendor</th>
                  <th className="p-3">Goods Description</th>
                  <th className="p-3">Branch Loaded</th>
                  <th className="p-3">Quantity Received</th>
                  <th className="p-3">Unit Cost Price</th>
                  <th className="p-3">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPurchases.map(pur => (
                  <tr key={pur.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold font-mono text-slate-600">{pur.date}</td>
                    <td className="p-3 font-bold text-slate-800">{pur.supplierName}</td>
                    <td className="p-3 text-slate-700 font-medium">{pur.productName}</td>
                    <td className="p-3 font-semibold text-slate-600">{pur.branchName}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{pur.quantity} Units</td>
                    <td className="p-3 font-mono text-slate-600">₱{pur.costPrice.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-slate-950">₱{pur.totalCost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
