import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { LoginBody, LoginResp } from '../models/Auth';
import { ChangePasswordBody } from '../models/ChangePassword';
import { RegisterBody } from '../models/RegisterBody';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = 'http://localhost:4000';

  private role$ = new BehaviorSubject<string | null>(localStorage.getItem('role'));
  public currentRole$ = this.role$.asObservable();

  constructor() {}

  login(body: LoginBody) {
    return this.http.post<LoginResp>(`${this.base}/auth/login`, body);
  }

  adminLogin(body: LoginBody) {
    return this.http.post<LoginResp>(`${this.base}/admin/login`, body);
  }

  changePassword(body: ChangePasswordBody) {
    return this.http.post<{ message: string }>(`${this.base}/auth/change-password`, body);
  }

  register(body: RegisterBody) {
    return this.http.post<{ message: string }>(`${this.base}/auth/register`, body);
  }

  saveSession(token: string, role: string, username: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('username', username);
    this.role$.next(role);
  }

  logout() {
    localStorage.clear();
    this.role$.next(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getRole(): string | null {
    return this.role$.getValue();
  }

  isTourist(): boolean {
    return this.getRole() === 'turista';
  }

  isOwner(): boolean {
    return this.getRole() === 'vlasnik';
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }
}
