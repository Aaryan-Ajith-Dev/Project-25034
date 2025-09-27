from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, jobs, user, translate
from config.auth_filter import auth_filter
import dotenv

dotenv.load_dotenv()

app = FastAPI()

# 1) Global auth middleware: bypass OPTIONS and public paths
@app.middleware("http")
async def global_auth_middleware(request: Request, call_next):
    # Let CORS preflight through
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path

    # Public endpoints (adjust as needed)
    public_prefixes = (
        "/auth/login",
        "/auth/signup",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/api/translate",  # if translation should be public
        "/healthz",
        "/",
    )
    if path == "/" or any(path.startswith(p) for p in public_prefixes):
        return await call_next(request)

    # Apply auth for the rest
    auth_response = await auth_filter(request)
    if auth_response is not None:
        return auth_response

    return await call_next(request)

# 2) Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(translate.router, prefix="/api", tags=["translate"])

# 3) CORS: add LAST so it is the OUTERMOST and handles preflight first
origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # explicit origins (required with allow_credentials)
    allow_credentials=True,
    allow_methods=["*"],          # include OPTIONS, GET, POST, etc.
    allow_headers=["*"],          # include Content-Type, Authorization, etc.
)

@app.get("/")
async def root():
    return {"message": "App is working"}
