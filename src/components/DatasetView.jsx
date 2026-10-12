import React, { useState } from 'react';
import {
  Upload,
  FileType,
  Database,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';

export default function DatasetView({
  datasets,
  onRefreshDatasets,
  onRunAnalysis,
  onSelectDatasetForRun,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setUploadError('');
    setUploadSuccess('');
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv' && ext !== 'txt') {
      setUploadError('Only CSV files are currently supported for topological GNN analysis.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size exceeds the 50MB investigation threshold.');
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const res = await api.uploadDataset(selectedFile);
      setUploadSuccess(`Dataset "${res.dataset.name}" successfully parsed and validated (${res.dataset.totalRecords} records)!`);
      setSelectedFile(null);
      await onRefreshDatasets();
    } catch (err) {
      setUploadError(err.message || 'Dataset upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadDemo = async (template) => {
    setLoadingDemo(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const res = await api.loadQuickDemo(template);
      setUploadSuccess(`Pre-configured dataset "${res.dataset.name}" loaded successfully.`);
      await onRefreshDatasets();
    } catch (err) {
      setUploadError(err.message || 'Demo dataset failed to load.');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Upload Zone & Demo Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Card */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                Upload Investigation Dataset
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload raw cryptocurrency transaction CSV files or Elliptic benchmark extracts
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              CSV / TXT (Max 50MB)
            </span>
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700/80 bg-slate-950/40 hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              id="dataset-file-input"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="dataset-file-input" className="cursor-pointer block space-y-3">
              {selectedFile ? (
                <>
                  <FileType className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="text-sm font-semibold text-white">{selectedFile.name}</div>
                  <div className="text-xs text-slate-400 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-500 mx-auto" />
                  <div className="text-sm font-semibold text-slate-200">
                    Click to select CSV or drag and drop file here
                  </div>
                  <div className="text-xs text-slate-500">
                    Expected columns: txId, class (optional), time_step, numeric feature columns
                  </div>
                </>
              )}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {selectedFile && (
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs hover:bg-slate-800 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              onClick={handleUploadSubmit}
              disabled={!selectedFile || uploading}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 animate-spin" />
                  Validating & Parsing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Validate & Register Dataset
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Demo Pre-Loaded Benchmarks */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Pre-Packaged Benchmarks
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Instantly ingest validated academic cryptocurrency datasets for evaluation and demonstration:
            </p>

            <div className="space-y-3 mt-4">
              <button
                onClick={() => handleLoadDemo('elliptic')}
                disabled={loadingDemo}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs space-y-1 block"
              >
                <div className="font-semibold text-indigo-300 flex items-center justify-between">
                  <span>Elliptic Bitcoin Flow Sample</span>
                  <span className="text-[10px] text-slate-500 font-mono">150 Nodes</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Standard real-world blockchain transaction network with 165 local features.
                </p>
              </button>

              <button
                onClick={() => handleLoadDemo('ransomware')}
                disabled={loadingDemo}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/40 transition-all text-xs space-y-1 block"
              >
                <div className="font-semibold text-rose-300 flex items-center justify-between">
                  <span>Ransomware Laundering Ring</span>
                  <span className="text-[10px] text-slate-500 font-mono">120 Nodes</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  High-risk concentration with cyclic wash trading and smurfing distribution.
                </p>
              </button>

              <button
                onClick={() => handleLoadDemo('compliance')}
                disabled={loadingDemo}
                className="w-full text-left p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all text-xs space-y-1 block"
              >
                <div className="font-semibold text-emerald-300 flex items-center justify-between">
                  <span>Clean Compliance Batch</span>
                  <span className="text-[10px] text-slate-500 font-mono">90 Nodes</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Regulated OTC broker volume with standard compliant disbursement.
                </p>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 font-mono">
            Ground-truth labels preserved for confusion matrix validation.
          </div>
        </div>
      </div>

      {/* Registered Datasets Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Registered Datasets ({datasets?.length || 0})
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Available transaction networks ready for GNN graph convolution inference
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono tracking-wider text-[11px]">
                <th className="py-3 px-4">Dataset Name</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Features</th>
                <th className="py-3 px-4">Ground Truth</th>
                <th className="py-3 px-4">Graph Edges</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {datasets && datasets.map((d) => (
                <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <FileType className="w-4 h-4 text-indigo-400 shrink-0" />
                      <div>
                        <div>{d.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{d.filename}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {d.totalRecords.toLocaleString()} nodes
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    {d.featuresCount} feats
                  </td>
                  <td className="py-3.5 px-4">
                    {d.hasLabels ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Available ({d.recordsSummary.licitCount} L / {d.recordsSummary.illicitCount} I)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                        Unlabeled Unseen
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {d.hasGraphEdges ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">Inferred Flow</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(d.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectDatasetForRun(d)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
                      Run Inference
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
