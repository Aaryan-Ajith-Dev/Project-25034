from fastapi import APIRouter, Depends, HTTPException, Request
from server.models.user import User, UserLogin
from server.services.logging_service import log_event
from server.services.auth_service import create_access_token
from server.services.user_service import create_user, authenticate_user

router = APIRouter()

@router.post("/signup")
async def signup(request: Request, user: User):
    db = request.app.state.db
    await create_user(db, user)
    token = create_access_token({"sub": user.email})

    log_event("user_signup", {
        "email": user.email,
        "skills_count": len(user.skills.split(",")) if user.skills else 0,
        "education_count": len(user.education) if user.education else 0,
        "experience_count": len(user.experience) if user.experience else 0,
    })
    
    return {"token": token, "msg": "signed in successfully", "status": 200}

@router.post("/login")
async def login(request: Request, user: UserLogin):
    db = request.app.state.db
    await authenticate_user(db, user)
    token = create_access_token({"sub": user.email})
    
    log_event("user_login", {
        "email": user.email,
    })

    return {"token": token, "msg": "login successful", "status": 200}
