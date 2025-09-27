# routes/user.py
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import EmailStr
from models.user import UserOut
from db import db
from services.auth_service import decode_access_token

router = APIRouter()

def get_current_user_email(request: Request) -> str:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Not authenticated")
    token = auth_header.split(" ", 1)[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=403, detail="Invalid token")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=403, detail="Invalid token payload")
    return email

@router.get("/me", response_model=UserOut)
async def get_me(current_email: str = Depends(get_current_user_email)):
    # Exclude sensitive fields
    print("Fetching profile for:", current_email)
    doc = await db.users.find_one(
        {"email": current_email},
        {"_id": 0, "password": 0, "embedding": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    # If skills is a list, convert to comma-separated string if your UserOut expects str
    if isinstance(doc.get("skills"), list):
        doc["skills"] = ", ".join([s for s in doc["skills"] if isinstance(s, str)])
    return UserOut(**doc)


