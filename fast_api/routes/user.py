from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from db import db

router = APIRouter(prefix="/user", tags=["user"])

