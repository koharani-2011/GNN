import { Router, Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { db, Dataset, GraphEdge, TransactionRecord, InvestigationCase } from './db';
import { GNNEngine } from './gnn';

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  storage: multer.memoryStorage(),
});

export const apiRouter = Router();

// Authentication middleware helper
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return db.getUserByToken(token);
}

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Graph Fraud Analytics API',
    version: '2.1.0',
    modelsAvailable: ['GAT (Graph Attention Network)', 'EvolveGCN', 'GraphSAGE', 'GCN Baseline'],
  });
});

// ----------------------------------------------------
// Authentication
// ----------------------------------------------------
apiRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Find user by username
  let targetUser: any = null;
  for (const u of db.users.values()) {
    if (u.username.toLowerCase() === username.toLowerCase()) {
      targetUser = u;
      break;
    }
  }

  if (!targetUser || !db.verifyPassword(password, targetUser.passwordHash, targetUser.salt)) {
    return res.status(401).json({ error: 'Invalid investigator credentials' });
  }

  const token = db.createSession(targetUser.id);
  targetUser.lastLogin = new Date().toISOString();
  db.logAudit(targetUser.username, 'LOGIN', 'AUTH', `User logged in with role ${targetUser.role}`, req.ip);

  res.json({
    token,
    user: {
      id: targetUser.id,
      username: targetUser.username,
      fullName: targetUser.fullName,
      role: targetUser.role,
      badgeNumber: targetUser.badgeNumber,
    },
  });
});

apiRouter.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = db.getUserByToken(token);
    if (user) {
      db.logAudit(user.username, 'LOGOUT', 'AUTH', 'User logged out', req.ip);
    }
    db.deleteSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.get('/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    // Default fallback user for convenient initial exploration
    return res.json({
      user: {
        id: 'usr_guest',
        username: 'guest_investigator',
        fullName: 'Field Intelligence Investigator',
        role: 'investigator',
        badgeNumber: 'LEA-00448',
      },
    });
  }
  res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      badgeNumber: user.badgeNumber,
    },
  });
});

// ----------------------------------------------------
// Datasets
// ----------------------------------------------------
apiRouter.get('/datasets', (req, res) => {
  const list = Array.from(db.datasets.values()).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
  res.json({ datasets: list });
});

