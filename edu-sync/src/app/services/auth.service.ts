// src/app/core/auth/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, switchMap } from 'rxjs';

type Role = 'student' | 'trainer' | 'admin';
interface RegisterDto {
  email: string;
  password: string;
  role: Role;
}
interface LoginDto {
  email: string;
  password: string;
}

// Be flexible about server payload keys
type LoginResponse =
  | { access_token: string; role?: string }
  | { accessToken: string; role?: string }
  | { token: string; role?: string };

const BASE_URL = 'http://localhost:4000/api';

function decodeJwt<T = any>(token: string): T | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private token$ = new BehaviorSubject<string | null>(
    localStorage.getItem('jwt')
  );
  private role$ = new BehaviorSubject<Role | null>(
    (localStorage.getItem('role') as Role) ?? null
  );

  readonly jwt$ = this.token$.asObservable();
  readonly userRole$ = this.role$.asObservable();

  get token(): string | null {
    return this.token$.value;
  }
  get role(): Role | null {
    return this.role$.value;
  }
  get isLoggedIn(): boolean {
    return !!this.token;
  }

  register(dto: RegisterDto): Observable<void> {
    return this.http.post(`${BASE_URL}/auth/register`, dto).pipe(
      switchMap(() => this.login({ email: dto.email, password: dto.password })),
      map(() => void 0)
    );
  }

  login(dto: LoginDto): Observable<void> {
    return this.http.post<LoginResponse>(`${BASE_URL}/auth/login`, dto).pipe(
      tap((res) => {
        // Accept access_token, accessToken, or token
        const token =
          (res as any).access_token ??
          (res as any).accessToken ??
          (res as any).token;

        if (!token) {
          // Clean up and surface a meaningful error
          this.logout();
          throw new Error('Login response did not include a JWT.');
        }

        this.setToken(token);

        // If the server also returns role on login, store it (optional)
        const roleRaw = (res as any).role as string | undefined;
        if (roleRaw) {
          const role = roleRaw.toLowerCase() as Role;
          localStorage.setItem('role', role);
          this.role$.next(role);
        }
      }),
      map(() => void 0)
    );
  }

  logout(): void {
    localStorage.removeItem('jwt');
    localStorage.removeItem('role');
    this.token$.next(null);
    this.role$.next(null);
  }

  private setToken(token: string): void {
    // Guard so we never write "undefined"
    if (!token || typeof token !== 'string') return;

    localStorage.setItem('jwt', token);
    this.token$.next(token);

    const payload = decodeJwt<{ role?: string }>(token);
    const role = (payload?.role ?? '').toLowerCase() as Role | null;

    if (role) {
      localStorage.setItem('role', role);
      this.role$.next(role);
    } else {
      // keep any role set by login response; otherwise clear
      if (!localStorage.getItem('role')) this.role$.next(null);
    }

    // Optional debug:
    // console.log('JWT sub:', decodeJwt<any>(token)?.sub, 'role:', role);
  }
}
