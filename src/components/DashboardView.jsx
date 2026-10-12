import React from 'react';
import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Share2,
  Network,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardView({
  analysis,
  patterns,
  onNavigate,
  onOpenAnalysisModal,
}) {
  if (!analysis) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Activity className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin-slow" />
        <h3 className="text-lg font-semibold text-white">Loading Investigation Metrics...</h3>
        <p className="text-xs mt-1">Ingesting graph topology and running GNN inference...</p>
      </div>
    );
  }

  const {
    totalTransactions,
    predictedLicit,
    predictedIllicit,
    suspiciousRatio,
    avgConfidence,
    graphDensity,
    timeSeries,
    datasetName,
    modelName,
  } = analysis;

  const pieData = [
    { name: 'Licit Transactions', value: predictedLicit },
    { name: 'Flagged Illicit / Suspicious', value: predictedIllicit },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Dataset Context */}
      <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
              Active Investigation Dossier
            </span>
            <span className="text-xs text-slate-400">ID: {analysis.id}</span>
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">{datasetName}</h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Temporal graph neural network analysis completed using{' '}
            <strong className="text-indigo-400">{modelName}</strong>. Dynamic attention
            coefficients and neighborhood topological structural patterns evaluated across{' '}
            {totalTransactions.toLocaleString()} nodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('graph')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-all"
          >
            <Network className="w-4 h-4 text-indigo-400" />
            Explore Graph Topology
          </button>
          <button
            onClick={() => onNavigate('transactions')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            Inspect Flagged Transactions
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Nodes */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Nodes Analyzed</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {totalTransactions.toLocaleString()}
          </div>
          <div className="text-[11px] text-indigo-400 mt-2 flex items-center gap-1 font-mono">
            Graph density: {graphDensity}
          </div>
        </div>

        {/* Flagged Illicit */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-900/40 rounded-2xl p-5 shadow-lg transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Flagged Suspicious</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 tracking-tight">
            {predictedIllicit.toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-300 mt-2 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            {suspiciousRatio}% of entire graph volume
          </div>
        </div>

        {/* Licit Safe */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-900/40 rounded-2xl p-5 shadow-lg transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Compliant / Licit</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            {predictedLicit.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-300 mt-2 flex items-center gap-1 font-mono">
            {((predictedLicit / (totalTransactions || 1)) * 100).toFixed(1)}% verified normal flow
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Model Calibration</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {avgConfidence}%
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
            Mean softmax probability
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temporal Evolution Chart */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-white">Temporal Fraud Evolution Over Timesteps</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Tracking total volume against GNN-detected suspicious transactions
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Discrete Timesteps
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIllicit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="transactions" stroke="#6366f1" fillOpacity={1} fill="url(#gradTotal)" name="Total Transactions" />
                <Area type="monotone" dataKey="illicit" stroke="#ef4444" fillOpacity={1} fill="url(#gradIllicit)" name="Suspicious (GNN)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Distribution Pie */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-sm text-white">Class Proportions</h4>
            <p className="text-xs text-slate-400 mt-0.5">Licit vs Suspicious imbalance</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ color: '#94a3b8', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center font-mono">
            Severe real-world class imbalance handled via weighted attention loss
          </div>
        </div>
      </div>

      {/* Detected Graph Topological Patterns Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-base text-white">
              Detected Suspicious Topological Patterns ({patterns?.length || 0})
            </h4>
          </div>
          <button
            onClick={() => onNavigate('patterns')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View All Pattern Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {patterns && patterns.slice(0, 3).map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 shadow-lg transition-all hover:-translate-y-0.5 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                    p.severity === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {p.severity} Risk
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    Risk: {(p.riskScore * 100).toFixed(0)}%
                  </span>
                </div>
                <h5 className="font-bold text-sm text-white">{p.name}</h5>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  {p.involvedNodes.length} nodes involved
                </span>
                <button
                  onClick={() => onNavigate('graph', { rootNode: p.primaryNode })}
                  className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  Locate in Graph <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
