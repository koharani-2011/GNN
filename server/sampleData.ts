import fs from 'fs';
import path from 'path';
import { db, Dataset, GraphEdge } from './db';
import { GNNEngine } from './gnn';

export function initializeSampleDatasets() {
  try {
    const csvPath = path.resolve('results', 'fraud_predictions_t40.csv');
    let csvData = '';
    if (fs.existsSync(csvPath)) {
      csvData = fs.readFileSync(csvPath, 'utf8');
    }

    const records: Array<{
      txId: string;
      timeStep: number;
      actualClass: 'Licit' | 'Illicit';
      features: Record<string, number>;
    }> = [];

    if (csvData) {
      const lines = csvData.trim().split('\n');
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [txId, _predClass, actualClass] = line.split(',');
        if (txId) {
          const isIllicit = actualClass && actualClass.toLowerCase().includes('fraud');
          records.push({
            txId: txId.trim(),
            timeStep: 40,
            actualClass: isIllicit ? 'Illicit' : 'Licit',
            features: {
              in_degree: Math.floor(Math.random() * 4) + (isIllicit ? 3 : 1),
              out_degree: Math.floor(Math.random() * 4) + (isIllicit ? 4 : 1),
              amount_btc: isIllicit ? parseFloat((Math.random() * 15 + 2).toFixed(4)) : parseFloat((Math.random() * 3 + 0.05).toFixed(4)),
              fee_ratio: isIllicit ? parseFloat((Math.random() * 0.18 + 0.04).toFixed(4)) : 0.012,
              timestep: 40,
            },
          });
        }
      }
    }

    // If records empty, provide synthetic fallback
    if (records.length === 0) {
      for (let i = 1; i <= 200; i++) {
        const isIllicit = i <= 25;
        records.push({
          txId: `tx_elliptic_${1000000 + i}`,
          timeStep: 40,
          actualClass: isIllicit ? 'Illicit' : 'Licit',
          features: {
            in_degree: isIllicit ? 5 : 2,
            out_degree: isIllicit ? 6 : 1,
            amount_btc: isIllicit ? 8.4 : 0.5,
            fee_ratio: isIllicit ? 0.09 : 0.01,
            timestep: 40,
          },
        });
      }
    }

    // Build authentic transaction graph edges among the records
    const edges: GraphEdge[] = [];
    const illicitIds = records.filter(r => r.actualClass === 'Illicit').map(r => r.txId);
    const licitIds = records.filter(r => r.actualClass === 'Licit').map(r => r.txId);

    // 1. Construct realistic fraudulent subnetwork:
    // Connect illicit transactions into fan-out smurfing hubs, fan-in accumulation, and circular loops
    if (illicitIds.length >= 6) {
      // Hub 1: Fan-out smurfing
      const hub1 = illicitIds[0];
      for (let i = 1; i <= Math.min(8, illicitIds.length - 1); i++) {
        edges.push({ source: hub1, target: illicitIds[i], timestamp: 40, amountBtc: 1.25, edgeType: 'smurf_split' });
      }

      // Hub 2: Circular loop among 4 illicit nodes
      if (illicitIds.length >= 12) {
        const c1 = illicitIds[4];
        const c2 = illicitIds[5];
        const c3 = illicitIds[6];
        const c4 = illicitIds[7];
        edges.push({ source: c1, target: c2, timestamp: 40, edgeType: 'wash_loop' });
        edges.push({ source: c2, target: c3, timestamp: 40, edgeType: 'wash_loop' });
        edges.push({ source: c3, target: c4, timestamp: 40, edgeType: 'wash_loop' });
        edges.push({ source: c4, target: c1, timestamp: 40, edgeType: 'wash_loop' });
      }

      // Hub 3: Fan-in accumulation
      if (illicitIds.length >= 18) {
        const sink = illicitIds[10];
        for (let i = 11; i <= Math.min(17, illicitIds.length - 1); i++) {
          edges.push({ source: illicitIds[i], target: sink, timestamp: 40, amountBtc: 3.4, edgeType: 'funnel_in' });
        }
      }

      // Peeling chain across illicit nodes
      if (illicitIds.length >= 24) {
        for (let i = 18; i < Math.min(23, illicitIds.length - 1); i++) {
          edges.push({ source: illicitIds[i], target: illicitIds[i + 1], timestamp: 40, edgeType: 'peeling_chain' });
        }
      }
    }

    // 2. Connect licit transactions into realistic sparse payment networks
    for (let i = 0; i < licitIds.length - 1; i += 2) {
      edges.push({
        source: licitIds[i],
        target: licitIds[i + 1],
        timestamp: 40,
        amountBtc: 0.42,
        edgeType: 'transfer',
      });
      if (i + 2 < licitIds.length && i % 4 === 0) {
        edges.push({
          source: licitIds[i + 1],
          target: licitIds[i + 2],
          timestamp: 40,
          amountBtc: 0.18,
          edgeType: 'transfer',
        });
      }
    }

    // 3. Register the benchmark dataset in database
    const datasetId = 'ds_elliptic_t40';
    const dataset: Dataset = {
      id: datasetId,
      name: 'Elliptic Bitcoin Dataset (Timestep 40 Benchmark)',
      filename: 'fraud_predictions_t40.csv',
      fileSize: 32716,
      totalRecords: records.length,
      featuresCount: 165,
      hasLabels: true,
      hasGraphEdges: true,
      uploadedBy: 'Chief Intelligence Officer (admin)',
      uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      sourceType: 'elliptic_bitcoin',
      recordsSummary: {
        licitCount: licitIds.length,
        illicitCount: illicitIds.length,
        unlabeledCount: 0,
      },
    };

    db.datasets.set(datasetId, dataset);
    db.datasetEdges.set(datasetId, edges);

    // 4. Run automated baseline GNN analysis on this benchmark dataset
    const analysisId = 'anl_baseline_01';
    const gnnResult = GNNEngine.runAnalysis(records, edges, 'GAT (Graph Attention Network)');

    // Persist transactions and analysis run
    db.datasetTransactions.set(analysisId, gnnResult.transactions);

    // Associate analysisId to patterns
    const updatedPatterns = gnnResult.patterns.map(p => ({ ...p, analysisId }));
    db.patterns.set(analysisId, updatedPatterns);

    db.analyses.set(analysisId, {
      id: analysisId,
      datasetId,
      datasetName: dataset.name,
      modelName: 'GAT (Graph Attention Network)',
      startedAt: new Date(Date.now() - 3600000 * 3.9).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 3.85).toISOString(),
      durationMs: 3120,
      analyzedBy: 'Chief Intelligence Officer (admin)',
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
    });

    // 5. Pre-seed default investigation case for demonstration
    const topSuspicious = gnnResult.transactions
      .filter(t => t.predictedClass === 'Suspicious (Illicit)')
      .slice(0, 6)
      .map(t => t.txId);

    const defaultCase = {
      id: 'case_2026_001',
      caseNumber: 'CASE-2026-0881',
      title: 'Darknet Market Liquidity Smurfing Cluster',
      description: 'Multiple high-risk cryptocurrency transactions demonstrating rapid fan-out smurfing dispersal and circular laundering loops identified in Elliptic Timestep 40.',
      status: 'Open' as const,
      priority: 'Critical' as const,
      assignedTo: 'Senior Financial Crime Analyst',
      createdBy: 'Chief Intelligence Officer',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 1800000).toISOString(),
      linkedTransactions: topSuspicious,
      patternIds: updatedPatterns.slice(0, 2).map(p => p.id),
      tags: ['Layering', 'Smurfing', 'GAT Flagged', 'High Confidence'],
      notes: [
        {
          id: 'note_01',
          author: 'Chief Intelligence Officer',
          text: 'Initial automated GAT inference flagged primary hub with 97.4% risk score. Transaction connects directly to known flagged mixing address.',
          timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
        },
        {
          id: 'note_02',
          author: 'Senior Financial Crime Analyst',
          text: 'Verified 2-hop neighborhood structure. Found 4-node circular wash loop. Recommending preservation order for target exchange deposit addresses.',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    };

    db.cases.set(defaultCase.id, defaultCase);
    db.logAudit('admin', 'INITIALIZE', 'SYSTEM', 'Pre-seeded Elliptic Bitcoin Timestep 40 benchmark and default investigation dossier');

    console.log(`[SampleData] Initialized benchmark dataset with ${records.length} transactions and ${edges.length} edges.`);
  } catch (err) {
    console.error('[SampleData] Error initializing sample data:', err);
  }
}
