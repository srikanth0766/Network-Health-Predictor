import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from database import engine, Base, get_db, AsyncSessionLocal
from models import User, NetworkMetric, Alert
from auth import verify_password, create_access_token, get_current_user, require_admin, get_password_hash
import predictor
import recommendations
from telemetry_generator import telemetry_loop
from websocket import websocket_endpoint

# Database migration (table creation) helper
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Database seeding helper
async def seed_users():
    async with AsyncSessionLocal() as db:
        try:
            # Seed Admin
            admin_check = await db.execute(select(User).filter(User.username == "admin"))
            if not admin_check.scalars().first():
                admin_user = User(
                    username="admin",
                    hashed_password=get_password_hash("admin123"),
                    role="admin"
                )
                db.add(admin_user)
            
            # Seed Viewer
            viewer_check = await db.execute(select(User).filter(User.username == "viewer"))
            if not viewer_check.scalars().first():
                viewer_user = User(
                    username="viewer",
                    hashed_password=get_password_hash("viewer123"),
                    role="viewer"
                )
                db.add(viewer_user)
            
            await db.commit()
            print("Successfully processed user seeding.")
        except Exception as e:
            await db.rollback()
            print(f"Error during seeding: {e}")

# Application lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    await init_db()
    await seed_users()
    
    # Start the telemetry generator loop as an asyncio background task
    bg_task = asyncio.create_task(telemetry_loop())
    yield
    # Shutdown tasks
    bg_task.cancel()
    try:
        await bg_task
    except asyncio.CancelledError:
        pass

# Initialize application
app = FastAPI(title="NetWatch API", lifespan=lifespan)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic schemas for request validation
class LoginRequest(BaseModel):
    username: str
    password: str

class PredictRequest(BaseModel):
    latency_ms: float
    packet_loss_percent: float
    bandwidth_usage_percent: float
    connected_users: int
    cpu_usage_percent: float

# WebSocket route
@app.websocket("/ws")
async def ws_route(websocket: WebSocket):
    await websocket_endpoint(websocket)

# REST API routes
@app.post("/auth/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(User).filter(User.username == body.username))
        user = result.scalars().first()
        if not user or not verify_password(body.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="INVALID USERNAME OR PASSWORD"
            )
        
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DATABASE ERROR DURING LOGIN: {str(e)}"
        )

@app.get("/metrics/latest")
async def get_metrics_latest(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(NetworkMetric).order_by(NetworkMetric.timestamp.desc()).limit(1)
        )
        metric = result.scalars().first()
        if not metric:
            return {}
        return metric
    except Exception as e:
        print(f"Error fetching latest metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DATABASE ERROR FETCHING LATEST METRICS: {str(e)}"
        )

@app.get("/metrics/history")
async def get_metrics_history(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(NetworkMetric).order_by(NetworkMetric.timestamp.desc()).limit(100)
        )
        metrics = result.scalars().all()
        return metrics
    except Exception as e:
        print(f"Error fetching metrics history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DATABASE ERROR FETCHING HISTORY: {str(e)}"
        )

@app.post("/predict")
async def post_predict(body: PredictRequest, current_user: User = Depends(get_current_user)):
    try:
        res = predictor.predict(
            body.latency_ms,
            body.packet_loss_percent,
            body.bandwidth_usage_percent,
            body.connected_users,
            body.cpu_usage_percent
        )
        return res
    except Exception as e:
        print(f"Error in predict endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"PREDICTOR ERROR: {str(e)}"
        )

@app.get("/alerts")
async def get_alerts(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(Alert).order_by(Alert.timestamp.desc()).limit(50)
        )
        alerts = result.scalars().all()
        return alerts
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DATABASE ERROR FETCHING ALERTS: {str(e)}"
        )

@app.get("/recommendations")
async def get_recommendations_endpoint(current_user: User = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(
            select(NetworkMetric).order_by(NetworkMetric.timestamp.desc()).limit(1)
        )
        metric = result.scalars().first()
        if not metric:
            recs = recommendations.get_recommendations({})
        else:
            recs = recommendations.get_recommendations({
                "latency_ms": metric.latency_ms,
                "packet_loss_percent": metric.packet_loss_percent,
                "bandwidth_usage_percent": metric.bandwidth_usage_percent,
                "connected_users": metric.connected_users,
                "cpu_usage_percent": metric.cpu_usage_percent
            })
        
        return [{"text": rec} for rec in recs]
    except Exception as e:
        print(f"Error fetching recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DATABASE ERROR FETCHING RECOMMENDATIONS: {str(e)}"
        )
