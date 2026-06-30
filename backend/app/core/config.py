from dataclasses import dataclass, field


@dataclass(frozen=True)
class Settings:
    app_name: str = "British Academy ERP API"
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = field(
        default_factory=lambda: ["http://127.0.0.1:5173", "http://localhost:5173"]
    )
    database_url: str = "postgresql://postgres:postgres@localhost:5432/british_academy"
    jwt_secret_key: str = "change-this-secret-before-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60


settings = Settings()
