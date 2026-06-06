import asyncio
import random
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from database import AsyncSessionLocal
from models import NetworkMetric, Alert
import predictor
import recommendations
from websocket import broadcast

MODES = ["NORMAL", "MODERATE", "CONGESTION", "RECOVERY"]
TICK_LIMIT = 100

class TelemetryState:
    def __init__(self):
        self.mode_idx = 0
        self.tick_count = 0
        self.prev_metrics = None
        
        # Recovery phase target state variables
        self.recovery_start_metrics = None
        self.recovery_target_metrics = None

    def get_mode_ranges(self, mode):
        if mode == "NORMAL":
            return {
                "latency_ms": (30.0, 60.0),
                "packet_loss_percent": (0.0, 1.0),
                "bandwidth_usage_percent": (20.0, 50.0),
                "connected_users": (50, 100),
                "cpu_usage_percent": (30.0, 60.0),
            }
        elif mode == "MODERATE":
            return {
                "latency_ms": (60.0, 100.0),
                "packet_loss_percent": (1.0, 4.0),
                "bandwidth_usage_percent": (50.0, 75.0),
                "connected_users": (100, 140),
                "cpu_usage_percent": (60.0, 80.0),
            }
        elif mode == "CONGESTION":
            return {
                "latency_ms": (100.0, 150.0),
                "packet_loss_percent": (3.0, 8.0),
                "bandwidth_usage_percent": (75.0, 98.0),
                "connected_users": (140, 200),
                "cpu_usage_percent": (80.0, 100.0),
            }
        return None

    def next_tick(self):
        mode = MODES[self.mode_idx]
        
        if mode == "RECOVERY":
            # Linear drift towards normal target
            t = self.tick_count / float(TICK_LIMIT)
            
            lat = self.recovery_start_metrics["latency_ms"] + (self.recovery_target_metrics["latency_ms"] - self.recovery_start_metrics["latency_ms"]) * t
            pl = self.recovery_start_metrics["packet_loss_percent"] + (self.recovery_target_metrics["packet_loss_percent"] - self.recovery_start_metrics["packet_loss_percent"]) * t
            bw = self.recovery_start_metrics["bandwidth_usage_percent"] + (self.recovery_target_metrics["bandwidth_usage_percent"] - self.recovery_start_metrics["bandwidth_usage_percent"]) * t
            u = int(self.recovery_start_metrics["connected_users"] + (self.recovery_target_metrics["connected_users"] - self.recovery_start_metrics["connected_users"]) * t)
            cpu = self.recovery_start_metrics["cpu_usage_percent"] + (self.recovery_target_metrics["cpu_usage_percent"] - self.recovery_start_metrics["cpu_usage_percent"]) * t
            
            # Add small random noise to keep signal look realistic
            lat += random.uniform(-1.0, 1.0)
            pl += random.uniform(-0.05, 0.05)
            bw += random.uniform(-0.5, 0.5)
            u += random.randint(-1, 1)
            cpu += random.uniform(-0.5, 0.5)
            
            # Clamp limits
            lat = max(20.0, min(150.0, lat))
            pl = max(0.0, min(10.0, pl))
            bw = max(0.0, min(100.0, bw))
            u = max(10, min(250, u))
            cpu = max(0.0, min(100.0, cpu))
            
            metrics = {
                "latency_ms": lat,
                "packet_loss_percent": pl,
                "bandwidth_usage_percent": bw,
                "connected_users": u,
                "cpu_usage_percent": cpu,
            }
        else:
            ranges = self.get_mode_ranges(mode)
            if self.prev_metrics is None:
                metrics = {
                    "latency_ms": sum(ranges["latency_ms"]) / 2.0,
                    "packet_loss_percent": sum(ranges["packet_loss_percent"]) / 2.0,
                    "bandwidth_usage_percent": sum(ranges["bandwidth_usage_percent"]) / 2.0,
                    "connected_users": sum(ranges["connected_users"]) // 2,
                    "cpu_usage_percent": sum(ranges["cpu_usage_percent"]) / 2.0,
                }
            else:
                lat_step = random.uniform(-5.0, 5.0)
                pl_step = random.uniform(-0.2, 0.2)
                bw_step = random.uniform(-3.0, 3.0)
                u_step = random.randint(-5, 5)
                cpu_step = random.uniform(-4.0, 4.0)
                
                lat = self.prev_metrics["latency_ms"] + lat_step
                pl = self.prev_metrics["packet_loss_percent"] + pl_step
                bw = self.prev_metrics["bandwidth_usage_percent"] + bw_step
                u = self.prev_metrics["connected_users"] + u_step
                cpu = self.prev_metrics["cpu_usage_percent"] + cpu_step
                
                # Clamp boundaries
                lat = max(ranges["latency_ms"][0], min(ranges["latency_ms"][1], lat))
                pl = max(ranges["packet_loss_percent"][0], min(ranges["packet_loss_percent"][1], pl))
                bw = max(ranges["bandwidth_usage_percent"][0], min(ranges["bandwidth_usage_percent"][1], bw))
                u = max(ranges["connected_users"][0], min(ranges["connected_users"][1], u))
                cpu = max(ranges["cpu_usage_percent"][0], min(ranges["cpu_usage_percent"][1], cpu))
                
                metrics = {
                    "latency_ms": lat,
                    "packet_loss_percent": pl,
                    "bandwidth_usage_percent": bw,
                    "connected_users": u,
                    "cpu_usage_percent": cpu,
                }

        self.prev_metrics = metrics
        self.tick_count += 1
        
        # Advance state
        if self.tick_count >= TICK_LIMIT:
            self.tick_count = 0
            self.mode_idx = (self.mode_idx + 1) % len(MODES)
            new_mode = MODES[self.mode_idx]
            
            if new_mode == "RECOVERY":
                self.recovery_start_metrics = dict(metrics)
                normal_ranges = self.get_mode_ranges("NORMAL")
                self.recovery_target_metrics = {
                    "latency_ms": random.uniform(*normal_ranges["latency_ms"]),
                    "packet_loss_percent": random.uniform(*normal_ranges["packet_loss_percent"]),
                    "bandwidth_usage_percent": random.uniform(*normal_ranges["bandwidth_usage_percent"]),
                    "connected_users": random.randint(*normal_ranges["connected_users"]),
                    "cpu_usage_percent": random.uniform(*normal_ranges["cpu_usage_percent"]),
                }
            
        return metrics

