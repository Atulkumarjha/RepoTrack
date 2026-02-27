from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.repositories import router as repo_router
from app.api.webhooks import router as webhook_router
from app.api.ws import router as ws_router

app = FastAPI(title="RepoTrack API")

app.include_router(auth_router)
app.include_router(repo_router)
app.include_router(webhook_router)
app.include_router(ws_router)

@app.get("/")
def health_check():
    return {
        "status": "ok",
    }