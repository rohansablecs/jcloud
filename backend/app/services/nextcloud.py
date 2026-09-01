import xml.etree.ElementTree as ET
from urllib.parse import quote

import httpx

from app.core.config import get_settings


class NextcloudAuthenticationError(Exception):
    pass


class NextcloudRequestError(Exception):
    pass


class NextcloudService:

    def __init__(self):
        self.settings = get_settings()

        # Temporary server-side credential store.
        # This will be replaced with encrypted persistent
        # storage before production deployment.
        self.credentials: dict[str, str] = {}

    @property
    def base_url(self) -> str:
        return self.settings.nextcloud_url.rstrip("/")

    def set_credentials(
        self,
        username: str,
        password: str,
    ) -> None:
        self.credentials[username] = password

    def remove_credentials(
        self,
        username: str,
    ) -> None:
        self.credentials.pop(username, None)

    def get_password(
        self,
        username: str,
    ) -> str:
        password = self.credentials.get(username)

        if not password:
            raise NextcloudAuthenticationError(
                "No Nextcloud credentials available"
            )

        return password

    async def authenticate(
        self,
        username: str,
        password: str,
    ) -> bool:

        if not self.base_url:
            raise RuntimeError(
                "Nextcloud URL is not configured"
            )

        username_encoded = quote(
            username,
            safe="",
        )

        url = (
            f"{self.base_url}"
            f"/remote.php/dav/files/"
            f"{username_encoded}/"
        )

        try:
            async with httpx.AsyncClient(
                auth=(username, password),
                timeout=15,
                follow_redirects=False,
            ) as client:

                response = await client.request(
                    "PROPFIND",
                    url,
                    headers={
                        "Depth": "0",
                    },
                )

        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"Could not reach Nextcloud: {exc}"
            )

        if response.status_code == 207:
            self.set_credentials(
                username,
                password,
            )
            return True

        if response.status_code in (401, 403):
            raise NextcloudAuthenticationError()

        raise RuntimeError(
            f"Unexpected response from Nextcloud: "
            f"{response.status_code}"
        )

    async def health_check(self) -> dict:

        if not self.base_url:
            return {
                "connected": False,
                "configured": False,
                "message": (
                    "Nextcloud URL is not configured"
                ),
            }

        try:
            async with httpx.AsyncClient(
                timeout=10,
            ) as client:

                response = await client.get(
                    f"{self.base_url}/status.php"
                )

            response.raise_for_status()

            data = response.json()

            return {
                "connected": True,
                "configured": True,
                "status": data.get("status"),
                "version": data.get("version"),
                "versionstring": data.get(
                    "versionstring"
                ),
            }

        except httpx.HTTPError as exc:
            return {
                "connected": False,
                "configured": True,
                "message": str(exc),
            }

    async def list_files(
        self,
        username: str,
        path: str = "",
    ) -> list[dict]:

        password = self.get_password(username)

        username_encoded = quote(
            username,
            safe="",
        )

        clean_path = path.strip("/")

        encoded_path = quote(
            clean_path,
            safe="/",
        )

        url = (
            f"{self.base_url}"
            f"/remote.php/dav/files/"
            f"{username_encoded}/"
        )

        if encoded_path:
            url += encoded_path + "/"

        try:
            async with httpx.AsyncClient(
                auth=(username, password),
                timeout=30,
            ) as client:

                response = await client.request(
                    "PROPFIND",
                    url,
                    headers={
                        "Depth": "1",
                    },
                )

        except httpx.HTTPError as exc:
            raise NextcloudRequestError(str(exc))

        if response.status_code in (401, 403):
            self.remove_credentials(username)
            raise NextcloudAuthenticationError()

        if response.status_code != 207:
            raise NextcloudRequestError(
                f"Nextcloud returned "
                f"{response.status_code}"
            )

        return self._parse_directory(
            response.text,
        )

    def _parse_directory(
        self,
        xml: str,
    ) -> list[dict]:

        namespaces = {
            "d": "DAV:",
        }

        root = ET.fromstring(xml)

        items = []

        for response in root.findall(
            "d:response",
            namespaces,
        ):

            prop = response.find(
                "d:propstat/d:prop",
                namespaces,
            )

            if prop is None:
                continue

            href = response.findtext(
                "d:href",
                default="",
                namespaces=namespaces,
            )

            name = prop.findtext(
                "d:displayname",
                default="",
                namespaces=namespaces,
            )

            resource_type = prop.find(
                "d:resourcetype",
                namespaces,
            )

            is_directory = (
                resource_type is not None
                and resource_type.find(
                    "d:collection",
                    namespaces,
                ) is not None
            )

            size_text = prop.findtext(
                "d:getcontentlength",
                default=None,
                namespaces=namespaces,
            )

            modified = prop.findtext(
                "d:getlastmodified",
                default=None,
                namespaces=namespaces,
            )

            content_type = prop.findtext(
                "d:getcontenttype",
                default=None,
                namespaces=namespaces,
            )

            size = None

            if size_text:
                try:
                    size = int(size_text)
                except ValueError:
                    size = None

            items.append(
                {
                    "name": name,
                    "path": href,
                    "is_directory": is_directory,
                    "size": size,
                    "modified": modified,
                    "content_type": content_type,
                }
            )

        return items

    async def create_folder(
        self,
        username: str,
        path: str,
    ) -> None:

        password = self.get_password(username)

        username_encoded = quote(
            username,
            safe="",
        )

        encoded_path = quote(
            path.strip("/"),
            safe="/",
        )

        url = (
            f"{self.base_url}"
            f"/remote.php/dav/files/"
            f"{username_encoded}/"
            f"{encoded_path}"
        )

        try:
            async with httpx.AsyncClient(
                auth=(username, password),
                timeout=30,
            ) as client:

                response = await client.request(
                    "MKCOL",
                    url,
                )

        except httpx.HTTPError as exc:
            raise NextcloudRequestError(str(exc))

        if response.status_code in (401, 403):
            self.remove_credentials(username)
            raise NextcloudAuthenticationError()

        if response.status_code not in (201, 405):
            raise NextcloudRequestError(
                f"Could not create folder: "
                f"{response.status_code}"
            )

    async def delete(
        self,
        username: str,
        path: str,
    ) -> None:

        password = self.get_password(username)

        username_encoded = quote(
            username,
            safe="",
        )

        encoded_path = quote(
            path.strip("/"),
            safe="/",
        )

        url = (
            f"{self.base_url}"
            f"/remote.php/dav/files/"
            f"{username_encoded}/"
            f"{encoded_path}"
        )

        try:
            async with httpx.AsyncClient(
                auth=(username, password),
                timeout=30,
            ) as client:

                response = await client.delete(url)

        except httpx.HTTPError as exc:
            raise NextcloudRequestError(str(exc))

        if response.status_code in (401, 403):
            self.remove_credentials(username)
            raise NextcloudAuthenticationError()

        if response.status_code != 204:
            raise NextcloudRequestError(
                f"Could not delete: "
                f"{response.status_code}"
            )

    async def upload(
        self,
        username: str,
        path: str,
        content,
    ) -> None:

        password = self.get_password(username)

        username_encoded = quote(
            username,
            safe="",
        )

        encoded_path = quote(
            path.strip("/"),
            safe="/",
        )

        url = (
            f"{self.base_url}"
            f"/remote.php/dav/files/"
            f"{username_encoded}/"
            f"{encoded_path}"
        )

        try:
            async with httpx.AsyncClient(
                auth=(username, password),
                timeout=120,
            ) as client:

                response = await client.put(
                    url,
                    content=content,
                )

        except httpx.HTTPError as exc:
            raise NextcloudRequestError(str(exc))

        if response.status_code in (401, 403):
            self.remove_credentials(username)
            raise NextcloudAuthenticationError()

        if response.status_code not in (201, 204):
            raise NextcloudRequestError(
                f"Upload failed: "
                f"{response.status_code}"
            )

    async def download(
        self,
        username: str,
        path: str,
    ) -> tuple[bytes, str]:

        password = self.get_password(username)

        username_encoded = quote(
            username,
            safe="",
        )

        encoded_path = quote(
            path.strip("/"),
            safe="/",
        )

        url = (
            f"{self.base_url}"
            f"/remote.php/dav/files/"
            f"{username_encoded}/"
            f"{encoded_path}"
        )

        try:
            async with httpx.AsyncClient(
                auth=(username, password),
                timeout=120,
            ) as client:

                response = await client.get(url)

        except httpx.HTTPError as exc:
            raise NextcloudRequestError(str(exc))

        if response.status_code in (401, 403):
            self.remove_credentials(username)
            raise NextcloudAuthenticationError()

        if response.status_code != 200:
            raise NextcloudRequestError(
                f"Download failed: "
                f"{response.status_code}"
            )

        return (
            response.content,
            response.headers.get(
                "content-type",
                "application/octet-stream",
            ),
        )


nextcloud = NextcloudService()