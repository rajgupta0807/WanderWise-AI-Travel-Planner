"""Itinerary generation.

If AI_API_KEY is configured, an OpenAI-compatible chat-completions endpoint is
asked for the itinerary. If it is not configured, or the call fails for any
reason, a deterministic template generator is used so the API always works.
"""
import datetime as dt
import json
import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings
from app.db.models import Trip
from app.schemas import ACTIVITY_TYPES, TIME_RE

logger = logging.getLogger("wanderwise.ai")

# (title, description, location) with {dest} placeholders.
TEMPLATES: Dict[str, List[tuple]] = {
    "food": [
        ("Local food tasting in {dest}", "Sample regional specialities at popular local eateries and street-food spots.", "{dest} food district"),
        ("Market visit and cooking experience", "Browse a local market for ingredients, then join a hands-on cooking session.", "{dest} central market"),
        ("Dinner at a well-reviewed local restaurant", "Enjoy a relaxed dinner featuring traditional dishes of the region.", "{dest} old town restaurants"),
    ],
    "culture": [
        ("Visit {dest}'s main museum", "Explore the history and art of the area at the city's best-known museum.", "{dest} main museum"),
        ("Old town heritage walk", "Wander historic streets, squares and landmarks with time for photos and cafes.", "{dest} old town"),
        ("Traditional performance or cultural show", "Catch a local music, dance or theatre performance in the evening.", "{dest} cultural centre"),
    ],
    "history": [
        ("Historic landmarks tour", "Visit the most important historical sites and learn their stories.", "{dest} historic sites"),
        ("Fort, palace or monument visit", "See a major monument and enjoy the views and architecture.", "{dest} main monument"),
    ],
    "nature": [
        ("Scenic park or viewpoint visit", "Spend the morning outdoors at a nearby park, garden or viewpoint.", "{dest} scenic viewpoint"),
        ("Sunset at a natural landmark", "Relax and watch the sunset from one of the area's best spots.", "{dest} sunset point"),
        ("Easy nature walk", "A gentle guided or self-guided walk through local landscapes.", "{dest} nature trail"),
    ],
    "adventure": [
        ("Guided outdoor adventure near {dest}", "Try a local adventure activity such as trekking, water sports or cycling.", "{dest} adventure base"),
        ("Half-day active excursion", "Join a small-group excursion with a licensed local operator.", "{dest} outskirts"),
    ],
    "shopping": [
        ("Local markets and artisan shops", "Shop for crafts, souvenirs and local products.", "{dest} shopping quarter"),
        ("Browse the main shopping street", "Stroll through shops, boutiques and cafes at your own pace.", "{dest} main street"),
    ],
    "nightlife": [
        ("Evening out in {dest}", "Enjoy live music, bars or a night market in the lively part of town.", "{dest} nightlife district"),
    ],
    "relaxation": [
        ("Spa or wellness session", "Unwind with a massage or spa treatment.", "{dest} wellness centre"),
        ("Slow afternoon at a cafe or beach", "Take it easy with a book, a coffee and some downtime.", "{dest} waterfront or cafe area"),
    ],
}
GENERIC = [
    ("Explore {dest} city centre", "Get your bearings with a relaxed walk through the heart of the city.", "{dest} city centre"),
    ("Popular local attraction", "Visit one of the area's most recommended attractions.", "{dest} top attraction"),
    ("Dinner in a local neighbourhood", "Find a cosy spot for dinner away from the busiest tourist streets.", "{dest} local neighbourhood"),
]

SLOTS = {
    "relaxed": [("morning", "10:00", "12:30"), ("evening", "18:30", "20:30")],
    "balanced": [("morning", "09:00", "11:30"), ("afternoon", "13:30", "16:00"), ("evening", "18:30", "21:00")],
    "packed": [("morning", "08:30", "10:30"), ("morning", "10:45", "12:30"), ("afternoon", "14:00", "16:30"), ("evening", "18:00", "21:30")],
}

# Share of the total trip budget the template generator spends on activities.
ACTIVITY_BUDGET_SHARE = 0.20


def _day_date(trip: Trip, day_number: int) -> dt.date:
    return trip.start_date + dt.timedelta(days=day_number - 1)


