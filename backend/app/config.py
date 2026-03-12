from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Autonomous Support Bot"
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    TRIPO_API_KEY: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
