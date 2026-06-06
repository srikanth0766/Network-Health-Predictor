def get_recommendations(metrics: dict) -> list[str]:
    recs = []
    if metrics.get("latency_ms", 0.0) > 80.0:
        recs.append("Check for overloaded routers on the core uplink — high latency detected.")
    if metrics.get("packet_loss_percent", 0.0) > 3.0:
        recs.append("Inspect physical network links — packet loss exceeds 3%.")
    if metrics.get("cpu_usage_percent", 0.0) > 85.0:
        recs.append("Enable load balancing — CPU usage critical on network nodes.")
    if metrics.get("connected_users", 0) > 150:
        recs.append("Redistribute clients to secondary access points — user count exceeds threshold.")
    if not recs:
        recs.append("Network operating within normal parameters.")
    return recs
