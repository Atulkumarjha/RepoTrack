from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.repositories import router as repo_router
from app.api.webhooks import router as webhook_router
from app.api.ws import router as ws_router
from app.api.activities import router as activities_router
from app.api.analytics import router as analytics_router
from app.api.integrations import router as integrations_router
from app.core.config import settings


app = FastAPI(title="RepoTrack API")

# Configure CORS - allow frontend URL from environment
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add production frontend URL if set
if hasattr(settings, 'FRONTEND_URL') and settings.FRONTEND_URL:
    allowed_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(repo_router)
app.include_router(webhook_router)
app.include_router(ws_router)
app.include_router(activities_router)
app.include_router(analytics_router)
app.include_router(integrations_router)


@app.get("/")
def health_check():
    return {
        "status": "ok",
    }