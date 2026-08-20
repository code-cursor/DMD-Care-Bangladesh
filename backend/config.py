import os
from functools import lru_cache
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DEFAULT_SQLITE_URL = f"sqlite:///{(BASE_DIR / 'dmd_admin.sqlite3').as_posix()}"


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file(PROJECT_ROOT / ".env")


class Settings:
    api_title = "DMD Care Bangladesh Admin API"
    database_url = os.getenv("DATABASE_URL", DEFAULT_SQLITE_URL)
    secret_key = os.getenv("SECRET_KEY", "change-this-secret-before-production")
    jwt_algorithm = "HS256"
    access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))
    upload_dir = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "uploads"))
    admin_bootstrap_name = os.getenv("ADMIN_BOOTSTRAP_NAME", "Super Admin")
    admin_bootstrap_email = os.getenv("ADMIN_BOOTSTRAP_EMAIL", "admin@example.com")
    admin_bootstrap_password = os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "ChangeMeNow123!")
    sms_admin_phone = os.getenv("SMS_ADMIN_PHONE", "")
    sms_api_url = os.getenv("SMS_API_URL", "")
    sms_api_key = os.getenv("SMS_API_KEY", "")
    sms_sender_id = os.getenv("SMS_SENDER_ID", "DMDCARE")
    sms_ip_update_url = os.getenv("SMS_IP_UPDATE_URL", "")

    @property
    def allowed_origins(self) -> list[str]:
        configured = os.getenv("ALLOWED_ORIGINS")
        if configured:
            return [origin.strip() for origin in configured.split(",") if origin.strip()]

        return [
            "null",
            "http://localhost",
            "http://localhost:80",
            "http://localhost:8080",
            "http://localhost:8002",
            "http://127.0.0.1",
            "http://127.0.0.1:80",
            "http://127.0.0.1:8080",
            "http://127.0.0.1:8002",
            "http://dmdcarebangladesh.loc",
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


