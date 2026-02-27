from fastapi import APIRouter, Request, Header, HTTPException 
from datetime import datetime 
import hmac 
import hashlib 
import json 

from app.core.config import settings 
from app.db.collections import repos_collection, activities_collection 

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

def verify_github_signature(payload: bytes, signature: str):
    mac = hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode(),
        msg=payload,
        digestmod=hashlib.sha256
    )
    expected_signature = "sha256=" + mac.hexdigest()
    return hmac.compare_digest(expected_signature, signature)

@router.post("/github")
async def github_webhook(
    request: Request,
    x_hub_signature_256: str = Header(None),
    x_github_event: str = Header(None),
):
    
    raw_body = await request.body()
    
    if not x_hub_signature_256 or not verify_github_signature(
        
    )