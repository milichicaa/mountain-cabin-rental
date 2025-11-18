import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Planinska vikendica';

  auth = inject(AuthService);
  private router = inject(Router);

  role$!: Observable<string | null>;
  username: string | null = null;

  ngOnInit() {
    this.role$ = this.auth.currentRole$;
    this.username = this.auth.getUsername();
    this.role$.subscribe(() => {
      this.username = this.auth.getUsername();
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
