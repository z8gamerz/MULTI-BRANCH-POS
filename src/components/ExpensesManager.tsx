/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Plus, DollarSign, BarChart2, Briefcase, Calendar, Info } from 'lucide-react';
import { Branch, Expense } from '../types';

interface ExpensesManagerProps {
  branches: Branch[];
  expenses: Expense[];
  onAddExpense: (newExp: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const EXPENSE_CATEGORIES = ['Utilities', 'Rent', 'Staff Wages', 'Marketing', 'Ingredients', 'Equipment', 'Waste Log', 'Miscellaneous'];

export default function ExpensesManager({
  branches,
  expenses,
  onAddExpense,
  onDeleteExpense
}: ExpensesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [branchName, setBranchName] = useState(branches[0]?.branchName || '');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);

  const topCategory = useMemo(() => {
    if (expenses.length === 0) return 'None';
    const totals = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'None';
  }, [expenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valAmt = Number(amount);
    if (!branchName || !description.trim() || valAmt <= 0) {
      alert('Please fill out all required fields with an amount greater than ₱0.');
      return;
    }

    const newExpense: Expense = {
      id: `exp-add-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      branchName,
      category,
      description: description.trim(),
      amount: valAmt
    };

    onAddExpense(newExpense);

    // Reset fields
    setDescription('');
    setAmount(0);
    setShowForm(false);
    alert('Operating expense filed successfully!');
  };

  // Profit vs loss helper calculations
  const totalExpenditure = expenses.reduce((acc, x) => acc + x.amount, 0);

  return (
    <div className="space-y-6" id="expenses-manager-panel">
      {/* Visual KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Operations Spent</p>
          <h3 className="text-xl font-extrabold text-red-600 font-sans mt-1">
            ₱{totalExpenditure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <span className="text-[10px] text-slate-400">Aggregated across all branches</span>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Expenditure Category</p>
          <h3 className="text-xl font-bold text-slate-800 font-sans mt-1">
            {topCategory}
          </h3>
          <span className="text-[10px] text-slate-400">Primary operational sink</span>
        </div>

        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expense Vouchers Logged</p>
          <h3 className="text-xl font-extrabold text-slate-800 font-sans mt-1">{expenses.length} Invoices</h3>
          <span className="text-[10px] text-slate-400">Total processed accounts</span>
        </div>
      </div>

      {/* Title & Trigger block */}
      <div className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-xl shadow-xs">
        <div>
          <h3 className="text-sm font-sans font-bold text-slate-800 uppercase tracking-wider">Operations Expenditure Audit</h3>
          <p className="text-xs text-slate-400">File general expenditures like rent, utilities, ingredient costs, and employee wages.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Log Expense
        </button>
      </div>

      {/* Log Expense Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 gap-4 grid grid-cols-1 md:grid-cols-4 font-sans text-xs">
          <div className="md:col-span-4 flex justify-between border-b pb-2 mb-1">
            <strong className="text-slate-800 font-bold">Write Incident Operations Expenditure</strong>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">Close X</button>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Charging Branch *</label>
            <select
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
            >
              {branches.map(br => (
                <option key={br.id} value={br.branchName}>{br.branchName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Expenditure Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Incident Description *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Electric bill for ovens Downtown"
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Invoice Cost (₱ Amount) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount || ''}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none text-xs"
            />
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={() => setShowForm(false)} className="py-1.5 bg-slate-100 hover:bg-slate-200 px-3 rounded text-slate-600">Cancel</button>
            <button type="submit" id="btn-expense-save" className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 font-bold text-white rounded">
              Log Incident Record
            </button>
          </div>
        </form>
      )}

      {/* Expenses list ledger */}
      <div className="bg-white border border-slate-150 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-bold text-[9px] tracking-wider">
              <th className="p-3">Incident Date</th>
              <th className="p-3">Charged Location</th>
              <th className="p-3">Expenditure Category</th>
              <th className="p-3">Audit Details / Description</th>
              <th className="p-3 text-right">Debit Charge (₱)</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-sans">
            {expenses.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-slate-400" colSpan={6}>
                  No incident expenses logged during this audit cycle.
                </td>
              </tr>
            ) : (
              expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold font-mono text-slate-500">{exp.date}</td>
                  <td className="p-3 font-bold text-slate-700">{exp.branchName}</td>
                  <td className="p-3 font-semibold text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-sans uppercase text-[9px]">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 italic font-medium">"{exp.description}"</td>
                  <td className="p-3 font-mono font-bold text-red-600 text-right">-₱{exp.amount.toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove custom charge of ₱${exp.amount}?`)) {
                          onDeleteExpense(exp.id);
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
