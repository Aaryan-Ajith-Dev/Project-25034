import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Tuple
from numpy.linalg import norm

model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

async def get_all_job_embeddings(db) -> Tuple[np.ndarray, List[str]]:
    embeddings = []
    job_ids = []
    async for job in db.jobs.find({}, {"embedding": 1}):
        if "embedding" in job:
            embeddings.append(job["embedding"])
            job_ids.append(str(job["_id"]))
    return np.array(embeddings, dtype=np.float32), job_ids

def cosine_sim(query_vec, embeddings):
    query_norm = query_vec / norm(query_vec)
    embeddings_norm = embeddings / norm(embeddings, axis=1, keepdims=True)
    return embeddings_norm @ query_norm

def get_embedding(texts: List[str]) -> np.ndarray:
    return model.encode(texts, convert_to_numpy=True)


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
        ("Name: " + user.name),
        ("Email: " + user.email),
        ("Phone: " + user.phone),
        ("Location: " + user.location),
        ("Summary: " + user.summary),
        ("Skills: " + user.skills),
        ("Education: " + ", ".join([f"{edu.degree} from {edu.school}" for edu in user.education]) if user.education else "None"),
        ("Experience: " + ", ".join([f"{exp.position} at {exp.company}" for exp in user.experience]) if user.experience else "None"),
        ("Disability: " + user.disability if user.disability else "None"),
        ("Gender: " + user.gender if user.gender else "None"),
    ]
    return " ".join(parts)
