from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, jobs, user, translate
import uvicorn
import os
import dotenv
from config.auth_filter import auth_filter

dotenv.load_dotenv()

app = FastAPI()

# Add CORS middleware for translation API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def global_auth_middleware(request: Request, call_next):
    auth_response = await auth_filter(request)
    if auth_response is not None:
        return auth_response
    response = await call_next(request)
    return response

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(translate.router, prefix="/api", tags=["translate"])

@app.get("/")
async def root():
    return {"message": "App is working"}
