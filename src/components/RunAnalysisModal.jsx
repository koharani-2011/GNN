import React, { useState } from 'react';
import {
  PlayCircle,
  X,
  Layers,
  Cpu,
  Sparkles,
  Activity,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { api } from '../api';

export default function RunAnalysisModal({
  isOpen,
  onClose,
  datasets,
  preselectedDataset,
  onAnalysisSuccess,
}) {
  const [selectedDatasetId, setSelectedDatasetId] = useState(
    preselectedDataset?.id || datasets?.[0]?.id || ''
  );
  const [selectedModel, setSelectedModel] = useState('GAT (Graph Attention Network)');
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDatasetId) {
      setError('Please select a dataset to analyze');
      return;
    }
    setRunning(true);
    setError('');
    try {
      const res = await api.runAnalysis(selectedDatasetId, selectedModel);
      onAnalysisSuccess(res.analysis);
      onClose();
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setRunning(false);
    }
  };

  const models = [
    {
      id: 'GAT (Graph Attention Network)',
      name: 'Graph Attention Network (GAT)',
      description: 'Dynamic edge attention coefficients α_ij with 8 multi-head channels. Best for detecting smurfing and money laundering hubs.',
      badge: 'Recommended',
    },
    {
      id: 'EvolveGCN',
      name: 'EvolveGCN (Temporal GNN)',
      description: 'Uses GRU recurrent units to evolve GCN weight matrices W_t across discrete temporal timesteps.',
      badge: 'Temporal',
    },
    {
      id: 'GraphSAGE',
      name: 'GraphSAGE (Inductive Aggregator)',
      description: 'Neighborhood mean aggregation with feature concatenation. Generalizes well to unseen nodes.',
      badge: 'Inductive',
    },
    {
      id: 'GCN Baseline',
      name: 'GCN (Kipf & Welling Baseline)',
      description: 'First-order spectral graph convolution with symmetric normalized Laplacian adjacency.',
      badge: 'Baseline',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Execute GNN Graph Inference</h3>
              <p className="text-xs text-slate-400">Run graph convolution model over transaction topology</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300">
              {error}
            </div>
          )}

          {/* Dataset Selector */}
          <div>
            <label className="text-slate-400 uppercase font-mono text-[10px] block mb-1.5 font-semibold">
              Target Investigation Dataset
            </label>
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl text-xs text-white p-2.5 focus:outline-none focus:border-indigo-500 font-mono"
            >
              {datasets && datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.totalRecords.toLocaleString()} nodes)
                </option>
              ))}
            </select>
          </div>

          {/* Model Architecture Selector */}
          <div>
            <label className="text-slate-400 uppercase font-mono text-[10px] block mb-2 font-semibold">
              GNN Architecture Configuration
            </label>
            <div className="space-y-2">
              {models.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/60 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs">{m.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        m.badge === 'Recommended'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{m.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[10px] text-slate-400">
            <span>Hidden Channels: 64</span>
            <span>Dropout: 0.5</span>
            <span>Weight Decay: 5e-4</span>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={running}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {running ? (
                <>
                  <Activity className="w-4 h-4 animate-spin-slow" />
                  Running Attention Convolutions...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Initiate Analysis
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
