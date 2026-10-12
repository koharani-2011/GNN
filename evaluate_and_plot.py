import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
import torch
import pandas as pd
import numpy as np
from torch_geometric.data import Data
from torch_geometric.utils import subgraph
import torch.nn.functional as F
import networkx as nx
import matplotlib.pyplot as plt

from models.evolvegcn import EvolveGCNModel
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def load_and_prep_data():
    data_dir = 'D:/Programming/Projects/GFA Data/elliptic_bitcoin_dataset'
    features = pd.read_csv(f'{data_dir}/elliptic_txs_features.csv', header=None)
    classes = pd.read_csv(f'{data_dir}/elliptic_txs_classes.csv')
    edges = pd.read_csv(f'{data_dir}/elliptic_txs_edgelist.csv')
    
    classes['class'] = classes['class'].map({'1': 1, '2': 0, 'unknown': -1})
    tx_features = pd.merge(features, classes, left_on=0, right_on='txId', how='left')
    
    nodes = tx_features['txId'].values
    map_id = {j: i for i, j in enumerate(nodes)}
    
    edges['txId1'] = edges['txId1'].map(map_id)
    edges['txId2'] = edges['txId2'].map(map_id)
    edges = edges.dropna()
    
    edge_index = torch.tensor(np.array([edges['txId1'].values, edges['txId2'].values]), dtype=torch.long)
    x = torch.tensor(tx_features.iloc[:, 2:167].values, dtype=torch.float)
    y = torch.tensor(tx_features['class'].values, dtype=torch.long)
    time_steps = torch.tensor(tx_features.iloc[:, 1].values, dtype=torch.long)
    
    unique_timesteps = torch.unique(time_steps).sort()[0]
    snapshots = []
    
    for t in unique_timesteps:
        node_mask = (time_steps == t)
        node_indices = node_mask.nonzero(as_tuple=False).view(-1)
        original_tx_ids = nodes[node_mask.numpy()]
        
        edge_index_t, _ = subgraph(node_indices, edge_index, relabel_nodes=True, num_nodes=x.size(0))
        
        x_t = x[node_mask]
        y_t = y[node_mask]
        
        data_t = Data(x=x_t, edge_index=edge_index_t, y=y_t, time_step=t.item())
        data_t.labeled_mask = y_t != -1
        data_t.original_tx_ids = original_tx_ids
        snapshots.append(data_t)
        
    return snapshots

