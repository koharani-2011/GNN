import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import DatasetView from './components/DatasetView';
import TransactionExplorerView from './components/TransactionExplorerView';
import GraphExplorerView from './components/GraphExplorerView';
import PatternAnalysisView from './components/PatternAnalysisView';
import CaseManagementView from './components/CaseManagementView';
import ModelEvaluationView from './components/ModelEvaluationView';
import ReportExportView from './components/ReportExportView';
import AdminLogsView from './components/AdminLogsView';
import TransactionDetailModal from './components/TransactionDetailModal';
import LoginModal from './components/LoginModal';
import RunAnalysisModal from './components/RunAnalysisModal';
import AcademicNoticeModal from './components/AcademicNoticeModal';
import { api } from './api';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [currentAnalysisId, setCurrentAnalysisId] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [cases, setCases] = useState([]);
  const [patterns, setPatterns] = useState([]);

  // Modals & Navigation state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [inspectTxId, setInspectTxId] = useState('');
  const [graphInitialRoot, setGraphInitialRoot] = useState('');
  const [preselectedDatasetForRun, setPreselectedDatasetForRun] = useState(null);

  // Initial load
  useEffect(() => {
    // Load current user
    api.getMe().then((res) => {
      if (res?.user) setCurrentUser(res.user);
    });

    // Load initial analyses
    loadAnalyses();
    // Load datasets
    loadDatasets();
    // Load cases
    loadCases();
  }, []);

  const loadAnalyses = async () => {
    try {
      const res = await api.getAnalyses();
      const list = res.analyses || [];
      setAnalyses(list);
      if (list.length > 0 && !currentAnalysisId) {
        setCurrentAnalysisId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadDatasets = async () => {
    try {
      const res = await api.getDatasets();
      setDatasets(res.datasets || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCases = async () => {
    try {
      const res = await api.getCases();
      setCases(res.cases || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Sync active analysis details whenever currentAnalysisId changes
  useEffect(() => {
    if (!currentAnalysisId) return;
    api.getAnalysis(currentAnalysisId)
      .then((res) => {
        if (res?.analysis) setCurrentAnalysis(res.analysis);
      })
      .catch((err) => console.error(err));

    api.getPatterns(currentAnalysisId)
      .then((res) => {
        setPatterns(res.patterns || []);
      })
      .catch((err) => console.error(err));
  }, [currentAnalysisId]);

  // Navigation Helper
  const handleNavigate = (view, options = {}) => {
    if (options.rootNode) {
      setGraphInitialRoot(options.rootNode);
    }
    setCurrentView(view);
  };

  const handleOpenGraphWithNode = (txId) => {
    setGraphInitialRoot(txId);
    setCurrentView('graph');
  };

  const handleCreateCaseFromPattern = async (pattern) => {
    try {
      const res = await api.createCase({
        title: `Investigation: ${pattern.name}`,
        description: pattern.description,
        priority: pattern.severity === 'Critical' ? 'Critical' : 'High',
        linkedTransactions: pattern.involvedNodes || [],
      });
      await loadCases();
      setCurrentView('cases');
    } catch (err) {
      console.error(err);
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Executive Overview Dashboard';
      case 'datasets':
        return 'Cryptocurrency Dataset Hub';
      case 'transactions':
        return 'Transaction Feature Explorer';
      case 'graph':
        return 'Interactive Network Graph Topology';
      case 'patterns':
        return 'Suspicious Pattern Analytics';
      case 'cases':
        return 'Financial Crime Investigation Dossiers';
      case 'evaluation':
        return 'GNN Model Evaluation & Metrics';
      case 'reports':
        return 'Investigation Reports & Dossier Export';
      case 'audit':
        return 'System Audit Logs & Security Monitoring';
      default:
        return 'Graph Fraud Analytics Workstation';
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-dark)] text-slate-100">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUser={currentUser}
        analyses={analyses}
        currentAnalysisId={currentAnalysisId}
        setCurrentAnalysisId={setCurrentAnalysisId}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle()}
          activeAnalysis={currentAnalysis}
          onRunAnalysisClick={() => {
            setPreselectedDatasetForRun(null);
            setIsRunModalOpen(true);
          }}
          onOpenDisclaimer={() => setIsNoticeOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              analysis={currentAnalysis}
              patterns={patterns}
              onNavigate={handleNavigate}
              onOpenAnalysisModal={() => setIsRunModalOpen(true)}
            />
          )}

          {currentView === 'datasets' && (
            <DatasetView
              datasets={datasets}
              onRefreshDatasets={loadDatasets}
              onSelectDatasetForRun={(dataset) => {
                setPreselectedDatasetForRun(dataset);
                setIsRunModalOpen(true);
              }}
            />
          )}

          {currentView === 'transactions' && (
            <TransactionExplorerView
              analysisId={currentAnalysisId}
              onInspectTransaction={(txId) => setInspectTxId(txId)}
              onAddToCase={(txId) => setInspectTxId(txId)}
            />
          )}

          {currentView === 'graph' && (
            <GraphExplorerView
              analysisId={currentAnalysisId}
              initialRootNode={graphInitialRoot}
              onInspectNode={(txId) => setInspectTxId(txId)}
            />
          )}

          {currentView === 'patterns' && (
            <PatternAnalysisView
              patterns={patterns}
              onOpenGraphWithNode={handleOpenGraphWithNode}
              onCreateCaseFromPattern={handleCreateCaseFromPattern}
            />
          )}

          {currentView === 'cases' && (
            <CaseManagementView
              cases={cases}
              onRefreshCases={loadCases}
              onInspectNode={(txId) => setInspectTxId(txId)}
            />
          )}

          {currentView === 'evaluation' && (
            <ModelEvaluationView analysis={currentAnalysis} />
          )}

          {currentView === 'reports' && (
            <ReportExportView analysisId={currentAnalysisId} />
          )}

          {currentView === 'audit' && <AdminLogsView />}
        </main>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadCases();
        }}
      />

      <RunAnalysisModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        datasets={datasets}
        preselectedDataset={preselectedDatasetForRun}
        onAnalysisSuccess={(newAnalysis) => {
          loadAnalyses();
          setCurrentAnalysisId(newAnalysis.id);
          setCurrentView('dashboard');
        }}
      />

      <AcademicNoticeModal
        isOpen={isNoticeOpen}
        onClose={() => setIsNoticeOpen(false)}
      />

      <TransactionDetailModal
        analysisId={currentAnalysisId}
        txId={inspectTxId}
        isOpen={!!inspectTxId}
        onClose={() => setInspectTxId('')}
        onOpenGraphWithNode={handleOpenGraphWithNode}
        cases={cases}
        onAddToCase={loadCases}
      />
    </div>
  );
}

export default App;
