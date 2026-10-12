import React from 'react';
import { PlayCircle, Info } from 'lucide-react';

export default function Header({
  title,
  subtitle,
  activeAnalysis,
  onRunAnalysisClick,
  onOpenDisclaimer,
}) {
  return (
    <header className="px-8 py-5 border-b border-[var(--color-border-subtle)] bg-slate-950/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {subtitle || 'GNN-Powered Cryptocurrency Financial Crime Detection Platform'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Model Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-slate-300 font-medium">
            {activeAnalysis?.modelName || 'GAT (Graph Attention Network)'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono">
            Active
          </span>
        </div>

        {/* Academic Notice Trigger */}
        <button
          onClick={onOpenDisclaimer}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          title="Academic Disclaimer & Methodological Framework"
        >
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Research Notice</span>
        </button>

        {/* Run Analysis Action */}
        <button
          onClick={onRunAnalysisClick}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all transform active:scale-95"
        >
          <PlayCircle className="w-4 h-4" />
          Run GNN Inference
        </button>
      </div>
    </header>
  );
}
