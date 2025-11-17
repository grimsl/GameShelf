/**
 * @deprecated Import from src/types/index.ts instead
 * Kept for backward compatibility
 */
export type { User } from './index';

export interface ProfileFormData {
  userHandle: string;
  bio: string;
  avatarUrl: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  userHandle: string;
  email: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}
