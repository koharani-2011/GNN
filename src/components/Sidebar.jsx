import React from 'react';
import {
  LayoutDashboard,
  Database,
  TableProperties,
  Network,
  Share2,
  FolderLock,
  BarChart3,
  FileText,
  ShieldAlert,
  Shield,
  Layers,
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  currentUser,
  analyses,
  currentAnalysisId,
  setCurrentAnalysisId,
  onOpenLogin,
}) {
  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Dataset Hub & Upload', icon: Database },
    { id: 'transactions', label: 'Transaction Explorer', icon: TableProperties },
    { id: 'graph', label: 'Interactive Graph Explorer', icon: Network },
    { id: 'patterns', label: 'Suspicious Graph Patterns', icon: Share2 },
    { id: 'cases', label: 'Investigation Cases', icon: FolderLock },
    { id: 'evaluation', label: 'Model Evaluation & Metrics', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Export Dossier', icon: FileText },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ id: 'audit', label: 'System Audit Logs', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 bg-[var(--color-bg-sidebar)] border-r border-[var(--color-border-subtle)] flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[var(--color-border-subtle)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Network className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white tracking-tight leading-none">
              Graph Fraud
            </h1>
            <span className="text-[11px] font-medium text-indigo-400 tracking-wider uppercase">
              Analytics GNN
            </span>
          </div>
        </div>

        {/* Active Analysis Selector */}
        <div className="px-4 py-3 border-b border-[var(--color-border-subtle)] bg-slate-900/40">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-indigo-400" />
            Active Investigation Run
          </label>
          <select
            value={currentAnalysisId || ''}
            onChange={(e) => setCurrentAnalysisId(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            {analyses && analyses.length > 0 ? (
              analyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.datasetName.length > 22 ? a.datasetName.slice(0, 20) + '...' : a.datasetName}
                </option>
              ))
            ) : (
              <option value="">No Active Runs</option>
            )}
          </select>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User & Role Footer */}
      <div className="p-4 border-t border-[var(--color-border-subtle)] bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
              {currentUser?.fullName?.charAt(0) || 'I'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.fullName || 'Investigator'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${currentUser?.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  {currentUser?.role || 'Guest'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onOpenLogin}
            title="Switch User / Login"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
