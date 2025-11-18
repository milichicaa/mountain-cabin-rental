import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservationService } from '../services/reservation.service';
import { UserService } from '../services/user.service';
import { Cabin } from '../models/Cabin';
import { detectBrandPreview, isCardValidForProject, CardBrand } from '../utils/validators';

/**
 * Komponenta za kreiranje nove rezervacije vikendice.
 * Omogućava unos datuma, broja gostiju, komentara i podataka o plaćanju.
 */
@Component({
  selector: 'app-reservations-create',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reservations-create.component.html',
  styleUrl: './reservations-create.component.css'
})
export class ReservationsCreateComponent {
  private router = inject(Router);
  private reservations = inject(ReservationService);
  private users = inject(UserService);

  cabin: Cabin | null = (history.state?.cabin as Cabin) || null;

  dateFrom = '';
  dateTo   = '';
  adults   = 1;
  children = 0;

  nights = 0;
  estimate: number | null = null;

  loading = false;
  submitted = false;
  errorMsg = '';
  infoMsg  = '';

  todayISO = new Date().toISOString().slice(0,10);

  // Plaćanje
  savedCardMasked: string = '';
  useSavedCard = true;
  cardNumber = '';
  cardBrand: CardBrand = 'unknown';
  cardValid = false;

  userComment = ''; // ← novo

  constructor() {
    if (!this.cabin) {
      this.errorMsg = 'Nedostaju podaci o vikendici.';
    }
    this.recompute();
  }

  /**
   * Inicijalizacija komponente i učitavanje podataka o korisniku.
   */
  ngOnInit() {
    this.users.dohvatiKorisnika().subscribe({
      next: u => {
        this.savedCardMasked = u?.creditCardMasked || '';
        this.useSavedCard = !!this.savedCardMasked;
      },
      error: () => { this.savedCardMasked = ''; this.useSavedCard = false; }
    });
  }

  /**
   * Proverava da li je mesec letnji (za cenu).
   */
  private isSummerMonth(d: Date) {
    const m = d.getMonth(); // 0=Jan ... 7=Aug
    return m >= 4 && m <= 7; // maj, jun, jul, avgust
  }

  /**
   * Preračunava broj noćenja i ukupnu cenu.
   */
  private estimateByNights(fromISO: string, toISO: string): { nights: number, total: number } {
    const from = new Date(fromISO);
    const to   = new Date(toISO);
    if (isNaN(+from) || isNaN(+to) || to <= from || !this.cabin) return { nights: 0, total: 0 };

    let cur = new Date(from);
    cur.setHours(0,0,0,0);
    const end = new Date(to);
    end.setHours(0,0,0,0);

    let nights = 0;
    let total  = 0;

    while (cur < end) {
      nights++;
      total += this.isSummerMonth(cur)
        ? (this.cabin.pricePerNightSummer || 0)
        : (this.cabin.pricePerNightWinter || 0);
      cur.setDate(cur.getDate() + 1);
    }
    return { nights, total };
  }

  /**
   * Preračunava cenu i broj noćenja na osnovu izabranih datuma.
   */
  recompute() {
    if (this.dateFrom && this.dateTo && this.cabin) {
      const est = this.estimateByNights(this.dateFrom, this.dateTo);
      this.nights = est.nights;
      this.estimate = est.total;
    } else {
      this.nights = 0;
      this.estimate = null;
    }
  }

  /**
   * Obrada unosa broja kartice i validacija.
   */
  onCardInput(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const digits = (el.value || '').replace(/\D/g, '').slice(0, 19);
    const groups = digits.match(/.{1,4}/g) || [];
    el.value = groups.join(' ');
    this.cardNumber = el.value;
    this.cardBrand = detectBrandPreview(digits);
    this.cardValid = isCardValidForProject(digits);
  }

  /**
   * Slanje zahteva za rezervaciju.
   */
  submit() {
    this.submitted = true; this.errorMsg = ''; this.infoMsg = '';
    if (!this.cabin) { this.errorMsg = 'Nema vikendice.'; return; }

    const from = new Date(this.dateFrom), to = new Date(this.dateTo);
    if (!(this.dateFrom && this.dateTo) || isNaN(+from) || isNaN(+to) || to <= from) {
      this.errorMsg = 'Izaberite ispravan opseg datuma.'; return;
    }
    const today = new Date(); today.setHours(0,0,0,0);
    if (from < today) { this.errorMsg = 'Ne možete rezervisati u prošlosti.'; return; }

    if (!this.adults || this.adults < 1) { this.errorMsg = 'Bar 1 odrasla osoba.'; return; }
    if (this.adults + this.children > (this.cabin.maxGuests || 0)) { this.errorMsg = 'Previše gostiju.'; return; }
    if (this.cabin.isBlocked) { this.errorMsg = 'Vikendica je blokirana.'; return; }

    if (!this.useSavedCard && !this.cardValid) {
      this.errorMsg = 'Unesite ispravan broj kartice.'; return;
    }

    if (this.userComment.length > 500) { this.errorMsg = 'Komentar može imati najviše 500 znakova.'; return; }

    this.loading = true;
    const body = {
      cabinId: this.cabin._id,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      adults: this.adults,
      children: this.children,
      userComment: this.userComment.trim() || undefined
    };
    this.reservations.create(body).subscribe({
      next: () => {
        this.loading = false;
        this.infoMsg = 'Zahtev poslat.';
        // this.router.navigate(['/reservations/mine']);
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri slanju zahteva.';
      }
    });
  }
}