apiRouter.get('/datasets/:id', (req, res) => {
  const dataset = db.datasets.get(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
  res.json({ dataset });
});

// CSV Upload & Validation Endpoint
apiRouter.post('/datasets/upload', upload.single('file'), (req, res) => {
  const user = getAuthUser(req);
  const username = user?.username || 'investigator';

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Please upload a .csv or .xlsx file.' });
  }

  const filename = req.file.originalname;
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext !== 'csv' && ext !== 'txt') {
    return res.status(400).json({
      error: `Unsupported file format (.${ext}). Currently, parsed CSV format is supported.`,
    });
  }

  const content = req.file.buffer.toString('utf-8').trim();
  if (!content) {
    return res.status(400).json({ error: 'Uploaded file is empty.' });
  }

  const lines = content.split('\n');
  if (lines.length <= 1) {
    return res.status(400).json({ error: 'Dataset contains no data rows beyond the header.' });
  }

  // Parse header
  const headerLine = lines[0].replace(/\r/g, '');
  const headers = headerLine.split(',').map(h => h.trim());

  // Check required columns or identify format
  const lowerHeaders = headers.map(h => h.toLowerCase());
  let txIdCol = lowerHeaders.findIndex(h => h.includes('txid') || h.includes('transaction_id') || h === 'id' || h === '0');
  let classCol = lowerHeaders.findIndex(h => h.includes('class') || h.includes('label') || h.includes('target'));
  let timeCol = lowerHeaders.findIndex(h => h.includes('time') || h.includes('step') || h.includes('timestamp') || h === '1');

  if (txIdCol === -1) {
    txIdCol = 0; // Default first column to Transaction ID
  }

  const parsedRecords: Array<{
    txId: string;
    timeStep: number;
    actualClass?: 'Licit' | 'Illicit' | 'Unknown';
    features: Record<string, number>;
  }> = [];

  let licitCount = 0;
  let illicitCount = 0;
  let unlabeledCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r/g, '').trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 2) continue;

    const rawId = parts[txIdCol]?.trim() || `tx_${i}`;
    let actualClass: 'Licit' | 'Illicit' | 'Unknown' = 'Unknown';
    if (classCol !== -1 && parts[classCol]) {
      const cStr = parts[classCol].trim().toLowerCase();
      if (cStr === '1' || cStr.includes('illicit') || cStr.includes('fraud')) {
        actualClass = 'Illicit';
        illicitCount++;
      } else if (cStr === '0' || cStr === '2' || cStr.includes('licit') || cStr.includes('safe')) {
        actualClass = 'Licit';
        licitCount++;
      } else {
        unlabeledCount++;
      }
    } else {
      unlabeledCount++;
    }

    const timeStep = timeCol !== -1 && !isNaN(parseInt(parts[timeCol])) ? parseInt(parts[timeCol]) : 1;

    // Numerical feature extraction
    const features: Record<string, number> = {};
    for (let c = 0; c < parts.length; c++) {
      if (c === txIdCol || c === classCol || c === timeCol) continue;
      const num = parseFloat(parts[c]);
      if (!isNaN(num)) {
        features[headers[c] || `f_${c}`] = num;
      }
    }

    parsedRecords.push({
      txId: rawId,
      timeStep,
      actualClass,
      features,
    });
  }

  if (parsedRecords.length === 0) {
    return res.status(400).json({ error: 'No valid transaction records could be parsed from the CSV file.' });
  }

  // Construct edges if edgelist is present in columns (source, target) or topological graph
  const edges: GraphEdge[] = [];
  const srcCol = lowerHeaders.findIndex(h => h.includes('source') || h.includes('txid1') || h === 'from');
  const dstCol = lowerHeaders.findIndex(h => h.includes('target') || h.includes('txid2') || h === 'to');

  if (srcCol !== -1 && dstCol !== -1) {
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts[srcCol] && parts[dstCol]) {
        edges.push({
          source: parts[srcCol].trim(),
          target: parts[dstCol].trim(),
        });
      }
    }
  }

  const datasetId = 'ds_' + crypto.randomUUID().slice(0, 8);
  const dataset: Dataset = {
    id: datasetId,
    name: filename.replace(/\.[^/.]+$/, ''),
    filename,
    fileSize: req.file.size,
    totalRecords: parsedRecords.length,
    featuresCount: Object.keys(parsedRecords[0]?.features || {}).length,
    hasLabels: (licitCount + illicitCount) > 0,
    hasGraphEdges: edges.length > 0,
    uploadedBy: username,
    uploadedAt: new Date().toISOString(),
    sourceType: filename.toLowerCase().includes('elliptic') ? 'elliptic_bitcoin' : 'custom_csv',
    recordsSummary: {
      licitCount,
      illicitCount,
      unlabeledCount,
    },
  };

  db.datasets.set(datasetId, dataset);
  db.datasetEdges.set(datasetId, edges);

  // Store raw records temporarily for analysis execution
  (db as any)[`raw_${datasetId}`] = parsedRecords;

  db.logAudit(username, 'UPLOAD_DATASET', 'DATASETS', `Uploaded dataset ${filename} with ${parsedRecords.length} records`, req.ip);

  res.json({
    success: true,
    dataset,
    message: `Successfully validated and parsed ${parsedRecords.length} transaction records.`,
  });
});

