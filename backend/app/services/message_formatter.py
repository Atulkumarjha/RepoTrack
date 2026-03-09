def format_activity_message(activity: dict) -> str:
    repo = activity.get("repo_full_name", "unknown")
    actor = activity.get("actor", "unknown")
    event_type = activity.get("event_type", "unknown")
    message = activity.get("message", "")

    emoji_map = {
        "push": "🚀",
        "pull_request": "🔀",
        "issues": "🐛",
        "issue_comment": "💬",
        "create": "🌿",
        "delete": "🗑️",
        "star": "⭐",
        "fork": "🍴",
        "release": "📦",
    }

    # Match by prefix for event types like pull_request_opened, issues_closed
    emoji = "📌"
    for key, icon in emoji_map.items():
        if event_type.startswith(key):
            emoji = icon
            break

    return f"{emoji} **{repo}**\n👤 {actor}\n📋 {message}"