from fastapi import HTTPException
from models.job import Job
from model import get_embedding, job_to_text
import numpy as np
from typing import List

async def get_all_jobs(db):
    jobs = []
    async for job in db.jobs.find():
        job["id"] = str(job["id"])
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

async def filter_jobs(db, companies, positions):
    query = {}
    if companies and len(companies) > 0:
        query["company"] = {"$in": companies}
    if positions and len(positions) > 0:
        query["title"] = {"$in": positions}
    jobs = []
    async for job in db.jobs.find(query):
        job["id"] = str(job["id"])
        jobs.append(Job(**job))
    return jobs