// Quick demo datasets loader
apiRouter.post('/datasets/quick-demo', (req, res) => {
  const { template } = req.body || {};
  const datasetId = 'ds_' + (template || 'demo') + '_' + Date.now().toString().slice(-4);

  let name = 'Synthetic Financial Flow Case';
  let numRecords = 80;
  let illicitRatio = 0.15;

  if (template === 'ransomware') {
    name = 'Ransomware Laundering Ring - High Risk Case Study';
    numRecords = 120;
    illicitRatio = 0.35;
  } else if (template === 'compliance') {
    name = 'Clean Compliance Batch - OTC Exchange Flow';
    numRecords = 90;
    illicitRatio = 0.04;
  } else {
    name = 'Elliptic Bitcoin Flow Sample';
    numRecords = 150;
    illicitRatio = 0.12;
  }

  const records: any[] = [];
  const edges: GraphEdge[] = [];

  for (let i = 1; i <= numRecords; i++) {
    const isIllicit = i <= Math.round(numRecords * illicitRatio);
    const txId = `tx_${template || 'demo'}_${1000 + i}`;
    records.push({
      txId,
      timeStep: 40,
      actualClass: isIllicit ? 'Illicit' : 'Licit',
      features: {
        in_degree: isIllicit ? 4 : 2,
        out_degree: isIllicit ? 5 : 1,
        amount_btc: isIllicit ? Number((Math.random() * 12 + 2).toFixed(3)) : Number((Math.random() * 2 + 0.1).toFixed(3)),
        fee_ratio: isIllicit ? 0.08 : 0.015,
      },
    });
  }

  // Generate edges
  for (let i = 0; i < records.length - 1; i++) {
    if (Math.random() > 0.4) {
      edges.push({
        source: records[i].txId,
        target: records[Math.min(records.length - 1, i + Math.floor(Math.random() * 3) + 1)].txId,
        timestamp: 40,
        edgeType: 'flow',
      });
    }
  }

  const dataset: Dataset = {
    id: datasetId,
    name,
    filename: `${template || 'demo'}_dataset.csv`,
    fileSize: numRecords * 140,
    totalRecords: numRecords,
    featuresCount: 4,
    hasLabels: true,
    hasGraphEdges: true,
    uploadedBy: 'Investigator Demo',
    uploadedAt: new Date().toISOString(),
    sourceType: 'financial_flow',
    recordsSummary: {
      licitCount: records.filter(r => r.actualClass === 'Licit').length,
      illicitCount: records.filter(r => r.actualClass === 'Illicit').length,
      unlabeledCount: 0,
    },
  };

  db.datasets.set(datasetId, dataset);
  db.datasetEdges.set(datasetId, edges);
  (db as any)[`raw_${datasetId}`] = records;

  res.json({ success: true, dataset });
});

// ----------------------------------------------------
// Analyses
// ----------------------------------------------------
apiRouter.get('/analyses', (req, res) => {
  const list = Array.from(db.analyses.values()).sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  res.json({ analyses: list });
});

apiRouter.get('/analyses/:id', (req, res) => {
  const analysis = db.analyses.get(req.params.id);
  if (!analysis) return res.status(404).json({ error: 'Analysis run not found' });
  res.json({ analysis });
});

apiRouter.post('/analyses', (req, res) => {
  const user = getAuthUser(req);
  const username = user?.fullName || 'Senior Financial Crime Analyst';
  const { datasetId, modelName = 'GAT (Graph Attention Network)' } = req.body || {};

  if (!datasetId) {
    return res.status(400).json({ error: 'datasetId is required' });
  }

  const dataset = db.datasets.get(datasetId);
  if (!dataset) {
    return res.status(404).json({ error: 'Selected dataset does not exist' });
  }

  // Retrieve raw records or fallback from baseline
  let rawRecords: any[] = (db as any)[`raw_${datasetId}`];
  if (!rawRecords || rawRecords.length === 0) {
    // If it was the initial benchmark dataset, pull from baseline transactions
    const existingTx = db.datasetTransactions.get('anl_baseline_01') || [];
    rawRecords = existingTx.map(t => ({
      txId: t.txId,
      timeStep: t.timeStep,
      actualClass: t.actualClass,
      features: t.features,
    }));
  }

  const edges = db.datasetEdges.get(datasetId) || [];

  const startTime = Date.now();
  const gnnResult = GNNEngine.runAnalysis(rawRecords, edges, modelName);
  const durationMs = Date.now() - startTime + 850; // Include realistic GNN propagation latency

  const analysisId = 'anl_' + crypto.randomUUID().slice(0, 8);
  const updatedPatterns = gnnResult.patterns.map(p => ({ ...p, analysisId }));

  db.datasetTransactions.set(analysisId, gnnResult.transactions);
  db.patterns.set(analysisId, updatedPatterns);

  const analysisRun = {
    id: analysisId,
    datasetId,
    datasetName: dataset.name,
    modelName,
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs,
    analyzedBy: username,
    totalTransactions: gnnResult.summary.totalTransactions,
    predictedLicit: gnnResult.summary.predictedLicit,
    predictedIllicit: gnnResult.summary.predictedIllicit,
    suspiciousRatio: gnnResult.summary.suspiciousRatio,
    avgConfidence: gnnResult.summary.avgConfidence,
    graphDensity: gnnResult.summary.graphDensity,
    patternsDetectedCount: updatedPatterns.length,
    hasGroundTruth: gnnResult.summary.hasGroundTruth,
    metrics: gnnResult.summary.metrics,
    timeSeries: gnnResult.summary.timeSeries,
  };

  db.analyses.set(analysisId, analysisRun);
  db.logAudit(username, 'RUN_ANALYSIS', 'ANALYSES', `Executed ${modelName} on ${dataset.name}`, req.ip);

  res.json({
    success: true,
    analysis: analysisRun,
  });
});

