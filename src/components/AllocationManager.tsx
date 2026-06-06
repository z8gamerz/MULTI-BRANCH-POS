/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeftRight, HelpCircle, AlertCircle, Plus, CheckCircle, XCircle } from 'lucide-react';
import { Branch, StockAllocation, Product } from '../types';

interface AllocationManagerProps {
  branches: Branch[];
  products: Product[];
  allocations: StockAllocation[];
  onAddAllocation: (newAlloc: StockAllocation) => void;
  onApproveAllocation: (allocId: string, fromBranch: string, toBranch: string, productTxt: string, qty: number) => void;
  onCancelAllocation: (allocId: string) => void;
}

export default function AllocationManager({
  branches,
  products,
  allocations,
  onAddAllocation,
  onApproveAllocation,
  onCancelAllocation
}: AllocationManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [fromBranch, setFromBranch] = useState(branches[0]?.branchName || '');
  const [toBranch, setToBranch] = useState(branches[1]?.branchName || '');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(10);

  // Sync state values when branches arrive after mounting delay
  React.useEffect(() => {
    if (!fromBranch && branches.length > 0) {
      setFromBranch(branches[0].branchName);
    }
    if (!toBranch && branches.length > 1) {
      setToBranch(branches[1].branchName);
    } else if (!toBranch && branches.length > 0) {
      setToBranch(branches[0].branchName);
    }
  }, [branches, fromBranch, toBranch]);

  // Filter products belonging to 'fromBranch' to choose from
  const sourceProducts = products.filter(p => p.branch === fromBranch && p.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromBranch === toBranch) {
      alert('Source and Destination branch locations must write different values.');
      return;
    }
    if (!productName) {
      alert('Please select a product of the source branch.');
      return;
    }

    const valQty = Number(quantity);
    if (valQty <= 0) {
      alert('Quantity must be greater than zero.');
      return;
    }

    // Check if source branch has enough quantity
    const matchedP = products.find(p => p.branch === fromBranch && p.productName === productName);
    if (!matchedP || matchedP.quantity < valQty) {
      alert(`Insufficient stock! ${fromBranch} only has ${matchedP ? matchedP.quantity : 0} units of ${productName}.`);
      return;
    }

    const newAlloc: StockAllocation = {
      id: `all-add-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      fromBranch,
      toBranch,
      productName,
      quantity: valQty,
      status: 'pending'
    };

    onAddAllocation(newAlloc);

    // reset fields
    setQuantity(10);
    setShowForm(false);
    alert('Stock transfer filed successfully. It is flagged as PENDING. Admins or Owners must approve the transfer to complete stock balance adjustments.');
  };

  return (
    <div className="space-y-6" id="allocation-manager-panel">
      {/* Title block */}
      <div className="flex justify-between items-center bg-white p-4 border border-slate-105 rounded-xl shadow-xs">
        <div>
          <h3 className="text-sm font-sans font-bold text-slate-800 uppercase tracking-wider">Branch Stock Allocations</h3>
          <p className="text-xs text-slate-400">Dispatch and receive stock quantities between branches securely.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            // Autofill product logic
            if (sourceProducts.length > 0 && !productName) {
              setProductName(sourceProducts[0].productName);
            }
          }}
          className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Transfer Stock
        </button>
      </div>

      {/* Stock Transfer creation form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 gap-4 grid grid-cols-1 md:grid-cols-4 font-sans text-xs">
          <div className="md:col-span-4 flex justify-between border-b pb-2 mb-1">
            <strong className="text-slate-800 font-bold">New Inter-Branch Stock Allocation Order</strong>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">Close X</button>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Source Branch (From) *</label>
            <select
              value={fromBranch}
              onChange={(e) => {
                setFromBranch(e.target.value);
                setProductName(''); // Clear product choice
              }}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
            >
              {branches.map(br => (
                <option key={br.id} value={br.branchName}>{br.branchName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Select Product to Transfer *</label>
            <select
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer text-xs"
            >
              <option value="">-- Choose Product --</option>
              {sourceProducts.map(p => (
                <option key={p.id} value={p.productName}>
                  {p.productName} (In-stock: {p.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Qty to Send *</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Destination Branch (To) *</label>
            <select
              value={toBranch}
              onChange={(e) => setToBranch(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
            >
              {branches.map(br => (
                <option key={br.id} value={br.branchName}>{br.branchName}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center pt-2 text-[10px] text-slate-500">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mr-1.5" />
            <span>
              Real-time calculations: Once approved, the software deducts the transfer quantities from the source stock and adds them to target catalog balances.
            </span>
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={() => setShowForm(false)} className="py-1.5 bg-slate-100 hover:bg-slate-200 px-3 rounded text-slate-600">Cancel</button>
            <button type="submit" id="btn-allocation-save" className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 font-bold text-white rounded">
              Issue Transfer Cargo
            </button>
          </div>
        </form>
      )}

      {/* History Ledger list */}
      <div className="bg-white border border-slate-150 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
              <th className="p-3">File Date</th>
              <th className="p-3">From Branch (Source)</th>
              <th className="p-3">Transfer Product Card</th>
              <th className="p-3">Transfer Qty</th>
              <th className="p-3">To Branch (Destination)</th>
              <th className="p-3">Stage Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-sans">
            {allocations.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-slate-400" colSpan={7}>
                  No stock allocations processed yet. Use the header button to file inter-branch relocations.
                </td>
              </tr>
            ) : (
              allocations.map(alloc => {
                const isPending = alloc.status === 'pending';
                return (
                  <tr key={alloc.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold font-mono text-slate-500">{alloc.date}</td>
                    <td className="p-3 font-bold text-slate-700">{alloc.fromBranch}</td>
                    <td className="p-3 text-slate-800 font-semibold">{alloc.productName}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{alloc.quantity} Units</td>
                    <td className="p-3 font-bold text-slate-700">{alloc.toBranch}</td>
                    <td className="p-3">
                      <span className={`px-20 px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        alloc.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : alloc.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border border-red-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                      }`}>
                        {alloc.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {isPending ? (
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => {
                              if (confirm(`Approve this transfer of ${alloc.quantity} units of ${alloc.productName} to ${alloc.toBranch}?`)) {
                                onApproveAllocation(alloc.id, alloc.fromBranch, alloc.toBranch, alloc.productName, alloc.quantity);
                              }
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded flex items-center gap-0.5 cursor-pointer"
                            title="Approve Cargo Balance update"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Discard this transfer order?`)) {
                                onCancelAllocation(alloc.id);
                              }
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded flex items-center gap-0.5 cursor-pointer"
                            title="Reject & Cancel transfer"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">Processed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Auxiliary explanation block */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-xs text-slate-600">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-slate-800">Need to balance menu offerings?</h4>
          <p className="text-slate-500 mt-1 leading-relaxed">
            If a popular dish like the "Truffle Burger" sells out at Northside but remains abundantly stocked Downtown, cashiers can quickly log a stock transfer. Once approved by an Admin or Owner, the balances update instantly across locations.
          </p>
        </div>
      </div>
    </div>
  );
}
