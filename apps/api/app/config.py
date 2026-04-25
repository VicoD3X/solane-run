from dataclasses import dataclass
import os
from pathlib import Path


def _csv_env(name: str, default: str) -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    esi_base_url: str = os.getenv("ESI_BASE_URL", "https://esi.evetech.net/latest").rstrip("/")
    esi_datasource: str = os.getenv("ESI_DATASOURCE", "tranquility")
    esi_compatibility_date: str = os.getenv("ESI_COMPATIBILITY_DATE", "2024-06-11")
    esi_user_agent: str = os.getenv(
        "ESI_USER_AGENT",
        "SolaneRun/0.1 contact:ops@solanerun.local",
    )
    cors_origins: list[str] = None  # type: ignore[assignment]
    system_catalog_cache_path: str = os.getenv(
        "SYSTEM_CATALOG_CACHE_PATH",
        str(Path(__file__).resolve().parents[1] / ".cache" / "system_catalog.json"),
    )
    system_catalog_refresh_seconds: int = int(os.getenv("SYSTEM_CATALOG_REFRESH_SECONDS", "86400"))
    system_catalog_refresh_enabled: bool = os.getenv("SYSTEM_CATALOG_REFRESH_ENABLED", "true").lower() == "true"

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "cors_origins",
            _csv_env(
                "CORS_ORIGINS",
                "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
            ),
        )


settings = Settings()
