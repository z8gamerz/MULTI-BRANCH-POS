/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CreditCard, Plus, HelpCircle, History, DollarSign, Wallet, CheckCircle2 } from 'lucide-react';
import { Order, CreditPayment } from '../types';

interface CreditManagerProps {
  orders: Order[];
  payments: CreditPayment[];
  onAddCreditPayment: (payment: CreditPayment) => void;
  onUpdateOrderPaymentStatus: (orderId: string, status: Order['paymentStatus']) => void;
}

export default function CreditManager({
  orders,
  payments,
  onAddCreditPayment,
  onUpdateOrderPaymentStatus
}: CreditManagerProps) {
  // UI states
  const [showPayForm, setShowPayForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(10);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'mobile_pay'>('cash');
  const [payRef, setPayRef] = useState('');

  // 1. Filter credit orders
  const creditOrders = useMemo(() => {
    return orders.filter(o => o.paymentMethod === 'credit');
  }, [orders]);

  // 2. Aggregate client overall accounts metrics
  const clientSummaryList = useMemo(() => {
    const clients: Record<string, { totalCharged: number; totalPaid: number; remaining: number; ordersCount: number }> = {};

    creditOrders.forEach(ord => {
      const name = ord.customerName || 'Walk-in Customer';
      if (!clients[name]) {
        clients[name] = { totalCharged: 0, totalPaid: 0, remaining: 0, ordersCount: 0 };
      }
      clients[name].totalCharged += ord.total;
      clients[name].ordersCount += 1;
    });

    payments.forEach(pay => {
      const name = pay.customerName || 'Walk-in Customer';
      if (clients[name]) {
        clients[name].totalPaid += pay.amountPaid;
      }
    });

    // Recalculate remaining debts
    Object.keys(clients).forEach(name => {
      clients[name].remaining = Math.max(0, clients[name].totalCharged - clients[name].totalPaid);
    });

    return Object.entries(clients).map(([name, data]) => ({
      clientName: name,
      ...data
    }));
  }, [creditOrders, payments]);

  // 3. For list: find remaining balance specifically for a single order
  const getOrderRemainingDebt = (orderId: string, total: number) => {
    const orderPaidAmount = payments
      .filter(p => p.orderId === orderId)
      .reduce((sum, p) => sum + p.amountPaid, 0);
    return Math.max(0, total - orderPaidAmount);
  };

  const handleRepaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) {
      alert('Must pick an outstanding invoice ticket reference!');
      return;
    }

    const targetOrd = orders.find(o => o.id === selectedOrderId);
    if (!targetOrd) return;

    const currentDueDebt = getOrderRemainingDebt(targetOrd.id, targetOrd.total);
    const amountToApply = Math.max(0, Number(payAmount));

    if (amountToApply <= 0) {
      alert('Repayment amount must be positive.');
      return;
    }

    if (amountToApply > currentDueDebt + 0.05) {
      alert(`Payment of ₱${amountToApply} exceeds the outstanding debt of ₱${currentDueDebt.toFixed(2)} on this order.`);
      return;
    }

    const newPayment: CreditPayment = {
      id: `pay-add-${Date.now()}`,
      orderId: targetOrd.id,
      customerName: targetOrd.customerName || 'Walk-in Customer',
      amountPaid: Number(amountToApply.toFixed(2)),
      paymentDate: new Date().toISOString(),
      paymentMethod: payMethod,
      paymentReference: payRef.trim() || `REPAY-${Math.floor(1000 + Math.random() * 9000)}`
    };

    onAddCreditPayment(newPayment);

    // Dynamic Invoice status update
    const totalRepayments = payments
      .filter(p => p.orderId === targetOrd.id)
      .reduce((sum, p) => sum + p.amountPaid, 0) + amountToApply;

    if (Math.abs(totalRepayments - targetOrd.total) < 0.05 || totalRepayments >= targetOrd.total) {
      onUpdateOrderPaymentStatus(targetOrd.id, 'paid');
    } else if (totalRepayments > 0) {
      onUpdateOrderPaymentStatus(targetOrd.id, 'partial');
    }

    // Reset fields
    setPayAmount(10);
    setPayRef('');
    setShowPayForm(false);
    alert('Repayment successfully recorded! Invoice credit balance updated.');
  };

  // Outstanding accounts calculations
  const totalOutstandingCredit = clientSummaryList.reduce((acc, c) => acc + c.remaining, 0);

  return (
    <div className="space-y-6" id="credit-ledger-panel">
      {/* Visual stats and summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Outstanding Customer Credit</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-xl font-extrabold text-amber-600 font-sans">
              ₱{totalOutstandingCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-bold font-sans">
              Debt
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Total uncollected client balances</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Credit Repaid</p>
          <h3 className="text-xl font-extrabold text-emerald-600 font-sans mt-1">
            ₱{payments.reduce((acc, p) => acc + p.amountPaid, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-400">Total collected credit receipts</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Outstanding Invoices</p>
          <h3 className="text-xl font-extrabold text-slate-800 font-sans mt-1">
            {creditOrders.filter(o => o.paymentStatus !== 'paid').length} Invoices
          </h3>
          <span className="text-[10px] text-slate-400">Repayments still pending collection</span>
        </div>
      </div>

      {/* Title Header with Repayment portal trigger */}
      <div className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-xl shadow-xs">
        <div>
          <h3 className="text-sm font-sans font-bold text-slate-800 uppercase tracking-wider">Accounts Receivable & Customer Credit Ledger</h3>
          <p className="text-xs text-slate-400">Audit overall balances, credit limits, or register custom customer payments.</p>
        </div>
        <button
          onClick={() => {
            const firstUnpaid = creditOrders.find(o => o.paymentStatus !== 'paid');
            if (!firstUnpaid) {
              alert('Excellent! There are no unpaid customer credit invoices to collect payments for at the moment.');
              return;
            }
            setSelectedOrderId(firstUnpaid.id);
            setPayAmount(getOrderRemainingDebt(firstUnpaid.id, firstUnpaid.total));
            setShowPayForm(!showPayForm);
          }}
          className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record Repayment
        </button>
      </div>

      {/* Record Repayment Form */}
      {showPayForm && (
        <form onSubmit={handleRepaySubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 gap-4 grid grid-cols-1 md:grid-cols-4 font-sans text-xs">
          <div className="md:col-span-4 flex justify-between border-b pb-2 mb-1">
            <strong className="text-slate-800 font-bold">Log Credit Payment Receipt (Cashier Desk)</strong>
            <button type="button" onClick={() => setShowPayForm(false)} className="text-slate-450 hover:text-slate-700">Close X</button>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Pick Outstanding Invoice *</label>
            <select
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                const matched = creditOrders.find(o => o.id === e.target.value);
                if (matched) {
                  setPayAmount(getOrderRemainingDebt(matched.id, matched.total));
                }
              }}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
            >
              {creditOrders
                .filter(o => o.paymentStatus !== 'paid')
                .map(o => {
                  const remains = getOrderRemainingDebt(o.id, o.total);
                  return (
                    <option key={o.id} value={o.id}>
                      #{o.orderNumber} - {o.customerName} (Outs: ₱{remains.toFixed(2)})
                    </option>
                  );
                })}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Payment Cashier Amount (₱) *</label>
            <input
              type="number"
              step="0.01"
              required
              min="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(Math.max(0.01, Number(e.target.value)))}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Repaying Medium *</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
            >
              <option value="cash">💵 Banknotes / Cash</option>
              <option value="card">💳 Credit Card Terminal</option>
              <option value="mobile_pay">📱 Mobile QR Pay</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Payment Reference / Memo</label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="e.g. Receipt slip 4492"
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none text-xs"
            />
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={() => setShowPayForm(false)} className="py-1.5 bg-slate-100 hover:bg-slate-200 px-3 rounded text-slate-600">Cancel</button>
            <button type="submit" id="btn-repay-save" className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 font-bold text-white rounded">
              Record Repayment
            </button>
          </div>
        </form>
      )}

      {/* Main grids: left accounts summary, right historical repayments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans text-xs">
        {/* Unpaid credit invoices */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 border-b pb-3 mb-3 flex items-center gap-1">
            <Wallet className="w-4 h-4 text-slate-600" />
            Unpaid Customer Credit Invoices
          </h4>
          
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
            {creditOrders.length === 0 ? (
              <p className="py-6 text-slate-400 text-center">No orders have utilized credit payment options yet.</p>
            ) : (
              creditOrders.map(ord => {
                const remains = getOrderRemainingDebt(ord.id, ord.total);
                const isPaid = ord.paymentStatus === 'paid';
                return (
                  <div key={ord.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-800">#{ord.orderNumber}</strong>
                        <span className="text-slate-400 font-mono text-[9px]">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-600 font-medium">Customer: {ord.customerName}</p>
                      <p className="text-[10px] text-slate-400">Total invoice value: ₱{ord.total.toFixed(2)}</p>
                    </div>

                    <div className="text-right">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded uppercase text-[9px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Fully Paid
                        </span>
                      ) : (
                        <div>
                          <strong className="text-amber-700 font-mono block text-sm">₱{remains.toFixed(2)} Due</strong>
                          <span className={`text-[9px] uppercase font-bold py-0.2 px-1 text-[10px] rounded ${
                            ord.paymentStatus === 'partial' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Repayment payments audit log */}
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 border-b pb-3 mb-3 flex items-center gap-1">
            <History className="w-4 h-4 text-slate-600" />
            Repayments Collected audit history
          </h4>
          
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[300px]">
            {payments.length === 0 ? (
              <p className="py-6 text-slate-400 text-center">No repayment receipts logged during this cycle.</p>
            ) : (
              payments.map(pay => (
                <div key={pay.id} className="py-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 block">Received from: {pay.customerName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">Invoice Order ID: {pay.orderId.substring(0, 10)}...</span>
                    <p className="text-[10px] text-slate-500 font-mono">Ref: {pay.paymentReference} | via {pay.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <strong className="text-emerald-700 font-mono text-sm leading-none">+₱{pay.amountPaid.toFixed(2)}</strong>
                    <p className="text-[9px] text-slate-400 mt-1 font-mono">{new Date(pay.paymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
