import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation } from '../models/Reservation';
import { ReservationService } from '../services/reservation.service';
import { Router } from '@angular/router';
import { ReviewService } from '../services/review.service';

/**
 * Komponenta za prikaz i upravljanje rezervacijama trenutnog korisnika (turista).
 * Omogućava otkazivanje i ocenjivanje rezervacija.
 */
@Component({
  standalone: true,
  selector: 'app-reservations-mine',
  imports: [CommonModule, FormsModule],
  templateUrl: './reservations-mine.component.html',
})
export class ReservationsMineComponent {
  private reservations = inject(ReservationService);
  private router = inject(Router);
  private review = inject(ReviewService);
  items: Reservation[] = [];
  loading = false;
  errorMsg = '';
  infoMsg = '';
  rateOpenId: string | null = null;
  rateValue = 0;
  rateComment = '';

  // 24h pravilo
  private oneDayMs = 24 * 60 * 60 * 1000;

  ngOnInit() { this.load(); }

  /**
   * Učitava rezervacije korisnika.
   */
  load() {
    this.loading = true; this.errorMsg = '';
    this.reservations.mine().subscribe({
      next: rows => { this.loading = false; this.items = rows || []; },
      error: err => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri učitavanju.'; }
    });
  }

  /**
   * Prelazak na stranicu za ocenjivanje vikendice.
   */
  goRate(cabinId: string) {
    this.router.navigate(['/cabin'], { state: { cabinId } });
  }

  /**
   * Proverava da li je moguće otkazati rezervaciju (24h pravilo).
   */
  canCancel(r: Reservation){
    const now = Date.now();
    const from = new Date(r.dateFrom).getTime();
    return (r.status === 'pending' || r.status === 'accepted') && (from - now) >= this.oneDayMs;
  }

  /**
   * Otkazuje rezervaciju.
   */
  cancel(r: Reservation){
    if (this.loading || !this.canCancel(r)) return;
    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.reservations.cancel(r._id).subscribe({
      next: (res) => { this.loading = false; r.status = 'cancelled'; this.infoMsg = res?.message || 'Otkazano.'; },
      error: (err) => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri otkazivanju.'; }
    });
  }

  /**
   * Proverava da li je moguće oceniti rezervaciju.
   */
  canRate(r: Reservation){
    return r.status === 'completed' && !r.userRating;
  }

  /**
   * Otvara modal za ocenu rezervacije.
   */
  openRate(r: Reservation){
    this.rateOpenId = r._id;
    this.rateValue = 0;
    this.rateComment = '';
  }

  /**
   * Zatvara modal za ocenu.
   */
  cancelRate(){
    this.rateOpenId = null;
    this.rateValue = 0;
    this.rateComment = '';
  }

  /**
   * Postavlja izabranu ocenu (zvezdicu).
   */
  setStar(n: number) { this.rateValue = n; }

  /**
   * Šalje ocenu za rezervaciju.
   */
  submitRate(r: Reservation) {
    if (!this.rateValue || this.rateValue < 1 || this.rateValue > 5) return;
    this.loading = true; this.errorMsg=''; this.infoMsg='';
    this.review.createForReservation(r._id, this.rateValue, this.rateComment).subscribe({
      next: _ => {
        r.userRating = this.rateValue;
        r.userComment = this.rateComment;
        this.loading = false;
        this.infoMsg = 'Ocena sačuvana.';
        this.cancelRate();
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri čuvanju ocene.';
      }
    });
  }

  /**
   * Formatira datum (YYYY-MM-DD).
   */
  fmt(iso?: string){ return iso ? iso.slice(0,10) : '—'; }

  /**
   * Trenutne rezervacije (pending/accepted i nisu istekle).
   */
  get current(): Reservation[] {
    const now = Date.now();
    return this.items
      .filter(r =>
        (r.status === 'pending' || r.status === 'accepted') &&
        new Date(r.dateTo).getTime() >= now
      );
  }

  /**
   * Arhivirane rezervacije (završene, otkazane, odbijene ili istekle).
   */
  get archive(): Reservation[] {
    const now = Date.now();
    return [...this.items]
      .filter(r =>
        r.status === 'completed' ||
        r.status === 'cancelled' ||
        r.status === 'rejected' ||
        new Date(r.dateTo).getTime() < now
      )
      .sort((a, b) =>
        new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime()
      );
  }
}
