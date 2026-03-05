import httpx

async def send_slack_message(webhook_url: str, text: str):
    
    payload = {
        "text": text
    }
    
    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)
        
        
async def send_dscord_message(webhook_url: str, text: str):
    
    payload = {
        "content": text
    }
    
    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)