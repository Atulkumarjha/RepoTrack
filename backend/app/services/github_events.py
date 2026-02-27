def normalize_event(event_type: str, payload: dict):
    timestamp = datetime.utcnow()

    if event_type == "push":
        return {
            "repo_full_name": payload["repository"]["full_name"],
            "event_type": "push",
            "actor": payload["pusher"]["name"],
            "message": f"Pushed {len(payload['commits'])} commit(s)",
            "payload": payload,
            "timestamp": timestamp,
        }

        if event_type == "pull_request":
            action = payload["action"]
            pr = payload["pull_request"]
            return {
                "repo_full_name": payload["repository"]["full_name"],
                "event_type": f"pull_request_{action}",
                "actor": pr["user"]["login"],
                "message": f"PR {action}: {pr['title']}",
                "payload": payload,
                "timestamp": timestamp,
            }

            if event_type in ["create", "delete"]:
                return {
                    "repo_full_name": payload["repository"]["full_name"],
                    "event_type": event_type,
                    "actor": payload["sender"]["login"],
                    "message": f"{event_type} {payload.get('ref_type')}: {payload.get('ref')}",
                    "payload": payload,
                    "timestamp": timestamp,
                }

                return None
