import React, { useState } from 'react';
import UploadSection from './components/UploadSection';
import DashboardResults from './components/DashboardResults';
import Logo from './components/Logo';

function App() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);

  const handleReset = () => {
    setAnalysisData(null);
    setAnalyzing(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-8 flex flex-col gap-8">
      <header className="flex justify-between items-center pb-6 border-b border-border-subtle animate-[fadeInDown_0.6s_ease-out]">
        <div className="flex items-center gap-4">
          <Logo />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-br from-white to-indigo-300 bg-clip-text text-transparent tracking-tight">Graph fraud analysis</h1>
            <p className="text-text-muted text-sm mt-1">Temporal Graph Neural Network Dashboard</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-bg-card backdrop-blur-md border border-border-subtle py-2 px-4 flex items-center gap-2 rounded-full shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_10px_var(--color-success)]"></div>
            <span className="text-sm font-medium">EvolveGCN Model Active</span>
          </div>
        </div>
      </header>

      {!analysisData ? (
        <UploadSection 
          onResults={setAnalysisData} 
          onAnalyzeStart={() => setAnalyzing(true)} 
          analyzing={analyzing} 
        />
      ) : (
        <DashboardResults 
          analysisData={analysisData} 
          onReset={handleReset} 
        />
      )}
    </div>
  );
}

export default App;
