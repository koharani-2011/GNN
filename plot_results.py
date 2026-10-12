import matplotlib.pyplot as plt
import os

def plot_metrics():
    # Ensure results directory exists
    os.makedirs('results', exist_ok=True)
    
    # Real data from the recent training run
    epochs = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    loss = [0.2401, 0.1954, 0.1827, 0.1737, 0.1688, 0.1661, 0.1679, 0.1641, 0.1608, 0.1619]
    train_acc = [0.9276, 0.9520, 0.9523, 0.9570, 0.9591, 0.9624, 0.9635, 0.9622, 0.9633, 0.9636]
    test_acc = [0.8174, 0.9216, 0.8999, 0.9088, 0.9205, 0.9248, 0.9287, 0.9284, 0.9263, 0.9277]

    plt.figure(figsize=(12, 5))
    
    # Plot Accuracy
    plt.subplot(1, 2, 1)
    plt.plot(epochs, train_acc, marker='o', label='Train Accuracy', color='blue')
    plt.plot(epochs, test_acc, marker='o', label='Test Accuracy', color='orange')
    plt.title('Training & Test Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.grid(True)
    plt.legend()
    
    # Plot Loss
    plt.subplot(1, 2, 2)
    plt.plot(epochs, loss, marker='o', label='Loss', color='red')
    plt.title('Training Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Cross Entropy Loss')
    plt.grid(True)
    plt.legend()
    
    plt.tight_layout()
    
    # Save the plot
    output_path = os.path.join('results', 'training_metrics.png')
    plt.savefig(output_path, dpi=300)
    print(f"Chart successfully saved to {output_path}")

if __name__ == '__main__':
    plot_metrics()
