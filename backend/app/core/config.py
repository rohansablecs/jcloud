from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "JCloud"
    app_env: str = "development"

    jwt_secret: str

    cors_origins: str = "http://localhost:3000"

    nextcloud_url: str = ""
    nextcloud_username: str = ""
    nextcloud_password: str = ""

    libvirt_uri: str = "qemu:///system"
    docker_host: str = "unix:///var/run/docker.sock"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()