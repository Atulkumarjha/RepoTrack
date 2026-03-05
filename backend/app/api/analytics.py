from fastapi import APIRouter, Depends
from bson import ObjectId

from app.db.collections import activities_collection
from app.core.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/event-types/{repo_id}")
async def event_type_distribution(
    repo_id: str, user_id: str = Depends(get_current_user)
):

    pipeline = [
        {"$match": {"repo_id": repo_id}},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
    ]

    results = []

    async for item in activities_collection.aggregate(pipeline):
        results.append(item)

    return results


@router.get("/top-contributors/{repo_id}")
async def top_contributors(repo_id: str, user_id: str = Depends(get_current_user)):

    pipeline = [
        {"$match": {"repo_id": repo_id}},
        {"$group": {"_id": "$actor", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]

    contributors = []

    async for item in activities_collection.aggregate(pipeline):
        contributors.append(item)

    return contributors


@router.get("/activity-timeline/{repo_id}")
async def activity_timeline(repo_id: str, user_id: str = Depends(get_current_user)):

    pipeline = [
        {"$match": {"repo_id": repo_id}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    timeline = []

    async for item in activities_collection.aggregate(pipeline):
        timeline.append(item)

    return timeline
