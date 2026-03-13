from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "LLMFit API"
    APP_VERSION: str = "0.1.0"
    APP_DESCRIPTION: str = "API for matching LLM models against local system hardware"

    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
