# Graph Fraud Analytics: Detecting Illicit Cryptocurrency Transactions Using Advanced Graph Neural Networks

## 🚀 About the Project
This project is an advanced machine learning repository developed to identify and classify illicit cryptocurrency transactions within massive blockchain networks. It acts as an automated Graph Fraud Analytics system designed to help catch bad actors involved in illegal activities like money laundering, ransomware operations, and darknet market trades.

## 🚨 The Problem It Solves
Traditional fraud detection models typically analyze transactions as isolated events (tabular data). However, illicit blockchain activities inherently rely on the flow of funds between different entities. By ignoring the structural and relational data of who is sending money to whom, traditional models miss crucial context. 

This project solves that by modeling the entire blockchain as a massive interconnected network (a Graph), where:
- **Nodes** represent individual cryptocurrency transactions.
- **Edges** represent the flow of cryptocurrency from one transaction to another.

By doing this, the AI is able to detect intricate "graph-based" patterns and money movement topologies that are characteristic of criminal rings.

## 🧠 Core Algorithm: Graph Attention Networks (GAT)
The core intelligence of this project relies on **Advanced Graph Neural Networks (GNNs)**, specifically a heavily customized implementation of **Graph Attention Networks (GAT)**.

### How it Works:
1. **Data Ingestion**: The system uses the Elliptic Bitcoin Dataset (a large, real-world blockchain graph containing over 200,000 transactions and 234,000 edges).
2. **Feature Mapping**: Each node (transaction) contains 165 local features (such as time-steps, in-degree, out-degree, transaction fees, etc.).
3. **Graph Attention Mechanism**: Instead of treating all neighbor transactions equally, the custom `GATLayer` computes "attention scores". The neural network learns to dynamically "pay attention" to the most suspicious neighboring transactions while ignoring irrelevant ones.
4. **Chronological Splitting**: Real-world fraud detection happens sequentially in time. The training pipeline explicitly splits the dataset by time-steps—training on historical transactions (time steps 1 to 34) and testing on future, unseen transactions (time steps > 34).
5. **Classification**: The model outputs raw scores that are normalized to categorize the transaction as either **Licit (Legal)** or **Illicit (Fraudulent)**.

*(Note: The codebase also includes alternative benchmark implementations like Graph Convolutional Networks (GCN), GraphSAGE, and GIN).*

## 💻 Technology Stack
This project leverages a state-of-the-art Python deep learning stack:
- **Python 3.x**: Core programming language.
- **PyTorch**: Deep learning framework used for building and accelerating the neural network architectures on CPUs and GPUs.
- **PyTorch Geometric (PyG)**: A specialized deep learning library built on PyTorch for processing irregularly structured input data such as graphs and manifolds.
- **Pandas & NumPy**: For heavy data manipulation, mapping, and preprocessing of the 700MB+ transaction dataset.
- **Matplotlib**: For tracking and visualizing training loss and evaluation metrics (producing the output charts in the `results/` folder).

## 📊 Getting Started
Run the automated pipeline to construct the graph, compile the Advanced GAT model, and initiate training:
```bash
python train.py
```
Training progress and final metrics (Training/Test Accuracy and Loss) will be printed in the console and a chart will be exported to `results/training_metrics.png`.