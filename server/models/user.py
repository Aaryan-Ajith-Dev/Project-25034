from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict

class Education(BaseModel):
    school: Optional[str]
    degree: Optional[str]
    grade: Optional[str]
    startDate: Optional[str]
    endDate: Optional[str]
    description: Optional[str]

class Experience(BaseModel):
    company: Optional[str]
    position: Optional[str]
    startDate: Optional[str]
    endDate: Optional[str]
    description: Optional[str]

class User(BaseModel):
    name: str
    email: EmailStr
    phone: str
    location: str
    summary: str
    skills: str
    password: str
    role: str
    education: Optional[List[Education]] = []
    experience: Optional[List[Experience]] = []
    gender: Optional[str] = "prefer not to say"
    disability: Optional[str] = "None"
    embedding: List[float] = None
    history: List[str] = [] # stores job IDs of applied jobs
    prior: Dict[str, float] = {} # stores prior preferences like {job_id: str, probability: float}

class UserOut(BaseModel):
    name: str
    email: EmailStr
    phone: str
    location: str
    summary: str
    skills: str
    role: str
    education: Optional[List[Education]] = []
    experience: Optional[List[Experience]] = []
    gender: Optional[str] = None
    disability: Optional[str] = "None"
    prior: Optional[Dict[str, float]] = {}

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[str] = None
    role: Optional[str] = None
    education: Optional[List[Education]] = None
    experience: Optional[List[Experience]] = None
    gender: Optional[str] = None
    disability: Optional[str] = None
