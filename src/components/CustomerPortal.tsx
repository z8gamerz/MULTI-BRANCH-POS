/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, Trash2, CheckCircle2, Clock, MapPin, 
  Search, ArrowRight, Tag, HelpCircle, Utensils, RefreshCw, UserCheck 
} from 'lucide-react';
import { Branch, Category, Product, Order, OrderItem } from '../types';

interface CustomerPortalProps {
  branches: Branch[];
  categories: Category[];
  products: Product[];
  onAddOrder: (newOrder: Order) => void;
  onUpdateProductStock: (productId: string, quantityToSubtract: number) => void;
}

export default function CustomerPortal({
  branches,
  categories,
  products,
  onAddOrder,
  onUpdateProductStock
}: CustomerPortalProps) {
  // Portal States
  const [selectedBranchName, setSelectedBranchName] = useState<string>(branches[0]?.branchName || '');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscountRate, setAppliedDiscountRate] = useState<number>(0);
  const [couponFeedback, setCouponFeedback] = useState('');

  // Customer Contact Info State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [pickupTime, setPickupTime] = useState('15 min');
  const [payMethod, setPayMethod] = useState<'card' | 'mobile_pay' | 'cash'>('card');

  // Completed Customer order (for live tracking window)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Sync selected branch name when branches list arrives after mounting delay
  React.useEffect(() => {
    if (!selectedBranchName && branches.length > 0) {
      setSelectedBranchName(branches[0].branchName);
    }
  }, [branches, selectedBranchName]);

  // Active Branch Selected object
  const activeBranch = useMemo(() => {
    return branches.find(b => b.branchName === selectedBranchName) || null;
  }, [branches, selectedBranchName]);

  // Clean filtered products list matching selected branch + category + search
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchBranch = p.branch === selectedBranchName;
      const matchActive = p.status === 'active';
      const matchCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchSearch = p.productName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBranch && matchActive && matchCategory && matchSearch;
    });
  }, [products, selectedBranchName, activeCategory, searchQuery]);

  // Pricing selectors
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Number((cartSubtotal * appliedDiscountRate).toFixed(2));
  }, [cartSubtotal, appliedDiscountRate]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount);
  }, [cartSubtotal, discountAmount]);

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      alert('This product is currently out of stock!');
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert(`Cannot purchase more than ${product.quantity} available items!`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          productName: product.productName,
          quantity: 1,
          sellingPrice: product.sellingPrice
        }];
      }
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    const srcProduct = products.find(p => p.id === productId);
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (srcProduct && newQty > srcProduct.quantity) {
            alert(`Sorry, stock is capped at ${srcProduct.quantity} items for this product.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as OrderItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const applyCoupon = () => {
    const code = discountCode.trim().toUpperCase();
    if (code === 'WELCOME10') {
      setAppliedDiscountRate(0.10);
      setCouponFeedback('10% Coupon Applied!');
    } else if (code === 'BISTRO20') {
      setAppliedDiscountRate(0.20);
      setCouponFeedback('20% Flash Discount Applied!');
    } else if (code === '') {
      setAppliedDiscountRate(0);
      setCouponFeedback('');
    } else {
      setCouponFeedback('Invalid Coupon Code');
    }
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Your shopping cart is empty!');
      return;
    }
    if (!custName.trim() || !custPhone.trim()) {
      alert('Please fill out your Name and Contact Phone!');
      return;
    }

    const nextOrderNo = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrderObj: Order = {
      id: `ord-cust-${Date.now()}`,
      orderNumber: nextOrderNo,
      branchName: selectedBranchName,
      source: 'online',
      customerName: custName,
      customerPhone: custPhone,
      customerEmail: custEmail || `${custName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      items: [...cart],
      subtotal: Number(cartSubtotal.toFixed(2)),
      discount: Number(discountAmount.toFixed(2)),
      total: Number(cartTotal.toFixed(2)),
      status: 'pending',
      paymentMethod: payMethod === 'cash' ? 'credit' : 'card', // mapped to cash-on-delivery (unpaid credit) or prepaid card
      paymentReference: payMethod === 'cash' ? 'Pay On Pick Up' : `Online ${payMethod.toUpperCase()} Ref ${Math.floor(100000 + Math.random() * 900000)}`,
      paymentStatus: payMethod === 'cash' ? 'unpaid' : 'paid',
      estimatedReadyTime: pickupTime,
      createdAt: new Date().toISOString()
    };

    // Update state stocks and submit order
    cart.forEach(item => {
      onUpdateProductStock(item.productId, item.quantity);
    });

    onAddOrder(newOrderObj);
    setPlacedOrder(newOrderObj);
    setCart([]);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setDiscountCode('');
    setAppliedDiscountRate(0);
    setCouponFeedback('');
  };

  return (
    <div className="space-y-6" id="customer-portal">
      {/* 1. Branch Selector Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
            ONLINE CUSTOMER HUB
          </span>
          <h2 className="text-xl font-bold font-sans tracking-tight mt-2">Bite Bistro Online Ordering</h2>
          <p className="text-sm text-slate-400 mt-1">Select your preferred branch venue to view the active menu & estimated times.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-emerald-500" />
            Pick Venue:
          </label>
          <select
            id="portal-branch-select"
            value={selectedBranchName}
            onChange={(e) => {
              setSelectedBranchName(e.target.value);
              setCart([]); // Clear cart to avoid cross-branch items mixup
            }}
            className="bg-slate-800 text-sm py-2 px-3 rounded-lg text-white border border-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            {branches.map(br => (
              <option key={br.id} value={br.branchName}>
                {br.branchName} {br.status === 'inactive' ? '(Pre-order Only)' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Welcome Messaging */}
      {activeBranch && (
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
          <Utensils className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">Branch Welcome Note</h4>
            <p className="text-sm text-emerald-800 font-medium mt-1">"{activeBranch.welcomeMessage}"</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-emerald-700">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                Est. Preparation: <strong>{activeBranch.timeInterval}</strong>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Location: <span className="underline">{activeBranch.address}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Interface Layout columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Menu Grid (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 border border-slate-100 rounded-xl">
            {/* Category horizontal bar */}
            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                key="all"
                onClick={() => setActiveCategory('All')}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 ${
                  activeCategory === 'All'
                    ? 'bg-emerald-600 text-white'
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
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat.categoryName}
                </button>
              ))}
            </div>

            {/* Product search box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="portal-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food & beverages..."
                className="w-full sm:w-[200px] pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Catalog grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white border border-slate-100 rounded-xl">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">No active products found</p>
                <p className="text-xs text-slate-400 mt-1">There are no products listed or in-stock for this category/branch combination.</p>
              </div>
            ) : (
              filteredProducts.map(p => (
                <div key={p.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-xs hover:shadow-md transition-all flex gap-3 relative overflow-hidden group">
                  <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'}
                      alt={p.productName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-col justify-between flex-1 py-0.5">
                    <div>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide bg-emerald-50 px-1.5 py-0.5 rounded">
                        {p.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{p.productName}</h4>
                      <p className="text-xs font-semibold text-emerald-700 mt-0.5">₱{p.sellingPrice.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] ${
                        p.quantity < 10 ? 'text-amber-600 font-medium' : 'text-slate-400'
                      }`}>
                        Stock: {p.quantity} left
                      </span>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={p.quantity <= 0}
                        className={`text-xs px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                          p.quantity <= 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xs'
                        }`}
                      >
                        {p.quantity <= 0 ? 'Out of Stock' : '+ Add to Bag'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Cart & Checkout (1/3 width on desktop) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
            <h3 className="text-sm font-sans font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              Online Basket ({cart.reduce((ac, x) => ac + x.quantity, 0)} items)
            </h3>

            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-400">Your basket is currently empty.</p>
                <p className="text-[10px] text-slate-400 mt-1">Pick some fresh treats on the left to start checking out.</p>
              </div>
            ) : (
              <div className="space-y-3 mt-3 max-h-[190px] overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between gap-2 text-xs border-b border-slate-50 pb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{item.productName}</p>
                      <p className="text-[10px] text-slate-400">₱{item.sellingPrice.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-100 rounded">
                        <button
                          onClick={() => updateCartQty(item.productId, -1)}
                          className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded font-semibold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 font-semibold text-slate-700 min-w-[20px] text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.productId, 1)}
                          className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-200 rounded font-semibold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="p-1 hover:text-red-500 text-slate-400 cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Coupon field */}
            {cart.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    placeholder="Coupon (e.g. WELCOME10)"
                    className="flex-1 px-2.5 py-1 text-[11px] border border-slate-200 rounded outline-none focus:ring-1 focus:ring-emerald-500 uppercase font-semibold"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-xs text-slate-600 transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponFeedback && (
                  <p className={`text-[10px] mt-1 font-medium ${
                    appliedDiscountRate > 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {couponFeedback}
                  </p>
                )}
              </div>
            )}

            {/* Receipt Summary */}
            {cart.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-150 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-700">₱{cartSubtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Discount:
                    </span>
                    <span>-₱{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm text-slate-800 font-sans">
                  <span className="font-bold">Total Bill:</span>
                  <span className="font-extrabold text-emerald-700">₱{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Customer Information Form */}
          {cart.length > 0 && (
            <form onSubmit={handleCheckout} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Delivery / Pickup Details
              </h3>
              
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="e.g. +1 555-0982"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="john@doe.com"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Ready Pickup In</label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 cursor-pointer"
                  >
                    <option value="15 min">15 Mins</option>
                    <option value="30 min">30 Mins</option>
                    <option value="45 min">45 Mins</option>
                    <option value="1 hour">1 Hour</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Payment Type</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700 cursor-pointer"
                  >
                    <option value="card">Prepay with Debit/Credit Card</option>
                    <option value="mobile_pay">Prepay via GCash / Maya</option>
                    <option value="cash">Pay Cash on Pick-up (COD)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                id="btn-customer-submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer mt-2 transition-all hover:shadow shadow-xs uppercase tracking-wide"
              >
                Place Online Order
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 4. Live Tracking section */}
      {placedOrder && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white" id="customer-tracker">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                <h3 className="text-sm font-sans font-bold uppercase tracking-wider text-cyan-400">Order Placed Successfully!</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">Keep this screen open to view food prep states in real time.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Ref:</span>{' '}
              <strong className="text-sm text-cyan-400 font-mono">{placedOrder.orderNumber}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Steps tracker indicators */}
            {[
              { label: 'order received', status: ['pending', 'preparing', 'ready', 'completed'] },
              { label: 'meal preparing', status: ['preparing', 'ready', 'completed'] },
              { label: 'ready for pickup', status: ['ready', 'completed'] },
              { label: 'order completed', status: ['completed'] }
            ].map((step, idx) => {
              const isActive = step.status.includes(placedOrder.status);
              return (
                <div key={idx} className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
                  <div className={`p-1.5 rounded-full ${
                    isActive ? 'bg-cyan-500 text-slate-900' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isActive ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider font-semibold text-slate-400">Step {idx + 1}</span>
                    <strong className={`block text-xs uppercase font-semibold ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status banner description */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-slate-400">
            <p>
              Destination: <strong className="text-slate-200">{placedOrder.branchName}</strong> | 
              Estimated pick up time: <strong className="text-cyan-400">{placedOrder.estimatedReadyTime}</strong>
            </p>
            <button
              onClick={() => setPlacedOrder(null)}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Close Tracker & New Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
