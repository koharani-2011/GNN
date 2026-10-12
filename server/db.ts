import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  fullName: string;
  role: 'admin' | 'investigator';
  badgeNumber: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Dataset {
  id: string;
  name: string;
  filename: string;
  fileSize: number;
  totalRecords: number;
  featuresCount: number;
  hasLabels: boolean;
  hasGraphEdges: boolean;
  uploadedBy: string;
  uploadedAt: string;
  sourceType: 'elliptic_bitcoin' | 'custom_csv' | 'financial_flow';
  recordsSummary: {
    licitCount?: number;
    illicitCount?: number;
    unlabeledCount?: number;
  };
}

export interface GraphEdge {
  source: string;
  target: string;
  timestamp?: number;
  amountBtc?: number;
  edgeType?: string;
}

export interface TransactionRecord {
  txId: string;
  timeStep: number;
  predictedClass: 'Licit' | 'Suspicious (Illicit)';
  actualClass?: 'Licit' | 'Illicit' | 'Unknown';
  riskScore: number; // 0.0 to 1.0
  confidence: number; // percentage e.g. 94.2
  inDegree: number;
  outDegree: number;
  clusteringCoeff: number;
  features: Record<string, number>;
  signals: string[];
  explanation: string;
  isFlaggedForReview: boolean;
}

export interface AnalysisRun {
  id: string;
  datasetId: string;
  datasetName: string;
  modelName: 'GAT (Graph Attention Network)' | 'EvolveGCN' | 'GraphSAGE' | 'GCN Baseline';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  analyzedBy: string;
  totalTransactions: number;
  predictedLicit: number;
  predictedIllicit: number;
  suspiciousRatio: number;
  avgConfidence: number;
  graphDensity: number;
  patternsDetectedCount: number;
  hasGroundTruth: boolean;
  metrics?: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc: number;
    prAuc: number;
    confusionMatrix: {
      tp: number;
      fp: number;
      tn: number;
      fn: number;
    };
  };
  timeSeries: Array<{
    time: string;
    transactions: number;
    illicit: number;
    riskTrend: number;
  }>;
}

export interface SuspiciousPattern {
  id: string;
  analysisId: string;
  type: 'circular_loop' | 'fan_out_smurfing' | 'fan_in_gathering' | 'peeling_chain' | 'dense_illicit_cluster';
  name: string;
  severity: 'Critical' | 'High' | 'Medium';
  description: string;
  involvedNodes: string[];
  primaryNode: string;
  riskScore: number;
  graphMetrics: {
    nodesCount: number;
    edgesCount: number;
    averageDegree: number;
  };
  detectionLogic: string;
  sourceFields: string[];
}

export interface InvestigationCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  status: 'Open' | 'Under Review' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  linkedTransactions: string[];
  patternIds: string[];
  tags: string[];
  notes: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: string;
  }>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
}

// In-Memory Database store with optional disk caching
class Database {
  users: Map<string, User> = new Map();
  sessions: Map<string, { userId: string; expiresAt: number }> = new Map();
  datasets: Map<string, Dataset> = new Map();
  datasetTransactions: Map<string, TransactionRecord[]> = new Map();
  datasetEdges: Map<string, GraphEdge[]> = new Map();
  analyses: Map<string, AnalysisRun> = new Map();
  patterns: Map<string, SuspiciousPattern[]> = new Map(); // analysisId -> patterns
  cases: Map<string, InvestigationCase> = new Map();
  auditLogs: AuditLogEntry[] = [];

  constructor() {
    this.seedDefaultUsers();
  }

  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, s, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: s };
  }

  verifyPassword(password: string, hash: string, salt: string): boolean {
    const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return computed === hash;
  }

  seedDefaultUsers() {
    // Admin user
    const adminAuth = this.hashPassword('Admin@123');
    const adminUser: User = {
      id: 'usr_admin_01',
      username: 'admin',
      passwordHash: adminAuth.hash,
      salt: adminAuth.salt,
      fullName: 'Chief Intelligence Officer',
      role: 'admin',
      badgeNumber: 'LEA-00192',
      createdAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);

    // Investigator user
    const invAuth = this.hashPassword('Investigator@123');
    const invUser: User = {
      id: 'usr_inv_01',
      username: 'investigator',
      passwordHash: invAuth.hash,
      salt: invAuth.salt,
      fullName: 'Senior Financial Crime Analyst',
      role: 'investigator',
      badgeNumber: 'LEA-00448',
      createdAt: new Date().toISOString(),
    };
    this.users.set(invUser.id, invUser);
  }

  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    this.sessions.set(token, { userId, expiresAt });
    return token;
  }

  getUserByToken(token: string): User | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return this.users.get(session.userId) || null;
  }

  deleteSession(token: string) {
    this.sessions.delete(token);
  }

  logAudit(username: string, action: string, resource: string, details: string, ipAddress?: string) {
    const entry: AuditLogEntry = {
      id: 'log_' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString(),
      username,
      action,
      resource,
      details,
      ipAddress: ipAddress || '127.0.0.1',
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }
}

export const db = new Database();
