def format_activity_message(activity):
    
    repo = activity["repo_full_name"]
    actor = activity["actor"]
    message = activity["message"]
    
    return f"{repo}\n {actor}\n {message}"