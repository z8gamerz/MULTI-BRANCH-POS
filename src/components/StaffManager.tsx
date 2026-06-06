/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, User, ShieldAlert, CheckCircle, Mail, MapPin } from 'lucide-react';
import { Staff, Branch } from '../types';

interface StaffManagerProps {
  staffList: Staff[];
  branches: Branch[];
  onAddStaff: (newStaff: Staff) => void;
  onDeleteStaff: (id: string) => void;
}

export default function StaffManager({
  staffList,
  branches,
  onAddStaff,
  onDeleteStaff
}: StaffManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'cashier'>('cashier');
  const [branchName, setBranchName] = useState('All');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim()) return;

    const isDuplicate = staffList.some(s => s.email.toLowerCase() === email.trim().toLowerCase());
    if (isDuplicate) {
      alert('A staff profile with this email address already exists.');
      return;
    }

    const newStaffObj: Staff = {
      id: `st-add-${Date.now()}`,
      email: email.trim().toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      branchName: role === 'owner' ? 'All' : branchName
    };

    onAddStaff(newStaffObj);

    // Reset fields
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('cashier');
    setBranchName('All');
    setShowForm(false);
  };

  return (
    <div className="space-y-6" id="staff-manager-panel">
      {/* Overview stats and title */}
      <div className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-xl shadow-xs">
        <div>
          <h3 className="text-sm font-sans font-bold text-slate-800 uppercase tracking-wider">Branch Staff & Roles Directory</h3>
          <p className="text-xs text-slate-400">Review staff positions, roles, and branch designations.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="py-1.5 px-3 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      {/* Corporate Adder Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 gap-4 grid grid-cols-1 md:grid-cols-4 font-sans text-xs">
          <div className="md:col-span-4 flex justify-between border-b pb-2 mb-1">
            <strong className="text-slate-800 font-bold">Register New Staff Member Account</strong>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-450 hover:text-slate-700">Close X</button>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">First Name *</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Marie"
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Last Name *</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Curie"
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Corporate Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="marie.curie@bistro.com"
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Operational Role *</label>
            <select
              value={role}
              onChange={(e) => {
                const nextRole = e.target.value as any;
                setRole(nextRole);
                if (nextRole === 'owner') setBranchName('All');
              }}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none cursor-pointer"
            >
              <option value="cashier">Cashier (Registers orders)</option>
              <option value="admin">Branch Admin (Registers products/stock)</option>
              <option value="owner">Enterprise Owner (Global access)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1 uppercase text-[10px]">Designated Branch Location *</label>
            <select
              value={branchName}
              disabled={role === 'owner'}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border rounded outline-none disabled:bg-slate-100 disabled:cursor-not-allowed cursor-pointer"
            >
              <option value="All">All Locations (Global Access)</option>
              {branches.map(br => (
                <option key={br.id} value={br.branchName}>{br.branchName}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex items-center pt-2 text-[10px] text-slate-500">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mr-1.5" />
            <span>
              Owners & Admins can switch branch views. Cashiers are locked into their assigned branch terminal.
            </span>
          </div>

          <div className="md:col-span-4 flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setShowForm(false)} className="py-1.5 bg-slate-100 hover:bg-slate-200 px-3 rounded text-slate-600">Cancel</button>
            <button type="submit" id="btn-staff-save" className="py-1.5 px-4 bg-slate-900 hover:bg-slate-800 font-bold text-white rounded">
              Register Credentials
            </button>
          </div>
        </form>
      )}

      {/* Employees Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {staffList.map(st => (
          <div key={st.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b pb-2 mb-3">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                    {st.firstName} {st.lastName}
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Id: {st.id}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-500">{st.email}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Venue scope: <strong className="text-slate-800">{st.branchName}</strong></span>
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full">
                    {st.role} Position
                  </span>
                </div>
              </div>
            </div>

            {/* Block Deletions of Owner to avoid lockdown lockouts */}
            {st.role !== 'owner' && (
              <div className="mt-4 pt-3 border-t/50 border-dashed text-right">
                <button
                  onClick={() => {
                    if (confirm(`Remove staff privileges for ${st.firstName}?`)) {
                      onDeleteStaff(st.id);
                    }
                  }}
                  className="text-[10px] text-red-500 hover:text-red-700 underline font-semibold cursor-pointer"
                >
                  Terminate privileges
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
