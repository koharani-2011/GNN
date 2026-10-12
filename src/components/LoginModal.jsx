import React, { useState } from 'react';
import { Shield, Lock, User, X } from 'lucide-react';
import { api } from '../api';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [username, setUsername] = useState('investigator');
  const [password, setPassword] = useState('Investigator@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_10px_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Investigator Access</h3>
              <p className="text-xs text-slate-400">Graph Fraud Analytics Security Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Investigator Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-white pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Secure Key / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs text-white pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Authenticate & Enter Workstation'}
            </button>
          </div>

          {/* Quick Preset Buttons for Academic Evaluation */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-2">
              Academic Demonstration Presets:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreset('investigator', 'Investigator@123')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left text-[11px] text-slate-300 transition-colors"
              >
                <div className="font-semibold text-indigo-400">Investigator</div>
                <div className="text-[10px] text-slate-500">Case & GNN Access</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset('admin', 'Admin@123')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left text-[11px] text-slate-300 transition-colors"
              >
                <div className="font-semibold text-amber-400">Chief Officer</div>
                <div className="text-[10px] text-slate-500">Full System Admin</div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
