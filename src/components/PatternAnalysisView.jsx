import React from 'react';
import {
  Share2,
  RotateCw,
  GitFork,
  Merge,
  Link,
  Layers,
  ArrowRight,
  FolderLock,
  Info,
} from 'lucide-react';

export default function PatternAnalysisView({
  patterns,
  onOpenGraphWithNode,
  onCreateCaseFromPattern,
}) {
  const getIcon = (type) => {
    switch (type) {
      case 'circular_loop':
        return RotateCw;
      case 'fan_out_smurfing':
        return GitFork;
      case 'fan_in_gathering':
        return Merge;
      case 'peeling_chain':
        return Link;
      default:
        return Layers;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Context */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-base text-white">
            Suspicious Graph Pattern Analytics ({patterns?.length || 0} Identified)
          </h3>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Graph topological heuristics combine network structural algorithms with node-level GNN attention
          to identify non-obvious illicit financial structures such as cyclic wash trading, fan-out smurfing,
          funnel consolidation, and multi-hop peeling chains.
        </p>
      </div>

      {/* Patterns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {patterns && patterns.map((p) => {
          const Icon = getIcon(p.type);
          const isCritical = p.severity === 'Critical';
          return (
            <div
              key={p.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all"
            >
              <div className="space-y-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Pattern ID: {p.id}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isCritical
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    }`}>
                      {p.severity}
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-200 mt-1">
                      Score: {(p.riskScore * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {p.description}
                </p>

                {/* Detection Logic & Source Data */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                    <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-300 font-semibold">Detection Logic:</span>
                    <span>{p.detectionLogic}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Underlying Source Fields: {p.sourceFields?.join(', ')}
                  </div>
                </div>

                {/* Involved Nodes List */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    Involved Nodes ({p.involvedNodes?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {p.involvedNodes?.map((id, idx) => (
                      <span
                        key={`${p.id}-${id}-${idx}`}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          id === p.primaryNode
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => onCreateCaseFromPattern(p)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium transition-colors flex items-center gap-1.5"
                >
                  <FolderLock className="w-3.5 h-3.5 text-indigo-400" />
                  Initiate Case
                </button>

                <button
                  onClick={() => onOpenGraphWithNode(p.primaryNode)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-semibold transition-colors flex items-center gap-1.5"
                >
                  View Subgraph in Explorer <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
