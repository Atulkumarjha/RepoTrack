"""
Vercel serverless entry point for FastAPI backend.
This file bridges Vercel's serverless functions with FastAPI.
"""
from app.main import app

# Vercel expects a variable named 'app' or a handler function
# FastAPI's app instance is already configured in app.main
