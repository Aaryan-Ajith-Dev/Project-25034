from typing import List
from model import cosine_sim
from models.job import Job
from models.user import User
import numpy as np

async def set_prior_for_all_users(db, job):
    """
    Set prior probabilities for all users based on a new job posting.
    """
    async for user in db.users.find({}):
        # Example logic: Assign a uniform prior probability for the new job to all users
        if "prior" not in user or not isinstance(user["prior"], dict):
            user["prior"] = {}

        probability = (1 + cosine_sim(user["embedding"], np.array([job["embedding"]]))) / 2 if "embedding" in user else 0.0
        user["prior"][job["id"]] = probability
        await db.users.update_one({"email": user["email"]}, {"$set": {"prior": user["prior"]}})

async def del_prior_for_all_users(db, job_id):
    """
    Delete prior probabilities for all users for a specific job.
    """
    async for user in db.users.find({}):
        if "prior" in user and isinstance(user["prior"], dict):
            user["prior"].pop(job_id, None)
        await db.users.update_one({"email": user["email"]}, {"$set": {"prior": user["prior"]}})

async def get_recommendations_for_user(db, user) -> List[Job]:
    """
    Sort and return all jobs in decreasing order of prior probability for the user.
    """
    if "prior" not in user or not user["prior"]:
        return []
    # Fetch all jobs
    jobs = await db.jobs.find({}).to_list(length=None)
    # Sort jobs by prior probability for the user
    sorted_jobs = sorted(jobs, key=lambda job: user["prior"].get(job["id"], 0), reverse=True)
    return [Job(**job) for job in sorted_jobs]


