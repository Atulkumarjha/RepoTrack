from fastapi import APIRouter, HTTPException, Depends
import httpx
from datetime import datetime

from app.db.collections import users_collection, repos_collection
from app.core.config import settings 

from app.core.deps import get_current_user

router = APIRouter(prefix="/repos", tags=["Repositories"])

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
            "url": "http://your-backend-url/webhooks/github",
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

from pydantic import BaseModel

class ConnectRepoRequest(BaseModel):
    repo_id: int
    name: str
    full_name: str
    owner: str

@router.post("/connect")
async def connect_repository(
    body: ConnectRepoRequest,
    user_id: str = Depends(get_current_user),
):
    
    user = await users_collection.find_one({"github_id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create webhook (optional - comment out if not using webhooks locally)
    # webhook = await create_github_webhook(user, body.full_name)
    
    repo_data = {
        "repo_id": body.repo_id,
        "name": body.name,
        "full_name": body.full_name,
        "owner": body.owner,
        "user_id": user["_id"],
        # "webhook_id": webhook["id"],
        "created_at": datetime.utcnow(),
    }
    
    result = await repos_collection.insert_one(repo_data)
    
    return {
        "message": "Repository connected successfully",
        "repo": body.full_name,
        "repo_id": str(result.inserted_id),
    }