import os
import joblib

# Define possible locations for the model
possible_paths = [
    "/app/ml/congestion_model.pkl",
    "ml/congestion_model.pkl",
    "../ml/congestion_model.pkl",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "ml/congestion_model.pkl"),
    os.path.join(os.path.dirname(__file__), "congestion_model.pkl")
]

model = None
for p in possible_paths:
    if os.path.exists(p):
        try:
            model = joblib.load(p)
            print(f"Predictor loaded model from: {p}")
            break
        except Exception as e:
            print(f"Error loading model from {p}: {e}")

if model is None:
    raise FileNotFoundError("Could not locate congestion_model.pkl on import. Ensure train_model.py has run.")

def predict(latency, packet_loss, bandwidth, users, cpu) -> dict:
    try:
        # Validate, coerce and clamp input values to prevent crash on edge values
        lat_val = float(latency) if latency is not None else 0.0
        pl_val = float(packet_loss) if packet_loss is not None else 0.0
        bw_val = float(bandwidth) if bandwidth is not None else 0.0
        u_val = int(users) if users is not None else 0
        cpu_val = float(cpu) if cpu is not None else 0.0
        
        # Clamp values
        lat_val = max(0.0, lat_val)
        pl_val = max(0.0, min(100.0, pl_val))
        bw_val = max(0.0, min(100.0, bw_val))
        u_val = max(0, u_val)
        cpu_val = max(0.0, min(100.0, cpu_val))
        
        # Features: latency_ms, packet_loss_percent, bandwidth_usage_percent, connected_users, cpu_usage_percent
        import pandas as pd
        df_features = pd.DataFrame(
            [[lat_val, pl_val, bw_val, u_val, cpu_val]],
            columns=['latency_ms', 'packet_loss_percent', 'bandwidth_usage_percent', 'connected_users', 'cpu_usage_percent']
        )
        prob_arr = model.predict_proba(df_features)
        prob = int(prob_arr[0][1] * 100)
        
        status = "Low Risk" if prob <= 30 else "Medium Risk" if prob <= 70 else "High Risk"
        return {"probability": prob, "status": status}
    except Exception as e:
        print(f"Predictor exception occurred: {e}")
        # Robust fallback
        return {"probability": 0, "status": "Low Risk"}
