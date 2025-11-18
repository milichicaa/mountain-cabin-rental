// src/app/admin-login/admin-login.component.ts
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { LoginBody } from '../models/Auth';

/**
 * Komponenta za prijavu administratora.
 */
@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  body: LoginBody = {
    username: '',
    password: ''
  };

  loading = false;
  errorMsg = '';

  /**
   * Prijava administratora na sistem.
   */
  login() {
    this.loading = true;
    this.errorMsg = '';

    this.auth.adminLogin(this.body).subscribe({
      next: (res: any) => {
        this.loading = false;

        const role = res.user?.role ?? res.role ?? 'admin';
        const username = res.user?.username ?? res.username ?? this.body.username;

        this.auth.saveSession(res.token, role, username);
        this.router.navigate(['/admin/requests']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || err?.message || 'Greška pri prijavi.';
      }
    });
  }
}
