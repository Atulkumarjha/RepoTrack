from app.db.mongo import database
users_collection = database.get_collection("users")
repos_collection = database.get_collection("repositories")
activities_collection = database.get_collection("activities")