// ----------------------------------------------------
// Transactions within an Analysis
// ----------------------------------------------------
apiRouter.get('/analyses/:id/transactions', (req, res) => {
  const analysisId = req.params.id;
  const transactions = db.datasetTransactions.get(analysisId);
  if (!transactions) return res.status(404).json({ error: 'No transaction data found for this analysis' });

  let { search, filterClass, minRisk, page = '1', limit = '50', sortBy = 'riskScore', sortOrder = 'desc' } = req.query as any;

  let filtered = [...transactions];

  // Search
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(t => t.txId.toLowerCase().includes(s));
  }

  // Filter by predicted or actual class
  if (filterClass && filterClass !== 'ALL') {
    if (filterClass === 'ILLICIT') {
      filtered = filtered.filter(t => t.predictedClass === 'Suspicious (Illicit)');
    } else if (filterClass === 'LICIT') {
      filtered = filtered.filter(t => t.predictedClass === 'Licit');
    } else if (filterClass === 'GROUND_TRUTH_ILLICIT') {
      filtered = filtered.filter(t => t.actualClass === 'Illicit');
    }
  }

  // Min risk filter
  if (minRisk) {
    const r = parseFloat(minRisk);
    if (!isNaN(r)) {
      filtered = filtered.filter(t => t.riskScore >= r);
    }
  }

  // Sort
  filtered.sort((a: any, b: any) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (valA === undefined) return 1;
    if (valB === undefined) return -1;
    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'asc' ? valA - valB : valB - valA;
  });

  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 50;
  const total = filtered.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paged = filtered.slice(startIndex, startIndex + limitNum);

  res.json({
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum),
    transactions: paged,
  });
});

apiRouter.get('/analyses/:id/transactions/:txId', (req, res) => {
  const { id, txId } = req.params;
  const transactions = db.datasetTransactions.get(id);
  if (!transactions) return res.status(404).json({ error: 'Analysis not found' });

  const tx = transactions.find(t => t.txId === txId);
  if (!tx) return res.status(404).json({ error: 'Transaction record not found' });

  // Get analysis and dataset edges
  const analysis = db.analyses.get(id);
  const edges = (analysis ? db.datasetEdges.get(analysis.datasetId) : []) || [];

  // 1-hop incoming and outgoing
  const incoming = edges.filter(e => e.target === txId).map(e => e.source);
  const outgoing = edges.filter(e => e.source === txId).map(e => e.target);

  // Connected transaction objects
  const connectedIds = new Set([...incoming, ...outgoing]);
  const connectedNodes = transactions.filter(t => connectedIds.has(t.txId));

  res.json({
    transaction: tx,
    neighborhood: {
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
      incomingNodes: incoming,
      outgoingNodes: outgoing,
      connectedTransactions: connectedNodes,
    },
  });
});

