from fastapi import APIRouter, Depends
from bson import ObjectId

from app.db.collections import activities_collection
from app.core.deps import get_current_user

router = APIRouter(prefix="/activities", tags=["Activities"])


@router.get("/{repo_id}")
async def get_repo_activities(
    repo_id: str,
    limit: int = 20,
    skip: int = 0,
    user_id: str = Depends(get_current_user),
):

    query = {"repo_id": repo_id}

    cursor = (
        activities_collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    )

    activities = []

    async for activity in cursor:
        activity["_id"] = str(activity["_id"])
        activities.append(activity)

    total = await activities_collection.count_documents(query)

    return {"activities": activities, "total": total}
