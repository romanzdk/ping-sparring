from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 60
    EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    SMTP_FROM_EMAIL: str = "noreply@pingsparring.cz"
    CONTACT_EMAIL: str | None = None  # Kam chodí zprávy z kontaktního formuláře (default SMTP_FROM_EMAIL)

    # Frontend
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Environment
    ENVIRONMENT: Literal["development", "production", "testing"] = "development"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
