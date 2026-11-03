import math
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_trip
from app.db.models import Trip, User
from app.db.session import get_db
from app.schemas import TripCreate, TripListResponse, TripResponse, TripUpdate
from app.services.ai import generate_itinerary
from app.services.itinerary import apply_full_itinerary, trip_to_response

router = APIRouter()


def _regenerate(db: Session, trip: Trip) -> TripResponse:
    generated = generate_itinerary(trip, list(range(1, trip.duration_days + 1)))
    apply_full_itinerary(trip, generated)
    db.commit()
    db.refresh(trip)
    return trip_to_response(trip)


@router.get("/trips", response_model=TripListResponse)
def list_trips(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    sort_by: str = Query("created_at", pattern="^(created_at|start_date|budget_amount)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(Trip).where(Trip.user_id == user.id)
    if search:
        like = f"%{search.strip()}%"
        query = query.where(
            or_(Trip.title.ilike(like), Trip.destination.ilike(like), Trip.country.ilike(like))
        )
    if status_filter:
        query = query.where(Trip.status == status_filter)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    column = getattr(Trip, sort_by)
    order = column.asc() if sort_order == "asc" else column.desc()
    items = db.scalars(query.order_by(order).offset((page - 1) * size).limit(size)).all()
    return TripListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=max(1, math.ceil(total / size)),
    )


@router.post("/trips", response_model=TripResponse, status_code=201)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = Trip(
        user_id=user.id,
        title=(payload.title or f"Trip to {payload.destination}").strip(),
        destination=payload.destination.strip(),
        country=payload.country,
        start_date=payload.start_date,
        end_date=payload.end_date,
        traveler_count=payload.traveler_count,
        budget_amount=payload.budget_amount,
        currency=payload.currency,
        travel_style=payload.travel_style,
        pace=payload.pace,
        interests=payload.interests,
        accommodation_preferences=payload.accommodation_preferences,
        dietary_requirements=payload.dietary_requirements,
        accessibility_requirements=payload.accessibility_requirements,
        special_requests=payload.special_requests,
        status="draft",
    )
    db.add(trip)
    db.flush()
    return _regenerate(db, trip)


@router.get("/trips/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return trip_to_response(get_owned_trip(db, user, trip_id))


@router.patch("/trips/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: str,
    payload: TripUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = get_owned_trip(db, user, trip_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None:
            continue  # these columns are not nullable; ignore explicit nulls
        if field == "currency":
            value = value.upper()
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return trip_to_response(trip)


@router.delete("/trips/{trip_id}", status_code=204)
def delete_trip(
    trip_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    trip = get_owned_trip(db, user, trip_id)
    db.delete(trip)
    db.commit()
    return Response(status_code=204)


@router.post("/trips/{trip_id}/regenerate", response_model=TripResponse)
def regenerate_full_trip(
    trip_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return _regenerate(db, get_owned_trip(db, user, trip_id))


@router.post("/trips/{trip_id}/generate", response_model=TripResponse)
def generate_full_trip(
    trip_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return _regenerate(db, get_owned_trip(db, user, trip_id))
