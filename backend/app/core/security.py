from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException, Request, status

from app.core.config import get_settings


ALGORITHM = "HS256"
SESSION_COOKIE = "jcloud_session"
SESSION_DURATION_HOURS = 12


def create_session(username: str) -> str:
    settings = get_settings()

    now = datetime.now(timezone.utc)

    payload = {
        "sub": username,
        "iat": now,
        "exp": now + timedelta(
            hours=SESSION_DURATION_HOURS
        ),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def decode_session(token: str) -> dict:
    settings = get_settings()

    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[ALGORITHM],
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )


def get_current_user(request: Request) -> str:
    token = request.cookies.get(SESSION_COOKIE)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    payload = decode_session(token)

    username = payload.get("sub")

    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session",
        )

    return username