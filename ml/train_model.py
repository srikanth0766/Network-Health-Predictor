import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib

def train_model():
    csv_path = 'ml/network_data.csv'
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}. Please run generate_dataset.py first.")

    df = pd.read_csv(csv_path)

    features = [
        'latency_ms',
        'packet_loss_percent',
        'bandwidth_usage_percent',
        'connected_users',
        'cpu_usage_percent'
    ]
    target = 'congestion'

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")

    assert acc > 0.85, f"Model accuracy ({acc:.4f}) is below the 85% requirement!"
    print("Assertion passed: accuracy > 85%.")

    model_path = 'ml/congestion_model.pkl'
    joblib.dump(model, model_path)
    print(f"Model successfully saved to {model_path}")

if __name__ == '__main__':
    train_model()
