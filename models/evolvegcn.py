import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn.conv import MessagePassing
from torch_geometric.utils import add_self_loops, degree
import math

class EvolveGCNOLayer(MessagePassing):
    def __init__(self, in_channels, out_channels):
        super(EvolveGCNOLayer, self).__init__(aggr='add')  # "Add" aggregation.
        self.in_channels = in_channels
        self.out_channels = out_channels
        
        # EvolveGCN-O uses a GRU to evolve the GCN weights.
        # The GRU takes the previous weights as both hidden state and input.
        # To match dimensions, GRU input_size and hidden_size is in_channels.
        # Since weight matrix is (in_channels, out_channels), we treat out_channels as the sequence length or batch.
        self.weight_rnn = nn.GRU(input_size=in_channels, hidden_size=in_channels, batch_first=True)
        
        # Initial weights
        self.initial_weight = nn.Parameter(torch.Tensor(in_channels, out_channels))
        self.reset_parameters()

    def reset_parameters(self):
        stdv = 1. / math.sqrt(self.out_channels)
        self.initial_weight.data.uniform_(-stdv, stdv)

    def forward(self, x, edge_index, W_prev=None):
        if W_prev is None:
            W_prev = self.initial_weight
            
        # Reshape W_prev for GRU: (batch, seq, feature)
        # We can view it as (out_channels, 1, in_channels)
        W_in = W_prev.t().unsqueeze(1)
        
        # GRU forward
        # W_in: (out_channels, 1, in_channels)
        # hidden state h_0: (1, out_channels, in_channels) -> wait, GRU hidden state is (num_layers, batch, hidden_size)
        # so h_0 should be (1, out_channels, in_channels)
        out, h_n = self.weight_rnn(W_in)
        
        # New weights
        # out is (out_channels, 1, in_channels)
        W_new = out.squeeze(1).t() # (in_channels, out_channels)
        
        # Add self-loops to the adjacency matrix.
        edge_index, _ = add_self_loops(edge_index, num_nodes=x.size(0))
        
        # Compute normalization.
        row, col = edge_index
        deg = degree(col, x.size(0), dtype=x.dtype)
        deg_inv_sqrt = deg.pow(-0.5)
        deg_inv_sqrt[deg_inv_sqrt == float('inf')] = 0
        norm = deg_inv_sqrt[row] * deg_inv_sqrt[col]
        
        # Project node features
        x_proj = torch.matmul(x, W_new)
        
        # Start propagating messages.
        out_features = self.propagate(edge_index, x=x_proj, norm=norm)
        
        return out_features, W_new

    def message(self, x_j, norm):
        return norm.view(-1, 1) * x_j

class EvolveGCNModel(nn.Module):
    def __init__(self, num_features, num_classes):
        super(EvolveGCNModel, self).__init__()
        self.layer1 = EvolveGCNOLayer(num_features, 64)
        self.layer2 = EvolveGCNOLayer(64, num_classes)

    def forward(self, data_list):
        """
        data_list: list of Data objects, one for each timestep.
        Returns: list of node embeddings for each timestep.
        """
        W1_prev, W2_prev = None, None
        outputs = []
        
        for data in data_list:
            x, edge_index = data.x, data.edge_index
            
            x, W1_prev = self.layer1(x, edge_index, W1_prev)
            x = F.relu(x)
            x = F.dropout(x, p=0.5, training=self.training)
            
            x, W2_prev = self.layer2(x, edge_index, W2_prev)
            
            outputs.append(x)
            
        return outputs
