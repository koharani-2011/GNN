import os
import torch
import pandas as pd
import numpy as np
from torch_geometric.data import Data
import torch.nn.functional as F
from custom_gat.model import GAT

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def load_data():
    print("Loading datasets...")
    data_dir = 'data/elliptic_bitcoin_dataset'
    
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
    
    # Fix numpy tensor warning
    edge_index = torch.tensor(np.array([edges['txId1'].values, edges['txId2'].values]), dtype=torch.long)
    
    x = torch.tensor(tx_features.iloc[:, 2:167].values, dtype=torch.float)
    y = torch.tensor(tx_features['class'].values, dtype=torch.long)
    time_steps = torch.tensor(tx_features.iloc[:, 1].values, dtype=torch.long)
    
    data = Data(x=x, edge_index=edge_index, y=y)
    data.time_steps = time_steps
    
    labeled_mask = data.y != -1
    train_mask = labeled_mask & (data.time_steps <= 34)
    test_mask = labeled_mask & (data.time_steps > 34)
    
    data.train_mask = train_mask
    data.test_mask = test_mask
    
    return data

def train():
    data = load_data().to(device)
    
    num_features = data.x.shape[1]
    num_classes = 2
    
    num_layers = 2
    num_heads = [8, 1]
    num_features_per_layer = [num_features, 64, num_classes]
    
    model = GAT(num_of_layers=num_layers, 
                num_heads_per_layer=num_heads, 
                num_features_per_layer=num_features_per_layer, 
                device=device).to(device)
    
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005, weight_decay=5e-4)
    
    print("Starting training on", device, flush=True)
    for epoch in range(1, 101):
        model.train()
        optimizer.zero_grad()
        
        out, _ = model((data.x, data.edge_index))
        
        loss = F.cross_entropy(out[data.train_mask], data.y[data.train_mask])
        loss.backward()
        optimizer.step()
        
        if epoch % 10 == 0:
            model.eval()
            with torch.no_grad():
                out, _ = model((data.x, data.edge_index))
                pred = out.argmax(dim=1)
                train_acc = (pred[data.train_mask] == data.y[data.train_mask]).sum().item() / data.train_mask.sum().item()
                test_acc = (pred[data.test_mask] == data.y[data.test_mask]).sum().item() / data.test_mask.sum().item()
                print(f'Epoch: {epoch:03d}, Loss: {loss:.4f}, Train Acc: {train_acc:.4f}, Test Acc: {test_acc:.4f}', flush=True)

if __name__ == '__main__':
    train()
