# from passlib.context import CryptContext
# from jose import jwt
# import os
# import dotenv

# dotenv.load_dotenv()

# # Prefer bcrypt_sha256 to avoid bcrypt's 72-byte limit; keep bcrypt for legacy hashes
# pwd_context = CryptContext(
#     schemes=["bcrypt_sha256", "bcrypt"],
#     deprecated="auto",
# )

# SECRET_KEY = os.environ.get("SECRET_ACCESS_TOKEN", "secret")
# ALGORITHM = "HS256"

# def verify_password(plain_password, hashed_password):
#     # Verifies against both bcrypt_sha256 and legacy bcrypt hashes
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password):
#     # Hashes using the first scheme (bcrypt_sha256) by default
#     return pwd_context.hash(password)

# def create_access_token(data: dict):
#     return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

# def decode_access_token(token: str):
#     from jose import JWTError
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         return payload
#     except JWTError:
#         return None

# services/auth_service.py
from jose import jwt, JWTError
import os
import dotenv

dotenv.load_dotenv()

SECRET_KEY = os.environ.get("SECRET_ACCESS_TOKEN", "secret")
ALGORITHM = "HS256"

# TEMPORARY: plain-text comparison for local debugging ONLY
def verify_password(plain_password: str, stored_password: str) -> bool:
    return isinstance(plain_password, str) and isinstance(stored_password, str) and plain_password == stored_password

def get_password_hash(password: str) -> str:
    # Store as-is (insecure) so signup/login works while debugging other issues
    if not isinstance(password, str):
        raise ValueError("Password must be a string")
    return password

def create_access_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
