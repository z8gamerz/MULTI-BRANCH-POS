/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, Clipboard, CheckCircle2, User, CreditCard, 
  Trash2, Receipt, AlertTriangle, ShieldCheck, BadgePercent, X, Sparkles
} from 'lucide-react';
import { Branch, Category, Product, Order, OrderItem, Staff } from '../types';

interface POSInterfaceProps {
  currentStaff: Staff;
  currentBranchName: string;
  branches: Branch[];
  categories: Category[];
  products: Product[];
  orders: Order[];
  onAddOrder: (newOrder: Order) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status'], cancelReason?: string) => void;
  onUpdateProductStock: (productId: string, quantityToSubtract: number) => void;
}

export default function POSInterface({
  currentStaff,
  currentBranchName,
  branches,
  categories,
  products,
  orders,
  onAddOrder,
  onUpdateOrderStatus,
  onUpdateProductStock
}: POSInterfaceProps) {
  // POS States
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout States
  const [terminalCart, setTerminalCart] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  
  const [discountType, setDiscountType] = useState<'none' | 'percent' | 'fixed'>('none');
  const [discountVal, setDiscountVal] = useState<number>(0);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'cash' | 'card' | 'mobile_pay' | 'credit'>('cash');
  const [paymentRef, setPaymentRef] = useState('');

  // Split Payment States
  const [isSplitPayment, setIsSplitPayment] = useState<boolean>(false);
  const [split1Method, setSplit1Method] = useState<'cash' | 'card' | 'mobile_pay' | 'credit'>('cash');
  const [split1Amount, setSplit1Amount] = useState<number>(0);
  const [split2Method, setSplit2Method] = useState<'cash' | 'card' | 'mobile_pay' | 'credit'>('mobile_pay');
  const [split2Amount, setSplit2Amount] = useState<number>(0);

  // Philippine-Specific POS State for Senior Citizen / PWD Accounts
  const [isSeniorOrPwd, setIsSeniorOrPwd] = useState<boolean>(false);
  const [seniorId, setSeniorId] = useState<string>('');

  // Receipt Modal State
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [targetCancelOrderId, setTargetCancelOrderId] = useState<string>('');
  const [cancelReasonText, setCancelReasonText] = useState('');

  // Filter products by branch & category & search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchBranch = p.branch === currentBranchName;
      const matchActive = p.status === 'active';
      const matchCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBranch && matchActive && matchCategory && matchSearch;
    });
  }, [products, currentBranchName, activeCategory, searchQuery]);

  // Order filters (Only show orders of currently chosen branch)
  const branchOrders = useMemo(() => {
    return orders
      .filter(o => o.branchName === currentBranchName)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentBranchName]);

  // Cart Subtotals
  const cartSubtotal = useMemo(() => {
    return terminalCart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  }, [terminalCart]);

  // Philippine standard computations: 12% VAT is included in Bistro menu prices.
  // Senior Citizens/PWD are exempt from this 12% VAT, and receive an additional 20% discount on the VAT-exempt value.
  const phBilling = useMemo(() => {
    const vatRate = 0.12;
    if (isSeniorOrPwd) {
      const vatExemptSales = cartSubtotal / (1 + vatRate);
      const vatAmountSaved = cartSubtotal - vatExemptSales; // 12% VAT backed out
      const senior20Percent = vatExemptSales * 0.20;
      const totalDiscount = vatAmountSaved + senior20Percent;
      const finalTotal = vatExemptSales - senior20Percent;

      return {
        isSeniorActive: true,
        vatExemptSales,
        vatAmountSaved,
        senior20Percent,
        regularDiscount: 0,
        totalDiscount: Number(totalDiscount.toFixed(2)),
        total: Number(finalTotal.toFixed(2))
      };
    } else {
      let regDisc = 0;
      if (discountType === 'percent') {
        regDisc = cartSubtotal * (discountVal / 100);
      } else if (discountType === 'fixed') {
        regDisc = Math.min(cartSubtotal, discountVal);
      }
      const finalTotal = Math.max(0, cartSubtotal - regDisc);
      const vatExemptSales = finalTotal / (1 + vatRate);
      const vatAmount = finalTotal - vatExemptSales;

      return {
        isSeniorActive: false,
        vatExemptSales,
        vatAmountSaved: 0,
        senior20Percent: 0,
        regularDiscount: regDisc,
        totalDiscount: Number(regDisc.toFixed(2)),
        total: Number(finalTotal.toFixed(2)),
        vatAmount
      };
    }
  }, [cartSubtotal, isSeniorOrPwd, discountType, discountVal]);

  const discountAmount = phBilling.totalDiscount;
  const cartTotal = phBilling.total;

  // Synchronize split amounts automatically on cart subtotal/discount updates
  useEffect(() => {
    if (isSplitPayment) {
      const half = Number((cartTotal / 2).toFixed(2));
      setSplit1Amount(half);
      setSplit2Amount(Number((cartTotal - half).toFixed(2)));
    }
  }, [cartTotal, isSplitPayment]);

  // Dynamic split balance handler helpers
  const handleSplit1AmountChange = (val: number) => {
    const clampedSplit1 = Math.min(cartTotal, Math.max(0, val));
    setSplit1Amount(clampedSplit1);
    setSplit2Amount(Number((cartTotal - clampedSplit1).toFixed(2)));
  };

  const handleSplit2AmountChange = (val: number) => {
    const clampedSplit2 = Math.min(cartTotal, Math.max(0, val));
    setSplit2Amount(clampedSplit2);
    setSplit1Amount(Number((cartTotal - clampedSplit2).toFixed(2)));
  };

  // Add Item
  const handleAddToTerminalCart = (prod: Product) => {
    if (prod.quantity <= 0) {
      alert('Product out of stock!');
      return;
    }

    setTerminalCart(prev => {
      const existing = prev.find(item => item.productId === prod.id);
      if (existing) {
        if (existing.quantity >= prod.quantity) {
          alert(`Selected quantity exceeds remaining stock level: (${prod.quantity})`);
          return prev;
        }
        return prev.map(item =>
          item.productId === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, {
          productId: prod.id,
          productName: prod.productName,
          quantity: 1,
          sellingPrice: prod.sellingPrice
        }];
      }
    });
  };

  const handleUpdateQty = (productId: string, amount: number) => {
    const srcProduct = products.find(p => p.id === productId);
    setTerminalCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const next = item.quantity + amount;
          if (next <= 0) return null;
          if (srcProduct && next > srcProduct.quantity) {
            alert(`Stock limit reached (${srcProduct.quantity} items).`);
            return item;
          }
          return { ...item, quantity: next };
        }
        return item;
      }).filter(Boolean) as OrderItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setTerminalCart(prev => prev.filter(item => item.productId !== productId));
  };

  const getPayMethodLabel = (m: 'cash' | 'card' | 'mobile_pay' | 'credit') => {
    switch (m) {
      case 'cash': return 'Cash';
      case 'mobile_pay': return 'GCash/Maya';
      case 'card': return 'Card';
      case 'credit': return 'Credit';
      default: return m;
    }
  };

  // Submit Instore Order
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalCart.length === 0) {
      alert('Cannot checkout an empty shopping cart!');
      return;
    }

    // Checking credit constraints
    if (!isSplitPayment && selectedPayMethod === 'credit' && !customerName.trim()) {
      alert('Customer Name is absolutely mandatory when recording credit sales!');
      return;
    }

    if (isSplitPayment) {
      if ((split1Method === 'credit' || split2Method === 'credit') && !customerName.trim()) {
        alert('Customer Name is absolutely mandatory when recording credit sales in payment splits!');
        return;
      }
      const splitSum = split1Amount + split2Amount;
      if (Math.abs(splitSum - cartTotal) > 0.05) {
        alert(`Split payment sum (₱${splitSum.toFixed(2)}) must exactly equal the total amount to pay (₱${cartTotal.toFixed(2)}).`);
        return;
      }
    }

    const nextOrderNum = `ORD-${Math.floor(2000 + Math.random() * 8000)}`;
    const finalRef = isSeniorOrPwd 
      ? `${paymentRef.trim() || 'PAID'} (SC/PWD ID: ${seniorId || 'N/A'})`
      : paymentRef.trim() || `POS-TERM-${Math.floor(1000 + Math.random() * 9000)}`;

    let resolvedPayMethod = selectedPayMethod;
    let resolvedPayRef = finalRef;
    let resolvedPayStatus: Order['paymentStatus'] = selectedPayMethod === 'credit' ? 'unpaid' : 'paid';

    if (isSplitPayment) {
      // Store split method with larger share as main paymentMethod to comply with DB check constraint
      resolvedPayMethod = split1Amount >= split2Amount ? split1Method : split2Method;
      const cleanRef = paymentRef.trim() ? ` (Ref: ${paymentRef.trim()})` : '';
      resolvedPayRef = `Split: ${getPayMethodLabel(split1Method)} (₱${split1Amount.toFixed(2)}) + ${getPayMethodLabel(split2Method)} (₱${split2Amount.toFixed(2)})${cleanRef}`;

      if (split1Method === 'credit' && split2Method === 'credit') {
        resolvedPayStatus = 'unpaid';
      } else if (split1Method === 'credit' || split2Method === 'credit') {
        resolvedPayStatus = 'partial';
      } else {
        resolvedPayStatus = 'paid';
      }
    }

    const newOrderObj: Order = {
      id: `ord-instore-${Date.now()}`,
      orderNumber: nextOrderNum,
      branchName: currentBranchName,
      source: 'instore',
      customerName: isSeniorOrPwd 
        ? `${customerName.trim() || 'Walk-in Customer'} 👵👴`
        : customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      customerEmail: customerEmail.trim() || 'N/A',
      items: [...terminalCart],
      subtotal: Number(cartSubtotal.toFixed(2)),
      discount: Number(discountAmount.toFixed(2)),
      total: Number(cartTotal.toFixed(2)),
      status: 'completed', // In-store POS purchases complete immediately
      paymentMethod: resolvedPayMethod,
      paymentReference: resolvedPayRef,
      paymentStatus: resolvedPayStatus,
      estimatedReadyTime: 'Immediate',
      createdAt: new Date().toISOString(),
      isSplit: isSplitPayment,
      splitDetails: isSplitPayment ? {
        method1: split1Method,
        amount1: split1Amount,
        method2: split2Method,
        amount2: split2Amount
      } : undefined
    };

    // Decrement stock levels
    terminalCart.forEach(item => {
      onUpdateProductStock(item.productId, item.quantity);
    });

    onAddOrder(newOrderObj);
    setSelectedReceiptOrder(newOrderObj); // Auto trigger receipt pop up!

    // Reset Terminal checkout states
    setTerminalCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setDiscountType('none');
    setDiscountVal(0);
    setSelectedPayMethod('cash');
    setPaymentRef('');
    setIsSeniorOrPwd(false);
    setSeniorId('');
    setIsSplitPayment(false);
    setSplit1Method('cash');
    setSplit2Method('mobile_pay');
    setSplit1Amount(0);
    setSplit2Amount(0);
  };

  // Status transitions
  const triggerStatusChange = (orderId: string, nextStatus: Order['status']) => {
    if (nextStatus === 'cancelled') {
      setTargetCancelOrderId(orderId);
      setCancelReasonText('');
      setIsCancelModalOpen(true);
    } else {
      onUpdateOrderStatus(orderId, nextStatus);
    }
  };

  const confirmCancellation = () => {
    if (!cancelReasonText.trim()) {
      alert('Please state a reason for order cancellation.');
      return;
    }
    onUpdateOrderStatus(targetCancelOrderId, 'cancelled', cancelReasonText.trim());
    setIsCancelModalOpen(false);
  };

  return (
    <div className="space-y-6" id="pos-terminal-root">
      
      {/* 1. Terminal Role Badge */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Logged in Staff</p>
            <h3 className="text-sm font-bold text-slate-800">
              {currentStaff.firstName} {currentStaff.lastName}
            </h3>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
            {currentStaff.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
          <p className="text-xs font-semibold text-slate-600">POS Terminal Live: {currentBranchName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE CATALOG & PRODUCTS (xl:col-span-8) */}
        <div className="xl:col-span-8 space-y-4">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-100 rounded-xl">
            {/* Category horizontal bar */}
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                key="all"
                onClick={() => setActiveCategory('All')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                  activeCategory === 'All'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.categoryName)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                    activeCategory === cat.categoryName
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>

            {/* Product search box */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="pos-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full sm:w-[180px] pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Product grid catalog */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white border border-slate-100 rounded-xl">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No active products found</p>
                <p className="text-xs text-slate-400 mt-1">Check current branch settings or category mapping.</p>
              </div>
            ) : (
              filteredProducts.map(p => {
                const stockWarning = p.quantity <= 5;
                const outOfStock = p.quantity <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAddToTerminalCart(p)}
                    disabled={outOfStock}
                    className="bg-white border border-slate-100 rounded-xl p-3 hover:border-slate-300 hover:shadow-md transition-all text-left flex flex-col justify-between h-[155px] relative group cursor-pointer"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-[8px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.category}
                        </span>
                        {outOfStock ? (
                          <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">
                            Out of Stock
                          </span>
                        ) : stockWarning ? (
                          <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Low Stock
                          </span>
                        ) : null}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-2 truncate max-w-full">{p.productName}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Branch: {p.branch}</p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50 w-full">
                      <span className="text-xs font-bold text-slate-900">₱{p.sellingPrice.toFixed(2)}</span>
                      <span className="text-[10px] text-slate-400 font-medium font-mono">Qty: {p.quantity}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* REAL-TIME BRANCH ORDERS MONITOR BOARD */}
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 text-slate-700 rounded-md">
                  <Clipboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Branch Real-time Orders Board</h3>
                  <p className="text-[10px] text-slate-400">Showing active online/store records for {currentBranchName}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded-full">
                {branchOrders.length} Total
              </span>
            </div>

            {branchOrders.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No orders registered for this branch yet. Use the client portal to simulate requests!
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
                {branchOrders.map(ord => {
                  return (
                    <div key={ord.id} className="border border-slate-150 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      {/* Customer Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 font-bold rounded text-[9px] uppercase ${
                            ord.source === 'online' 
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' 
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}>
                            {ord.source}
                          </span>
                          <strong className="text-slate-800 font-mono text-sm">{ord.orderNumber}</strong>
                          <span className="text-slate-400 text-[10px]">{new Date(ord.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="font-semibold text-slate-700 mt-1">
                          👤 {ord.customerName} <span className="text-slate-400 font-normal">({ord.customerPhone})</span>
                        </p>
                        {/* Items list */}
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Items:{' '}
                          {ord.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                        </p>
                      </div>

                      {/* Summary financials */}
                      <div className="md:text-right">
                        <p className="font-bold text-slate-800">Total: ₱{ord.total.toFixed(2)}</p>
                        {ord.discount > 0 && <p className="text-emerald-600 text-[10px]">Saved -₱{ord.discount.toFixed(2)}</p>}
                        
                        <div className="flex items-center gap-1.5 md:justify-end mt-1">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                            ord.paymentStatus === 'paid' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                          <span className="text-slate-400 text-[10px]">via {ord.paymentMethod}</span>
                        </div>
                      </div>

                      {/* State Upgraders */}
                      <div className="flex flex-wrap gap-1 items-center border-t border-dashed border-slate-100 pt-2 md:pt-0 md:border-none">
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => triggerStatusChange(ord.id, 'preparing')}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-[10px] cursor-pointer transition-colors"
                          >
                            Accept & Prep
                          </button>
                        )}
                        {ord.status === 'preparing' && (
                          <button
                            onClick={() => triggerStatusChange(ord.id, 'ready')}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] cursor-pointer transition-colors"
                          >
                            Mark Ready
                          </button>
                        )}
                        {ord.status === 'ready' && (
                          <button
                            onClick={() => triggerStatusChange(ord.id, 'completed')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[10px] cursor-pointer transition-colors"
                          >
                            Collect & Close
                          </button>
                        )}
                        
                        {/* General status badge */}
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded text-center min-w-[75px] ${
                          ord.status === 'completed' 
                            ? 'bg-slate-100 text-slate-700' 
                            : ord.status === 'cancelled' 
                            ? 'bg-red-50 text-red-600' 
                            : 'bg-orange-50 text-orange-600 animate-pulse'
                        }`}>
                          {ord.status}
                        </span>

                        {/* Order action controls */}
                        <button
                          onClick={() => setSelectedReceiptOrder(ord)}
                          className="p-1 hover:bg-slate-100 text-slate-500 rounded cursor-pointer"
                          title="View Digital Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        
                        {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                          <button
                            onClick={() => triggerStatusChange(ord.id, 'cancelled')}
                            className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                            title="Cancel Order"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TAXI / CART & CHECKOUT TERMINAL (xl:col-span-4) */}
        <div className="xl:col-span-4">
          <form onSubmit={handleTerminalSubmit} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-4">
            <h3 className="text-sm font-sans font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-slate-900" />
                Active Order Cart
              </span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-800 rounded-full font-mono">
                {terminalCart.reduce((acc, it) => acc + it.quantity, 0)} items
              </span>
            </h3>

            {/* Cart itemizer lines */}
            {terminalCart.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Checkout basket is vacant</p>
                <p className="text-[10px] text-slate-400 mt-1">Click products on the left menu catalog to populate the cart.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {terminalCart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between gap-2 text-xs border-b border-slate-50 pb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">₱{item.sellingPrice.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-100 rounded">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, -1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 rounded font-semibold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 font-bold text-slate-700 min-w-[20px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.productId, 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 rounded font-semibold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.productId)}
                        className="p-1 hover:text-red-500 text-slate-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Customer information binding */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Customer Profile (Optional)</h4>
              <div>
                <input
                  type="text"
                  placeholder="Customer Name (Required for Credit)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-950 text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="tel"
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-950 text-slate-700"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-950 text-slate-700"
                />
              </div>
            </div>

            {/* Philippine Senior Citizen / PWD Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between">
                <label htmlFor="senior-pwd-switch" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                  👵👴 Senior Citizen / PWD Promo
                </label>
                <input
                  id="senior-pwd-switch"
                  type="checkbox"
                  checked={isSeniorOrPwd}
                  onChange={(e) => {
                    setIsSeniorOrPwd(e.target.checked);
                    if (!e.target.checked) setSeniorId('');
                  }}
                  className="w-4 h-4 text-emerald-600 border-slate-350 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-400">Exempt from 12% VAT + 20% extra discount on food/merienda under PH Republic Act 9994 / 10754.</p>
              
              {isSeniorOrPwd && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
                  <input
                    type="text"
                    required
                    placeholder="SC / PWD ID Number (Required)"
                    value={seniorId}
                    onChange={(e) => setSeniorId(e.target.value)}
                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Cashier adjustments & discount */}
            {!isSeniorOrPwd && (
              <div className="space-y-2 pt-2 border-t border-slate-50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <BadgePercent className="w-3.5 h-3.5" />
                  Cart Discounts & Adjustments
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { mode: 'none' as const, label: 'No Discount' },
                    { mode: 'percent' as const, label: 'Percentage' },
                    { mode: 'fixed' as const, label: 'Fixed ₱' }
                  ].map(opt => (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => {
                        setDiscountType(opt.mode);
                        setDiscountVal(0);
                      }}
                      className={`p-1 text-[10px] font-semibold border rounded cursor-pointer transition-colors ${
                        discountType === opt.mode 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {discountType !== 'none' && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder={discountType === 'percent' ? 'Discount % (e.g. 10)' : 'Amount ₱ (e.g. 100)'}
                      value={discountVal || ''}
                      onChange={(e) => setDiscountVal(Math.max(0, Number(e.target.value)))}
                      className="flex-1 px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded outline-none text-slate-700"
                    />
                    <span className="p-1 text-xs font-bold text-slate-500 self-center">
                      -{discountType === 'percent' ? '%' : '₱'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Method selector */}
            {/* Split Payment Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="p-1 bg-indigo-50 text-indigo-650 rounded">⚡</span>
                Enable Split Payment
              </span>
              <button
                type="button"
                onClick={() => setIsSplitPayment(!isSplitPayment)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer outline-none ${
                  isSplitPayment ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-sm transform duration-200 ${
                    isSplitPayment ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Payment Method selector */}
            <div className="space-y-2 pt-1">
              {isSplitPayment ? (
                <div className="space-y-3 pt-1 pb-1 bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-100/50">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-indigo-950 uppercase tracking-wide">Split Breakdown</h4>
                    <span className="text-[10px] font-bold text-slate-600">Total to Pay: ₱{cartTotal.toFixed(2)}</span>
                  </div>

                  {/* Split 1 */}
                  <div className="space-y-1 p-2 bg-white rounded-md border border-slate-100 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Split Part 1</span>
                      <span className="text-[10px] text-slate-400">Amount</span>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={split1Method}
                        onChange={(e) => setSplit1Method(e.target.value as any)}
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="cash">💵 Cash</option>
                        <option value="mobile_pay">📱 GCash/Maya</option>
                        <option value="card">💳 Card</option>
                        <option value="credit">🤝 Store Credit</option>
                      </select>
                      <div className="relative w-1/2 flex items-center">
                        <span className="absolute left-2 text-[11px] font-bold text-slate-400">₱</span>
                        <input
                          type="number"
                          min="0"
                          max={cartTotal}
                          step="0.01"
                          value={split1Amount || 0}
                          onChange={(e) => handleSplit1AmountChange(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded pl-4 pr-1.5 py-1 text-xs text-slate-800 font-bold outline-none text-right focus:bg-white focus:ring-1 focus:ring-indigo-550"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Split 2 */}
                  <div className="space-y-1 p-2 bg-white rounded-md border border-slate-100 shadow-2xs">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Split Part 2 (Auto-balanced)</span>
                      <span className="text-[10px] text-slate-400">Amount</span>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={split2Method}
                        onChange={(e) => setSplit2Method(e.target.value as any)}
                        className="w-1/2 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 font-semibold cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="cash">💵 Cash</option>
                        <option value="mobile_pay">📱 GCash/Maya</option>
                        <option value="card">💳 Card</option>
                        <option value="credit">🤝 Store Credit</option>
                      </select>
                      <div className="relative w-1/2 flex items-center">
                        <span className="absolute left-2 text-[11px] font-bold text-slate-400">₱</span>
                        <input
                          type="number"
                          min="0"
                          max={cartTotal}
                          step="0.01"
                          value={split2Amount || 0}
                          onChange={(e) => handleSplit2AmountChange(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded pl-4 pr-1.5 py-1 text-xs text-slate-800 font-bold outline-none text-right focus:bg-white focus:ring-1 focus:ring-indigo-550"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Split Check Warning */}
                  {(split1Method === 'credit' || split2Method === 'credit') && (
                    <div className="text-[9px] text-amber-700 font-sans leading-tight bg-amber-50 rounded p-2 border border-amber-100">
                      ℹ️ One split is Credit. Customer's Name cannot be blank to support the loan ledger.
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-emerald-50 text-[10px] text-emerald-800 p-2 rounded border border-emerald-100 font-semibold">
                    <span>Partitions:</span>
                    <span className="font-bold">
                      ₱{split1Amount.toFixed(2)} + ₱{split2Amount.toFixed(2)} = ₱{(split1Amount + split2Amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select PH Payment Method</h4>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { style: 'cash' as const, text: '💵 PH Cash' },
                      { style: 'mobile_pay' as const, text: '📱 GCash / Maya' },
                      { style: 'card' as const, text: '💳 Debit / Credit' },
                      { style: 'credit' as const, text: '🤝 Store Credit' }
                    ].map(pm => (
                      <button
                        key={pm.style}
                        type="button"
                        onClick={() => setSelectedPayMethod(pm.style)}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                          selectedPayMethod === pm.style 
                            ? pm.style === 'credit'
                              ? 'bg-red-50 border-red-300 text-red-700'
                              : 'bg-indigo-50 border-indigo-300 text-indigo-800' 
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pm.text}
                      </button>
                    ))}
                  </div>

                  {selectedPayMethod === 'credit' && (
                    <div className="bg-red-50/70 text-[10px] text-red-800 p-2.5 rounded-lg space-y-1 border border-red-100">
                      <p className="font-bold">⚠️ Customer Credit Debt</p>
                      <p className="text-red-700">Records credit invoicing. Customer's Name cannot be blank.</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <input
                  type="text"
                  placeholder={
                    isSplitPayment
                      ? 'Optional notes or authorization reference'
                      : selectedPayMethod === 'mobile_pay' 
                      ? 'GCash/Maya Reference Ref (13 digits)' 
                      : selectedPayMethod === 'credit' 
                      ? 'Terms Net-30 / Employee ID' 
                      : 'Payment Reference (Optional)'
                  }
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-slate-950 text-slate-700 font-mono mt-1"
                />
              </div>
            </div>

            {/* Calculations and final submit with BIR-compliant Philippine breakdown */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5 font-sans text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal (VAT Inclusive):</span>
                <span className="font-semibold text-slate-700">₱{cartSubtotal.toFixed(2)}</span>
              </div>
              
              {phBilling.isSeniorActive ? (
                <>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>VAT Exemption (12% Backout):</span>
                    <span>-₱{phBilling.vatAmountSaved.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Senior / PWD Discount (20%):</span>
                    <span>-₱{phBilling.senior20Percent.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] bg-slate-50 p-1 px-1.5 rounded">
                    <span>VAT-Exempt Sales:</span>
                    <span>₱{phBilling.vatExemptSales.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-indigo-600 font-medium">
                      <span>Store Discount:</span>
                      <span>-₱{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>12% VAT Portion:</span>
                    <span>₱{phBilling.vatAmount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Net VAT-Exempt Sales:</span>
                    <span>₱{phBilling.vatExemptSales?.toFixed(2)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-base text-slate-900 border-t border-slate-100 pt-2 font-bold font-sans">
                <span>Total Amount Due:</span>
                <span className="text-slate-950 text-lg">₱{cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              id="btn-pos-checkout"
              disabled={terminalCart.length === 0 || (isSeniorOrPwd && !seniorId.trim())}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                terminalCart.length === 0 || (isSeniorOrPwd && !seniorId.trim())
                  ? 'bg-slate-100 border border-slate-150 text-slate-400 cursor-not-allowed' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              Complete Transaction (₱)
            </button>
          </form>
        </div>
      </div>

      {/* 2. RECEIPT MODAL SIMULATION */}
      {selectedReceiptOrder && (
        <div id="receipt-modal-bg" className="fixed inset-0 bg-slate-990/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-2xl shadow-xl p-5 relative overflow-hidden" id="receipt-modal-content">
            <button
              onClick={() => setSelectedReceiptOrder(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt aesthetics */}
            <div className="text-center font-mono text-xs border-b border-dashed border-slate-300 pb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase">*** BITE BISTRO ***</h3>
              <p className="text-slate-500 mt-1">{selectedReceiptOrder.branchName}</p>
              <p className="text-slate-500 font-sans">{branches.find(b => b.branchName === selectedReceiptOrder.branchName)?.address}</p>
              <p className="text-slate-500 text-[10px] mt-2 font-mono">Date: {new Date(selectedReceiptOrder.createdAt).toLocaleString()}</p>
              <p className="text-slate-800 text-[11px] font-bold mt-1 font-mono">INVOICE: #{selectedReceiptOrder.orderNumber}</p>
            </div>

            {/* Invoice items lists */}
            <div className="py-4 border-b border-dashed border-slate-300 max-h-[160px] overflow-y-auto font-mono text-xs text-slate-700 space-y-2">
              {selectedReceiptOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start gap-1">
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{it.productName}</p>
                    <p className="text-[10px] text-slate-400">Qty: {it.quantity} @ ₱{it.sellingPrice.toFixed(2)}</p>
                  </div>
                  <span className="font-bold text-slate-800">₱{(it.quantity * it.sellingPrice).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals with BIR Philippine compliance details */}
            <div className="py-3 border-b border-dashed border-slate-300 font-mono text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal (VAT Inc):</span>
                <span>₱{selectedReceiptOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedReceiptOrder.discount > 0 && (
                <div className="flex justify-between text-indigo-600 font-semibold">
                  <span>DISCOUNT/BENEFIT:</span>
                  <span>-₱{selectedReceiptOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-900 font-extrabold font-mono pt-1">
                <span>TOTAL AMOUNT DUE:</span>
                <span>₱{selectedReceiptOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* BIR tax information footer */}
            <div className="py-3.5 border-b border-dashed border-slate-300 font-mono text-[9px] text-slate-500 space-y-1">
              <p className="font-bold text-[10px] text-slate-700 uppercase tracking-wider mb-1.5 text-center">--- BIR Tax Sales Breakdown ---</p>
              {selectedReceiptOrder.customerName.includes('👵') ? (
                <>
                  <div className="flex justify-between">
                    <span>VATABLE SALES:</span>
                    <span>₱0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT-EXEMPT SALES:</span>
                    <span>₱{(selectedReceiptOrder.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>12% VAT EXEMPTION:</span>
                    <span>₱{(selectedReceiptOrder.subtotal - (selectedReceiptOrder.subtotal / 1.12)).toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span>VATABLE SALES (12%):</span>
                    <span>₱{(selectedReceiptOrder.total / 1.12).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>12% VAT PORTION:</span>
                    <span>₱{(selectedReceiptOrder.total - (selectedReceiptOrder.total / 1.12)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT-EXEMPT SALES:</span>
                    <span>₱0.00</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span>ZERO-RATED SALES:</span>
                <span>₱0.00</span>
              </div>
              <p className="text-[8px] text-slate-400 mt-1 italic text-center">Official PH POS billing record.</p>
            </div>

            {/* Payment status */}
            <div className="py-4 text-center font-mono text-xs text-slate-500 space-y-1">
              <p>PAYMENT METHOD: <strong className="text-slate-900 uppercase">{selectedReceiptOrder.paymentMethod}</strong></p>
              <p>REFERENCE: <strong className="text-slate-950 font-mono">{selectedReceiptOrder.paymentReference}</strong></p>
              <p className="text-[10px] font-medium bg-slate-50 rounded p-1 inline-block mt-3 border border-slate-100 uppercase">
                STATUS: <strong className={`${
                  selectedReceiptOrder.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-red-500'
                }`}>{selectedReceiptOrder.paymentStatus}</strong>
              </p>
            </div>

            {/* Dummy Barcode */}
            <div className="text-center pt-2 font-mono">
              <div className="inline-block p-1 bg-slate-950 text-white font-mono tracking-[4px] text-[10px] px-4 rounded select-none">
                ||||| | |||| | | |||| || {selectedReceiptOrder.orderNumber} |||||
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-3">Thank you for dining with us!</p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                id="btn-print-receipt"
                onClick={() => {
                  alert('Command sent to virtual POS receipt printer successfully! 📠');
                  setSelectedReceiptOrder(null);
                }}
                className="flex-1 py-1.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer text-center"
              >
                Print Voucher
              </button>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION DIALOG MODAL */}
      {isCancelModalOpen && (
        <div id="cancel-dialog-bg" className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-slate-100 shadow-xl" id="cancel-dialog-content">
            <h3 className="font-bold text-slate-800 flex items-center gap-1">
              <AlertTriangle className="text-red-500 w-4 h-4" />
              Cancel Order Request
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to cancel order #{orders.find(o => o.id === targetCancelOrderId)?.orderNumber}?
              Please specify the cancellation reason for supplier audit logs.
            </p>
            <div className="mt-3">
              <input
                type="text"
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                placeholder="e.g. Customer changed mind / duplicate order"
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-red-500 text-slate-700"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Go Back
              </button>
              <button
                id="btn-confirm-cancel"
                onClick={confirmCancellation}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded cursor-pointer transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple wrappers to avoid missing standard exports
function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
