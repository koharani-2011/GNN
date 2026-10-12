import React from 'react';
import { Activity, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function DashboardResults({ analysisData, onReset }) {
  if (!analysisData) return null;

  return (
    <div className="animate-[fadeIn_0.6s_ease-out]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Analysis Results: <span className="text-text-muted">{analysisData.filename}</span></h2>
        <button onClick={onReset} className="bg-transparent border border-border-subtle text-white py-2 px-4 rounded-lg font-semibold cursor-pointer transition-all duration-200 hover:bg-white/5">Upload New File</button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 animate-[fadeIn_0.8s_ease-out]">
        <div className="bg-bg-card backdrop-blur-md border border-border-subtle rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1 hover:border-white/15 flex flex-col gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider font-medium">Total Nodes Analysed</span>
          <span className="text-4xl font-bold text-text-main">{analysisData.total_nodes.toLocaleString()}</span>
          <span className="text-primary text-xs flex items-center gap-1"><Activity size={16} /> Dataset</span>
        </div>
        
        <div className="bg-bg-card backdrop-blur-md border border-border-subtle rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1 hover:border-white/15 flex flex-col gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider font-medium">Detected Illicit (Fraud)</span>
          <span className="text-4xl font-bold text-danger">{analysisData.illicit.toLocaleString()}</span>
          <span className="text-danger text-xs flex items-center gap-1"><TrendingUp size={16} /> Attention Required</span>
        </div>

        <div className="bg-bg-card backdrop-blur-md border border-border-subtle rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1 hover:border-white/15 flex flex-col gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider font-medium">Safe Transactions</span>
          <span className="text-4xl font-bold text-success">{analysisData.licit.toLocaleString()}</span>
          <span className="text-success text-xs flex items-center gap-1"><ShieldCheck size={16} /> {(analysisData.licit / analysisData.total_nodes * 100).toFixed(1)}% Secure</span>
        </div>

        <div className="bg-bg-card backdrop-blur-md border border-border-subtle rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1 hover:border-white/15 flex flex-col gap-2">
          <span className="text-text-muted text-xs uppercase tracking-wider font-medium">Model Confidence</span>
          <span className="text-4xl font-bold text-primary">{analysisData.confidence}%</span>
          <span className="text-primary text-xs flex items-center gap-1"><AlertTriangle size={16} /> Model prediction</span>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-6 mt-6">
        <div className="bg-bg-card backdrop-blur-md border border-border-subtle rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1">
          <h3 className="mb-6 font-medium">Temporal Fraud Volume Evolution</h3>
          <div className="h-[400px] w-full mt-4 animate-[fadeInUp_0.8s_ease-out]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysisData.time_series} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIllicit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLicit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--color-text-muted)" tick={{fill: 'var(--color-text-muted)'}} />
                <YAxis stroke="var(--color-text-muted)" tick={{fill: 'var(--color-text-muted)'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="transactions" stroke="var(--color-success)" fillOpacity={1} fill="url(#colorLicit)" name="Total Txns" />
                <Area type="monotone" dataKey="illicit" stroke="var(--color-danger)" fillOpacity={1} fill="url(#colorIllicit)" name="Fraud Detected" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-card backdrop-blur-md border border-border-subtle rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-transform duration-300 hover:-translate-y-1">
          <h3 className="mb-6 font-medium">Overall Distribution</h3>
          <div className="h-[350px] w-full mt-4 animate-[fadeInUp_0.8s_ease-out]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Licit Transactions', value: analysisData.licit },
                    { name: 'Illicit (Fraud)', value: analysisData.illicit }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {[
                    { name: 'Licit Transactions', value: analysisData.licit },
                    { name: 'Illicit (Fraud)', value: analysisData.illicit }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#10b981', '#ef4444'][index % 2]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border-subtle)', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--color-text-main)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
