from typing import Optional

from app.db.models import Trip
from app.schemas import BudgetCalculation, BudgetCategoryBreakdown

# Share of the total trip budget assumed for costs that are not individual
# activities. Activities use their real stored costs.
_ACCOMMODATION_SHARE = {"budget": 0.30, "luxury": 0.45}
_DEFAULT_ACCOMMODATION_SHARE = 0.38
_FOOD_SHARE = 0.22
_TRANSPORT_SHARE = 0.10


def compute_budget(trip: Trip) -> Optional[BudgetCalculation]:
    if not trip.days:
        return None

    budget = float(trip.budget_amount)
    travelers = max(trip.traveler_count, 1)
    duration = max(trip.duration_days, 1)

    activities = sum(a.estimated_cost or 0.0 for d in trip.days for a in d.activities)
    accommodation = budget * _ACCOMMODATION_SHARE.get(
        trip.travel_style.lower(), _DEFAULT_ACCOMMODATION_SHARE
    )
    food = budget * _FOOD_SHARE
    transport = budget * _TRANSPORT_SHARE
    total = activities + accommodation + food + transport

    def pct(x: float) -> float:
        return round(x / total * 100, 1) if total else 0.0

    categories = [
        BudgetCategoryBreakdown(
            category="Accommodation",
            amount=round(accommodation, 2),
            percentage=pct(accommodation),
            description=f"Estimated lodging for {max(duration - 1, 1)} night(s), style: {trip.accommodation_preferences}.",
        ),
        BudgetCategoryBreakdown(
            category="Food & Dining",
            amount=round(food, 2),
            percentage=pct(food),
            description="Meals and drinks for the whole group.",
        ),
        BudgetCategoryBreakdown(
            category="Local Transport",
            amount=round(transport, 2),
            percentage=pct(transport),
            description="Taxis, public transport and local transfers.",
        ),
        BudgetCategoryBreakdown(
            category="Activities",
            amount=round(activities, 2),
            percentage=pct(activities),
            description="Sum of planned activity costs across all days (whole group).",
        ),
    ]

    warnings = []
    difference = round(total - budget, 2)
    over = total > budget
    if over:
        warnings.append(
            f"Estimated cost exceeds your budget by {abs(difference):.2f} {trip.currency}."
        )
    if budget and activities > 0.35 * budget:
        warnings.append("Activities take up more than 35% of the budget.")

    return BudgetCalculation(
        currency=trip.currency,
        budget_target=round(budget, 2),
        estimated_total=round(total, 2),
        per_person_target=round(budget / travelers, 2),
        per_person_estimated=round(total / travelers, 2),
        traveler_count=travelers,
        is_over_budget=over,
        difference=difference,
        categories=categories,
        daily_average=round(total / duration, 2),
        assumptions=[
            "Activity costs are totals for the whole group, not per person.",
            "Accommodation, food and transport are estimated as fixed shares of your budget.",
            "Prices are rough planning estimates, not live quotes.",
        ],
        warnings=warnings,
    )
