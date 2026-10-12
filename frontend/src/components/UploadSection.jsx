import React, { useState } from 'react';
import { Upload, FileType, Activity } from 'lucide-react';
import { analyzeFile } from '../api';

export default function UploadSection({ onResults, onAnalyzeStart, analyzing }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (uploadedFile) => {
    const ext = uploadedFile.name.split('.').pop().toLowerCase();
    if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
      setFile(uploadedFile);
    } else {
      alert("Please upload a valid CSV or Excel file.");
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    onAnalyzeStart();
    
    try {
      const data = await analyzeFile(file);
      onResults(data);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      alert(error.message || "Failed to connect to backend. Make sure the FastAPI server is running on port 8000.");
      onResults(null); 
    }
  };

  return (
    <main className="flex flex-col gap-8 flex-1 justify-center my-8">
      <div className="bg-bg-card backdrop-blur-md border border-border-subtle rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] max-w-2xl mx-auto w-full">
        <h2 className="mb-6 text-xl font-semibold">Dataset Upload</h2>
        
        <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".csv, .xlsx, .xls"
            onChange={handleChange} 
          />
          <label 
            htmlFor="file-upload" 
            className={`group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${dragActive ? 'border-primary bg-primary/5 shadow-[0_0_20px_var(--color-primary-glow)] -translate-y-0.5' : 'border-border-subtle bg-white/5 hover:border-primary hover:bg-primary/5 hover:shadow-[0_0_20px_var(--color-primary-glow)] hover:-translate-y-0.5'} ${analyzing ? 'animate-pulse' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {analyzing ? (
              <>
                <Activity className="text-primary w-12 h-12 mb-4 animate-spin-slow" />
                <p className="text-lg font-semibold mb-2">Processing Temporal Graph...</p>
                <p className="text-text-muted text-sm">Running EvolveGCN inference across timesteps</p>
              </>
            ) : file ? (
              <>
                <FileType className="text-success w-12 h-12 mb-4 transition-transform duration-300 group-hover:-translate-y-1" />
                <p className="text-lg font-semibold mb-2">{file.name}</p>
                <p className="text-text-muted text-sm">{(file.size / (1024*1024)).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <Upload className="text-primary w-12 h-12 mb-4 transition-transform duration-300 group-hover:-translate-y-1" />
                <p className="text-lg font-semibold mb-2">Drag & drop your transaction dataset</p>
                <p className="text-text-muted text-sm">Supports .CSV, .XLSX (Max 1GB)</p>
              </>
            )}
          </label>
        </form>

        <div className="mt-8 flex justify-center">
          <button 
            className="w-48 bg-gradient-to-br from-primary to-indigo-600 text-white border-none py-3 px-6 rounded-lg font-semibold cursor-pointer transition-all duration-200 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(99,102,241,0.5)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none" 
            onClick={handleAnalyze} 
            disabled={!file || analyzing}
          >
            {analyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>
    </main>
  );
}
