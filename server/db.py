from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import FastAPI
import os
from dotenv import load_dotenv

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("MONGO_DB", "RecSys")

def create_db_client():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]
