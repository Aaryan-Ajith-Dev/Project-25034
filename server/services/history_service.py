from fastapi import HTTPException
from typing import List, Dict, Any

async def add_job_to_history(db, user_email: str, job_id: str) -> Dict[str, Any]:
    """Add a job ID to user's history"""
    try:
        # Check if user exists
        user = await db.users.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if job exists
        job = await db.jobs.find_one({"id": job_id})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Check if job is already in history
        current_history = user.get("history", [])
        if job_id in current_history:
            raise HTTPException(status_code=409, detail="Job already in history")
        
        # Add job to history
        updated_history = current_history + [job_id]
        
        result = await db.users.update_one(
            {"email": user_email},
            {"$set": {"history": updated_history}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update history")
        
        return {
            "message": "Job added to history successfully",
            "job_id": job_id,
            "history_count": len(updated_history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add job to history: {str(e)}")

async def get_user_history_with_jobs(db, user_email: str) -> List[Dict[str, Any]]:
    """Get user's history with full job details"""
    try:
        # Get user
        user = await db.users.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        history_ids = user.get("history", [])
        if not history_ids:
            return []
        
        # Get all jobs from history
        jobs_cursor = db.jobs.find({"id": {"$in": history_ids}})
        jobs = await jobs_cursor.to_list(length=None)
        
        # Create a mapping of job_id to job for maintaining order
        job_map = {job["id"]: job for job in jobs}
        
        # Return jobs in the same order as history (most recent first if that's the order)
        history_jobs = []
        for job_id in history_ids:
            if job_id in job_map:
                job = job_map[job_id]
                # Remove MongoDB _id and embedding for cleaner response
                job.pop("_id", None)
                job.pop("embedding", None)
                history_jobs.append(job)
        
        return history_jobs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

async def remove_job_from_history(db, user_email: str, job_id: str) -> Dict[str, Any]:
    """Remove a job ID from user's history"""
    try:
        # Check if user exists
        user = await db.users.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_history = user.get("history", [])
        if job_id not in current_history:
            raise HTTPException(status_code=404, detail="Job not found in history")
        
        # Remove job from history
        updated_history = [jid for jid in current_history if jid != job_id]
        
        result = await db.users.update_one(
            {"email": user_email},
            {"$set": {"history": updated_history}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update history")
        
        return {
            "message": "Job removed from history successfully",
            "job_id": job_id,
            "history_count": len(updated_history)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove job from history: {str(e)}")

async def clear_user_history(db, user_email: str) -> Dict[str, Any]:
    """Clear all jobs from user's history"""
    try:
        # Check if user exists
        user = await db.users.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        result = await db.users.update_one(
            {"email": user_email},
            {"$set": {"history": []}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to clear history")
        
        return {
            "message": "History cleared successfully",
            "history_count": 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")
