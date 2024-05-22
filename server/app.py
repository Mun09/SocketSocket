from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, json

app = FastAPI()

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}
        self.next_client_id = 1
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        client_id = self.next_client_id
        self.next_client_id += 1
        self.active_connections[client_id] = websocket
    
        return client_id

    def disconnect(self, client_id: int):
        del self.active_connections[client_id]
    
    async def send_personal_message(self, client_id: int, message: str):
        await self.active_connections[client_id].send_text(message)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/")
async def websocket_endpoint(websocket: WebSocket):
    client_id = await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            parsed = json.loads(data)
            print(parsed)
            message = parsed['message']

            await manager.broadcast(f"Client #{client_id} says: {message}")

    except WebSocketDisconnect:
        manager.disconnect(client_id)
        await manager.broadcast(f"Client #{client_id} left the chat")

if __name__=="__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
