from fastapi import FastAPI
app = FastAPI(title="RepoTrack API")

@app.get("/")
def health_check():
    return {"status": "health is okay"}