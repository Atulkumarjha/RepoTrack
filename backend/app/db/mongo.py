import certifi
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings


client = AsyncIOMotorClient(
	settings.MONGO_URI,
	tls=True,
	tlsCAFile=certifi.where(),
	serverSelectionTimeoutMS=10000,
	connectTimeoutMS=10000,
)
database = client[settings.MONGO_DB_NAME]