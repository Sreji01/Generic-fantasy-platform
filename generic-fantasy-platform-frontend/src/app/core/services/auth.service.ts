import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserRole } from '../models/auth.model';

interface StoredAuth {
  token: string;
  username: string;
  email: string;
  role: UserRole;
}

const STORAGE_KEY = 'auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authState = signal<StoredAuth | null>(this.readFromStorage());

  readonly currentUser = this.authState.asReadonly();
  readonly isAuthenticated = computed(() => this.authState() !== null);

  constructor(private readonly http: HttpClient) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.authState.set(null);
  }

  getToken(): string | null {
    return this.authState()?.token ?? null;
  }

  private setSession(response: AuthResponse): void {
    const stored: StoredAuth = {
      token: response.token,
      username: response.username,
      email: response.email,
      role: response.role
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    this.authState.set(stored);
  }

  private readFromStorage(): StoredAuth | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as StoredAuth;
    } catch {
      return null;
    }
  }
}
