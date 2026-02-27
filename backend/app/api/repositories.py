from fastapi import APIRouter, HTTPException
import httpx
from datetime import datetime

from app.db.collections import users_collection, repos_collection
from app.core.config import settings 

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
    
    @router.post("/connect") 
    async def connect_repository(
        github_id: int,
        repo_id: int,
        name: str,
        full_name: str,
        owner: str,
    ):
        
        user = await users_collection.find_one({"github_id": github_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        webhook = await create_github_webhook(user, full_name)
        
        repo_data = {
            "repo_id": repo_id,
            "name": name,
            "full_name": full_name,
            "owner": owner,
            "user_id": user["_id"],
            "webhook_id": webhook["id"],
            "created_id": datetime.utcnow(),
        }
        
        await repos_collection.insert_one(repo_data)
        
        return {
            "message": "Repository connected successfully",
            "repo": full_name,
        }