export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type UserRole = 'USER' | 'ADMIN';

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: UserRole;
}
