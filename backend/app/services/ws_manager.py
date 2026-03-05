from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    def __init__(self):
        # repo_id → list of sockets
        self.repo_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, repo_id: str):
        await websocket.accept()

        if repo_id not in self.repo_connections:
            self.repo_connections[repo_id] = []

        self.repo_connections[repo_id].append(websocket)

    def disconnect(self, websocket: WebSocket, repo_id: str):
        if repo_id in self.repo_connections:
            self.repo_connections[repo_id].remove(websocket)

            if not self.repo_connections[repo_id]:
                del self.repo_connections[repo_id]

    async def broadcast_to_repo(self, repo_id: str, message: dict):
        if repo_id not in self.repo_connections:
            return

        for connection in self.repo_connections[repo_id]:
            await connection.send_json(message)


manager = ConnectionManager()