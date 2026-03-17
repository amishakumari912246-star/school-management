import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map, tap } from 'rxjs';

type Role = 'Admin' | 'Teacher' | 'Student' | 'Accountant';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = 'http://localhost:5000/api/auth';

  private readonly tokenKey = 'school_token';
  private readonly userKey = 'school_user';

  private readonly userState = new BehaviorSubject<AuthUser | null>(this.readStoredUser());
  readonly user$ = this.userState.asObservable();

  login(payload: { email: string; password: string; role: Role }) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((response) => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.userKey, JSON.stringify(response.user));
        this.userState.next(response.user);
      })
    );
  }

  register(payload: { name: string; email: string; password: string; role: Role }) {
    return this.http.post(`${this.baseUrl}/register`, payload);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userState.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): AuthUser | null {
    return this.userState.value;
  }

  isLoggedIn(): boolean {
    return Boolean(this.getToken());
  }

  hasAnyRole(roles: string[]): boolean {
    const current = this.getCurrentUser();
    return Boolean(current && roles.includes(current.role));
  }

  currentRole() {
    return this.user$.pipe(map((user) => user?.role ?? 'Guest'));
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
