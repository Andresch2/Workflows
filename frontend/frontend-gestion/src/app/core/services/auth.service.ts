import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, of, tap } from 'rxjs';
import { LoginRequest, LoginResponse, User } from '../models/auth.model';
import { RoleEnum } from '../models/role.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/v1';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuth();
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/email/login`, credentials)
      .pipe(
        tap(response => {
          this.setSession(response);
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
        })
      );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`)
      .pipe(
        tap(user => {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        })
      );
  }

  hasRole(roleId: number): boolean {
    const user = this.currentUser();
    return user?.role?.id === roleId;
  }

  isAdmin(): boolean {
    return this.hasRole(RoleEnum.ADMIN);
  }

  logout(): Observable<void> {
    const token = this.getToken();

    if (!token) {
      this.clearSession(true);
      return of(void 0);
    }

    return this.http.post<void>(`${this.API_URL}/auth/logout`, {}).pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.clearSession(true);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authResult.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
  }

  private checkAuth(): void {
    const token = this.getToken();

    if (!token) {
      this.isAuthenticated.set(false);
      return;
    }

    this.getMe().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      },
      error: (error) => {
        if (error?.status === 401 || error?.status === 403) {
          this.clearSession();
          return;
        }

        this.currentUser.set(null);
        this.isAuthenticated.set(false);
      }
    });
  }

  private clearSession(redirectToLogin = false): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    if (redirectToLogin) {
      void this.router.navigate(['/auth/login']);
    }
  }
}
