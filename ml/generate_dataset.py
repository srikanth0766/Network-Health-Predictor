import os
import numpy as np
import pandas as pd

def generate_dataset():
    np.random.seed(42)
    n_samples = 10000

    # Generate uniform base values
    latency_base = np.random.uniform(20, 150, n_samples)
    packet_loss_base = np.random.uniform(0, 8, n_samples)
    bandwidth_usage_base = np.random.uniform(20, 100, n_samples)
    connected_users = np.random.randint(10, 201, n_samples)
    cpu_usage_base = np.random.uniform(30, 100, n_samples)

    # Add Gaussian noise
    latency_ms = latency_base + np.random.normal(0, 5, n_samples)
    packet_loss_percent = packet_loss_base + np.random.normal(0, 0.3, n_samples)
    bandwidth_usage_percent = bandwidth_usage_base + np.random.normal(0, 3, n_samples)
    cpu_usage_percent = cpu_usage_base + np.random.normal(0, 4, n_samples)

    # Clamp boundaries
    latency_ms = np.maximum(0.0, latency_ms)
    packet_loss_percent = np.clip(packet_loss_percent, 0.0, 100.0)
    bandwidth_usage_percent = np.clip(bandwidth_usage_percent, 0.0, 100.0)
    cpu_usage_percent = np.clip(cpu_usage_percent, 0.0, 100.0)

    # Congestion logic
    congestion = (
        (latency_ms > 80.0) |
        (packet_loss_percent > 3.0) |
        (cpu_usage_percent > 85.0) |
        (connected_users > 150)
    ).astype(int)

    df = pd.DataFrame({
        'latency_ms': latency_ms,
        'packet_loss_percent': packet_loss_percent,
        'bandwidth_usage_percent': bandwidth_usage_percent,
        'connected_users': connected_users,
        'cpu_usage_percent': cpu_usage_percent,
        'congestion': congestion
    })

    # Ensure ml/ directory exists
    os.makedirs('ml', exist_ok=True)
    df.to_csv('ml/network_data.csv', index=False)
    print(f"Dataset successfully saved to ml/network_data.csv. Rows: {len(df)}")

if __name__ == '__main__':
    generate_dataset()
