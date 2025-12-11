# routes/user.py
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any
from server.model import get_prior, update_prior
from server.services.logging_service import log_event
from server.services.recommendation_service import get_recommendations_for_user
from server.models.user import UserOut, UserUpdate
from server.models.job import Job
from server.services.auth_service import decode_access_token
from server.services.user_service import update_user
from server.services.history_service import (
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
async def get_me(
    request: Request,
    current_email: str = Depends(get_current_user_email)
):
    # Exclude sensitive fields
    print("Fetching profile for:", current_email)
    db = request.app.state.db
    doc = await db.users.find_one(
        {"email": current_email},
        {"_id": 0, "password": 0, "embedding": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    # If skills is a list, convert to comma-separated string if your UserOut expects str
    if isinstance(doc.get("skills"), list):
        doc["skills"] = ", ".join([s for s in doc["skills"] if isinstance(s, str)])
    log_event("user_profile_fetched", {"email": current_email})
    return UserOut(**doc)

@router.put("/me", response_model=UserOut)
async def update_me(
    request: Request,
    user_update: UserUpdate,
    current_email: str = Depends(get_current_user_email)
):
    """Update current user's profile information"""
    print("Updating profile for:", current_email)
    db = request.app.state.db
    updated_user = await update_user(db, current_email, user_update)
    
    # Convert skills to string if it's a list (for consistency with get_me)
    if isinstance(updated_user.get("skills"), list):
        updated_user["skills"] = ", ".join([s for s in updated_user["skills"] if isinstance(s, str)])
    
    log_event("user_profile_updated", {
        "email": current_email,
        "skills_count": len(updated_user["skills"].split(",")) if updated_user["skills"] else 0,
        "education_count": len(updated_user.get("education", [])),
        "experience_count": len(updated_user.get("experience", [])),
    })

    return UserOut(**updated_user)

@router.delete("/me", response_model=dict)
async def delete_me(request: Request, current_email: str = Depends(get_current_user_email)):
    """Delete current user's account"""
    print("Deleting account for:", current_email)
    db = request.app.state.db
    result = await db.users.delete_one({"email": current_email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    log_event("user_account_deleted", {"email": current_email})
    return {"message": "User account deleted successfully"}

# History routes
@router.get("/history", response_model=List[Dict[str, Any]])
async def get_history(request: Request, current_email: str = Depends(get_current_user_email)):
    """Get user's job application history with full job details"""
    print("Fetching history for:", current_email)
    db = request.app.state.db
    history_jobs = await get_user_history_with_jobs(db, current_email)
    log_event("user_history_fetched", {
        "email": current_email,
        "history_count": len(history_jobs)
    })
    return history_jobs

@router.post("/history", response_model=HistoryResponse)
async def add_to_history(
    request: Request,
    request_data: AddJobToHistoryRequest,
    current_email: str = Depends(get_current_user_email)
):
    """Add a job to user's application history"""
    print(f"Adding job {request_data.job_id} to history for:", current_email)
    db = request.app.state.db
    result = await add_job_to_history(db, current_email, request_data.job_id)
    
    log_event("job_added_to_history", {
        "email": current_email,
        "job_id": request_data.job_id,
        "history_count": result.get("history_count")
    })

    return HistoryResponse(**result)

@router.delete("/history/{job_id}", response_model=HistoryResponse)
async def remove_from_history(
    request: Request,
    job_id: str,
    current_email: str = Depends(get_current_user_email)
):
    """Remove a specific job from user's application history"""
    print(f"Removing job {job_id} from history for:", current_email)
    db = request.app.state.db
    result = await remove_job_from_history(db, current_email, job_id)
    log_event("job_removed_from_history", {
        "email": current_email,
        "job_id": job_id,
        "history_count": result.get("history_count")
    })
    return HistoryResponse(**result)

@router.delete("/history", response_model=HistoryResponse)
async def clear_history(request: Request, current_email: str = Depends(get_current_user_email)):
    """Clear all jobs from user's application history"""
    print("Clearing history for:", current_email)
    db = request.app.state.db
    result = await clear_user_history(db, current_email)
    log_event("history_cleared", {
        "email": current_email,
        "history_count": result.get("history_count")
    })
    return HistoryResponse(message=result["message"], history_count=result["history_count"])

# Sorts jobs based on similarity to user's profile embedding
@router.get("/recommendations", response_model=List[Job])
async def get_recommendations(request: Request, current_email: str = Depends(get_current_user_email)):
    """Get job recommendations based on user's profile embedding"""
    print("Fetching recommendations for:", current_email)
    db = request.app.state.db
    # Fetch user to get embedding
    user = await db.users.find_one({"email": current_email})
    if not user or "embedding" not in user:
        raise HTTPException(status_code=404, detail="User not found or embedding missing")

    response = await get_recommendations_for_user(db, user)

    log_event("recommendations_fetched", {
        "email": current_email,
        "recommendation_count": len(response)
    })
    return response

@router.post("/recommendations", response_model=dict)
async def update_priorities(
    db_request: Request, request: PriorUpdateRequest, current_email: str = Depends(get_current_user_email)
):
    """
    Updates prior based on currently applied jobs and profile embedding.
    """
    db = db_request.app.state.db
    user = await db.users.find_one({"email": current_email})
    job = await db.jobs.find_one({"id": request.job_id})
    if not job or "embedding" not in job:
        raise HTTPException(status_code=404, detail="Job not found")
    if not user or "embedding" not in user:
        raise HTTPException(status_code=404, detail="User not found or embedding missing")
    new_prior = await update_prior(db, user["prior"], job["embedding"])
    await db.users.update_one({"email": current_email}, {"$set": {"prior": new_prior}})
    
    log_event("prior_updated", {
        "email": current_email,
        "job_id": request.job_id
    })
    
    return {"message": "Priorities updated successfully"}

@router.get("/recommendations/reset", response_model=dict)
async def reset_recommendations(request: Request, current_email: str = Depends(get_current_user_email)):
    """Reset user recommendations to initial state"""
    db = request.app.state.db
    user = await db.users.find_one({"email": current_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Reset the user's prior distribution
    db = request.app.state.db
    new_prior = await get_prior(db, user["embedding"]) if "embedding" in user else {}
    await db.users.update_one({"email": current_email}, {"$set": {"prior": new_prior}})
    log_event("recommendations_reset", {
        "email": current_email
    })
    return {"message": "Recommendations reset successfully"}