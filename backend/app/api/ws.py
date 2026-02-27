from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ws_manager import ConnectionManager 

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws/activities")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try: 
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)