# ---------------------------------------------------------------- templates
def _template_day(trip: Trip, day_number: int, focus: Optional[str]) -> Dict[str, Any]:
    dest = trip.destination
    slots = SLOTS.get((trip.pace or "balanced").lower(), SLOTS["balanced"])
    interests = [i.lower() for i in (trip.interests or [])]
    keys = [k for k in interests if k in TEMPLATES]
    if focus:
        focus_l = focus.lower()
        focus_keys = [k for k in TEMPLATES if k in focus_l]
        keys = focus_keys + [k for k in keys if k not in focus_keys]
    if not keys:
        keys = ["culture", "food", "nature"]

    per_day_budget = trip.budget_amount * ACTIVITY_BUDGET_SHARE / max(trip.duration_days, 1)
    cost_each = round(per_day_budget / len(slots), 2)

    activities = []
    for i, (kind, start, end) in enumerate(slots):
        key = keys[(day_number - 1 + i) % len(keys)]
        options = TEMPLATES[key]
        title, desc, loc = options[(day_number - 1 + i) % len(options)]
        activities.append(
            {
                "title": title.format(dest=dest),
                "description": desc,
                "activity_type": kind,
                "start_time": start,
                "end_time": end,
                "estimated_cost": cost_each,
                "currency": trip.currency,
                "location_name": loc.format(dest=dest),
                "sort_order": i,
            }
        )

    diet = (trip.dietary_requirements or "none").strip()
    access = (trip.accessibility_requirements or "none").strip()
    tips = ["Book popular attractions in advance and carry some cash for small vendors."]
    if diet.lower() != "none":
        tips.append(f"Dietary needs ({diet}): confirm ingredients with restaurants before ordering.")
    if access.lower() != "none":
        tips.append(f"Accessibility needs ({access}): check venue access before you go.")

    theme = keys[0].title()
    return {
        "day_number": day_number,
        "title": f"Day {day_number}: {theme} in {dest}",
        "summary": f"A {trip.pace or 'balanced'}-paced day in {dest} focused on {', '.join(keys[:2])}.",
        "notes": trip.special_requests or None,
        "dining_suggestions": [
            f"Try a well-reviewed local restaurant near your first stop in {dest}.",
            "Ask your hotel for a recommendation for a traditional local dish.",
        ],
        "transport_guidance": "Use local taxis, ride-hailing apps or public transport; walk between nearby stops.",
        "practical_tips": " ".join(tips),
        "activities": activities,
    }


def _template_result(trip: Trip, day_numbers: List[int], focus: Optional[str]) -> Dict[str, Any]:
    interests = ", ".join(trip.interests[:3]) if trip.interests else "sightseeing"
    return {
        "summary": (
            f"{trip.duration_days}-day {trip.travel_style} trip to {trip.destination} for "
            f"{trip.traveler_count} traveller(s), focused on {interests}."
        ),
        "theme": (trip.interests[0].title() if trip.interests else trip.travel_style.title()),
        "days": [_template_day(trip, n, focus) for n in day_numbers],
        "source": "template",
    }


# ---------------------------------------------------------------------- AI
def _extract_json(text: str) -> Dict[str, Any]:
    text = text.strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("no JSON object in AI response")
    return json.loads(text[start : end + 1])


def _clean_time(value: Any, default: str) -> str:
    value = str(value or "").strip()
    return value if TIME_RE.match(value) else default


