# backend/auth/security.py
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt

# ✅ Use PBKDF2 (stable on Windows, no bcrypt backend/version issues, no 72-byte limit)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME_IN_PROD")
JWT_ALG = "HS256"
JWT_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", "10080"))  # 7 days default


def hash_password(password: str) -> str:
    # Optional: normalize whitespace to avoid accidental trailing spaces/newlines
    password = password.strip()
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    password = password.strip()
    return pwd_context.verify(password, password_hash)


def create_access_token(payload: dict) -> str:
    exp = datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MIN)
    to_encode = {**payload, "exp": exp}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALG)
