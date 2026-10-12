import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
import torch
import pandas as pd
import numpy as np
from torch_geometric.data import Data
import torch.nn.functional as F
from torch_geometric.utils import subgraph

# Import models
from custom_gat.model import GAT
from models.evolvegcn import EvolveGCNModel

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def load_data_temporal():
    print("Loading dataset for temporal processing...")
    data_dir = 'D:/Programming/Projects/GFA Data/elliptic_bitcoin_dataset'
    
    # Load features
    features = pd.read_csv(f'{data_dir}/elliptic_txs_features.csv', header=None)
    
    # Load classes
    classes = pd.read_csv(f'{data_dir}/elliptic_txs_classes.csv')
    
    # Load edges
    edges = pd.read_csv(f'{data_dir}/elliptic_txs_edgelist.csv')
    
    # Map classes: 1 (illicit) -> 1, 2 (licit) -> 0, unknown -> -1
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
    
    # Create temporal snapshots
    unique_timesteps = torch.unique(time_steps).sort()[0]
    snapshots = []
    
    for t in unique_timesteps:
        # Get nodes for this timestep
        node_mask = (time_steps == t)
        node_indices = node_mask.nonzero(as_tuple=False).view(-1)
        
        # Subgraph will reindex the nodes from 0 to N_t - 1
        edge_index_t, _ = subgraph(node_indices, edge_index, relabel_nodes=True, num_nodes=x.size(0))
        
        x_t = x[node_mask]
        y_t = y[node_mask]
        
        # Mask for labeled nodes (known classes)
        labeled_mask = y_t != -1
        
        data_t = Data(x=x_t, edge_index=edge_index_t, y=y_t, time_step=t.item())
        data_t.labeled_mask = labeled_mask
        snapshots.append(data_t)
        
    return snapshots

def train_temporal(snapshots, model_type='evolvegcn'):
    num_features = snapshots[0].x.shape[1]
    num_classes = 2
    
    if model_type == 'evolvegcn':
        model = EvolveGCNModel(num_features, num_classes).to(device)
    else:
        # Static GAT model applied to temporal data
        # We need to re-initialize it for comparison, or just use the same instance 
        # but GAT does not carry state across time.
        model = GAT(num_of_layers=2, 
                    num_heads_per_layer=[8, 1], 
                    num_features_per_layer=[num_features, 64, num_classes], 
                    device=device).to(device)

    optimizer = torch.optim.Adam(model.parameters(), lr=0.005, weight_decay=5e-4)
    
    # Train on first 34 timesteps, test on the rest (early-timestep prediction testing)
    train_snapshots = [s.to(device) for s in snapshots if s.time_step <= 34]
    test_snapshots = [s.to(device) for s in snapshots if s.time_step > 34]
    
    print(f"\n--- Training {model_type.upper()} ---")
    for epoch in range(1, 101):
        model.train()
        optimizer.zero_grad()
        
        if model_type == 'evolvegcn':
            outs = model(train_snapshots)
            loss = 0
            for out, data in zip(outs, train_snapshots):
                mask = data.labeled_mask
                if mask.sum() > 0:
                    loss += F.cross_entropy(out[mask], data.y[mask])
            loss.backward()
            optimizer.step()
        else:
            # Static GAT
            loss = 0
            for data in train_snapshots:
                out, _ = model((data.x, data.edge_index))
                mask = data.labeled_mask
                if mask.sum() > 0:
                    loss += F.cross_entropy(out[mask], data.y[mask])
            loss.backward()
            optimizer.step()
            
        if epoch % 10 == 0:
            model.eval()
            with torch.no_grad():
                # Evaluate on Train
                train_accs = []
                if model_type == 'evolvegcn':
                    train_outs = model(train_snapshots)
                    for out, data in zip(train_outs, train_snapshots):
                        mask = data.labeled_mask
                        if mask.sum() > 0:
                            pred = out.argmax(dim=1)
                            acc = (pred[mask] == data.y[mask]).sum().item() / mask.sum().item()
                            train_accs.append(acc)
                else:
                    for data in train_snapshots:
                        out, _ = model((data.x, data.edge_index))
                        mask = data.labeled_mask
                        if mask.sum() > 0:
                            pred = out.argmax(dim=1)
                            acc = (pred[mask] == data.y[mask]).sum().item() / mask.sum().item()
                            train_accs.append(acc)
                
                # Evaluate on Test (early prediction - seeing new timesteps sequentially)
                test_accs = []
                if model_type == 'evolvegcn':
                    # To test on future timesteps, we need to pass all snapshots so weights evolve
                    # from 1 to 49.
                    all_snapshots = train_snapshots + test_snapshots
                    all_outs = model(all_snapshots)
                    test_outs = all_outs[len(train_snapshots):]
                    for out, data in zip(test_outs, test_snapshots):
                        mask = data.labeled_mask
                        if mask.sum() > 0:
                            pred = out.argmax(dim=1)
                            acc = (pred[mask] == data.y[mask]).sum().item() / mask.sum().item()
                            test_accs.append(acc)
                else:
                    for data in test_snapshots:
                        out, _ = model((data.x, data.edge_index))
                        mask = data.labeled_mask
                        if mask.sum() > 0:
                            pred = out.argmax(dim=1)
                            acc = (pred[mask] == data.y[mask]).sum().item() / mask.sum().item()
                            test_accs.append(acc)
                
                train_acc = sum(train_accs) / len(train_accs) if train_accs else 0
                test_acc = sum(test_accs) / len(test_accs) if test_accs else 0
                print(f'Epoch {epoch:03d}: Loss: {loss.item():.4f}, Train Acc: {train_acc:.4f}, Test Acc: {test_acc:.4f}', flush=True)

if __name__ == '__main__':
    snapshots = load_data_temporal()
    
    # Train Static GAT (Baseline)
    train_temporal(snapshots, model_type='gat')
    
    # Train Temporal EvolveGCN (New approach)
    train_temporal(snapshots, model_type='evolvegcn')