async def save_telemetry_tick(metrics_data: dict):
    # 2. Call predictor.predict(...)
    pred = predictor.predict(
        metrics_data["latency_ms"],
        metrics_data["packet_loss_percent"],
        metrics_data["bandwidth_usage_percent"],
        metrics_data["connected_users"],
        metrics_data["cpu_usage_percent"]
    )
    
    # 3. Call recommendations.get_recommendations(...)
    recs = recommendations.get_recommendations(metrics_data)
    rec_text = "\n".join(recs)
    
    prob = pred["probability"]
    status = pred["status"]
    
    async with AsyncSessionLocal() as db:
        try:
            # 4. Insert full row into network_metrics table
            metric_row = NetworkMetric(
                latency_ms=metrics_data["latency_ms"],
                packet_loss_percent=metrics_data["packet_loss_percent"],
                bandwidth_usage_percent=metrics_data["bandwidth_usage_percent"],
                connected_users=metrics_data["connected_users"],
                cpu_usage_percent=metrics_data["cpu_usage_percent"],
                congestion_probability=float(prob),
                status=status,
                recommendation=rec_text
            )
            db.add(metric_row)
            await db.commit()
            await db.refresh(metric_row)
            
            # Prep metric dictionary
            ts_str = metric_row.timestamp.isoformat() if metric_row.timestamp else datetime.utcnow().isoformat()
            payload_metrics = {
                "timestamp": ts_str,
                "latency_ms": metric_row.latency_ms,
                "packet_loss_percent": metric_row.packet_loss_percent,
                "bandwidth_usage_percent": metric_row.bandwidth_usage_percent,
                "connected_users": metric_row.connected_users,
                "cpu_usage_percent": metric_row.cpu_usage_percent,
                "congestion_probability": prob
            }
            
            alert_payload = None
            # 5. If probability > 80: insert alert row
            if prob > 80:
                alert_msg = f"⚠ HIGH RISK — NETWORK CONGESTION PREDICTED WITHIN NEXT MONITORING WINDOW"
                alert_row = Alert(
                    message=alert_msg,
                    probability=float(prob),
                    metric_id=metric_row.id
                )
                db.add(alert_row)
                await db.commit()
                await db.refresh(alert_row)
                
                alert_ts_str = alert_row.timestamp.isoformat() if alert_row.timestamp else datetime.utcnow().isoformat()
                alert_payload = {
                    "timestamp": alert_ts_str,
                    "message": alert_row.message,
                    "probability": prob
                }
            
            # 6. Call broadcast(payload)
            payload = {
                "metrics": payload_metrics,
                "prediction": {
                    "probability": prob,
                    "status": status
                },
                "alert": alert_payload
            }
            await broadcast(payload)
            
        except Exception as e:
            await db.rollback()
            print(f"Error saving telemetry tick: {e}")

async def telemetry_loop():
    state = TelemetryState()
    while True:
        try:
            metrics_data = state.next_tick()
            await save_telemetry_tick(metrics_data)
        except Exception as e:
            # Telemetry generator: catch per tick, log, never crash the loop
            print(f"Telemetry generator error on tick: {e}")
        await asyncio.sleep(5)
