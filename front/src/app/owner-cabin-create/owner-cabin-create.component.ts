import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CabinService } from '../services/cabin.service';
import { UploadService } from '../services/upload.service';
import { nonEmptyTrim } from '../utils/validators';

/**
 * Komponenta za kreiranje nove vikendice (vlasnik).
 * Omogućava unos svih podataka, upload slika i učitavanje iz JSON fajla.
 */
@Component({
  selector: 'app-owner-cabin-create',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './owner-cabin-create.component.html',
  styleUrl: './owner-cabin-create.component.css'
})
export class OwnerCabinCreateComponent {
  private cabins = inject(CabinService);
  private router = inject(Router);
  private upload = inject(UploadService);

  // Polja forme
  name = '';
  place = '';
  address = '';
  description = '';
  maxGuests: number | null = null;
  pricePerNightSummer: number | null = null;
  pricePerNightWinter: number | null = null;
  lat: number | null = null;
  lng: number | null = null;
  phone = '';
  amenitiesText = '';
  images: string[] = [];

  // Status
  loading = false;
  submitted = false;
  errorMsg = '';
  infoMsg = '';
  apiBase = 'http://localhost:4000';

  /**
   * Popravlja URL slike (relativan ili apsolutan).
   */
  fixUrl(p: string): string {
    if (!p) return '';
    return p.startsWith('http') ? p : this.apiBase + p;
  }

  /**
   * Upload slika vikendice.
   */
  onPickCabinImages(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    if (!files || !files.length) return;

    const picked = Array.from(files);
    this.loading = true;
    this.errorMsg = ''; this.infoMsg = '';

    let done = 0, failed = 0;

    picked.forEach(f => {
      this.upload.uploadCabinImage(f).subscribe({
        next: (res: { path: string }) => {
          if (res?.path) this.images.push(res.path);
          done++;
          if (done + failed === picked.length) {
            this.loading = false;
            this.infoMsg = failed ? `Upload gotov: ${done} uspešno, ${failed} grešaka.` : `Upload gotov: ${done} fajl(ova).`;
          }
        },
        error: (_: any) => {
          failed++;
          if (done + failed === picked.length) {
            this.loading = false;
            this.errorMsg = `Neki fajlovi nisu uploadovani (${failed}).`;
          }
        }
      });
    });

    input.value = '';
  }

  /**
   * Uklanja sliku iz liste.
   */
  removeImage(i: number) {
    if (i >= 0 && i < this.images.length) this.images.splice(i, 1);
  }

  /**
   * Učitava podatke iz JSON fajla i popunjava formu.
   */
  onPickJson(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    file.text().then(txt => {
      try {
        const raw = JSON.parse(txt || '{}');
        const j = Array.isArray(raw) ? raw[0] : raw;
        if (!j || typeof j !== 'object') {
          this.errorMsg = 'JSON mora biti objekat ili niz sa jednim objektom.';
          this.infoMsg = ''; return;
        }

        // Popuni polja (slike se NE učitavaju iz JSON-a)
        this.name = j.name ?? this.name;
        this.place = j.place ?? this.place;
        this.address = j.address ?? this.address;
        this.description = j.description ?? this.description;
        this.phone = j.phone ?? this.phone;

        const toNum = (v: any) => (v === null || v === undefined || v === '') ? null : Number(v);
        const n = (v: any) => { const x = toNum(v); return Number.isFinite(x) ? x : null; };

        this.maxGuests = n(j.maxGuests) ?? this.maxGuests;
        this.pricePerNightSummer = n(j.pricePerNightSummer) ?? this.pricePerNightSummer;
        this.pricePerNightWinter = n(j.pricePerNightWinter) ?? this.pricePerNightWinter;
        this.lat = n(j.lat) ?? this.lat;
        this.lng = n(j.lng) ?? this.lng;

        if (Array.isArray(j.amenities)) {
          this.amenitiesText = j.amenities.filter((x: any) => typeof x === 'string').join(', ');
        } else if (typeof j.amenities === 'string') {
          this.amenitiesText = j.amenities;
        }

        // Slike iz JSON-a se ignorišu

        this.infoMsg = 'JSON učitan. Polja su popunjena.';
        this.errorMsg = '';
      } catch {
        this.errorMsg = 'Neispravan JSON format.';
        this.infoMsg = '';
      }
    });

    input.value = '';
  }

  /**
   * Slanje forme za kreiranje vikendice.
   */
  submit() {
    this.submitted = true;
    this.errorMsg = ''; this.infoMsg = '';

    const requiredFields = [this.name, this.place, this.address, this.description, this.phone];
    if (requiredFields.some(f => !nonEmptyTrim(f))) { this.errorMsg = 'Popunite sva obavezna polja.'; return; }
    const requiredNumbers = [this.maxGuests, this.pricePerNightWinter, this.pricePerNightSummer, this.lat, this.lng];
    if (requiredNumbers.some(n => n === null)) { this.errorMsg = 'Popunite sve numeričke vrednosti.'; return; }
    if (this.maxGuests! <= 0 || this.pricePerNightWinter! <= 0 || this.pricePerNightSummer! <= 0) { this.errorMsg = 'Vrednosti moraju biti veće od nule.'; return; }
    if (this.lat! < -90 || this.lat! > 90 || this.lng! < -180 || this.lng! > 180) { this.errorMsg = 'Koordinate van opsega.'; return; }
    if (this.images.length === 0) { this.errorMsg = 'Dodajte bar jednu sliku.'; return; }

    const amenities = (this.amenitiesText || '').split(',').map(s => s.trim()).filter(Boolean);

    this.loading = true;
    this.cabins.create({
      name: this.name.trim(),
      place: this.place.trim(),
      address: this.address.trim(),
      description: this.description.trim(),
      maxGuests: this.maxGuests!,
      amenities,
      images: this.images,
      lat: this.lat!,
      lng: this.lng!,
      phone: String(this.phone || '').replace(/[^\d+]/g, ''),
      pricePerNightSummer: this.pricePerNightSummer!,
      pricePerNightWinter: this.pricePerNightWinter!,
    }).subscribe({
      next: _ => {
        this.loading = false;
        this.infoMsg = 'Vikendica sačuvana.';
        this.router.navigate(['/owner/cabins']);
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri čuvanju vikendice.';
      }
    });
  }
}