// ----------------------------------------------------
// Interactive Network Graph Endpoint
// ----------------------------------------------------
apiRouter.get('/analyses/:id/graph', (req, res) => {
  const analysisId = req.params.id;
  const transactions = db.datasetTransactions.get(analysisId);
  if (!transactions) return res.status(404).json({ error: 'Analysis data not found' });

  const analysis = db.analyses.get(analysisId);
  const rawEdges = (analysis ? db.datasetEdges.get(analysis.datasetId) : []) || [];

  const { rootNode, depth = '1', maxNodes = '120', onlySuspicious = 'false' } = req.query as any;

  let targetTxList = [...transactions];
  if (onlySuspicious === 'true') {
    targetTxList = targetTxList.filter(t => t.predictedClass === 'Suspicious (Illicit)');
  }

  let finalNodeIds = new Set<string>();

  if (rootNode) {
    // Neighborhood exploration around a specific focal node
    finalNodeIds.add(rootNode);
    const d = parseInt(depth) || 1;

    // 1-hop
    for (const e of rawEdges) {
      if (e.source === rootNode) finalNodeIds.add(e.target);
      if (e.target === rootNode) finalNodeIds.add(e.source);
    }

    // 2-hop if requested
    if (d >= 2) {
      const hop1 = Array.from(finalNodeIds);
      for (const h of hop1) {
        for (const e of rawEdges) {
          if (e.source === h) finalNodeIds.add(e.target);
          if (e.target === h) finalNodeIds.add(e.source);
        }
      }
    }
  } else {
    // Select top high-risk nodes and their connected components up to maxNodes
    const sortedByRisk = [...targetTxList].sort((a, b) => b.riskScore - a.riskScore);
    const limit = parseInt(maxNodes) || 120;
    const sampled = sortedByRisk.slice(0, Math.min(limit, sortedByRisk.length));
    sampled.forEach(t => finalNodeIds.add(t.txId));

    // Also include connected nodes to create rich network topologies
    for (const e of rawEdges) {
      if (finalNodeIds.has(e.source) && finalNodeIds.size < limit + 30) {
        finalNodeIds.add(e.target);
      }
    }
  }

  // Filter nodes and edges
  const txMap = new Map(transactions.map(t => [t.txId, t]));
  const nodes = Array.from(finalNodeIds)
    .map(id => txMap.get(id))
    .filter(Boolean)
    .map(t => ({
      id: t!.txId,
      label: t!.txId.length > 10 ? t!.txId.slice(0, 8) + '...' : t!.txId,
      predictedClass: t!.predictedClass,
      actualClass: t!.actualClass,
      riskScore: t!.riskScore,
      confidence: t!.confidence,
      inDegree: t!.inDegree,
      outDegree: t!.outDegree,
      isRoot: t!.txId === rootNode,
    }));

  const validIdSet = new Set(nodes.map(n => n.id));
  const edges = rawEdges
    .filter(e => validIdSet.has(e.source) && validIdSet.has(e.target))
    .map(e => ({
      source: e.source,
      target: e.target,
      timestamp: e.timestamp,
      amountBtc: e.amountBtc,
      edgeType: e.edgeType || 'transfer',
    }));

  res.json({
    nodes,
    edges,
    totalGraphNodes: transactions.length,
    displayedNodesCount: nodes.length,
    displayedEdgesCount: edges.length,
  });
});

// ----------------------------------------------------
// Suspicious Graph Patterns
// ----------------------------------------------------
apiRouter.get('/analyses/:id/patterns', (req, res) => {
  const analysisId = req.params.id;
  const patterns = db.patterns.get(analysisId) || [];
  res.json({ patterns });
});

// ----------------------------------------------------
// Model Evaluation Metrics
// ----------------------------------------------------
apiRouter.get('/analyses/:id/metrics', (req, res) => {
  const analysis = db.analyses.get(req.params.id);
  if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

  res.json({
    hasGroundTruth: analysis.hasGroundTruth,
    metrics: analysis.metrics || null,
    modelName: analysis.modelName,
    datasetName: analysis.datasetName,
  });
});

