from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
import httpx

from app.db.collections import activities_collection, repos_collection, users_collection
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


@router.get("/github-events/{repo_full_name:path}")
async def get_github_events(
    repo_full_name: str,
    limit: int = 30,
    user_id: str = Depends(get_current_user),
):
    """Fetch recent events directly from the GitHub API for a repo.
    This is used as a fallback when there are no stored webhook activities yet.
    """
    user = await users_collection.find_one({"github_id": int(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    headers = {
        "Authorization": f"Bearer {user['access_token']}",
        "Accept": "application/vnd.github+json",
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.github.com/repos/{repo_full_name}/events",
            headers=headers,
            params={"per_page": min(limit, 100)},
        )

        if response.status_code != 200:
            return {"events": []}

        raw_events = response.json()

    # Map GitHub API event types to the simpler names used by webhooks
    _TYPE_MAP = {
        "PushEvent": "push",
        "PullRequestEvent": "pull_request",
        "IssuesEvent": "issues",
        "IssueCommentEvent": "issue_comment",
        "CreateEvent": "create",
        "DeleteEvent": "delete",
        "WatchEvent": "star",
        "ForkEvent": "fork",
        "ReleaseEvent": "release",
        "PullRequestReviewEvent": "pull_request_review",
        "PullRequestReviewCommentEvent": "pull_request_review_comment",
    }

    events = []
    for event in raw_events:
        raw_type = event.get("type", "")
        actor = event.get("actor", {}).get("login", "unknown")
        created_at = event.get("created_at", "")
        payload = event.get("payload", {})

        message = _format_github_event(raw_type, payload)

        events.append({
            "event_type": _TYPE_MAP.get(raw_type, raw_type.lower()),
            "actor": actor,
            "message": message,
            "repo_full_name": repo_full_name,
            "timestamp": created_at,
            "source": "github_api",
        })

    return {"events": events}


def _format_github_event(event_type: str, payload: dict) -> str:
    """Convert a GitHub event type + payload into a human-readable message."""
    if event_type == "PushEvent":
        commits = payload.get("commits", [])
        commit_count = payload.get("distinct_size")
        if commit_count is None:
            commit_count = payload.get("size")
        if commit_count is None:
            commit_count = len(commits)
        ref = payload.get("ref", "").split("/")[-1]
        return f"Pushed {commit_count} commit(s) to {ref}"

    if event_type == "PullRequestEvent":
        action = payload.get("action", "")
        pr = payload.get("pull_request", {})
        return f"PR {action}: {pr.get('title', '')}"

    if event_type == "IssuesEvent":
        action = payload.get("action", "")
        issue = payload.get("issue", {})
        return f"Issue {action}: {issue.get('title', '')}"

    if event_type == "IssueCommentEvent":
        issue = payload.get("issue", {})
        return f"Commented on #{issue.get('number', '?')}: {issue.get('title', '')}"

    if event_type == "CreateEvent":
        ref_type = payload.get("ref_type", "")
        ref = payload.get("ref", "")
        return f"Created {ref_type}: {ref}" if ref else f"Created {ref_type}"

    if event_type == "DeleteEvent":
        ref_type = payload.get("ref_type", "")
        ref = payload.get("ref", "")
        return f"Deleted {ref_type}: {ref}"

    if event_type == "WatchEvent":
        return "Starred the repository"

    if event_type == "ForkEvent":
        forkee = payload.get("forkee", {})
        return f"Forked to {forkee.get('full_name', '')}"

    if event_type == "ReleaseEvent":
        action = payload.get("action", "published")
        release = payload.get("release", {})
        return f"Release {action}: {release.get('tag_name', '')}"

    if event_type == "PullRequestReviewEvent":
        pr = payload.get("pull_request", {})
        review = payload.get("review", {})
        return f"Reviewed PR: {pr.get('title', '')} ({review.get('state', '')})"

    if event_type == "PullRequestReviewCommentEvent":
        pr = payload.get("pull_request", {})
        return f"Review comment on PR: {pr.get('title', '')}"

    return f"{event_type} event"
