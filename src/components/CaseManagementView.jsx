import React, { useState } from 'react';
import {
  FolderLock,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { api } from '../api';

export default function CaseManagementView({
  cases,
  onRefreshCases,
  onInspectNode,
}) {
  const [selectedCase, setSelectedCase] = useState(cases?.[0] || null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [noteText, setNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await api.createCase({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        linkedTransactions: [],
      });
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      await onRefreshCases();
      setSelectedCase(res.case);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedCase) return;
    setSubmittingNote(true);
    try {
      const res = await api.addCaseNote(selectedCase.id, noteText.trim());
      setNoteText('');
      setSelectedCase(res.case);
      await onRefreshCases();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedCase) return;
    try {
      const res = await api.updateCase(selectedCase.id, { status: newStatus });
      setSelectedCase(res.case);
      await onRefreshCases();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlinkNode = async (txId) => {
    if (!selectedCase) return;
    try {
      const res = await api.unlinkCaseTransaction(selectedCase.id, txId);
      setSelectedCase(res.case);
      await onRefreshCases();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-indigo-400" />
            Financial Crime Investigation Cases ({cases?.length || 0})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured intelligence case-management workflows and evidential audit logs
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Create Investigation Case
        </button>
      </div>

      {/* Main Grid: Cases List + Case Dossier */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Column: Case Cards List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-y-auto space-y-3">
          {cases && cases.map((c) => {
            const isSelected = selectedCase?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/50 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">
                    {c.caseNumber}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    c.status === 'Open'
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                      : c.status === 'Under Review'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-white truncate">{c.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {c.description}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-800/80 font-mono">
                  <span>{c.linkedTransactions?.length || 0} flagged txs</span>
                  <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Case Dossier Detail */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl overflow-y-auto space-y-6 flex flex-col justify-between">
          {selectedCase ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      {selectedCase.caseNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Lead: {selectedCase.assignedTo}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-white mt-1">
                    {selectedCase.title}
                  </h3>
                </div>

                {/* Status Switcher */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={selectedCase.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl text-xs text-white px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="Open">Open</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                {selectedCase.description}
              </div>

              {/* Linked Transactions */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Associated Suspicious Transaction Nodes ({selectedCase.linkedTransactions?.length || 0})
                </span>
                {selectedCase.linkedTransactions?.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No transactions currently linked. Add suspicious nodes from Transaction Explorer or Graph View.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedCase.linkedTransactions.map((txId) => (
                      <div
                        key={txId}
                        className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-slate-300 truncate max-w-[170px]">{txId}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onInspectNode(txId)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                            title="Inspect Node"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUnlinkNode(txId)}
                            className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400"
                            title="Remove from Case"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes Timeline */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Investigator Notes & Audit Timeline
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCase.notes?.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-bold text-indigo-400">{n.author}</span>
                        <span>{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{n.text}</p>
                    </div>
                  ))}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add an investigative note or finding..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!noteText.trim() || submittingNote}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors disabled:opacity-40"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select or create an investigation case.
            </div>
          )}
        </div>
      </div>

      {/* Create Case Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">Create Investigation Case</h3>

            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 uppercase font-mono text-[10px] block mb-1">
                  Case Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mixing Cluster Suspicious Outflow"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl text-xs text-white p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase font-mono text-[10px] block mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl text-xs text-white p-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 uppercase font-mono text-[10px] block mb-1">
                  Case Description & Hypotheses
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide investigative context, observed graph anomalies, and expected follow-ups..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl text-xs text-white p-2.5 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
