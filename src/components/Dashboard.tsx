/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  Store, Users, FileText, Sparkles, Clock, Percent, ArrowUpRight 
} from 'lucide-react';
import { Branch, Order, Expense, Product, Staff } from '../types';

interface DashboardProps {
  currentStaff: Staff;
  branches: Branch[];
  orders: Order[];
  expenses: Expense[];
  products: Product[];
  currentBranchName: string;
}

export default function Dashboard({
  currentStaff,
  branches,
  orders,
  expenses,
  products,
  currentBranchName
}: DashboardProps) {
  const [metricBranch, setMetricBranch] = useState<string>('All');

  // Filter scopes helper
  const scopeOrders = useMemo(() => {
    return orders.filter(o => {
      const matchBranch = metricBranch === 'All' || o.branchName === metricBranch;
      const matchStatus = o.status === 'completed';
      return matchBranch && matchStatus;
    });
  }, [orders, metricBranch]);

  const scopeExpenses = useMemo(() => {
    return expenses.filter(e => metricBranch === 'All' || e.branchName === metricBranch);
  }, [expenses, metricBranch]);

  // Aggregate finances
  const totalSales = useMemo(() => {
    return scopeOrders.reduce((sum, o) => sum + o.total, 0);
  }, [scopeOrders]);

  const totalExpenseCost = useMemo(() => {
    return scopeExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [scopeExpenses]);

  const averageTicket = useMemo(() => {
    if (scopeOrders.length === 0) return 0;
    return totalSales / scopeOrders.length;
  }, [scopeOrders, totalSales]);

  const grossProfit = useMemo(() => {
    return Math.max(0, totalSales - totalExpenseCost);
  }, [totalSales, totalExpenseCost]);

  const totalOrdersCount = scopeOrders.length;

  // Breakdown sales per Branch
  const branchSalesData = useMemo(() => {
    const data: Record<string, { branch: string; sales: number; count: number }> = {};
    branches.forEach(b => {
      data[b.branchName] = { branch: b.branchName, sales: 0, count: 0 };
    });

    orders.filter(o => o.status === 'completed').forEach(ord => {
      if (data[ord.branchName]) {
        data[ord.branchName].sales += ord.total;
        data[ord.branchName].count += 1;
      }
    });

    return Object.values(data);
  }, [branches, orders]);

  // Top selling products inside the active scope
  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    scopeOrders.forEach(ord => {
      ord.items.forEach(it => {
        if (!counts[it.productName]) {
          counts[it.productName] = { name: it.productName, quantity: 0, revenue: 0 };
        }
        counts[it.productName].quantity += it.quantity;
        counts[it.productName].revenue += (it.quantity * it.sellingPrice);
      });
    });

    return Object.values(counts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [scopeOrders]);

  const maxBranchSales = Math.max(...branchSalesData.map(b => b.sales), 1);

  return (
    <div className="space-y-6" id="dashboard-tab-panel">
      
      {/* Scope filter header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 border border-slate-105 rounded-xl shadow-xs">
        <div>
          <h2 className="text-sm font-sans font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <Store className="w-4 h-4 text-slate-600" />
            Branch Performance Analyzer
          </h2>
          <p className="text-xs text-slate-400">Financial audits in stand-alone sandboxed models.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 font-semibold">Scope:</label>
          <select
            id="dash-branch-scope-select"
            value={metricBranch}
            onChange={(e) => setMetricBranch(e.target.value)}
            className="bg-slate-50 text-slate-700 text-xs py-1.5 px-3 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer font-medium"
          >
            <option value="All">All Branches (Consolidated)</option>
            {branches.map(b => (
              <option key={b.id} value={b.branchName}>{b.branchName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Financial Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Revenue Sales</p>
              <h3 className="text-2xl font-black text-slate-950 font-sans tracking-tight mt-1">
                ₱{totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-emerald-600">
              <span className="text-xl font-bold font-sans">₱</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.4% vs last week</span>
          </div>
        </div>

        {/* Operating Costs Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Operating Expenses</p>
              <h3 className="text-2xl font-black text-slate-950 font-sans tracking-tight mt-1">
                ₱{totalExpenseCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Includes rent, staff & bills</span>
          </div>
        </div>

        {/* Net Profit Margin Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Net Profit</p>
              <h3 className="text-2xl font-black text-slate-950 font-sans tracking-tight mt-1">
                ₱{grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-cyan-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-cyan-600 font-semibold">
            <Percent className="w-3.5 h-3.5" />
            <span>Margin: {totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>

        {/* Average Receipt value Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Ticket Size</p>
              <h3 className="text-2xl font-black text-slate-950 font-sans tracking-tight mt-1">
                ₱{averageTicket.toFixed(2)}
              </h3>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-slate-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <span>Based on {totalOrdersCount} purchases</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans text-xs">
        
        {/* SVG Sales Comparators */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs">
          <h4 className="text-sm font-bold text-slate-800 border-b pb-3 mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            Branch Sales Comparisons
          </h4>
          
          <div className="space-y-4">
            {branchSalesData.map(b => {
              const percent = (b.sales / maxBranchSales) * 100;
              return (
                <div key={b.branch} className="space-y-1.5">
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>{b.branch}</span>
                    <span className="font-mono text-slate-900">₱{b.sales.toFixed(2)} ({b.count} bills)</span>
                  </div>
                  {/* Styled metric line */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-slate-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-500 leading-relaxed mt-6">
            💡 <strong>Performance Insight:</strong> CBD branches like Makati capture high lunchtime surges. Leverage promotions at local university areas like Taft Ave during afternoons to lift average merienda tickets.
          </div>
        </div>

        {/* Top Products listed */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800 border-b pb-3 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-650" />
              Highest Demand Offerings
            </h4>

            {topProducts.length === 0 ? (
              <p className="py-12 text-center text-slate-400">No product orders completed in this scope filter.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 font-semibold">{p.name}</strong>
                      <p className="text-[10px] text-slate-400">Total portions served: {p.quantity}</p>
                    </div>
                    <div className="text-right">
                      <strong className="text-slate-900 font-mono">₱{p.revenue.toFixed(2)}</strong>
                      <span className="text-[10px] block text-emerald-600 font-bold uppercase tracking-wider">Top {idx + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {metricBranch !== 'All' && (
            <div className="border-t border-slate-100 pt-3 mt-4 text-[11px] text-slate-500">
              Currently filtering analytics exclusively for: <strong>{metricBranch}</strong>. Switch scopes at the top to aggregate numbers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
