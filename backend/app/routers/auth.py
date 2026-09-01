from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from app.core.security import (
    SESSION_COOKIE,
    create_session,
    get_current_user,
)
from app.services.nextcloud import (
    NextcloudAuthenticationError,
    nextcloud,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(
    credentials: LoginRequest,
    response: Response,
):
    username = credentials.username.strip()

    if not username or not credentials.password:
        raise HTTPException(
            status_code=400,
            detail="Username and password are required",
        )

    try:
        await nextcloud.authenticate(
            username,
            credentials.password,
        )

    except NextcloudAuthenticationError:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        )

    token = create_session(username)

    response.set_cookie(
        key=SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 12,
    )

    return {
        "authenticated": True,
        "username": username,
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE,
    )

    return {
        "authenticated": False,
    }


@router.get("/me")
async def me(
    username: str = Depends(get_current_user),
):
    return {
        "authenticated": True,
        "username": username,
    }