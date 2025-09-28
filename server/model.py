import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Tuple
from numpy.linalg import norm

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

async def get_all_job_embeddings(db) -> Tuple[np.ndarray, List[str]]:
    embeddings = []
    job_ids = []
    async for job in db.jobs.find({}, {"embedding": 1, "id": 1}):
        if "embedding" in job:
            embeddings.append(job["embedding"])
            job_ids.append(job["id"])
    return np.array(embeddings, dtype=np.float32), job_ids

def cosine_sim(query_vec, embeddings):
    query_norm = query_vec / norm(query_vec)
    embeddings_norm = embeddings / norm(embeddings, axis=1, keepdims=True)
    return embeddings_norm @ query_norm

def get_embedding(texts: List[str]) -> np.ndarray:
    return model.encode(texts, convert_to_numpy=True)

async def get_prior(db, user_embedding: np.ndarray) -> np.ndarray:
    job_embeddings, job_ids =  await get_all_job_embeddings(db)
    prior = (cosine_sim(user_embedding, job_embeddings) + 1) / 2
    prior = np.array(prior / sum(prior)).flatten()
    # convert to dict
    return {job_id: float(prob) for job_id, prob in zip(job_ids, prior)}

def job_to_text(job) -> str:
    parts = [
        ("Title: " + job.title),
        ("Company: " + job.company),
        ("Location: " + job.location),
        ("Description: " + job.description), # maybe too long...
        ("Salary: " + (f"{job.salaryMin} - {job.salaryMax} {job.currency}" if job.salaryMin and job.salaryMax and job.currency else "Not specified")),
        ("Employment Type: " + job.employmentType),
    ]
    return " ".join(parts)

def user_to_text(user) -> str:
    parts = [
        ("Name: " + user["name"]),
        ("Email: " + user["email"]),
        ("Phone: " + user["phone"]),
        ("Location: " + user["location"]),
        ("Summary: " + user["summary"]),
        ("Skills: " + user["skills"]),
        ("Education: " + ", ".join([f"{edu['degree']} from {edu['school']}" for edu in user["education"]]) if user["education"] else "None"),
        ("Experience: " + ", ".join([f"{exp['position']} at {exp['company']}" for exp in user["experience"]]) if user["experience"] else "None"),
        ("Disability: " + user["disability"] if user["disability"] else "None"),
        ("Gender: " + user["gender"] if user["gender"] else "None"),
    ]
    return " ".join(parts)

def likelihood(xt, job_embeddings, tau=2.0):
    """
    Compute likelihood p(xt | x) for all candidate jobs x.
    xt: job embedding of the job the user clicked
    job_embeddings: np.array of shape (num_jobs, dim)
    prior: np.array of shape (num_jobs,)
    tau: temperature parameter (controls sharpness)
    """
    # cosine similarity of all jobs w.r.t. clicked job
    sims = cosine_sim(xt, job_embeddings).flatten()  # shape: (num_jobs,)

    # convert similarities into probabilities (softmax with temperature)
    likelihoods = np.exp(sims / tau)
    likelihoods /= likelihoods.sum()

    return likelihoods


async def update_prior(db, prior: dict, feedback: np.ndarray) -> np.ndarray:
    '''
    feedback: Embedding of the clicked job
    prior: Current prior distribution over jobs
    alpha: Learning rate
    '''
    job_embeddings, jobIds = await get_all_job_embeddings(db)
    prior_array = np.array([prior.get(job_id, 0.0) for job_id in jobIds], dtype=np.float32)
    # compute likelihood
    prod = likelihood(feedback, job_embeddings) * prior_array # element-wise mutliplication
    posterior = prod/prod.sum()
    # convert to dict
    return {job_id: float(prob) for job_id, prob in zip(jobIds, posterior)}