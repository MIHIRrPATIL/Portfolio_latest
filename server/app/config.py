import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: str = "*"
    
    GITHUB_PERSONAL_ACCESS_TOKEN: str = ""
    GITHUB_TOKEN: str = ""
    GH_TOKEN: str = ""
    GITHUB_PAT: str = ""
    GITHUB_ACCESS_TOKEN: str = ""
    ACCESS_TOKEN: str = ""
    GITHUB_WEBHOOK_SECRET: str = ""
    GITHUB_USERNAME: str = "MIHIRrPATIL"
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openrouter/free"
    DATABASE_URL: str = "sqlite:///./portfolio.db"

    @property
    def effective_github_token(self) -> str:
        token = (
            self.GITHUB_PERSONAL_ACCESS_TOKEN or
            self.GITHUB_TOKEN or
            self.GH_TOKEN or
            self.GITHUB_PAT or
            self.GITHUB_ACCESS_TOKEN or
            self.ACCESS_TOKEN or
            os.getenv("GITHUB_TOKEN", "") or
            os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN", "")
        ).strip()
        if token == "your_github_pat_token_here":
            return ""
        return token

    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
