import React from 'react';
import { ShieldAlert, X, BookOpen, Scale, Award } from 'lucide-react';

export default function AcademicNoticeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Academic & Methodological Governance Notice
              </h3>
              <p className="text-[11px] text-slate-400">BE Computer Science & Engineering Final-Year Project</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Project Title & Objectives:</span>
            <p className="text-slate-400">
              <strong>Graph Fraud Analysis – Financial Fraud Detection Using Graph Neural Networks (GNN)</strong>.
              Designed to explore temporal graph neural networks (GAT, EvolveGCN) applied to cryptocurrency transaction
              relational structures and topology-aware suspicious pattern mining.
            </p>
          </div>

          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1 text-rose-200">
            <span className="font-bold block text-rose-300">Mandatory Investigative & Evidential Disclaimer:</span>
            <p className="text-[11px]">
              This system does <strong>not</strong> establish that a transaction or identity is criminally fraudulent.
              Graph Neural Network classification outputs and topological heuristics provide algorithmic leads
              to guide investigative focus. Formal attribution requires legal subpoenas, verified KYC exchanges,
              and comprehensive off-chain corroboration.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Benchmark Dataset Citation:</span>
            <p className="text-slate-400 text-[11px]">
              Trained and evaluated on the <em>Elliptic Bitcoin Dataset</em> (Weber et al., 2019), consisting of over
              200,000 Bitcoin transactions mapped across 49 discrete time steps with 165 local and aggregate features.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs"
          >
            I Understand & Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
