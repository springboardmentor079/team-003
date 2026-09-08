import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "BuildTrack Construction API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "buildtrack_super_secret_jwt_key_change_in_production_2026!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # SQLite as fallback, PostgreSQL in production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./buildtrack.db")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
