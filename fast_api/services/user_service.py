from fastapi import HTTPException
from .auth_service import get_password_hash, verify_password
from models.user import User, UserLogin
from model import get_embedding, user_to_text
import numpy as np

async def create_user(db, user: User):
    user_in_db = await db.users.find_one({"email": user.email})
    if user_in_db:
        raise HTTPException(status_code=409, detail="User already exists")
    hashed_password = get_password_hash(user.password)
    user_dict = user.dict()
    user_dict["password"] = hashed_password
    user_dict["embedding"] = get_embedding(user_to_text(user))
    user_dict["embedding"] = user_dict["embedding"].tolist()
    await db.users.insert_one(user_dict)
    return user_dict

async def authenticate_user(db, user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=403, detail="Invalid credentials")
    return db_user
