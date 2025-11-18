import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CabinService } from '../services/cabin.service';
import { ReviewService } from '../services/review.service';
import { UserService } from '../services/user.service';
import { ReservationService } from '../services/reservation.service';
import { detectBrandPreview, isCardValidForProject, type CardBrand } from '../utils/validators';
import { Cabin } from '../models/Cabin';
import { Review } from '../models/Review';
import { User } from '../models/User';

 /**
 * Komponenta za prikaz detalja vikendice, recenzija i kreiranje rezervacije.
 * Prikazuje slike, mapu, recenzije i omogućava rezervaciju sa plaćanjem.
 */
@Component({
  selector: 'app-cabin-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cabin-details.component.html',
  styleUrls: ['./cabin-details.component.css']
})
export class CabinDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cabinService = inject(CabinService);
  private reviewService = inject(ReviewService);
  private userService = inject(UserService);
  private reservationService = inject(ReservationService);

  cabin: Cabin | null = null;
  reviews: Review[] = [];
  loading = true;
  errorMsg = '';
  infoMsg = '';
  apiBase = 'http://localhost:4000';

  // Rezervacija - koraci
  step = 1;
  dateFrom = '';
  dateTo   = '';
  adults = 1;
  children = 0;
  minDateISO = new Date().toISOString().slice(0,10);

  nights = 0;
  estimate: number | null = null;

  // Plaćanje
  savedCardMasked = '';
  useSavedCard = true;
  cardNumber = '';
  cardBrand: CardBrand = 'unknown';
  cardValid = false;

  userComment = '';
  submitting = false;

  private map: any;
  private L: any;

  /**
   * Inicijalizacija komponente i učitavanje detalja vikendice.
   */
  ngOnInit() {
    const cabinId = this.route.snapshot.paramMap.get('id');
    if (!cabinId) {
      this.errorMsg = 'ID vikendice nije pronađen u ruti.';
      this.loading = false;
      return;
    }
    this.loadCabinDetails(cabinId);
    this.userService.dohvatiKorisnika().subscribe({
      next: u => {
        this.savedCardMasked = u?.creditCardMasked || '';
        this.useSavedCard = !!this.savedCardMasked;
      },
      error: () => { this.savedCardMasked = ''; this.useSavedCard = false; }
    });
    window.addEventListener('keydown', this.onKeydown);
  }

  /**
   * Dohvata detalje vikendice i recenzije.
   */
  loadCabinDetails(id: string) {
    this.loading = true;
    this.cabinService.detail(id).subscribe({
      next: (data) => {
        this.cabin = data as Cabin;
        // umesto da se oslanjaš na cabin.reviews:
        this.reviewService.listByCabin(id).subscribe({
          next: (rows) => { this.reviews = rows; this.loading = false; this.initMap(); },
          error: () => { this.reviews = []; this.loading = false; this.initMap(); }
        });
      },
      error: (err) => {
        this.errorMsg = 'Greška pri učitavanju detalja. ' + (err.error?.message || '');
        this.loading = false;
      }
    });
  }

  /**
   * Prikazuje mapu sa lokacijom vikendice (Leaflet).
   */
  private async initMap() {
    if (this.map || !this.cabin?.lat || !this.cabin?.lng) return;
    this.L = await import('leaflet');
    await this.ensureLeafletCss();
    this.map = this.L.map('map').setView([this.cabin.lat, this.cabin.lng], 13);
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);
    this.L.marker([this.cabin.lat, this.cabin.lng]).addTo(this.map).bindPopup(this.cabin.name);
  }

  /**
   * Učitava Leaflet CSS kao nije već dodat.
   */
  private ensureLeafletCss(): Promise<void> {
    return new Promise(res => {
      if (document.querySelector('link[href*="leaflet.css"]')) return res();
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.onload = () => res();
      document.head.appendChild(link);
    });
  }

  /**
   * Popravlja URL slike (relativan ili apsolutan).
   */
  fixUrl(url?: string) {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.apiBase}${url.startsWith('/') ? url : '/' + url}`;
  }

  /**
   * Fallback za slike ako dođe do greške.
   */
  onImgErr(ev: Event) {
    (ev.target as HTMLImageElement).src = this.apiBase + '/uploads/defaults/owner.jpg';
  }

  /**
   * Type guard za recenzenta (korisnik).
   */
  isUser(tourist: any): tourist is User {
    return typeof tourist === 'object' && tourist !== null && 'username' in tourist;
  }

  /**
   * Type guard za vlasnika.
   */
  isOwner(owner: any): owner is Pick<User, 'firstName' | 'lastName'> {
    return typeof owner === 'object' && owner !== null && ('firstName' in owner || 'lastName' in owner);
  }

  /**
   * Vraća ID vlasnika.
   */
  ownerId(owner: unknown): string {
    if (typeof owner === 'string') return owner;
    return (owner as any)?._id ?? 'Nepoznat';
  }

  /**
   * Proverava da li je mesec letnji (za cenu).
   */
  private isSummerMonth(d: Date) {
    const m = d.getMonth();
    return m >= 4 && m <= 7;
  }

  /**
   * Izračunava broj noćenja i ukupnu cenu.
   */
  recompute() {
    if (this.dateFrom && this.dateTo && this.cabin) {
      const from = new Date(this.dateFrom);
      const to   = new Date(this.dateTo);
      if (isNaN(+from) || isNaN(+to) || to <= from) { this.nights = 0; this.estimate = null; return; }
      const cur = new Date(from);
      cur.setHours(0,0,0,0);
      const end = new Date(to);
      end.setHours(0,0,0,0);

      let nights = 0;
      let total  = 0;
      while (cur < end) {
        nights++;
        total += this.isSummerMonth(cur) ? (this.cabin!.pricePerNightSummer || 0)
                                         : (this.cabin!.pricePerNightWinter || 0);
        cur.setDate(cur.getDate() + 1);
      }
      this.nights = nights;
      this.estimate = total;
    } else {
      this.nights = 0; this.estimate = null;
    }
  }

  /**
   * Sledeći korak rezervacije (validacija unosa).
   */
  nextStep() {
    this.errorMsg = ''; this.infoMsg = '';
    if (!this.cabin) { this.errorMsg = 'Nema podataka o vikendici.'; return; }

    const from = new Date(this.dateFrom);
    const to   = new Date(this.dateTo);
    if (!(this.dateFrom && this.dateTo) || isNaN(+from) || isNaN(+to) || to <= from) {
      this.errorMsg = 'Izaberite ispravan opseg datuma.'; return;
    }
    if (!this.adults || this.adults < 1) { this.errorMsg = 'Bar 1 odrasla osoba.'; return; }
    if (this.adults + this.children > (this.cabin.maxGuests || 0)) { this.errorMsg = 'Previše gostiju.'; return; }
    if (this.cabin.isBlocked) { this.errorMsg = 'Vikendica je blokirana.'; return; }
    if (this.nights <= 0) { this.errorMsg = 'Opseg ne generiše nijedno noćenje.'; return; }

    this.step = 2;
  }

  backToStep1() { this.step = 1; }

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
  submitReservation() {
    this.errorMsg = ''; this.infoMsg = '';
    if (!this.cabin) { this.errorMsg = 'Nema podataka o vikendici.'; return; }

    if (!this.savedCardMasked || !this.useSavedCard) {
      if (!this.cardValid) { this.errorMsg = 'Unesite ispravan broj kartice.'; return; }
    }
    if (this.userComment.length > 500) { this.errorMsg = 'Komentar može imati najviše 500 znakova.'; return; }

    this.submitting = true;
    this.reservationService.create({
      cabinId: this.cabin._id,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      adults: this.adults,
      children: this.children,
      userComment: this.userComment.trim() || undefined
    }).subscribe({
      next: _ => {
        this.submitting = false;
        this.infoMsg = 'Zahtev uspešno poslat.';
      },
      error: err => {
        this.submitting = false;
        this.errorMsg = err?.error?.message || 'Greška pri slanju zahteva.';
      }
    });
  }
    // --- LIGHTBOX STATE ---
  lightboxOpen = false;
  activeImg = '';
  private imgs: string[] = [];   // keširano iz cabin.images

  openLightbox(img: string) {
    this.imgs = (this.cabin?.images || []).slice();
    this.activeImg = img;
    this.lightboxOpen = true;
  }

  closeLightbox() {
    this.lightboxOpen = false;
  }

  next(ev?: Event) {
    ev?.stopPropagation();
    const i = this.imgs.indexOf(this.activeImg);
    const j = (i + 1 + this.imgs.length) % this.imgs.length;
    this.activeImg = this.imgs[j];
  }

  prev(ev?: Event) {
    ev?.stopPropagation();
    const i = this.imgs.indexOf(this.activeImg);
    const j = (i - 1 + this.imgs.length) % this.imgs.length;
    this.activeImg = this.imgs[j];
  }
  private onKeydown = (e: KeyboardEvent) => {
    if (!this.lightboxOpen) return;
    if (e.key === 'Escape') this.closeLightbox();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'ArrowLeft') this.prev();
  };
}
