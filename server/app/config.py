import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:3000"
    
    GITHUB_PERSONAL_ACCESS_TOKEN: str = ""
    GITHUB_WEBHOOK_SECRET: str = ""
    GITHUB_USERNAME: str = "MIHIRrPATIL"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
