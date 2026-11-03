export interface UserProfile {
  id: string;
  email?: string | null;
  full_name?: string | null;
  preferred_currency: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}
