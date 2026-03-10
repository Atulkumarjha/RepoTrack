from fastapi import APIRouter, Request, Header, HTTPException
from app.services.ws_manager import manager
from datetime import datetime
import hmac
import hashlib
import json

from app.core.config import settings as app_settings
from app.db.collections import repos_collection, activities_collection, database
from app.services.github_events import normalize_event

from app.services.notifications import (
    send_slack_message,
    send_discord_message,
    send_teams_message,
    send_telegram_message,
    send_custom_webhook,
)
from app.services.message_formatter import format_activity_message

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def verify_github_signature(payload: bytes, signature: str):
    mac = hmac.new(
        app_settings.GITHUB_WEBHOOK_SECRET.encode(), msg=payload, digestmod=hashlib.sha256
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
        raw_body, x_hub_signature_256
    ):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = json.loads(raw_body)

    activity = normalize_event(x_github_event, payload)
    if not activity:
        return {"status": "ignored"}

    repo_full_name = activity["repo_full_name"]
    repo = await repos_collection.find_one({"full_name": repo_full_name})

    if not repo:
        return {"status": "repo_not_connected"}

    repo_id = str(repo["_id"])
    activity["repo_id"] = repo_id

    await activities_collection.insert_one(activity)
    await manager.broadcast_to_repo(repo_id, activity)

    # Send notifications
    notification_settings = await database["notification_settings"].find_one({
        "repo_id": repo_id,
        "user_id": str(repo["user_id"]),
    })

    if notification_settings:
        text = format_activity_message(activity)

        if notification_settings.get("slack_webhook"):
            await send_slack_message(notification_settings["slack_webhook"], text)

        if notification_settings.get("discord_webhook"):
            await send_discord_message(notification_settings["discord_webhook"], text)

        if notification_settings.get("teams_webhook"):
            await send_teams_message(notification_settings["teams_webhook"], text)

        if notification_settings.get("telegram_webhook"):
            await send_telegram_message(notification_settings["telegram_webhook"], text)

        if notification_settings.get("custom_webhook"):
            await send_custom_webhook(notification_settings["custom_webhook"], text, activity)

    return {"status": "received"}
