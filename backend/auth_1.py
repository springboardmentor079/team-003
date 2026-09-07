from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: Optional[str] = "site_engineer"

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
