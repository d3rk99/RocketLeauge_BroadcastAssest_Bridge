from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    isu_rl_api_key: str = Field(default="dev-api-key", alias="ISU_RL_API_KEY")
    isu_rl_public_base_url: str = Field(default="http://localhost:8000", alias="ISU_RL_PUBLIC_BASE_URL")
    port: int = Field(default=8000, alias="PORT")


settings = Settings()
