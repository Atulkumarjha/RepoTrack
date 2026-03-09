from datetime import datetime


def normalize_event(event_type: str, payload: dict):
    timestamp = datetime.utcnow()
    repo_full_name = payload.get("repository", {}).get("full_name", "unknown")

    if event_type == "push":
        commits = payload.get("commits", [])
        return {
            "repo_full_name": repo_full_name,
            "event_type": "push",
            "actor": payload.get("pusher", {}).get("name", "unknown"),
            "message": f"Pushed {len(commits)} commit(s)",
            "payload": payload,
            "timestamp": timestamp,
        }

    if event_type == "pull_request":
        action = payload.get("action", "unknown")
        pr = payload.get("pull_request", {})
        return {
            "repo_full_name": repo_full_name,
            "event_type": f"pull_request_{action}",
            "actor": pr.get("user", {}).get("login", "unknown"),
            "message": f"PR {action}: {pr.get('title', '')}",
            "payload": payload,
            "timestamp": timestamp,
        }

    if event_type == "issues":
        action = payload.get("action", "unknown")
        issue = payload.get("issue", {})
        return {
            "repo_full_name": repo_full_name,
            "event_type": f"issues_{action}",
            "actor": issue.get("user", {}).get("login", "unknown"),
            "message": f"Issue {action}: {issue.get('title', '')}",
            "payload": payload,
            "timestamp": timestamp,
        }

    if event_type == "issue_comment":
        action = payload.get("action", "created")
        issue = payload.get("issue", {})
        comment = payload.get("comment", {})
        return {
            "repo_full_name": repo_full_name,
            "event_type": "issue_comment",
            "actor": comment.get("user", {}).get("login", "unknown"),
            "message": f"Commented on #{issue.get('number', '?')}: {issue.get('title', '')}",
            "payload": payload,
            "timestamp": timestamp,
        }

    if event_type in ["create", "delete"]:
        return {
            "repo_full_name": repo_full_name,
            "event_type": event_type,
            "actor": payload.get("sender", {}).get("login", "unknown"),
            "message": f"{event_type} {payload.get('ref_type', '')}: {payload.get('ref', '')}",
            "payload": payload,
            "timestamp": timestamp,
        }

    if event_type == "star":
        action = payload.get("action", "created")
        return {
            "repo_full_name": repo_full_name,
            "event_type": "star",
            "actor": payload.get("sender", {}).get("login", "unknown"),
            "message": f"{'Starred' if action == 'created' else 'Unstarred'} the repository",
            "payload": payload,
            "timestamp": timestamp,
        }

    if event_type == "fork":
        forkee = payload.get("forkee", {})
        return {
            "repo_full_name": repo_full_name,
            "event_type": "fork",
            "actor": payload.get("sender", {}).get("login", "unknown"),
            "message": f"Forked to {forkee.get('full_name', '')}",
            "payload": payload,
            "timestamp": timestamp,
        }

    if event_type == "release":
        action = payload.get("action", "published")
        release = payload.get("release", {})
        return {
            "repo_full_name": repo_full_name,
            "event_type": f"release_{action}",
            "actor": payload.get("sender", {}).get("login", "unknown"),
            "message": f"Release {action}: {release.get('tag_name', '')}",
            "payload": payload,
            "timestamp": timestamp,
        }

    # Catch-all for any other event types
    return {
        "repo_full_name": repo_full_name,
        "event_type": event_type,
        "actor": payload.get("sender", {}).get("login", "unknown"),
        "message": f"{event_type} event received",
        "payload": payload,
        "timestamp": timestamp,
    }