def main():
    print("Loading data...")
    snapshots = load_and_prep_data()
    num_features = snapshots[0].x.shape[1]
    
    model = EvolveGCNModel(num_features, 2).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)
    
    # Train for 20 epochs just to get a somewhat trained model rapidly
    train_snapshots = [s.to(device) for s in snapshots if s.time_step <= 34]
    all_snapshots = [s.to(device) for s in snapshots]
    
    print("Training EvolveGCN model for 25 epochs to capture fraud patterns...")
    model.train()
    for epoch in range(25):
        optimizer.zero_grad()
        outs = model(train_snapshots)
        loss = 0
        for out, data in zip(outs, train_snapshots):
            mask = data.labeled_mask
            if mask.sum() > 0:
                loss += F.cross_entropy(out[mask], data.y[mask])
        loss.backward()
        optimizer.step()
        if (epoch + 1) % 5 == 0:
            print(f"Epoch {epoch+1} Loss: {loss.item():.4f}")

    # Evaluate and predict
    print("\nExtracting predictions on Test Timestep 40...")
    model.eval()
    with torch.no_grad():
        outs = model(all_snapshots)
    
    # We will pick timestep 40 which is in the test set (future predicting)
    t_idx = 40 - 1 # 0-indexed
    data_t = snapshots[t_idx]
    out_t = outs[t_idx]
    
    preds = out_t.argmax(dim=1).cpu().numpy()
    true_labels = data_t.y.cpu().numpy()
    tx_ids = data_t.original_tx_ids
    
    # Filter only labeled nodes (0 = licit, 1 = illicit)
    mask = data_t.labeled_mask.cpu().numpy()
    tx_ids_labeled = tx_ids[mask]
    preds_labeled = preds[mask]
    true_labeled = true_labels[mask]
    
    # 1. Save results to CSV
    os.makedirs('results', exist_ok=True)
    df = pd.DataFrame({
        'Transaction_ID': tx_ids_labeled,
        'Predicted_Class': ['Fraud (Illicit)' if p == 1 else 'Licit' for p in preds_labeled],
        'Actual_Class': ['Fraud (Illicit)' if t == 1 else 'Licit' for t in true_labeled]
    })
    
    # Flag whether prediction was correct
    df['Correct'] = df['Predicted_Class'] == df['Actual_Class']
    
    csv_path = 'results/fraud_predictions_t40.csv'
    df.to_csv(csv_path, index=False)
    print(f"-> Saved detailed Fraud/Licit predictions to: {csv_path}")
    
    # 2. Generate Graph Plot using NetworkX
    print("Generating graph visualization...")
    edge_list = data_t.edge_index.cpu().numpy().T
    
    G = nx.Graph()
    G.add_edges_from(edge_list)
    
    # To make the graph readable, we extract a subgraph around fraudulent activity
    fraud_indices = np.where(preds == 1)[0]
    
    if len(fraud_indices) > 0:
        start_node = fraud_indices[0]
    else:
        # Fallback to true frauds if model missed or any random node
        true_frauds = np.where(true_labels == 1)[0]
        start_node = true_frauds[0] if len(true_frauds) > 0 else 0
        
    neighborhood = {start_node}
    
    # Gather 2-hop neighborhood
    for u, v in edge_list:
        if u in neighborhood: neighborhood.add(v)
        if v in neighborhood: neighborhood.add(u)
            
    for u, v in edge_list:
        if u in neighborhood: neighborhood.add(v)
        if v in neighborhood: neighborhood.add(u)
    
    subgraph_nodes = list(neighborhood)[:150] # Limit size for plotting
    sub_G = G.subgraph(subgraph_nodes)
    
    colors = []
    labels_dict = {}
    
    for node in sub_G.nodes():
        if not mask[node]:
            colors.append('lightgray') # Unknown
            labels_dict[node] = ''
        else:
            if preds[node] == 1:
                colors.append('red') # Predicted Fraud
                labels_dict[node] = 'F'
            else:
                colors.append('green') # Predicted Licit
                labels_dict[node] = 'L'
                
    plt.figure(figsize=(12, 10))
    pos = nx.spring_layout(sub_G, seed=42)
    
    nx.draw_networkx_nodes(sub_G, pos, node_color=colors, node_size=150, alpha=0.9, edgecolors='black')
    nx.draw_networkx_edges(sub_G, pos, edge_color='gray', alpha=0.5)
    nx.draw_networkx_labels(sub_G, pos, labels=labels_dict, font_size=8, font_color='white')
    
    # Legend
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], marker='o', color='w', label='Predicted Fraud', markerfacecolor='red', markersize=10, markeredgecolor='black'),
        Line2D([0], [0], marker='o', color='w', label='Predicted Licit', markerfacecolor='green', markersize=10, markeredgecolor='black'),
        Line2D([0], [0], marker='o', color='w', label='Unknown', markerfacecolor='lightgray', markersize=10, markeredgecolor='black')
    ]
    plt.legend(handles=legend_elements, loc='upper right')
    
    plt.title('Transaction Network Analysis (Timestep 40)\nShowing Fraud Clusters vs Licit Nodes')
    plt.axis('off')
    
    plot_path = 'results/fraud_network_t40.png'
    plt.savefig(plot_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"-> Saved network visualization to: {plot_path}")

if __name__ == '__main__':
    main()
