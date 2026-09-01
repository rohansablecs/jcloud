from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from fastapi.responses import Response

from app.core.security import get_current_user
from app.services.nextcloud import (
    NextcloudAuthenticationError,
    NextcloudRequestError,
    nextcloud,
)


router = APIRouter(
    prefix="/storage",
    tags=["Storage"],
)


@router.get("/health")
async def storage_health():
    return await nextcloud.health_check()


@router.get("/files")
async def list_files(
    path: str = Query(default=""),
    username: str = Depends(get_current_user),
):
    try:
        return await nextcloud.list_files(
            username=username,
            path=path,
        )

    except NextcloudAuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Nextcloud authentication failed",
        )

    except NextcloudRequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )


@router.post("/folder")
async def create_folder(
    path: str,
    username: str = Depends(get_current_user),
):
    try:
        await nextcloud.create_folder(
            username=username,
            path=path,
        )

        return {
            "created": True,
            "path": path,
        }

    except NextcloudAuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Nextcloud authentication failed",
        )

    except NextcloudRequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )


@router.delete("/file")
async def delete_file(
    path: str,
    username: str = Depends(get_current_user),
):
    try:
        await nextcloud.delete(
            username=username,
            path=path,
        )

        return {
            "deleted": True,
            "path": path,
        }

    except NextcloudAuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Nextcloud authentication failed",
        )

    except NextcloudRequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )


@router.post("/upload")
async def upload_file(
    path: str,
    file: UploadFile = File(...),
    username: str = Depends(get_current_user),
):
    try:
        content = await file.read()

        await nextcloud.upload(
            username=username,
            path=path,
            content=content,
        )

        return {
            "uploaded": True,
            "name": file.filename,
            "path": path,
        }

    except NextcloudAuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Nextcloud authentication failed",
        )

    except NextcloudRequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        )


@router.get("/download")
async def download_file(
    path: str,
    username: str = Depends(get_current_user),
):
    try:
        content, content_type = (
            await nextcloud.download(
                username=username,
                path=path,
            )
        )

        filename = (
            path.rstrip("/")
            .split("/")[-1]
        )

        return Response(
            content=content,
            media_type=content_type,
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{filename}"'
                )
            },
        )

    except NextcloudAuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Nextcloud authentication failed",
        )

    except NextcloudRequestError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        )