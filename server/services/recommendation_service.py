from typing import List
from model import cosine_sim
from models.job import Job
from models.user import User
import numpy as np

async def set_prior_for_all_users(db, job):
    """
    Set prior probabilities for all users based on a new job posting.
    """
    factor = 2
    async for user in db.users.find({}):
        # Example logic: Assign a uniform prior probability for the new job to all users
        if "prior" not in user or not isinstance(user["prior"], dict):
            user["prior"] = {}

        if "embedding" in user and "embedding" in job:
            # Calculate similarity-based probability
            similarity_prob = (1 + cosine_sim(user["embedding"], np.array([job["embedding"]]))) / 2
            similarity_prob = factor * float(similarity_prob[0])

            # Get existing prior values to determine appropriate priority
            existing_values = list(user["prior"].values()) if user["prior"] else [0.0]

            if existing_values:
                min_prior = min(existing_values)
                max_prior = max(existing_values)

                # Scale similarity_prob to fit within the range of existing probabilities
                scaled_similarity = min_prior + (similarity_prob * (max_prior - min_prior))

                # Ensure the scaled similarity does not dominate existing probabilities
                target_priority = scaled_similarity
            else:
                target_priority = similarity_prob

            user["prior"][job["id"]] = target_priority
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
    Return the top 5 jobs sorted by prior probability for the user.
    """
    if "prior" not in user or not user["prior"]:
        return []
    # Fetch all jobs
    jobs = await db.jobs.find({}).to_list(length=None)
    # Get top 5 jobs by prior probability for the user
    top_jobs = sorted(jobs, key=lambda job: user["prior"].get(job["id"], 0), reverse=True)
    # Filter based on not being in history
    history = user.get("history", [])
    top_jobs = [job for job in top_jobs if job["id"] not in history][:5]
    return [Job(**job) for job in top_jobs]