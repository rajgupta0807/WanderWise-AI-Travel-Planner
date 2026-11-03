from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_owned_trip
from app.db.models import Activity, ItineraryDay, Trip, User
from app.db.session import get_db
from app.schemas import (
    ActivityCreate,
    ActivityResponse,
    ActivityUpdate,
    ItineraryDayResponse,
    ItineraryDayUpdate,
    RegenerateDayRequest,
)
from app.services.ai import generate_itinerary
from app.services.itinerary import apply_day_data, recalc_day_total

router = APIRouter()


def _get_day(db: Session, trip: Trip, day_id: str) -> ItineraryDay:
    day = db.scalar(
        select(ItineraryDay).where(ItineraryDay.id == day_id, ItineraryDay.trip_id == trip.id)
    )
    if day is None:
        raise HTTPException(status_code=404, detail="Itinerary day not found")
    return day


def _get_activity(db: Session, trip: Trip, activity_id: str) -> Activity:
    activity = db.scalar(
        select(Activity)
        .join(ItineraryDay, Activity.itinerary_day_id == ItineraryDay.id)
        .where(Activity.id == activity_id, ItineraryDay.trip_id == trip.id)
    )
    if activity is None:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.get("/trips/{trip_id}/itinerary", response_model=List[ItineraryDayResponse])
def get_trip_itinerary(
    trip_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    return get_owned_trip(db, user, trip_id).days


@router.patch("/trips/{trip_id}/days/{day_id}", response_model=ItineraryDayResponse)
def update_itinerary_day(
    trip_id: str,
    day_id: str,
    payload: ItineraryDayUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    day = _get_day(db, get_owned_trip(db, user, trip_id), day_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None and field in {"title", "summary", "estimated_total"}:
            continue
        setattr(day, field, value)
    db.commit()
    db.refresh(day)
    return day


@router.post("/trips/{trip_id}/days/{day_id}/regenerate", response_model=ItineraryDayResponse)
def regenerate_day(
    trip_id: str,
    day_id: str,
    payload: Optional[RegenerateDayRequest] = Body(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = get_owned_trip(db, user, trip_id)
    day = _get_day(db, trip, day_id)
    focus = payload.focus_preference if payload else None
    generated = generate_itinerary(trip, [day.day_number], focus)
    apply_day_data(day, generated["days"][0])
    db.commit()
    db.refresh(day)
    return day


@router.post(
    "/trips/{trip_id}/days/{day_id}/activities",
    response_model=ActivityResponse,
    status_code=201,
)
def create_activity(
    trip_id: str,
    day_id: str,
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    day = _get_day(db, get_owned_trip(db, user, trip_id), day_id)
    activity = Activity(itinerary_day_id=day.id, **payload.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    recalc_day_total(db, day.id)
    return activity


@router.patch("/trips/{trip_id}/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(
    trip_id: str,
    activity_id: str,
    payload: ActivityUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    activity = _get_activity(db, get_owned_trip(db, user, trip_id), activity_id)
    nullable = {"address", "latitude", "longitude", "booking_url"}
    for field, value in payload.model_dump(exclude_unset=True).items():
        if value is None and field not in nullable:
            continue
        setattr(activity, field, value)
    db.commit()
    db.refresh(activity)
    recalc_day_total(db, activity.itinerary_day_id)
    return activity


@router.delete("/trips/{trip_id}/activities/{activity_id}", status_code=204)
def delete_activity(
    trip_id: str,
    activity_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    activity = _get_activity(db, get_owned_trip(db, user, trip_id), activity_id)
    day_id = activity.itinerary_day_id
    db.delete(activity)
    db.commit()
    recalc_day_total(db, day_id)
    return Response(status_code=204)