def _norm_activity(raw: Any, idx: int, currency: str) -> Optional[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return None
    title = str(raw.get("title") or "").strip()[:255]
    if not title:
        return None
    kind = str(raw.get("activity_type") or "").strip().lower()
    if kind not in ACTIVITY_TYPES:
        kind = "morning"
    try:
        cost = max(float(raw.get("estimated_cost") or 0), 0.0)
    except (TypeError, ValueError):
        cost = 0.0

    def num(key: str, lo: float, hi: float) -> Optional[float]:
        try:
            v = float(raw.get(key))
            return v if lo <= v <= hi else None
        except (TypeError, ValueError):
            return None

    return {
        "title": title,
        "description": str(raw.get("description") or title).strip(),
        "activity_type": kind,
        "start_time": _clean_time(raw.get("start_time"), "09:00"),
        "end_time": _clean_time(raw.get("end_time"), "11:00"),
        "estimated_cost": round(cost, 2),
        "currency": currency,
        "location_name": (str(raw.get("location_name") or title).strip())[:255],
        "address": (str(raw["address"]).strip()[:500] if raw.get("address") else None),
        "latitude": num("latitude", -90, 90),
        "longitude": num("longitude", -180, 180),
        "booking_url": (str(raw["booking_url"]).strip()[:1000] if raw.get("booking_url") else None),
        "sort_order": idx,
    }


def _norm_day(raw: Any, day_number: int, trip: Trip) -> Optional[Dict[str, Any]]:
    if not isinstance(raw, dict):
        return None
    activities = [
        a
        for i, r in enumerate(raw.get("activities") or [])
        if (a := _norm_activity(r, i, trip.currency)) is not None
    ]
    if not activities:
        return None
    dining = raw.get("dining_suggestions")
    if isinstance(dining, str):
        dining = [dining]
    return {
        "day_number": day_number,
        "title": (str(raw.get("title") or f"Day {day_number}").strip())[:255],
        "summary": str(raw.get("summary") or "").strip(),
        "notes": (str(raw["notes"]).strip() if raw.get("notes") else None),
        "dining_suggestions": [str(d) for d in (dining or [])][:6],
        "transport_guidance": (str(raw["transport_guidance"]).strip() if raw.get("transport_guidance") else None),
        "practical_tips": (str(raw["practical_tips"]).strip() if raw.get("practical_tips") else None),
        "activities": activities,
    }


def _call_ai(trip: Trip, day_numbers: List[int], focus: Optional[str]) -> Dict[str, Any]:
    slots = SLOTS.get((trip.pace or "balanced").lower(), SLOTS["balanced"])
    request = {
        "destination": trip.destination,
        "country": trip.country,
        "traveler_count": trip.traveler_count,
        "total_budget": trip.budget_amount,
        "currency": trip.currency,
        "travel_style": trip.travel_style,
        "pace": trip.pace,
        "activities_per_day": len(slots),
        "interests": trip.interests,
        "accommodation_preferences": trip.accommodation_preferences,
        "dietary_requirements": trip.dietary_requirements,
        "accessibility_requirements": trip.accessibility_requirements,
        "special_requests": trip.special_requests,
        "focus_preference": focus,
        "days_to_plan": [
            {"day_number": n, "date": _day_date(trip, n).isoformat()} for n in day_numbers
        ],
    }
    schema_hint = {
        "summary": "string, 1-2 sentences about the whole trip",
        "theme": "string, 1-3 words",
        "days": [
            {
                "day_number": "integer matching days_to_plan",
                "title": "string",
                "summary": "string",
                "notes": "string or null",
                "dining_suggestions": ["string"],
                "transport_guidance": "string",
                "practical_tips": "string",
                "activities": [
                    {
                        "title": "string",
                        "description": "string",
                        "activity_type": "morning | afternoon | evening",
                        "start_time": "HH:MM",
                        "end_time": "HH:MM",
                        "estimated_cost": "number, total for the whole group in the trip currency",
                        "location_name": "string",
                        "address": "string or null",
                        "latitude": "number or null",
                        "longitude": "number or null",
                    }
                ],
            }
        ],
    }
    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert travel planner. Reply with ONE JSON object only, no prose. "
                "Use real places. Keep the sum of all activity costs under about 25% of the total budget "
                "(the rest goes to lodging, food and transport). Respect dietary and accessibility needs."
            ),
        },
        {
            "role": "user",
            "content": json.dumps({"trip": request, "required_json_shape": schema_hint}),
        },
    ]
    url = settings.AI_BASE_URL.rstrip("/") + "/chat/completions"
    headers = {"Authorization": f"Bearer {settings.AI_API_KEY}"}
    body = {
        "model": settings.AI_MODEL,
        "messages": messages,
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }
    with httpx.Client(timeout=settings.AI_TIMEOUT_SECONDS) as client:
        resp = client.post(url, headers=headers, json=body)
        if resp.status_code == 400:  # some providers reject response_format
            body.pop("response_format")
            resp = client.post(url, headers=headers, json=body)
        resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    return _extract_json(content)


def generate_itinerary(
    trip: Trip, day_numbers: List[int], focus: Optional[str] = None
) -> Dict[str, Any]:
    """Return {"summary", "theme", "days": [...], "source"} for the given days."""
    template = _template_result(trip, day_numbers, focus)
    if not settings.AI_API_KEY:
        return template
    try:
        ai = _call_ai(trip, day_numbers, focus)
        ai_days = {}
        for pos, raw in enumerate(ai.get("days") or []):
            number = raw.get("day_number") if isinstance(raw, dict) else None
            if not isinstance(number, int):
                number = day_numbers[pos] if pos < len(day_numbers) else None
            if number in day_numbers:
                norm = _norm_day(raw, number, trip)
                if norm:
                    ai_days[number] = norm
        if not ai_days:
            raise ValueError("AI response contained no usable days")
        template_days = {d["day_number"]: d for d in template["days"]}
        return {
            "summary": str(ai.get("summary") or template["summary"]).strip(),
            "theme": (str(ai.get("theme") or template["theme"]).strip())[:120],
            "days": [ai_days.get(n) or template_days[n] for n in day_numbers],
            "source": "ai",
        }
    except Exception as exc:  # noqa: BLE001 - never fail the request because of the AI
        logger.warning("AI generation failed, using template: %s", re.sub(r"\s+", " ", str(exc)))
        return template
