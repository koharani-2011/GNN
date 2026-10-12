const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('gfa_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to login');
    if (data.token) {
      localStorage.setItem('gfa_token', data.token);
      localStorage.setItem('gfa_user', JSON.stringify(data.user));
    }
    return data;
  },

  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      localStorage.removeItem('gfa_token');
      localStorage.removeItem('gfa_user');
    }
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Datasets
  async getDatasets() {
    const res = await fetch(`${API_BASE}/datasets`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async uploadDataset(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  async loadQuickDemo(template) {
    const res = await fetch(`${API_BASE}/datasets/quick-demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ template }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Demo load failed');
    return data;
  },

  // Analyses
  async getAnalyses() {
    const res = await fetch(`${API_BASE}/analyses`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getAnalysis(id) {
    const res = await fetch(`${API_BASE}/analyses/${id}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async runAnalysis(datasetId, modelName = 'GAT (Graph Attention Network)') {
    const res = await fetch(`${API_BASE}/analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ datasetId, modelName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Analysis execution failed');
    return data;
  },

  // Transactions
  async getTransactions(analysisId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/analyses/${analysisId}/transactions?${query}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async getTransactionDetails(analysisId, txId) {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}/transactions/${txId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Graph Visualization
  async getGraphData(analysisId, params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/analyses/${analysisId}/graph?${query}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Patterns
  async getPatterns(analysisId) {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}/patterns`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Evaluation Metrics
  async getMetrics(analysisId) {
    const res = await fetch(`${API_BASE}/analyses/${analysisId}/metrics`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Investigation Cases
  async getCases() {
    const res = await fetch(`${API_BASE}/cases`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  async createCase(caseData) {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(caseData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create case');
    return data;
  },

  async updateCase(caseId, patch) {
    const res = await fetch(`${API_BASE}/cases/${caseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(patch),
    });
    return res.json();
  },

  async addCaseNote(caseId, text) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  async linkCaseTransaction(caseId, txId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ txId }),
    });
    return res.json();
  },

  async unlinkCaseTransaction(caseId, txId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/transactions/${txId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Reports
  async getReport(analysisId) {
    const res = await fetch(`${API_BASE}/reports/${analysisId}`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },

  // Audit Logs
  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: getAuthHeaders(),
    });
    return res.json();
  },
};
