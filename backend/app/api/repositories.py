from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
from datetime import datetime

from app.db.collections import users_collection, repos_collection
from app.core.config import settings

from app.core.deps import get_current_user

router = APIRouter(prefix="/repos", tags=["Repositories"])


class ConnectRepoRequest(BaseModel):
    repo_id: int
    name: str
    full_name: str
    owner: str

@router.get("/github/{github_id}")
async def get_github_repos(github_id: int):
    user = await users_collection.find_one({"github_id": github_id}) 
    if not user: 
        raise HTTPException(status_code=404, detail="User not found")
    
    headers = {
        "Authorization": f"Bearer {user['access_token']}",
        "Accept": "application/vnd.github+json",
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user/repos",
            headers=headers,
            params={"per_page": 100},
        )
        
        return response.json()


async def create_github_webhook(user, repo_full_name: str):
    url = f"https://api.github.com/repos/{repo_full_name}/hooks"
    
    payload = {
        "name": "web",
        "active": True,
        "events": ["push", "pull_request", "issues", "create", "delete"],
        "config": {
            "url": f"{settings.BACKEND_BASE_URL}/webhooks/github",
            "content_type": "json",
            "secret": settings.GITHUB_WEBHOOK_SECRET,
        },
    }
    headers = {
        "Authorization": f"Bearer {user['access_token']}",
        "Accept": "application/vnd.github+json",
    }
    

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers)
        
        if response.status_code != 201:
            raise HTTPException(
                status_code=400,
                detail="failed to create webhook"
            )
        
        return response.json()


@router.post("/connect")
async def connect_repository(
    body: ConnectRepoRequest,
    user_id: str = Depends(get_current_user),
):
    user = await users_collection.find_one({"github_id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent duplicate connections
    existing = await repos_collection.find_one({
        "full_name": body.full_name,
        "user_id": user["_id"],
    })
    if existing:
        return {
            "message": "Repository already connected",
            "repo": body.full_name,
            "repo_id": str(existing["_id"]),
        }

    repo_data = {
        "repo_id": body.repo_id,
        "name": body.name,
        "full_name": body.full_name,
        "owner": body.owner,
        "user_id": user["_id"],
        "created_at": datetime.utcnow(),
    }

    result = await repos_collection.insert_one(repo_data)

    webhook_created = False
    webhook_error = None
    try:
        await create_github_webhook(user, body.full_name)
        webhook_created = True
    except Exception as exc:
        webhook_error = str(exc)

    response = {
        "message": "Repository connected successfully",
        "repo": body.full_name,
        "repo_id": str(result.inserted_id),
        "webhook_created": webhook_created,
    }
    if webhook_error:
        response["webhook_error"] = webhook_error

    return response


@router.get("/tracked")
async def get_tracked_repos(user_id: str = Depends(get_current_user)):
    """Get all repositories the user has connected/tracked."""
    user = await users_collection.find_one({"github_id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    cursor = repos_collection.find({"user_id": user["_id"]})
    repos = []
    async for repo in cursor:
        repo["_id"] = str(repo["_id"])
        repo["user_id"] = str(repo["user_id"])
        repos.append(repo)

    return repos


@router.delete("/disconnect/{repo_id}")
async def disconnect_repository(
    repo_id: str,
    user_id: str = Depends(get_current_user),
):
    """Disconnect/untrack a repository."""
    from bson import ObjectId

    user = await users_collection.find_one({"github_id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await repos_collection.delete_one({
        "_id": ObjectId(repo_id),
        "user_id": user["_id"],
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Repository not found")

    return {"message": "Repository disconnected"}