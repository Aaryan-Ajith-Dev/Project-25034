from fastapi import APIRouter, Depends, Query, Request, HTTPException
from typing import List
from models.job import Job
from services.job_service import (
    create_embedding,
    filter_jobs,
    get_all_jobs,
    get_job_by_id,
    create_job,
    update_job,
    delete_job
)
from db import db
from services.auth_service import decode_access_token
from services.logging_service import log_event

router = APIRouter()

def get_current_user(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=403, detail="Invalid token")
    return payload.get("sub")

@router.get("/", response_model=List[Job])
async def list_jobs():
    jobs = await get_all_jobs(db)
    log_event("jobs_listed", {"count": len(jobs)})
    return jobs

@router.get("/filter", response_model=List[Job])
async def get_filtered_jobs(search: List[str] = Query(None, description="List of companies or positions to filter by")):
    jobs = await filter_jobs(db, search)
    log_event("jobs_filtered", {"search_terms": search, "result_count": len(jobs)})
    return jobs

@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str):
    job = await get_job_by_id(db, job_id)
    log_event("job_fetched", {"job_id": job_id})
    return job

@router.post("/", response_model=Job)
async def create_new_job(job: Job, user: str = Depends(get_current_user)):
    created_job = await create_job(db, job)
    log_event("job_created", {
        "job_id": created_job.id,
        "created_by": user,
        "title": created_job.title,
        "company": created_job.company
    })
    return created_job

@router.put("/{job_id}", response_model=Job)
async def update_existing_job(job_id: str, job: Job, user: str = Depends(get_current_user)):
    updated_job = await update_job(db, job_id, job)
    log_event("job_updated", {
        "job_id": job_id,
        "updated_by": user,
        "title": updated_job.title,
        "company": updated_job.company
    })
    return updated_job

@router.delete("/{job_id}")
async def delete_existing_job(job_id: str, user: str = Depends(get_current_user)):
    result = await delete_job(db, job_id)
    log_event("job_deleted", {"job_id": job_id, "deleted_by": user})
    return result

@router.post("/embed", response_model=dict)
async def create_job_embedding():  # Removed user dependency
    result = await create_embedding(db)
    log_event("job_embeddings_created", {"embedding_count": len(result.get("embeddings", []))})
    return result
