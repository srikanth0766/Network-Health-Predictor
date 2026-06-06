from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class NetworkMetric(Base):
    __tablename__ = "network_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    latency_ms = Column(Float, nullable=False)
    packet_loss_percent = Column(Float, nullable=False)
    bandwidth_usage_percent = Column(Float, nullable=False)
    connected_users = Column(Integer, nullable=False)
    cpu_usage_percent = Column(Float, nullable=False)
    congestion_probability = Column(Float, nullable=True)
    status = Column(String(20), nullable=True)
    recommendation = Column(Text, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    message = Column(Text, nullable=True)
    probability = Column(Float, nullable=True)
    metric_id = Column(Integer, ForeignKey("network_metrics.id"), nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String(10), server_default="viewer", nullable=False)
