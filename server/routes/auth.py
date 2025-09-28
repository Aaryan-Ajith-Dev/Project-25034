from fastapi import APIRouter, Depends, HTTPException, Request
from models.user import User, UserLogin
from services.auth_service import create_access_token
from services.user_service import create_user, authenticate_user
from db import db

router = APIRouter()

@router.post("/signup")
async def signup(user: User):
    await create_user(db, user)
    token = create_access_token({"sub": user.email})
    return {"token": token, "msg": "signed in successfully", "status": 200}

@router.post("/login")
async def login(user: UserLogin):
    await authenticate_user(db, user)
    token = create_access_token({"sub": user.email})
    return {"token": token, "msg": "login successful", "status": 200}
