import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User
from app.db.session import get_db
from app.schemas import (
    LoginRequest,
    ProfileResponse,
    ProfileUpdate,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter()


def _token_for(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user.id),
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
    )


@router.post("/auth/register", response_model=TokenResponse)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        preferred_currency=(payload.preferred_currency or "USD").upper(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _token_for(user)


@router.post("/auth/guest", response_model=TokenResponse)
def create_guest_session(db: Session = Depends(get_db)):
    """Create an isolated guest account so demo users never share trip data."""
    guest_id = uuid.uuid4().hex
    guest = User(
        email=f"guest-{guest_id}@guest.wanderwise.local",
        password_hash=hash_password(secrets.token_urlsafe(32)),
        full_name="Guest Traveler",
        preferred_currency="USD",
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    return _token_for(guest)


@router.post("/auth/login", response_model=TokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _token_for(user)


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = payload.model_dump(exclude_unset=True)
    if "full_name" in data:
        user.full_name = data["full_name"]
    if data.get("preferred_currency"):
        user.preferred_currency = data["preferred_currency"].upper()
    db.commit()
    db.refresh(user)
    return user