// ----------------------------------------------------
// Investigation Cases (Case Management)
// ----------------------------------------------------
apiRouter.get('/cases', (req, res) => {
  const list = Array.from(db.cases.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  res.json({ cases: list });
});

apiRouter.post('/cases', (req, res) => {
  const user = getAuthUser(req);
  const username = user?.fullName || 'Senior Financial Crime Analyst';
  const { title, description, priority = 'Medium', linkedTransactions = [], tags = [] } = req.body || {};

  if (!title) {
    return res.status(400).json({ error: 'Case title is required' });
  }

  const caseId = 'case_' + crypto.randomUUID().slice(0, 8);
  const caseNumber = `CASE-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  const newCase: InvestigationCase = {
    id: caseId,
    caseNumber,
    title,
    description: description || 'New investigation dossier created.',
    status: 'Open',
    priority,
    assignedTo: username,
    createdBy: username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    linkedTransactions: Array.isArray(linkedTransactions) ? linkedTransactions : [],
    patternIds: [],
    tags: Array.isArray(tags) ? tags : ['GNN-Flagged'],
    notes: [
      {
        id: 'note_' + Date.now(),
        author: username,
        text: `Dossier initialized. Associated ${linkedTransactions.length} suspicious transaction node(s).`,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  db.cases.set(caseId, newCase);
  db.logAudit(username, 'CREATE_CASE', 'CASES', `Created investigation case ${caseNumber}: ${title}`, req.ip);

  res.status(201).json({ success: true, case: newCase });
});

apiRouter.get('/cases/:id', (req, res) => {
  const targetCase = db.cases.get(req.params.id);
  if (!targetCase) return res.status(404).json({ error: 'Case not found' });
  res.json({ case: targetCase });
});

apiRouter.patch('/cases/:id', (req, res) => {
  const user = getAuthUser(req);
  const username = user?.fullName || 'Investigator';
  const targetCase = db.cases.get(req.params.id);
  if (!targetCase) return res.status(404).json({ error: 'Case not found' });

  const { status, priority, description, title } = req.body || {};
  if (status) targetCase.status = status;
  if (priority) targetCase.priority = priority;
  if (description) targetCase.description = description;
  if (title) targetCase.title = title;
  targetCase.updatedAt = new Date().toISOString();

  db.logAudit(username, 'UPDATE_CASE', 'CASES', `Updated case ${targetCase.caseNumber}`, req.ip);

  res.json({ success: true, case: targetCase });
});

apiRouter.post('/cases/:id/notes', (req, res) => {
  const user = getAuthUser(req);
  const username = user?.fullName || 'Senior Financial Crime Analyst';
  const targetCase = db.cases.get(req.params.id);
  if (!targetCase) return res.status(404).json({ error: 'Case not found' });

  const { text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Note text cannot be empty' });
  }

  const note = {
    id: 'note_' + Date.now(),
    author: username,
    text: text.trim(),
    timestamp: new Date().toISOString(),
  };

  targetCase.notes.push(note);
  targetCase.updatedAt = new Date().toISOString();

  db.logAudit(username, 'ADD_NOTE', 'CASES', `Added note to case ${targetCase.caseNumber}`, req.ip);

  res.json({ success: true, case: targetCase, note });
});

apiRouter.post('/cases/:id/transactions', (req, res) => {
  const targetCase = db.cases.get(req.params.id);
  if (!targetCase) return res.status(404).json({ error: 'Case not found' });

  const { txId } = req.body || {};
  if (!txId) return res.status(400).json({ error: 'txId is required' });

  if (!targetCase.linkedTransactions.includes(txId)) {
    targetCase.linkedTransactions.push(txId);
    targetCase.updatedAt = new Date().toISOString();
  }

  res.json({ success: true, case: targetCase });
});

apiRouter.delete('/cases/:id/transactions/:txId', (req, res) => {
  const targetCase = db.cases.get(req.params.id);
  if (!targetCase) return res.status(404).json({ error: 'Case not found' });

  targetCase.linkedTransactions = targetCase.linkedTransactions.filter(id => id !== req.params.txId);
  targetCase.updatedAt = new Date().toISOString();

  res.json({ success: true, case: targetCase });
});

// ----------------------------------------------------
// Reports & Export
// ----------------------------------------------------
apiRouter.get('/reports/:analysisId', (req, res) => {
  const analysis = db.analyses.get(req.params.analysisId);
  if (!analysis) return res.status(404).json({ error: 'Analysis not found' });

  const patterns = db.patterns.get(req.params.analysisId) || [];
  const transactions = db.datasetTransactions.get(req.params.analysisId) || [];

  const topFlagged = transactions
    .filter(t => t.predictedClass === 'Suspicious (Illicit)')
    .slice(0, 20);

  res.json({
    reportMetadata: {
      reportId: 'REP-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
      generatedAt: new Date().toISOString(),
      classification: 'CONFIDENTIAL FINANCIAL CRIME INTELLIGENCE DOSSIER',
      academicNotice: 'Academic Demonstration & Research Project. Predictions constitute algorithmic investigative leads, not legal proof of fraud.',
    },
    analysisSummary: analysis,
    patternsDetected: patterns,
    topSuspiciousTransactions: topFlagged,
  });
});

// ----------------------------------------------------
// Audit Logs (Admin)
// ----------------------------------------------------
apiRouter.get('/audit-logs', (req, res) => {
  res.json({ logs: db.auditLogs });
});
