from fastapi import HTTPException
from .auth_service import get_password_hash, verify_password
from models.user import User, UserLogin, UserUpdate
from model import get_embedding, get_prior, user_to_text
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
    user_dict["prior"] = await get_prior(db, user_dict["embedding"]) or {}
    print("Prior for user", user_dict["prior"])
    await db.users.insert_one(user_dict)
    return user_dict

async def authenticate_user(db, user: UserLogin):
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=403, detail="Invalid credentials")
    return db_user

async def update_user(db, email: str, user_update: UserUpdate):
    """Update user profile information ---To be made neater"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create update dictionary with only provided fields
    update_data = {}
    update_dict = user_update.dict(exclude_unset=True)
    
    if update_dict:
        update_data.update(update_dict)
        
        # If any profile data is being updated, regenerate embedding
        profile_fields = ["name", "location", "summary", "skills", "role", "education", "experience"]
        if any(field in update_dict for field in profile_fields):
            # Create a temporary user object for embedding generation
            temp_user_data = existing_user.copy()
            temp_user_data.update(update_data)
            
            new_embedding = get_embedding(user_to_text(temp_user_data))
            update_data["embedding"] = new_embedding.tolist()
            update_data["prior"] = get_prior(db, update_data["embedding"]) or {}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Update user in database
    result = await db.users.update_one(
        {"email": email},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="No changes made")
    
    # Return updated user (excluding sensitive fields)
    updated_user = await db.users.find_one(
        {"email": email},
        {"_id": 0, "password": 0, "embedding": 0}
    )
    
    return updated_user
