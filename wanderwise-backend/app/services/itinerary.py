from typing import Any, Dict

from sqlalchemy.orm import Session

from app.db.models import Activity, ItineraryDay, Trip
from app.schemas import TripResponse
from app.services.ai import _day_date
from app.services.budget import compute_budget


def _build_activities(items) -> list:
    return [
        Activity(
            title=a["title"],
            description=a.get("description") or a["title"],
            activity_type=a.get("activity_type", "morning"),
            start_time=a.get("start_time", "09:00"),
            end_time=a.get("end_time", "11:00"),
            estimated_cost=a.get("estimated_cost", 0.0),
            currency=a.get("currency", "USD"),
            location_name=a.get("location_name") or a["title"],
            address=a.get("address"),
            latitude=a.get("latitude"),
            longitude=a.get("longitude"),
            booking_url=a.get("booking_url"),
            sort_order=a.get("sort_order", 0),
        )
        for a in items
    ]


def apply_day_data(day: ItineraryDay, data: Dict[str, Any]) -> None:
    day.title = data["title"]
    day.summary = data.get("summary") or ""
    day.notes = data.get("notes")
    day.dining_suggestions = data.get("dining_suggestions") or []
    day.transport_guidance = data.get("transport_guidance")
    day.practical_tips = data.get("practical_tips")
    day.activities = _build_activities(data["activities"])
    day.estimated_total = round(sum(a.estimated_cost for a in day.activities), 2)


def apply_full_itinerary(trip: Trip, generated: Dict[str, Any]) -> None:
    days = []
    for data in generated["days"]:
        day = ItineraryDay(day_number=data["day_number"], date=_day_date(trip, data["day_number"]))
        apply_day_data(day, data)
        days.append(day)
    trip.days = days  # delete-orphan cascade removes any previous days
    trip.summary = generated.get("summary")
    trip.theme = generated.get("theme")
    trip.status = "generated"


def recalc_day_total(db: Session, day_id: str) -> None:
    day = db.get(ItineraryDay, day_id)
    if day is None:
        return
    db.refresh(day)
    day.estimated_total = round(sum(a.estimated_cost or 0.0 for a in day.activities), 2)
    db.commit()


def trip_to_response(trip: Trip) -> TripResponse:
    response = TripResponse.model_validate(trip)
    response.budget_breakdown = compute_budget(trip)
    return response
