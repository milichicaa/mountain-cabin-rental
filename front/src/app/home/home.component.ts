import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CabinService } from '../services/cabin.service';
import { StatsService } from '../services/stats.service';
import { Cabin } from '../models/Cabin';

/**
 * Komponenta za prikaz početne stranice sa statistikama i listom vikendica.
 * Omogućava pretragu, sortiranje i rezervaciju vikendica.
 */
@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  // Statistika za kartice
  stats = {
    totalCabins: null as number | null,
    totalOwners: null as number | null,
    totalTourists: null as number | null,
    r24h: null as number | null,
    r7d: null as number | null,
    r30d: null as number | null
  };

  // Prikazane vikendice
  items: Cabin[] = [];

  // Filteri za pretragu
  qName = '';
  qPlace = '';

  // Sortiranje
  sort: { key: 'name' | 'place' | ''; dir: 'asc' | 'desc' } = { key: '', dir: 'asc' };

  // Auth info
  loggedIn = false;
  role: string | null = null;

  constructor() {}

  private cabins = inject(CabinService);
  router = inject(Router);
  private statsApi = inject(StatsService);

  ngOnInit() {
    this.syncAuth();
    this.search();
    this.loadStats();
  }

  /**
   * Učitava statistiku za prikaz na početnoj stranici.
   */
  loadStats() {
    this.statsApi.home().subscribe({
      next: (s) => {
        this.stats.totalCabins  = s.totalCabins;
        this.stats.totalOwners  = s.totalOwners;
        this.stats.totalTourists= s.totalTourists;
        this.stats.r24h         = s.r24h;
        this.stats.r7d          = s.r7d;
        this.stats.r30d         = s.r30d;
      },
      error: () => {}
    });
  }

  /**
   * Proverava login i ulogu korisnika.
   */
  syncAuth() {
    this.loggedIn = !!localStorage.getItem('token');
    this.role = localStorage.getItem('role');
  }

  /**
   * Sortira vikendice po zadatoj koloni.
   */
  onSort(col: 'name' | 'place') {
    if (this.sort.key === col)
      this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    else {
      this.sort.key = col;
      this.sort.dir = 'asc';
    }

    this.items = [...this.items].sort((a: any, b: any) => {
      const av = (a[col] ?? '').toString().toLowerCase();
      const bv = (b[col] ?? '').toString().toLowerCase();
      const cmp = av > bv ? 1 : av < bv ? -1 : 0;
      return this.sort.dir === 'asc' ? cmp : -cmp;
    });
  }

  /**
   * Pretražuje vikendice po filterima.
   */
  search() {
    this.cabins.list(this.qName, this.qPlace).subscribe({
      next: (rows: any) => { this.items = rows || []; },
      error: () => { this.items = []; }
    });
  }

  /**
   * Pokreće proces rezervacije za izabranu vikendicu.
   */
  goReserve(x: Cabin) {
    this.syncAuth();
    if (!this.loggedIn || this.role === 'admin') {
      sessionStorage.setItem('pendingCabin', JSON.stringify(x));
      this.router.navigate(['/login'], { queryParams: { return: 'reserve' } });
      return;
    }
    this.router.navigate(['/reservations/create'], { state: { cabin: x } });
  }

  // Zvezdice za prosečnu ocenu
  five = [1, 2, 3, 4, 5];
  isFilled(avg: number | null | undefined, idx: number) {
    const filled = Math.round(Math.max(0, Math.min(5, avg || 0)));
    return idx <= filled;
  }
}
