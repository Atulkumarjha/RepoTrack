from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from datetime import datetime 

from app.core.config import settings
from app.db.collections import users_collection

from app.core.security import create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/github/login")
def github_login():
    github_auth_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        "&scope=repo read:user"
    )
    return RedirectResponse(github_auth_url)


@router.get("/github/callback")
async def github_callback(code: str):
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
            },
        )
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(f"{frontend_url}/login?error=oauth_failed")
        
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
            )
            
            github_user = user_response.json()
            
            user_data = {
                "github_id": github_user["id"],
                "username": github_user["login"],
                "avatar_url": github_user.get("avatar_url"),
                "access_token": access_token,
                "created_at": datetime.utcnow(),
            }
            
            await users_collection.update_one(
                {"github_id": github_user["id"]},
                {"$set": user_data},
                upsert=True,
            )
            
            token = create_access_token({
                "sub": str(github_user["id"])
            })
            
            # Redirect to frontend callback with JWT token
            return RedirectResponse(
                f"{frontend_url}/callback?token={token}&username={github_user['login']}"
            )


@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    user = await users_collection.find_one({"github_id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "github_id": user["github_id"],
        "username": user["username"],
        "avatar_url": user.get("avatar_url"),
    }