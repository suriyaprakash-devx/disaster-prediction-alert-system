import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

class Settings(BaseSettings):
    APP_ENV: str = "production"
    APP_NAME: str = "DesignOps AI Copilot"
    PORT: int = Field(default=8000, validation_alias="PORT")
    SECRET_KEY: str = "replace-this-default-secret-in-production-random-32-chars"
    
    # Database
    DATABASE_URL: str = "sqlite:///./designops_local.db"
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str) and v.startswith("postgres://"):
            # Render PostgreSQL URLs frequently use postgres:// instead of postgresql://
            return v.replace("postgres://", "postgresql://", 1)
        return v

    # Groq AI Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_TIMEOUT_SECONDS: float = 30.0

    # URLs & CORS
    FRONTEND_URL: str = "http://localhost:5173"
    BACKEND_URL: str = "http://localhost:8000"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # JWT Authentication
    JWT_SECRET_KEY: str = "replace-this-jwt-secret-in-production-random-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Storage Configuration
    STORAGE_PROVIDER: str = "local"  # "s3" or "local"
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    S3_BUCKET_NAME: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT_URL: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Add FRONTEND_URL to allowed origins if provided
if settings.FRONTEND_URL and settings.FRONTEND_URL not in settings.ALLOWED_ORIGINS:
    settings.ALLOWED_ORIGINS.append(settings.FRONTEND_URL)
