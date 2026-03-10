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

# Add configured frontend URL
if settings.FRONTEND_URL:
    frontend_origin = settings.FRONTEND_URL.rstrip("/")
    if frontend_origin not in allowed_origins:
        allowed_origins.append(frontend_origin)

# Optional extra origins via env var: "https://a.com,https://b.com"
if settings.CORS_ORIGINS:
    extra_origins = [origin.strip().rstrip("/") for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
    for origin in extra_origins:
        if origin not in allowed_origins:
            allowed_origins.append(origin)

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