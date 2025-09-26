from pydantic import BaseModel, EmailStr
from typing import List, Optional

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

class UserLogin(BaseModel):
    email: EmailStr
    password: str
