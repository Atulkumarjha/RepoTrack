import httpx

async def send_slack_message(webhook_url: str, text: str):
    
    payload = {
        "text": text
    }
    
    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)
        
        
async def send_discord_message(webhook_url: str, text: str):
    
    payload = {
        "content": text
    }
    
    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)


async def send_teams_message(webhook_url: str, text: str):
    payload = {
        "text": text
    }

    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)


async def send_telegram_message(webhook_url: str, text: str):
    payload = {
        "text": text,
        "parse_mode": "Markdown"
    }

    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)


async def send_custom_webhook(webhook_url: str, text: str, activity: dict):
    payload = {
        "text": text,
        "activity": activity,
    }

    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)