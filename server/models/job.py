from pydantic import BaseModel
from typing import Optional, List

class Job(BaseModel):
    id: str
    title: str
    company: Optional[str] = None
    location: str
    employmentType: str
    description: str
    salaryMin: Optional[float] = None
    salaryMax: Optional[float] = None
    currency: Optional[str] = None
    raw: Optional[dict] = None
    embedding: List[float] = None
