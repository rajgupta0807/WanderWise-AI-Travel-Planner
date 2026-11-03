import datetime as dt
import re
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

TIME_RE = re.compile(r"^([01]?\d|2[0-3]):[0-5]\d$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
ACTIVITY_TYPES = {"morning", "afternoon", "evening"}
TRIP_STATUSES = {"draft", "generated", "confirmed", "completed", "archived"}
MAX_TRIP_DAYS = 30


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


def _check_time(v: Optional[str]) -> Optional[str]:
    if v is not None and not TIME_RE.match(v):
        raise ValueError("must be a time like 09:00")
    return v


def _check_activity_type(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip().lower()
    if v not in ACTIVITY_TYPES:
        raise ValueError("must be morning, afternoon, or evening")
    return v


# --------------------------------------------------------------------- Auth
class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)
    full_name: Optional[str] = Field(default=None, max_length=255)
    preferred_currency: Optional[str] = "USD"

    @field_validator("email")
    @classmethod
    def valid_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v) or len(v) > 255:
            raise ValueError("invalid email address")
        return v


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=255)
    preferred_currency: Optional[str] = Field(default=None, max_length=10)


class ProfileResponse(ORMModel):
    id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    preferred_currency: str = "USD"
    created_at: dt.datetime
    updated_at: dt.datetime


# ---------------------------------------------------------------- Activities
class ActivityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    activity_type: str = Field(default="morning", description="morning, afternoon, or evening")
    start_time: str = Field(description="e.g. 09:00")
    end_time: str = Field(description="e.g. 11:30")
    estimated_cost: float = Field(default=0.0, ge=0)
    currency: str = Field(default="USD", max_length=10)
    location_name: str = Field(min_length=1, max_length=255)
    address: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    booking_url: Optional[str] = None
    sort_order: int = 0

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_times(cls, v):
        return _check_time(v)

    @field_validator("activity_type")
    @classmethod
    def validate_activity_type(cls, v):
        return _check_activity_type(v)


class ActivityUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None
    activity_type: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    estimated_cost: Optional[float] = Field(default=None, ge=0)
    currency: Optional[str] = Field(default=None, max_length=10)
    location_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    address: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    booking_url: Optional[str] = None
    sort_order: Optional[int] = None

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_times(cls, v):
        return _check_time(v)

    @field_validator("activity_type")
    @classmethod
    def validate_activity_type(cls, v):
        return _check_activity_type(v)


class ActivityResponse(ORMModel):
    id: str
    itinerary_day_id: str
    title: str
    description: str
    activity_type: str = "morning"
    start_time: str
    end_time: str
    estimated_cost: float = 0.0
    currency: str = "USD"
    location_name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    booking_url: Optional[str] = None
    sort_order: int = 0
    created_at: dt.datetime
    updated_at: dt.datetime


# ---------------------------------------------------------------------- Days
class ItineraryDayUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    summary: Optional[str] = None
    estimated_total: Optional[float] = Field(default=None, ge=0)
    notes: Optional[str] = None
    dining_suggestions: Optional[List[str]] = None
    transport_guidance: Optional[str] = None
    practical_tips: Optional[str] = None


class RegenerateDayRequest(BaseModel):
    focus_preference: Optional[str] = Field(default=None, max_length=255)


class ItineraryDayResponse(ORMModel):
    id: str
    trip_id: str
    day_number: int
    date: dt.date
    title: str
    summary: str
    estimated_total: float = 0.0
    notes: Optional[str] = None
    dining_suggestions: Optional[List[str]] = []
    transport_guidance: Optional[str] = None
    practical_tips: Optional[str] = None
    activities: List[ActivityResponse] = []


# -------------------------------------------------------------------- Budget
class BudgetCategoryBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
    description: str


class BudgetCalculation(BaseModel):
    currency: str
    budget_target: float
    estimated_total: float
    per_person_target: float
    per_person_estimated: float
    traveler_count: int
    is_over_budget: bool
    difference: float
    categories: List[BudgetCategoryBreakdown]
    daily_average: float
    assumptions: List[str]
    warnings: List[str]


# --------------------------------------------------------------------- Trips
class TripCreate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    destination: str = Field(min_length=2, max_length=255)
    country: Optional[str] = Field(default=None, max_length=120)
    start_date: dt.date
    end_date: dt.date
    traveler_count: int = Field(default=1, ge=1, le=50)
    budget_amount: float = Field(gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=10)
    travel_style: str = Field(default="balanced", max_length=50)
    pace: str = Field(default="balanced", max_length=50)
    interests: List[str] = []
    accommodation_preferences: str = Field(default="balanced hotel", max_length=100)
    dietary_requirements: str = Field(default="none", max_length=255)
    accessibility_requirements: str = Field(default="none", max_length=255)
    special_requests: Optional[str] = None

    @field_validator("currency")
    @classmethod
    def upper_currency(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("interests")
    @classmethod
    def clean_interests(cls, v: List[str]) -> List[str]:
        cleaned = [i.strip() for i in v if i and i.strip()]
        if len(cleaned) > 20:
            raise ValueError("at most 20 interests")
        return cleaned

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if (self.end_date - self.start_date).days + 1 > MAX_TRIP_DAYS:
            raise ValueError(f"trips can be at most {MAX_TRIP_DAYS} days long")
        return self


class TripUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    traveler_count: Optional[int] = Field(default=None, ge=1, le=50)
    budget_amount: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=10)
    travel_style: Optional[str] = Field(default=None, max_length=50)
    pace: Optional[str] = Field(default=None, max_length=50)
    interests: Optional[List[str]] = None
    accommodation_preferences: Optional[str] = Field(default=None, max_length=100)
    dietary_requirements: Optional[str] = Field(default=None, max_length=255)
    accessibility_requirements: Optional[str] = Field(default=None, max_length=255)
    special_requests: Optional[str] = None
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in TRIP_STATUSES:
            raise ValueError(f"status must be one of {sorted(TRIP_STATUSES)}")
        return v


class TripListItem(ORMModel):
    id: str
    user_id: str
    title: str
    destination: str
    country: Optional[str] = None
    start_date: dt.date
    end_date: dt.date
    duration_days: int
    traveler_count: int
    budget_amount: float
    currency: str
    travel_style: str
    pace: str
    interests: List[str]
    status: str
    theme: Optional[str] = None
    created_at: dt.datetime
    updated_at: dt.datetime


class TripListResponse(BaseModel):
    items: List[TripListItem]
    total: int
    page: int
    size: int
    pages: int


class TripResponse(TripListItem):
    accommodation_preferences: str
    dietary_requirements: str
    accessibility_requirements: str
    special_requests: Optional[str] = None
    summary: Optional[str] = None
    days: List[ItineraryDayResponse] = []
    budget_breakdown: Optional[BudgetCalculation] = None
