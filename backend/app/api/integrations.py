from fastapi import APIRouter, Depends
from app,core.deps import get_current_user
from app.db.collections import database
router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.post("/notifications")
async def configure_notifications(
    repo_id: str,
    slack_webhook: str | None = None,
    discord_webhook: str | None = None,
    user_id: str = Depends(get_current_user),
):
    
    data = {
        "repo_id": repo_id,
        "slack_webhook": slack_webhook,
        "discord_webhook": discord_webhook,
    }
    
    await database["notification_settings"].update_one(
        {"repo_id": repo_id},
        {"$set": data},
        upsert=True
    )
    
    return {"message": "Notification settings saved"}