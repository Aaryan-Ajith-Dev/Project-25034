# routes/user.py
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
from model import get_prior, update_prior
from services.recommendation_service import get_recommendations_for_user
from models.user import UserOut, UserUpdate
from models.job import Job
from db import db
from services.auth_service import decode_access_token
from services.user_service import update_user
from services.history_service import (
    add_job_to_history, 
    get_user_history_with_jobs, 
    remove_job_from_history,
    clear_user_history
)

router = APIRouter()

# Pydantic models for history endpoints
class AddJobToHistoryRequest(BaseModel):
    job_id: str

class HistoryResponse(BaseModel):
    message: str
    job_id: str = None
    history_count: int

class PriorUpdateRequest(BaseModel):
    job_id: str

def get_current_user_email(request: Request) -> str:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=403, detail="Invalid token")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=403, detail="Invalid token payload")
    return email

@router.get("/me", response_model=UserOut)
async def get_me(current_email: str = Depends(get_current_user_email)):
    # Exclude sensitive fields
    print("Fetching profile for:", current_email)
    doc = await db.users.find_one(
        {"email": current_email},
        {"_id": 0, "password": 0, "embedding": 0}
    )
    print(doc["prior"])
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    # If skills is a list, convert to comma-separated string if your UserOut expects str
    if isinstance(doc.get("skills"), list):
        doc["skills"] = ", ".join([s for s in doc["skills"] if isinstance(s, str)])
    return UserOut(**doc)

@router.put("/me", response_model=UserOut)
async def update_me(
    user_update: UserUpdate,
    current_email: str = Depends(get_current_user_email)
):
    """Update current user's profile information"""
    print("Updating profile for:", current_email)
    
    updated_user = await update_user(db, current_email, user_update)
    
    # Convert skills to string if it's a list (for consistency with get_me)
    if isinstance(updated_user.get("skills"), list):
        updated_user["skills"] = ", ".join([s for s in updated_user["skills"] if isinstance(s, str)])
    
    return UserOut(**updated_user)

# History routes
@router.get("/history", response_model=List[Dict[str, Any]])
async def get_history(current_email: str = Depends(get_current_user_email)):
    """Get user's job application history with full job details"""
    print("Fetching history for:", current_email)
    
    history_jobs = await get_user_history_with_jobs(db, current_email)
    return history_jobs

@router.post("/history", response_model=HistoryResponse)
async def add_to_history(
    request: AddJobToHistoryRequest,
    current_email: str = Depends(get_current_user_email)
):
    """Add a job to user's application history"""
    print(f"Adding job {request.job_id} to history for:", current_email)
    
    result = await add_job_to_history(db, current_email, request.job_id)
    return HistoryResponse(**result)

@router.delete("/history/{job_id}", response_model=HistoryResponse)
async def remove_from_history(
    job_id: str,
    current_email: str = Depends(get_current_user_email)
):
    """Remove a specific job from user's application history"""
    print(f"Removing job {job_id} from history for:", current_email)
    
    result = await remove_job_from_history(db, current_email, job_id)
    return HistoryResponse(**result)

@router.delete("/history", response_model=HistoryResponse)
async def clear_history(current_email: str = Depends(get_current_user_email)):
    """Clear all jobs from user's application history"""
    print("Clearing history for:", current_email)
    
    result = await clear_user_history(db, current_email)
    return HistoryResponse(message=result["message"], history_count=result["history_count"])

# Sorts jobs based on similarity to user's profile embedding
@router.get("/recommendations", response_model=List[Job])
async def get_recommendations(current_email: str = Depends(get_current_user_email)):
    """Get job recommendations based on user's profile embedding"""
    print("Fetching recommendations for:", current_email)
    
    # Fetch user to get embedding
    user = await db.users.find_one({"email": current_email})
    if not user or "embedding" not in user:
        raise HTTPException(status_code=404, detail="User not found or embedding missing")

    response = await get_recommendations_for_user(db, user)
    return response

@router.post("/recommendations", response_model=dict)
async def update_priorities(
    request: PriorUpdateRequest, current_email: str = Depends(get_current_user_email)
):
    """
    Updates prior based on currently applied jobs and profile embedding.
    """
    user = await db.users.find_one({"email": current_email})
    job = await db.jobs.find_one({"id": request.job_id})
    if not job or "embedding" not in job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not user or "embedding" not in user:
        raise HTTPException(status_code=404, detail="User not found or embedding missing")
    new_prior = await update_prior(db, user["prior"], job["embedding"])
    await db.users.update_one({"email": current_email}, {"$set": {"prior": new_prior}})
    return {"message": "Priorities updated successfully"}

@router.get("/recommendations/reset", response_model=dict)
async def reset_recommendations(current_email: str = Depends(get_current_user_email)):
    """Reset user recommendations to initial state"""
    user = await db.users.find_one({"email": current_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Reset the user's prior distribution
    new_prior = await get_prior(db, user["embedding"]) if "embedding" in user else {}
    await db.users.update_one({"email": current_email}, {"$set": {"prior": new_prior}})
    return {"message": "Recommendations reset successfully"}