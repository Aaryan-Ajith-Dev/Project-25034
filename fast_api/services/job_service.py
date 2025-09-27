from fastapi import HTTPException
from models.job import Job
from model import get_embedding, job_to_text
import numpy as np
from typing import List, Optional
import re

async def get_all_jobs(db):
    jobs = []
    async for job in db.jobs.find():
        job["id"] = str(job["id"])
        job.pop("_id", None)
        # print(job.keys())
        # print(job.get("company"))
        jobs.append(Job(**job))
    return jobs

async def create_embedding(db) -> dict:
    jobs = await get_all_jobs(db)
    for job in jobs:
        if not job.embedding:
            job["embedding"] = get_embedding(job_to_text(Job(**job))).tolist()
            await db.jobs.update_one({"id": job.id}, {"$set": {"embedding": job["embedding"]}})
    return {"msg": "Job embeddings created"}

async def get_job_by_id(db, job_id: str):
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job["id"] = str(job["id"])
    return Job(**job)


async def create_job(db, job: Job):
    existing = await db.jobs.find_one({"id": job.id})
    if existing:
        raise HTTPException(status_code=409, detail="Job already exists")
    job.embedding = get_embedding(job_to_text(job)).tolist()
    await db.jobs.insert_one(job.dict())
    return job

async def update_job(db, job_id: str, job: Job):
    result = await db.jobs.replace_one({"id": job_id}, job.dict())
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

async def delete_job(db, job_id: str):
    result = await db.jobs.delete_one({"id": job_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"msg": "Job deleted"}


async def filter_jobs(db, search: Optional[List[str]]):
    # Normalize and sanitize terms
    terms = [t.strip() for t in (search or []) if t and t.strip()]
    
    # Build cursor
    if not terms:
        cursor = db.jobs.find({})
    else:
        # Case-insensitive substring match for each term
        regexes = [{"$regex": re.escape(t), "$options": "i"} for t in terms]
        # Match in either company OR title
        query = {
            "$or": [{"company": r} for r in regexes] + [{"title": r} for r in regexes]
        }
        cursor = db.jobs.find(query)

    # Materialize results into Pydantic models
    jobs = []
    async for job in cursor:
        job["id"] = str(job.get("id") or job.get("_id") or "")
        job.pop("_id", None)
        jobs.append(Job(**job))
    return jobs
