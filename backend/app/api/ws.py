from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ws_manager import ConnectionManager 

from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws/activities")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        await websocket.close(code=1008)
        return 
    
    await manager.connect(websocket)