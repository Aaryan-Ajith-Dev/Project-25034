from jose import jwt, JWTError
import os
import dotenv
import bcrypt

dotenv.load_dotenv()

SECRET_KEY = os.environ.get("SECRET_ACCESS_TOKEN", "secret")
ALGORITHM = "HS256"

def verify_password(plain_password: str, stored_password: str) -> bool:
    """Verify a plain password against a hashed password using bcrypt"""
    if not isinstance(plain_password, str) or not isinstance(stored_password, str):
        return False
    
    # Encode strings to bytes for bcrypt
    plain_bytes = plain_password.encode('utf-8')
    stored_bytes = stored_password.encode('utf-8')
    
    return bcrypt.checkpw(plain_bytes, stored_bytes)

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    if not isinstance(password, str):
        raise ValueError("Password must be a string")
    
    # Generate salt and hash the password
    salt = bcrypt.gensalt()
    password_bytes = password.encode('utf-8')
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Return as string for storage
    return hashed.decode('utf-8')

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

