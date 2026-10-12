# Graph Fraud Analytics: Financial Fraud Detection Using Graph Neural Networks (GNN)

[![Project Status: Completed](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)]()
[![Degree: BE Computer Science](https://img.shields.io/badge/Academic-BE%20CSE%20Final%20Year-indigo.svg)]()
[![Model: GAT / EvolveGCN / GraphSAGE](https://img.shields.io/badge/GNN-PyG%20%7C%20GAT%20%7C%20EvolveGCN-cyan.svg)]()

> **Final-Year BE Computer Science & Engineering Capstone Project**  
> An investigator-oriented platform for cryptocurrency transaction graph analysis, temporal graph neural network inference, topological anomaly detection, and forensic financial crime intelligence.

---

## 📋 Table of Contents
1. [Project Overview & Motivation](#1-project-overview--motivation)
2. [Academic & Research Boundaries (Disclaimer)](#2-academic--research-boundaries)
3. [System Architecture](#3-system-architecture)
4. [Graph Neural Network (GNN) Models](#4-graph-neural-network-gnn-models)
5. [Key Application Features](#5-key-application-features)
6. [Windows 10/11 & VS Code Setup Guide](#6-windows-1011--vs-code-setup-guide)
7. [Starting the Full Application](#7-starting-the-full-application)
8. [Automated Testing](#8-automated-testing)
9. [REST API Documentation](#9-rest-api-documentation)
10. [Final-Year Viva Voce Q&A Preparation](#10-final-year-viva-voce-qa-preparation)

---

## 1. Project Overview & Motivation

Traditional financial fraud detection approaches analyze transactions as isolated rows in tabular matrices. In contrast, illicit cryptocurrency movements (such as money laundering rings, darknet vendor operations, and ransomware cash-outs) inherently leverage the **flow of funds** across complex networks of addresses.

By modeling blockchain transactions as a directed property graph:
- **Nodes ($V$)**: Individual cryptocurrency transactions.
- **Edges ($E$)**: The directed flow of cryptocurrency from inputs to outputs.
- **Node Features ($X$)**: 165 local and aggregated features (transaction volume, fee dissipation, time-steps, in/out degrees).

Using **Graph Attention Networks (GAT)** and **EvolveGCN**, the system learns dynamic attention coefficients $\alpha_{ij}$ to focus on suspicious transaction paths while filtering normal economic activity.

---

## 2. Academic & Research Boundaries

> ⚠️ **Mandatory Academic Notice**: This application is built for research and academic demonstration. The system does not assert that a transaction or identity is criminally fraudulent merely because an AI model flags it. The model outputs algorithmic risk indicators and investigative leads; judicial conclusions require off-chain corroboration and formal legal proceedings.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               React 19 + Tailwind CSS + Canvas              │
│  (Executive Dashboard, Graph Explorer, Cases, Reports)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (Port 3000)
┌──────────────────────────────▼──────────────────────────────┐
│           Express + TypeScript / FastAPI Backend            │
│  (Authentication, Validation, GNN Engine, SQLite Database)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Ingestion & Adjacency Mapping
┌──────────────────────────────▼──────────────────────────────┐
│            PyG / GNN Topological Convolution Engine         │
│  (GAT Multi-Head Attention, EvolveGCN, GraphSAGE, Metrics)  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Graph Neural Network (GNN) Models

### 1. Graph Attention Network (GAT) — Primary Model
Computes dynamic attention coefficients between connected nodes:
$$\alpha_{ij} = \frac{\exp\left(\text{LeakyReLU}\left(\mathbf{a}^T [\mathbf{W}h_i \parallel \mathbf{W}h_j]\right)\right)}{\sum_{k \in \mathcal{N}(i)} \exp\left(\text{LeakyReLU}\left(\mathbf{a}^T [\mathbf{W}h_i \parallel \mathbf{W}h_k]\right)\right)}$$
Multi-head attention prevents attention collapse on high-degree mixing nodes.

### 2. EvolveGCN (Temporal GNN)
Instead of evolving node embeddings, EvolveGCN evolves the **GCN weight matrix** $W_t$ over time using a Recurrent Neural Network (GRU):
$$W_t = \text{GRU}(W_{t-1})$$
This models evolving criminal typologies across discrete blockchain timesteps without requiring nodes to persist across all time periods.

### 3. GraphSAGE & GCN Baselines
Provides inductive neighborhood mean aggregations for benchmark comparisons.

---

## 5. Key Application Features

1. **Executive Overview Dashboard**: Total transactions, licit vs. suspicious ratios, model confidence, temporal volume area charts, and class proportions.
2. **Dataset Hub & Upload Validation**: CSV validation with schema verification, missing-value handling, and 3 pre-packaged academic benchmarks (Elliptic Timestep 40, Ransomware Laundering Ring, Clean Compliance Batch).
3. **Transaction Feature Explorer**: Filterable and searchable table with risk score color bars, status badges, pagination, and CSV export.
4. **Transaction Detail Modal**: Full feature matrix, 1-hop neighborhood ego network, GAT explainability rationale, and case linking.
5. **Interactive Network Graph Explorer**: High-performance HTML5 Canvas simulation with pan, zoom, node click inspector, 1-hop and 2-hop ego isolation, and color coding.
6. **Suspicious Graph Pattern Analytics**: Automated detection of:
   - **Circular Loops** (cyclic wash trading)
   - **Fan-Out Smurfing** (disbursing funds to avoid thresholds)
   - **Fan-In Gathering** (funneling funds into accumulator)
   - **Peeling Chains** (linear multi-hop obfuscation)
7. **Investigation Case Dossiers**: Full case management (Open, Under Review, Closed), priority levels, investigator notes timeline, and linked transaction evidence.
8. **GNN Model Evaluation**: Confusion Matrix (TP, FP, TN, FN), Precision, Recall, F1-Score, and PR-AUC.
9. **Intelligence Dossier & Reports**: Printable formatted PDF reports with classification markings and exportable CSVs.
10. **System Audit Logs & RBAC**: Role-based access control (Admin vs. Investigator) and security activity logging.

---

## 6. Windows 10/11 & VS Code Setup Guide

### Prerequisites
- [Node.js v20+ or v22+](https://nodejs.org/) (LTS recommended)
- [Python 3.10+](https://www.python.org/downloads/) (Check "Add Python to PATH" during installation)
- [Visual Studio Code](https://code.visualstudio.com/)

### Step 1: Open Project in VS Code
Open VS Code, press `Ctrl + O` (or `File > Open Folder...`), and select the `graph-fraud-analysis` directory.

### Step 2: Open Terminal in VS Code
Press ``Ctrl + ` `` to open the integrated PowerShell/Command Prompt terminal.

### Step 3: Install Node Dependencies
```powershell
npm install
```

---

## 7. Starting the Full Application

### Option A: Complete Integrated Web Workstation (Recommended)
This starts the unified Express + React + GNN engine on port 3000:
```powershell
npm run dev
```
Open your browser to: **`http://localhost:3000`**

#### Default Login Credentials:
- **Senior Investigator**:
  - Username: `investigator`
  - Password: `Investigator@123`
- **Chief Intelligence Officer (Admin)**:
  - Username: `admin`
  - Password: `Admin@123`

---

### Option B: Local Python FastAPI Server (Academic Inspection)
If you wish to run the standalone Python backend:

1. Create and activate a Python virtual environment:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

2. Install Python dependencies:
```powershell
pip install -r requirements.txt
```

3. Start the FastAPI server:
```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```
API Documentation will be available at: **`http://127.0.0.1:8000/docs`**

---

## 8. Automated Testing

### Run Python Unit Tests:
```powershell
python -m unittest discover -s tests -p "test_*.py"
```

### Run Frontend & Full-Stack Build Verification:
```powershell
npm run build
```

---

## 9. REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health and model status |
| `POST` | `/api/auth/login` | Investigator authentication & JWT token |
| `GET` | `/api/datasets` | List registered cryptocurrency datasets |
| `POST` | `/api/datasets/upload` | Upload and validate new CSV dataset |
| `POST` | `/api/analyses` | Run GNN inference (GAT, EvolveGCN, GraphSAGE) |
| `GET` | `/api/analyses/:id/transactions` | Query, filter, and paginate transaction nodes |
| `GET` | `/api/analyses/:id/graph` | Fetch nodes and edges for network visualization |
| `GET` | `/api/analyses/:id/patterns` | Retrieve detected suspicious topological structures |
| `GET` | `/api/analyses/:id/metrics` | Retrieve evaluation metrics & confusion matrix |
| `GET` | `/api/cases` | Retrieve all investigation dossiers |
| `POST` | `/api/cases` | Create a new investigation case |
| `GET` | `/api/reports/:id` | Generate formal intelligence report |

---

## 10. Final-Year Viva Voce Q&A Preparation

### Q1: What makes Graph Neural Networks superior to Random Forests or XGBoost for fraud detection?
> **Answer**: Tabular models assume that transaction records are Independent and Identically Distributed (I.I.D.). In money laundering, bad actors deliberately split and route transactions to keep individual transaction features beneath detection limits. GNNs aggregate topological neighborhood signals—meaning even if a single transaction looks normal, its structural relationship to a suspicious hub or cyclic wash loop will trigger high risk.

### Q2: Why is accuracy a poor metric for evaluating fraud detection models?
> **Answer**: Real-world fraud datasets exhibit severe class imbalance (often 90% licit vs 10% illicit). A naive model that blindly predicts "Licit" for every record would achieve 90% accuracy while failing to detect a single crime. Therefore, we prioritize **F1-Score**, **Precision-Recall AUC (PR-AUC)**, and **Recall (Sensitivity)** on the illicit class.

### Q3: What is the purpose of the Graph Attention Mechanism?
> **Answer**: In standard GCN, all neighbors contribute equally (or normalized by static degree). In Graph Attention Networks (GAT), the neural network learns dynamic, parameterized attention weights $\alpha_{ij}$. This allows the model to pay heavy attention to high-risk neighbor connections while ignoring benign consumer payments.

---

## 🎓 Academic Submission Metadata
- **Project Title**: Graph Fraud Analysis – Financial Fraud Detection Using Graph Neural Networks
- **Domain**: Artificial Intelligence, Deep Learning, Graph Neural Networks, Financial Cybersecurity
- **Benchmark Dataset**: Elliptic Bitcoin Dataset (MIT & IBM Research)
- **Primary Frameworks**: PyTorch, PyTorch Geometric, NetworkX, FastAPI, React, Tailwind CSS
