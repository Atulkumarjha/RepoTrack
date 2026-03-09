from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime


class UserCreate(BaseModel):
    github_id: int
    username: str
    avatar_url: Optional[str] = None
    access_token: str


class RepositoryCreate(BaseModel):
    repo_id: int
    name: str
    full_name: str
    owner: str
    user_id: str
    webhook_id: Optional[int] = None


class ActivityCreate(BaseModel):
    repo_id: str
    event_type: str
    actor: str
    message: str
    payload: Dict
    timestamp: datetime