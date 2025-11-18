import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UploadService } from '../services/upload.service';
import { RegisterBody } from '../models/RegisterBody';
import { CardBrand, detectBrand, detectBrandPreview, isCardValidForProject } from '../utils/validators';

 /**
 * Komponenta za registraciju novog korisnika (turista ili vlasnik).
 * Omogućava unos podataka, upload slike i validaciju kartice.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // ... tvoji inject-ovani servisi
  private auth = inject(AuthService);
  private router = inject(Router);
  private upload = inject(UploadService);

  // --- Polja forme ---
  role: 'turista' | 'vlasnik' = 'turista';
  username = '';
  email = '';
  password = '';
  password2 = '';
  firstName = '';
  lastName = '';
  gender: 'M' | 'Ž' | '' = '';
  address = '';
  phone = '';

  // --- Logika za slike ---
  profileImageFile: File | null = null;
  profileImagePreview: string | null = null;
  creditCardFile: File | null = null;
  creditCardPreview: string | null = null;
  profileImagePath: string = ''; // server putanja nakon upload-a


  // --- Logika za karticu (iz tvog koda) ---

  cardNumber = ''; // Za prikaz u inputu sa razmacima
  brand: CardBrand = 'unknown';
  brandPreview: CardBrand = 'unknown';
  cardValid: boolean = false;

  // --- Stanje komponente ---
  loading = false;
  submitted = false;
  errorMsg = '';
  infoMsg = '';

  // --- Validatori ---
  private passRegex = /^(?=.{6,10}$)(?=(?:.*[a-z]){3,})(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].*$/;
  private emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Logika za unos broja kartice i validaciju.
   */
  onCardInput(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const digits = (el.value || '').replace(/\D/g, '').slice(0, 16);

    // Formatiranje prikaza sa razmacima
    const groups = digits.match(/.{1,4}/g) || [];
    el.value = groups.join(' ');
    this.cardNumber = el.value;

    // 1) Preliminarna detekcija za prikaz ikonice
    this.brandPreview = detectBrandPreview(digits);

    // 2) Stroga validacija za proveru pre slanja
    this.brand = detectBrand(digits);
    this.cardValid = isCardValidForProject(digits);
  }

  /**
   * Prikaz preview-a za profilnu sliku i upload na server.
   */
  onProfileImageChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.profileImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => this.profileImagePreview = e.target?.result as string;
    reader.readAsDataURL(this.profileImageFile);

    // odmah upload na backend da dobijemo /uploads/ putanju
    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.upload.uploadProfile(file).subscribe({
      next: (res: { path: string }) => { this.loading = false; this.profileImagePath = res.path; },
      error: (err: any) => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri uploadu slike.'; }
    });
  }

  /**
   * Prikaz preview-a za sliku kartice.
   */
  onCreditCardChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.creditCardFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.creditCardPreview = e.target?.result as string;
      reader.readAsDataURL(this.creditCardFile);
    }
  }

  /**
   * Maskira broj kartice za prikaz (**** **** **** 1234).
   */
  private maskStars(cc: string): string {
    const d = (cc || '').replace(/\D/g, '');
    if (d.length < 4) return '';
    const last4 = d.slice(-4);

    return `**** **** **** ${last4}`;
  }

  /**
   * Slanje forme za registraciju.
   */
  submit() {
    this.submitted = true;
    this.errorMsg = ''; this.infoMsg = '';

    // obavezna polja (minimal)
    if (!this.username || !this.email || !this.password || !this.password2 ||
        !this.firstName || !this.lastName || !this.gender || !this.address ||
        !this.phone || !this.role) {
      this.errorMsg = 'Popuni sva obavezna polja.'; return;
    }
    if (this.password !== this.password2) { this.errorMsg = 'Lozinke se ne poklapaju.'; return; }
    if (!this.passRegex.test(this.password)) { this.errorMsg = 'Lozinka nije u traženom formatu.'; return; }
    if (!this.cardValid) { this.errorMsg = 'Broj kartice nije ispravan.'; return; }

    // Slika nije obavezna ni za turiste ni za vlasnike; backend će dodeliti podrazumevanu ako nije poslata.

    const creditCardMasked = this.maskStars(this.cardNumber);
    if (!/^\*{4}\s\*{4}\s\*{4}\s\d{4}$/.test(creditCardMasked)) {
      this.errorMsg = 'Kartica mora biti u formatu **** **** **** 1234.'; return;
    }

    const body: RegisterBody = {
      username: this.username.trim(),
      email: this.email.trim(),
      password: this.password,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      gender: this.gender,
      address: this.address.trim(),
      phone: this.phone.replace(/[^\d+]/g, ''),
      role: this.role,
      profileImagePath: this.role === 'vlasnik' ? (this.profileImagePath || undefined) : this.profileImagePath,
      creditCardMasked,
      creditCardFull: this.cardNumber.replace(/\s+/g, "")
    };

    this.loading = true;
    this.auth.register(body).subscribe({
      next: (res) => { this.loading = false; this.infoMsg = res?.message || 'Zahtev poslat.'; },
      error: (err) => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri registraciji.'; }
    });
  }
}
