import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Network,
  Share2,
  FolderLock,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { api } from '../api';

export default function TransactionDetailModal({
  analysisId,
  txId,
  isOpen,
  onClose,
  onOpenGraphWithNode,
  onAddToCase,
  cases,
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [caseSuccess, setCaseSuccess] = useState('');

  useEffect(() => {
    if (!analysisId || !txId || !isOpen) return;
    setLoading(true);
    setDetails(null);
    setCaseSuccess('');
    api.getTransactionDetails(analysisId, txId)
      .then((data) => {
        setDetails(data);
      })
      .catch((err) => {
        console.error('Failed to load transaction details:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [analysisId, txId, isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(txId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkCase = async () => {
    if (!selectedCaseId) return;
    try {
      await api.linkCaseTransaction(selectedCaseId, txId);
      setCaseSuccess('Successfully attached transaction to investigation dossier.');
      setTimeout(() => setCaseSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const tx = details?.transaction;
  const neighborhood = details?.neighborhood;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              tx?.predictedClass === 'Suspicious (Illicit)'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Node Details
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Timestep {tx?.timeStep || 40}
                </span>
              </div>
              <h3 className="font-bold text-base text-white font-mono flex items-center gap-2">
                <span>{txId}</span>
                <button
                  onClick={handleCopy}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                  title="Copy ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              Retrieving node feature matrix and topological neighborhood...
            </div>
          ) : !tx ? (
            <div className="py-16 text-center text-slate-400">Transaction record not found.</div>
          ) : (
            <>
              {/* Classification & Risk Score Gauge */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    Model Classification
                  </span>
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    {tx.predictedClass === 'Suspicious (Illicit)' ? (
                      <span className="text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" /> Suspicious (Illicit)
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Licit Flow
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Ground truth: {tx.actualClass || 'Unlabeled'}
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    GAT Attention Risk Score
                  </span>
                  <div className="text-2xl font-extrabold text-white font-mono">
                    {(tx.riskScore * 100).toFixed(1)}%
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${tx.riskScore > 0.6 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${tx.riskScore * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                    Confidence Calibration
                  </span>
                  <div className="text-2xl font-extrabold text-indigo-400 font-mono">
                    {tx.confidence}%
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Decision boundary margin
                  </div>
                </div>
              </div>

              {/* Explainability Breakdown */}
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <Info className="w-4 h-4 text-indigo-400" />
                  GNN Explainability & Topological Risk Rationale
                </div>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {tx.explanation}
                </p>
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider block">
                    Detected Graph Risk Signals:
                  </span>
                  {tx.signals && tx.signals.map((sig, i) => (
                    <div key={i} className="flex items-center gap-2 text-slate-300 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graph Neighborhood */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-indigo-400" />
                    1-Hop Topological Neighborhood ({neighborhood?.connectedTransactions?.length || 0} Adjacent Nodes)
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGraphWithNode(txId);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    View Ego Network in Graph <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Incoming Feeders</div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {neighborhood?.incomingCount || 0} edges
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px] uppercase">Outgoing Disbursements</div>
                    <div className="text-lg font-bold text-white mt-0.5">
                      {neighborhood?.outgoingCount || 0} edges
                    </div>
                  </div>
                </div>

                {neighborhood?.connectedTransactions && neighborhood.connectedTransactions.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pt-2">
                    {neighborhood.connectedTransactions.map((c) => (
                      <div
                        key={c.txId}
                        className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-slate-300 truncate max-w-[200px]">{c.txId}</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-mono font-bold ${
                            c.predictedClass === 'Suspicious (Illicit)' ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {c.predictedClass}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px]">
                            Risk: {(c.riskScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Raw Features Table */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider block">
                  Extracted Numerical Feature Values
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  {Object.entries(tx.features || {}).map(([key, val]) => (
                    <div key={key} className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-400 truncate block">{key}</span>
                      <span className="text-white font-bold">{typeof val === 'number' ? val.toFixed(4) : val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attach to Investigation Case */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
                <span className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FolderLock className="w-4 h-4 text-indigo-400" />
                  Attach Node to Investigation Dossier
                </span>
                {caseSuccess && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{caseSuccess}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Investigation Case...</option>
                    {cases && cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.caseNumber} - {c.title}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleLinkCase}
                    disabled={!selectedCaseId}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-40"
                  >
                    Attach Node
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
