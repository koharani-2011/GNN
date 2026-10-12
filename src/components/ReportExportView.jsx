import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Lock,
} from 'lucide-react';
import { api } from '../api';

export default function ReportExportView({ analysisId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!analysisId) return;
    setLoading(true);
    api.getReport(analysisId)
      .then((data) => setReport(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [analysisId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Compiling financial intelligence dossier...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-slate-400">Report data unavailable for this run.</div>;
  }

  const { reportMetadata, analysisSummary, patternsDetected, topSuspiciousTransactions } = report;

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Formal Investigation Dossier & Export
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptocurrency Financial Crime Intelligence Report
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF Dossier
        </button>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-8 shadow-2xl space-y-8 text-slate-300 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-bold uppercase tracking-widest">
              <Lock className="w-3.5 h-3.5" />
              {reportMetadata.classification}
            </div>
            <h1 className="text-2xl font-black text-white mt-2 print:text-black">
              Graph Fraud Analytics Dossier
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Automated Forensic Graph Neural Network Assessment
            </p>
          </div>

          <div className="text-right text-xs font-mono space-y-1">
            <div className="text-white font-bold print:text-black">{reportMetadata.reportId}</div>
            <div className="text-slate-400">{new Date(reportMetadata.generatedAt).toLocaleString()}</div>
          </div>
        </div>

        {/* Executive Summary Section */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider print:text-black">
            1. Executive Assessment Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 print:bg-slate-100">
              <span className="text-slate-400 text-[10px] uppercase block">Total Nodes Analyzed</span>
              <span className="text-lg font-bold text-white print:text-black">
                {analysisSummary.totalTransactions.toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 print:bg-slate-100">
              <span className="text-slate-400 text-[10px] uppercase block">Flagged Suspicious</span>
              <span className="text-lg font-bold text-rose-400">
                {analysisSummary.predictedIllicit.toLocaleString()} ({analysisSummary.suspiciousRatio}%)
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 print:bg-slate-100">
              <span className="text-slate-400 text-[10px] uppercase block">Evaluated Model</span>
              <span className="text-xs font-bold text-indigo-300 print:text-black truncate block mt-1">
                {analysisSummary.modelName}
              </span>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 print:bg-slate-100">
              <span className="text-slate-400 text-[10px] uppercase block">Mean Confidence</span>
              <span className="text-lg font-bold text-emerald-400">
                {analysisSummary.avgConfidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Detected Topologies */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider print:text-black">
            2. Identified Graph Typologies ({patternsDetected?.length || 0})
          </h3>
          <div className="space-y-2">
            {patternsDetected?.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 text-xs print:bg-slate-50"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-white print:text-black">{p.name}</span>
                  <span className="text-rose-400 font-bold">{p.severity} (Score: {(p.riskScore * 100).toFixed(0)}%)</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{p.description}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Detection rule: {p.detectionLogic} | Involved Nodes: {p.involvedNodes.length}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Flagged Transactions Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider print:text-black">
            3. Top High-Risk Flagged Nodes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-3">Node / Tx ID</th>
                  <th className="py-2 px-3">GNN Class</th>
                  <th className="py-2 px-3">Risk Index</th>
                  <th className="py-2 px-3">Confidence</th>
                  <th className="py-2 px-3">Degree</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topSuspiciousTransactions?.map((tx) => (
                  <tr key={tx.txId}>
                    <td className="py-2 px-3 text-white font-semibold print:text-black">{tx.txId}</td>
                    <td className="py-2 px-3 text-rose-400 font-bold">{tx.predictedClass}</td>
                    <td className="py-2 px-3">{(tx.riskScore * 100).toFixed(1)}%</td>
                    <td className="py-2 px-3">{tx.confidence}%</td>
                    <td className="py-2 px-3 text-slate-400">{tx.inDegree} in / {tx.outDegree} out</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal & Academic Disclaimer */}
        <div className="border-t border-slate-800 pt-6 text-[11px] text-slate-400 space-y-1.5 leading-relaxed font-mono">
          <div className="font-bold text-slate-300 uppercase">
            Mandatory Methodological & Academic Notice:
          </div>
          <p>
            {reportMetadata.academicNotice} Model predictions and topological flags are generated by deep graph
            neural network attention convolutions and structural heuristic filters. Outputs serve strictly as
            algorithmic leads for accredited financial investigators and academic researchers.
          </p>
        </div>
      </div>
    </div>
  );
}
