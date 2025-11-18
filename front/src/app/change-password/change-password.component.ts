import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Komponenta za promenu lozinke korisnika.
 * Omogućava unos stare i nove lozinke i prikazuje status poruku.
 */
@Component({
  standalone: true,
  selector: 'app-change-password',
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent {
  oldPassword = '';
  newPassword = '';
  newPassword2 = '';
  loading = false;
  msg = '';
  ok = false;

  constructor(private auth: AuthService, private router: Router) {}

  /**
   * Menja lozinku korisnika i izloguje ga nakon uspeha.
   */
  promeniLozinku() {
    this.msg = '';
    this.ok = false;
    this.loading = true;

    this.auth.changePassword({
      oldPassword: this.oldPassword,
      newPassword: this.newPassword,
      newPasswordRepeat: this.newPassword2
    }).subscribe({
      next: (res: { message: string }) => {
        this.loading = false;
        this.ok = true;
        this.msg = res?.message || 'Lozinka uspešno promenjena. Bićete izlogovani.';
        setTimeout(() => {
          localStorage.clear();
          this.router.navigateByUrl('/login');
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.ok = false;
        this.msg = err?.error?.message || 'Greška pri promeni lozinke.';
      }
    });
  }
}
