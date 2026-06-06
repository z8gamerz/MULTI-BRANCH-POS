/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Copy, Check, CloudLightning, HardDrive, RefreshCw, AlertTriangle, HelpCircle } from 'lucide-react';
import { isSupabaseConfigured, POSDatabase } from '../lib/supabase';
import { SUPABASE_SCHEMA_SQL } from '../lib/schemaSql';

interface SupabaseSyncPanelProps {
  onDataRefreshed: () => void;
}

export default function SupabaseSyncPanel({ onDataRefreshed }: SupabaseSyncPanelProps) {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setMessage({ type: null, text: '' });
    try {
      const res = await POSDatabase.uploadCurrentToSupabase();
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        onDataRefreshed();
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'An unexpected sync error occurred.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all temporary browser database tables back to default mock bistro data?')) {
      POSDatabase.resetToDefault();
      setMessage({ type: 'success', text: 'Browser state reset to high-quality default seeds!' });
      onDataRefreshed();
    }
  };

  return (
    <div className="space-y-6" id="supabase-sync-panel">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-980 text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight">Supabase Direct Integration Portal</h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                This POS app operates on a transparent dual-state engine. It runs in secure standalone mode in your browser while allowing instant 
                syncing & remote database backup to Supabase.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSupabaseConfigured ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SUPABASE CONNECTED
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                RUNNING IN DEMO MODE
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection & Actions Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <CloudLightning className="w-4 h-4 text-emerald-600" />
              Real-time Database Status
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              To bind your remote Supabase instance, input these variables into the app Secrets/Environment panel:
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 font-mono text-[11px] text-slate-600 space-y-2 mb-4">
              <div>
                <span className="text-cyan-700 font-semibold">VITE_SUPABASE_URL</span>=your_project_url
              </div>
              <div>
                <span className="text-cyan-700 font-semibold">VITE_SUPABASE_ANON_KEY</span>=your_anon_key
              </div>
            </div>
            
            {!isSupabaseConfigured && (
              <div className="bg-amber-50/70 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 space-y-1 mb-4">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Credentials Missing
                </p>
                <p className="text-[11px] text-amber-700">
                  No variables found. POS is currently working with high-grade local JSON tables. All POS tabs, online customer portals, order preparation, stock purchasing, and expenses are fully functional.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 mt-4">
            <button
              id="btn-sync-supabase"
              onClick={handleSyncToSupabase}
              disabled={syncing || !isSupabaseConfigured}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                isSupabaseConfigured 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              }`}
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Uploading Stock & Tables...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Push Local State to Supabase
                </>
              )}
            </button>
            <button
              id="btn-reset-pos-demo"
              onClick={handleResetDefaults}
              className="w-full py-2 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
            >
              Reset Browser Schema (Demo Seeds)
            </button>
          </div>
        </div>

        {/* Database Migration Instructions */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Setup SQL DDL Editor Schema
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Copy this compiled query and execute it inside your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-semibold">Supabase SQL Editor</a> tab. 
              This builds all 8 tables seamlessly including cross-branch references, suppliers, items tracking, and stock transfers.
            </p>
            <div className="relative">
              <pre className="bg-slate-900 text-slate-300 font-mono text-[11px] p-4 rounded-lg overflow-x-auto h-[178px] border border-slate-800">
                {SUPABASE_SCHEMA_SQL}
              </pre>
              <button
                id="btn-copy-sql"
                onClick={handleCopySql}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 hover:text-white transition-all flex items-center gap-1 text-[10px] uppercase font-semibold cursor-pointer"
                title="Copy full SQL query"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy SQL
                  </>
                )}
              </button>
            </div>
          </div>

          {message.text && (
            <div id="sync-status-msg" className={`mt-4 p-3 rounded-lg text-xs font-sans ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                : 'bg-red-50 text-red-800 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Deployment & Live Help */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 text-xs text-slate-600 space-y-3">
        <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
          <HelpCircle className="w-4 h-4 text-slate-500" />
          How do the dual states synchronize?
        </h4>
        <ul className="list-disc pl-5 space-y-1.5 leading-relaxed text-slate-500">
          <li><strong>Out of the Box Mode</strong>: The application initializes with offline bistro mock tables. All operations (creating bills, making stock transfers, receiving inventory) write directly into localized mock databases so that the interface works immediately without external friction.</li>
          <li><strong>Supabase Handshake Mode</strong>: When you load the two secret keys in the environment, the app establishes active integrations. For security and safety, reading will fallback gracefully if any table hasn't been created yet.</li>
          <li><strong>Foreign Key Cascades</strong>: Our tables are tightly structured with foreign keys. For example, adding products in a branch requires database records of that branch and category name. Copy-pasting the full SQL setups solves this block natively.</li>
        </ul>
      </div>
    </div>
  );
}
