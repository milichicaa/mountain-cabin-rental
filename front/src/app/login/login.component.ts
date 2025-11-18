import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  loading = false;
  errorMsg = '';
  submitted = false;

  // Povratna putanja (ako postoji)
  private returnUrl: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Proveri da li postoji ?return= u URL-u
    this.returnUrl = this.route.snapshot.queryParamMap.get('return');
  }

  // Prijava korisnika
  login() {
    this.submitted = true;
    if (!this.username || !this.password) {
      this.errorMsg = 'Popunite oba polja.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        // Sačuvaj sesiju
        this.auth.saveSession(res.token, res.role, res.username);
        this.loading = false;

        // Odloži navigaciju za jedan "tick"
        setTimeout(() => {
          this.handleRedirect(res.role);
        }, 0);
      },
      error: (err) => {
        this.loading = false;
        const code = err?.error?.code;

        // Ako admin pokuša ovde, preusmeri ga na admin login
        if (code === 'ADMIN_USE_SEPARATE_LOGIN') {
          this.router.navigateByUrl('/admin/login');
          return;
        }

        this.errorMsg = err?.error?.message || 'Greška pri prijavi.';
      }
    });
  }

  // Preusmeravanje nakon uspešne prijave
  private handleRedirect(role: string) {
    if (this.returnUrl === 'reserve') {
      const pendingCabin = sessionStorage.getItem('pendingCabin');
      sessionStorage.removeItem('pendingCabin');
      if (pendingCabin) {
        this.router.navigate(['/reservations/create'], { state: { cabin: JSON.parse(pendingCabin) } });
        return;
      }
    }
    if (role === 'admin') this.router.navigateByUrl('/admin/requests');
    else this.router.navigateByUrl(this.returnUrl || (role === 'vlasnik' ? '/owner/profile' : '/profile'));
  }
}
