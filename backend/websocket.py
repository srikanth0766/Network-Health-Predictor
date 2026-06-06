import json
from fastapi import WebSocket, WebSocketDisconnect
from auth import verify_token

# Set of active WebSocket connections
active_connections = set()

async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    payload = verify_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    active_connections.add(websocket)

    try:
        while True:
            # Keep the socket open and listen for client disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket connection error: {e}")
    finally:
        active_connections.discard(websocket)

async def broadcast(data: dict):
    payload = json.dumps(data)
    dead = set()
    for ws in active_connections:
        try:
            await ws.send_text(payload)
        except Exception:
            dead.add(ws)
    for ws in dead:
        active_connections.discard(ws)
