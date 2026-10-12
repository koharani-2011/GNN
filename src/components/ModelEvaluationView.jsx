import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Info,
  Scale,
  TrendingUp,
  Target,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function ModelEvaluationView({ analysis }) {
  if (!analysis) {
    return <div className="p-8 text-center text-slate-400">No active analysis selected.</div>;
  }

  const { hasGroundTruth, metrics, modelName, datasetName } = analysis;
  const cm = metrics?.confusionMatrix;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">
              GNN Model Evaluation & Imbalance Metrics
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            Model: {modelName}
          </span>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Fraud detection datasets exhibit severe natural class imbalance (~9:1 ratio). In financial crime research,
          traditional accuracy is misleading. Evaluation relies on <strong>Precision</strong>, <strong>Recall</strong>,
          <strong>F1-Score</strong>, and <strong>PR-AUC</strong>.
        </p>
      </div>

      {!hasGroundTruth || !metrics ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center text-xs text-amber-200 space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="font-bold text-sm text-amber-300">Ground-Truth Labels Unavailable</h4>
          <p className="max-w-xl mx-auto leading-relaxed">
            The currently selected dataset consists of unseen, unlabeled transaction records. Model evaluation
            metrics (Precision, Recall, F1, Confusion Matrix) cannot be calculated without verified ground-truth labels.
            To view verified metrics, select the <strong>Elliptic Bitcoin Timestep 40 Benchmark</strong> from the active investigation selector.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                F1-Score (Primary Metric)
              </span>
              <div className="text-3xl font-extrabold text-indigo-400 font-mono">
                {(metrics.f1Score * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400">
                Harmonic mean of precision & recall on illicit class
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Illicit Detection Precision
              </span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {(metrics.precision * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400">
                Ratio of true illicit among all flagged transactions
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Illicit Recall (Sensitivity)
              </span>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                {(metrics.recall * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400">
                Coverage of actual money laundering transactions caught
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                ROC-AUC / PR-AUC
              </span>
              <div className="text-3xl font-extrabold text-cyan-400 font-mono">
                {(metrics.rocAuc * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                PR-AUC: {(metrics.prAuc * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Confusion Matrix Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  Empirical Confusion Matrix
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  Total Labeled: {((cm?.tp || 0) + (cm?.fp || 0) + (cm?.tn || 0) + (cm?.fn || 0)).toLocaleString()}
                </span>
              </div>

              {/* 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
                {/* TP */}
                <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider block">
                    True Positives (TP)
                  </span>
                  <div className="text-2xl font-black text-rose-400">
                    {cm?.tp?.toLocaleString() || 0}
                  </div>
                  <span className="text-[10px] text-slate-400">Correctly Flagged Illicit</span>
                </div>

                {/* FP */}
                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                    False Positives (FP)
                  </span>
                  <div className="text-2xl font-black text-amber-400">
                    {cm?.fp?.toLocaleString() || 0}
                  </div>
                  <span className="text-[10px] text-slate-400">Licit Misflagged as Illicit</span>
                </div>

                {/* FN */}
                <div className="p-5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    False Negatives (FN)
                  </span>
                  <div className="text-2xl font-black text-slate-300">
                    {cm?.fn?.toLocaleString() || 0}
                  </div>
                  <span className="text-[10px] text-slate-400">Undetected Illicit Leakage</span>
                </div>

                {/* TN */}
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1">
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                    True Negatives (TN)
                  </span>
                  <div className="text-2xl font-black text-emerald-400">
                    {cm?.tn?.toLocaleString() || 0}
                  </div>
                  <span className="text-[10px] text-slate-400">Correctly Verified Licit</span>
                </div>
              </div>
            </div>

            {/* Academic Defense & Viva Q&A Guide */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Academic BE CSE Project Notes & Viva Defense
              </h4>

              <div className="space-y-3 text-slate-300 leading-relaxed">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-indigo-300 font-semibold block">
                    Why Graph Attention Networks (GAT) Outperform Standard Tabular ML:
                  </strong>
                  <p className="text-[11px] text-slate-400">
                    Tabular ML models (Random Forests, Logistic Regression) treat transactions as isolated points. GAT
                    learns parameterized self-attention weights α_ij over transaction graph edges, enabling
                    the network to dynamically weigh high-risk neighboring flows while filtering legitimate noise.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-indigo-300 font-semibold block">
                    Handling Extreme Class Imbalance:
                  </strong>
                  <p className="text-[11px] text-slate-400">
                    In the Elliptic dataset, illicit transactions constitute only ~9.8% of total volume. We utilize
                    weighted cross-entropy loss and track Precision-Recall AUC (PR-AUC) rather than raw classification
                    accuracy to guarantee operational investigative reliability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
