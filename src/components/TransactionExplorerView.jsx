import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PlusCircle,
  Copy,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../api';

export default function TransactionExplorerView({
  analysisId,
  onInspectTransaction,
  onAddToCase,
}) {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [minRisk, setMinRisk] = useState(0);
  const [sortBy, setSortBy] = useState('riskScore');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchTransactions = async () => {
    if (!analysisId) return;
    setLoading(true);
    try {
      const params = {
        page: page.toString(),
        limit: '25',
        search,
        filterClass,
        minRisk: minRisk > 0 ? minRisk.toString() : '',
        sortBy,
        sortOrder,
      };
      const res = await api.getTransactions(analysisId, params);
      setTransactions(res.transactions || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [analysisId, page, filterClass, minRisk, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleExportCsv = () => {
    if (transactions.length === 0) return;
    const headers = ['Transaction_ID', 'Timestep', 'Predicted_Class', 'Actual_Class', 'Risk_Score', 'Confidence', 'In_Degree', 'Out_Degree'];
    const rows = transactions.map(t => [
      t.txId,
      t.timeStep,
      t.predictedClass,
      t.actualClass || 'N/A',
      t.riskScore,
      `${t.confidence}%`,
      t.inDegree,
      t.outDegree,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_analysis_${analysisId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-white">Transaction Node Explorer</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {total.toLocaleString()} transactions analyzed by the Graph Neural Network
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export Filtered CSV
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Search by ID */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Transaction ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </form>

          {/* Classification Filter */}
          <div>
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Classes (Licit & Suspicious)</option>
              <option value="ILLICIT">Flagged Suspicious Only (Illicit)</option>
              <option value="LICIT">Licit / Normal Flow Only</option>
              <option value="GROUND_TRUTH_ILLICIT">Ground Truth Illicit</option>
            </select>
          </div>

          {/* Min Risk Slider */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl">
            <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Min Risk</span>
                <span className="text-indigo-400 font-bold">{(minRisk * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.1"
                value={minRisk}
                onChange={(e) => {
                  setMinRisk(parseFloat(e.target.value));
                  setPage(1);
                }}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="riskScore-desc">Highest Risk Score First</option>
              <option value="riskScore-asc">Lowest Risk Score First</option>
              <option value="outDegree-desc">Highest Out-Degree (Fan-Out)</option>
              <option value="inDegree-desc">Highest In-Degree (Fan-In)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Transaction / Node ID</th>
                <th className="py-3 px-4">Step</th>
                <th className="py-3 px-4">GNN Prediction</th>
                <th className="py-3 px-4">Ground Truth</th>
                <th className="py-3 px-4">Risk Index</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Degrees (In/Out)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading filtered transaction records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No transactions match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isSuspicious = tx.predictedClass === 'Suspicious (Illicit)';
                  return (
                    <tr key={tx.txId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{tx.txId}</span>
                          <button
                            onClick={() => handleCopy(tx.txId)}
                            className="text-slate-500 hover:text-slate-300 p-0.5"
                            title="Copy ID"
                          >
                            {copiedId === tx.txId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        T-{tx.timeStep}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            isSuspicious
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isSuspicious ? (
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                          ) : (
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          )}
                          {tx.predictedClass}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {tx.actualClass === 'Illicit' ? (
                          <span className="text-rose-400 font-bold">Illicit (Known)</span>
                        ) : tx.actualClass === 'Licit' ? (
                          <span className="text-slate-400">Licit</span>
                        ) : (
                          <span className="text-slate-500">Unlabeled</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="font-bold text-slate-200">
                              {(tx.riskScore * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                tx.riskScore > 0.7
                                  ? 'bg-rose-500'
                                  : tx.riskScore > 0.4
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, tx.riskScore * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {tx.confidence}%
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {tx.inDegree} in / {tx.outDegree} out
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onInspectTransaction(tx.txId)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Inspect
                          </button>
                          <button
                            onClick={() => onAddToCase(tx.txId)}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Add to Investigation Case"
                          >
                            <PlusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>
            Page {page} of {totalPages} ({total} items)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
