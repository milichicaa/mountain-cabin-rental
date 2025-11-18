import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { UploadService } from '../services/upload.service';
import { getCardType, detectBrandPreview, isCardValidForProject, type CardBrand } from '../utils/validators';

/**
 * Komponenta za prikaz i izmenu profila korisnika.
 * Omogućava izmenu podataka, upload slike i promenu kartice.
 */
@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // Servisi
  users = inject(UserService);
  upload = inject(UploadService);

  // Baza za slike
  apiBase = 'http://localhost:4000';

  user: any = {};
  newCardNumber = '';
  cardBrand: CardBrand = 'unknown';
  cardValid = false;

  loading = false;
  submitted = false;
  statusMsg = '';
  statusOk = false;

  // upload state
  uploading = false;
  uploadErr = '';

  originalUser: any = null;

  ngOnInit() {
    this.loading = true;
    this.users.dohvatiKorisnika().subscribe({
      next: u => { this.user = { ...u }; this.originalUser = JSON.parse(JSON.stringify(this.user)); this.loading = false; },
      error: _ => { this.loading = false; }
    });
  }

  // Upload profilne slike
  onProfileImageChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true; this.uploadErr = '';
    this.upload.uploadProfile(file).subscribe({
      next: (r: { path: string }) => {
        this.uploading = false;
        this.user.profileImagePath = r.path;
      },
      error: (err: any) => {
        this.uploading = false;
        this.uploadErr = err?.error?.message || 'Greška pri uploadu.';
      }
    });
  }

  // Unos broja kartice i validacija
  onCardInput(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const digits = (el.value || '').replace(/\D/g, '').slice(0, 19);
    const groups = digits.match(/.{1,4}/g) || [];
    el.value = groups.join(' ');
    this.newCardNumber = el.value;
    this.cardBrand = detectBrandPreview(digits);
    this.cardValid = isCardValidForProject(digits);
  }

  // Sačuvaj izmene profila korisnika
  save() {
    this.submitted = true;
    this.statusMsg = '';
    this.statusOk = false;

    // 1) Trim + čišćenje telefona
    const cleaned = {
      firstName: (this.user.firstName || '').trim(),
      lastName:  (this.user.lastName  || '').trim(),
      email:     (this.user.email     || '').trim(),
      address:   (this.user.address   || '').trim(),
      phone:     (this.user.phone     || '').replace(/[^\d+]/g, ''),
      profileImagePath: (this.user.profileImagePath || '').trim(),
    };

    // 2) Front validacije obaveznih polja (ne sme biti prazno)
    if (!cleaned.firstName || !cleaned.lastName || !cleaned.email || !cleaned.address || !cleaned.phone) {
      this.statusMsg = 'Popunite obavezna polja.';
      this.statusOk = false;
      return;
    }

    // 3) body od ne-praznih i izmenjenih vrednosti
    const body: any = {};
    for (const k of Object.keys(cleaned)) {
      const now = (cleaned as any)[k];
      const was = this.originalUser ? (this.originalUser as any)[k] : undefined;
      // šalji samo ako je ne-prazno i promenjeno
      if (now && now !== was) {
        body[k] = now;
      }
    }

    // 4) Kartica – samo ako je unesena i važeća
    if (this.newCardNumber && this.newCardNumber.trim()) {
      const cleanDigits = this.newCardNumber.replace(/\D/g, '');
      const brand = getCardType(cleanDigits);
      if (!brand || !isCardValidForProject(cleanDigits)) {
        this.statusMsg = 'Neispravan broj kartice.';
        this.statusOk = false;
        return;
      }
      body.cardNumber = cleanDigits;
    }

    // 5) Ako nema ničeg za izmenu
    if (Object.keys(body).length === 0) {
      this.statusMsg = 'Niste izmenili ništa.';
      this.statusOk = false;
      return;
    }

    // 6) Pošalji
    this.loading = true;
    this.users.updateProfile(body).subscribe({
      next: (res: any) => {
        // osveži lokalno stanje
        if (res?.user) this.user = { ...this.user, ...res.user };
        else Object.assign(this.user, cleaned);

        // reset pomocnih stanja
        this.originalUser = JSON.parse(JSON.stringify(this.user));
        this.newCardNumber = '';
        this.statusMsg = 'Sačuvano.';
        this.statusOk = true;
        this.loading = false;
      },
      error: err => {
        this.statusMsg = err?.error?.message || 'Greška pri čuvanju.';
        this.statusOk = false;
        this.loading = false;
      }
    });
  }

  // Popravi URL slike (relativan ili apsolutan)
  fixUrl(p?: string) { return p?.startsWith('/') ? (this.apiBase + p) : (p || ''); }

  // Fallback za slike ako dođe do greške
  onImgErr(ev: Event) { (ev.target as HTMLImageElement).src = this.apiBase + '/uploads/defaults/owner.jpg'; }
}
