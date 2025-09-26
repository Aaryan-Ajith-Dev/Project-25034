
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from typing import List
from models.job import Job
from services.job_service import create_embedding, get_all_jobs, get_job_by_id, create_job, update_job, delete_job
from db import db
from services.auth_service import decode_access_token

router = APIRouter()

def get_current_user(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=403, detail="Invalid token")
    email = payload.get("sub")
    return email

@router.get("/", response_model=List[Job])
async def list_jobs():
    return await get_all_jobs(db)

@router.get("/filter", response_model=List[Job])
async def filter_jobs(companies: List[str] = Query(None), positions: List[str] = Query(None)):
    return await filter_jobs(db, companies, positions)

@router.get("/{job_id}", response_model=Job)
async def get_job(job_id: str):
    return await get_job_by_id(db, job_id)

@router.post("/", response_model=Job)
async def create_new_job(job: Job, user: str = Depends(get_current_user)):
    return await create_job(db, job)

@router.put("/{job_id}", response_model=Job)
async def update_existing_job(job_id: str, job: Job, user: str = Depends(get_current_user)):
    return await update_job(db, job_id, job)

@router.delete("/{job_id}")
async def delete_existing_job(job_id: str, user: str = Depends(get_current_user)):
    return await delete_job(db, job_id)

@router.post("/embed", response_model=dict)
async def create_job_embedding(user: str = Depends(get_current_user)):
    return await create_embedding(db)