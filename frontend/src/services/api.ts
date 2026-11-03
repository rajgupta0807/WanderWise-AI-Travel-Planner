import { Trip, TripListItem, TripCreateInput, TripUpdateInput, Activity, ItineraryDay } from '../types/trip';
import { UserProfile } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('wanderwise_token');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers || {}) };

    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 204) {
        return null as unknown as T;
      }

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let errorMsg = 'An unexpected error occurred';
        if (data && typeof data === 'object') {
          if (data.detail) {
            errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          } else if (data.errors && Array.isArray(data.errors)) {
            errorMsg = data.errors.join(', ');
          }
        }
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err: any) {
      if (err.message && err.message !== 'Failed to fetch') {
        throw err;
      }
      throw new Error('Could not connect to Wanderwise server. Please ensure the backend is running.');
    }
  }

  // Health
  async health(): Promise<{ status: string; database: any; ai_engine: any; version: string }> {
    return this.request('/api/health');
  }

  // Auth & Profile
  async createGuestSession(): Promise<{ access_token: string; user_id: string; email: string; full_name?: string }> {
    return this.request('/api/auth/guest', { method: 'POST' });
  }

  async login(email: string, password: string): Promise<{ access_token: string; user_id: string; email: string; full_name?: string }> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, full_name?: string, preferred_currency?: string): Promise<{ access_token: string; user_id: string; email: string; full_name?: string }> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, preferred_currency }),
    });
  }

  async getProfile(): Promise<UserProfile> {
    return this.request('/api/me');
  }

  async updateProfile(data: { full_name?: string; preferred_currency?: string }): Promise<UserProfile> {
    return this.request('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Trips
  async listTrips(params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  } = {}): Promise<{ items: TripListItem[]; total: number; page: number; size: number; pages: number }> {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.size) q.append('size', params.size.toString());
    if (params.search) q.append('search', params.search);
    if (params.status && params.status !== 'all') q.append('status', params.status);
    if (params.sort_by) q.append('sort_by', params.sort_by);
    if (params.sort_order) q.append('sort_order', params.sort_order);

    const queryString = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/api/trips${queryString}`);
  }

  async createTrip(data: TripCreateInput): Promise<Trip> {
    return this.request('/api/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTrip(tripId: string): Promise<Trip> {
    return this.request(`/api/trips/${tripId}`);
  }

  async updateTrip(tripId: string, data: TripUpdateInput): Promise<Trip> {
    return this.request(`/api/trips/${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTrip(tripId: string): Promise<void> {
    return this.request(`/api/trips/${tripId}`, {
      method: 'DELETE',
    });
  }

  async regenerateFullTrip(tripId: string): Promise<Trip> {
    return this.request(`/api/trips/${tripId}/regenerate`, {
      method: 'POST',
    });
  }

  // Days & Activities
  async regenerateDay(tripId: string, dayId: string, focus_preference?: string): Promise<ItineraryDay> {
    return this.request(`/api/trips/${tripId}/days/${dayId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ focus_preference }),
    });
  }

  async createActivity(tripId: string, dayId: string, activity: Partial<Activity>): Promise<Activity> {
    return this.request(`/api/trips/${tripId}/days/${dayId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  }

  async updateActivity(tripId: string, activityId: string, activity: Partial<Activity>): Promise<Activity> {
    return this.request(`/api/trips/${tripId}/activities/${activityId}`, {
      method: 'PATCH',
      body: JSON.stringify(activity),
    });
  }

  async deleteActivity(tripId: string, activityId: string): Promise<void> {
    return this.request(`/api/trips/${tripId}/activities/${activityId}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
