from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.ws_manager import ConnectionManager 

from jose import jwt, JWTError
from app.core.security import SECRET_KEY, ALGORITHM

router = APIRouter()
manager = ConnectionManager()

@router.websocket("/ws/activities/{repo_id}")
async def websocket_endpoint(websocket: WebSocket, repo_id: str):
    token = websocket.query_params.get("token")
    
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        await websocket.close(code=1008)
        return 
    
    await manager.connect(websocket, repo_id)
    
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, repo_id)