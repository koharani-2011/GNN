import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  User,
  Shield,
  Clock,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { api } from '../api';

export default function AdminLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getAuditLogs()
      .then((data) => setLogs(data.logs || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="font-bold text-base text-white">
            System Security & Activity Audit Trail
          </h3>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Comprehensive immutable logging of authentication events, dataset uploads, model inference executions,
          and case management actions to ensure regulatory integrity and traceability.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Total Security Events: {logs.length}</span>
          <span className="text-indigo-400">RBAC Enforcement: ACTIVE</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading security logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-indigo-300 font-semibold">{log.username}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-200 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{log.resource}</td>
                    <td className="py-3 px-4 text-slate-300">{log.details}</td>
                    <td className="py-3 px-4 text-slate-500 text-[10px]">{log.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
