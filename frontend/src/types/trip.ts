export interface Activity {
  id: string;
  itinerary_day_id: string;
  title: string;
  description: string;
  activity_type: 'morning' | 'afternoon' | 'evening';
  start_time: string;
  end_time: string;
  estimated_cost: number;
  currency: string;
  location_name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  booking_url?: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string;
  title: string;
  summary: string;
  estimated_total: number;
  notes?: string | null;
  dining_suggestions?: string[];
  transport_guidance?: string | null;
  practical_tips?: string | null;
  activities: Activity[];
}

export interface BudgetCategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  description: string;
}

export interface BudgetCalculation {
  currency: string;
  budget_target: number;
  estimated_total: number;
  per_person_target: number;
  per_person_estimated: number;
  traveler_count: number;
  is_over_budget: boolean;
  difference: number;
  categories: BudgetCategoryBreakdown[];
  daily_average: number;
  assumptions: string[];
  warnings: string[];
}

export interface TripListItem {
  id: string;
  user_id: string;
  title: string;
  destination: string;
  country?: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  traveler_count: number;
  budget_amount: number;
  currency: string;
  travel_style: 'budget' | 'balanced' | 'luxury';
  pace: 'relaxed' | 'balanced' | 'packed';
  interests: string[];
  status: 'planned' | 'active' | 'completed' | 'draft';
  theme?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Trip extends TripListItem {
  accommodation_preferences: string;
  dietary_requirements: string;
  accessibility_requirements: string;
  special_requests?: string | null;
  summary?: string | null;
  days: ItineraryDay[];
  budget_breakdown?: BudgetCalculation | null;
}

export interface TripCreateInput {
  title?: string;
  destination: string;
  country?: string;
  start_date: string;
  end_date: string;
  traveler_count: number;
  budget_amount: number;
  currency: string;
  travel_style: string;
  pace: string;
  interests: string[];
  accommodation_preferences: string;
  dietary_requirements: string;
  accessibility_requirements: string;
  special_requests?: string;
}

export interface TripUpdateInput {
  title?: string;
  traveler_count?: number;
  budget_amount?: number;
  currency?: string;
  travel_style?: string;
  pace?: string;
  interests?: string[];
  accommodation_preferences?: string;
  dietary_requirements?: string;
  accessibility_requirements?: string;
  special_requests?: string;
  status?: string;
}
