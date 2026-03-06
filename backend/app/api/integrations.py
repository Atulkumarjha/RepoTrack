from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.deps import get_current_user
from app.db.collections import database

router = APIRouter(prefix="/integrations", tags=["Integrations"])


class IntegrationRequest(BaseModel):
    repo_id: str
    slack_webhook: str | None = None
    discord_webhook: str | None = None
    telegram_webhook: str | None = None
    email_address: str | None = None
    teams_webhook: str | None = None
    custom_webhook: str | None = None


@router.post("/connect")
async def save_integration(
    body: IntegrationRequest,
    user_id: str = Depends(get_current_user),
):
    update_data: dict = {}
    for field in [
        "slack_webhook",
        "discord_webhook",
        "telegram_webhook",
        "email_address",
        "teams_webhook",
        "custom_webhook",
    ]:
        value = getattr(body, field, None)
        if value is not None:
            update_data[field] = value

    if update_data:
        await database["notification_settings"].update_one(
            {"repo_id": body.repo_id},
            {"$set": update_data},
            upsert=True,
        )

    return {"message": "Integration saved"}


@router.get("/{repo_id}")
async def get_integrations(
    repo_id: str,
    user_id: str = Depends(get_current_user),
):
    doc = await database["notification_settings"].find_one({"repo_id": repo_id})
    if not doc:
        return {}

    doc.pop("_id", None)
    doc.pop("repo_id", None)
    return doc


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
        upsert=True,
    )

    return {"message": "Notification settings saved"}