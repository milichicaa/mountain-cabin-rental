import { Component, inject } from '@angular/core';
import { ReviewService } from '../services/review.service';
import { Router, RouterLink } from '@angular/router';
import { Cabin } from '../models/Cabin';
import { Review } from '../models/Review';
import { FormsModule } from '@angular/forms';
import { CabinService } from '../services/cabin.service';
import { CommonModule } from '@angular/common';
import { UploadService } from '../services/upload.service';

/**
 * Komponenta za izmenu podataka o vikendici (vlasnik).
 * Omogućava izmenu svih podataka i upload novih slika.
 */
@Component({
  selector: 'app-owner-cabin-edit',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './owner-cabin-edit.component.html',
  styleUrl: './owner-cabin-edit.component.css'
})
export class OwnerCabinEditComponent {
  private cabins = inject(CabinService);
  private upload = inject(UploadService);
  private router = inject(Router);

  cabin: Cabin | null = (history.state?.cabin as Cabin) || null;

  // Polja forme
  name = '';
  place = '';
  address = '';
  phone = '';
  description = '';
  pricePerNightSummer: number | null = null;
  pricePerNightWinter: number | null = null;
  maxGuests: number | null = null;
  lat: number | null = null;
  lng: number | null = null;
  amenitiesText = '';
  images: string[] = [];

  loading = false;
  errorMsg = '';
  infoMsg = '';
  apiBase = 'http://localhost:4000';

  // Popravi URL slike
  fixUrl = (p: string) => (p?.startsWith('http') ? p : this.apiBase + p);

  ngOnInit() {
    // Ako nema vikendice, vrati nazad
    if (!this.cabin) { this.router.navigate(['/owner/cabins']); return; }
    // Popuni polja iz postojeće vikendice
    const c = this.cabin;
    this.name = c.name || '';
    this.place = c.place || '';
    this.address = c.address || '';
    this.phone = c.phone || '';
    this.description = c.description || '';
    this.pricePerNightSummer = (c as any).pricePerNightSummer ?? null;
    this.pricePerNightWinter = (c as any).pricePerNightWinter ?? null;
    this.maxGuests = c.maxGuests ?? null;
    this.lat = (c as any).lat ?? (c as any).latitude ?? null;
    this.lng = (c as any).lng ?? (c as any).longitude ?? null;
    this.amenitiesText = (c.amenities || []).join(', ');
    this.images = [...(c.images || [])];
  }

  // Upload novih slika
  onPickImages(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = input.files;
    if (!files || !files.length) return;

    const picked = Array.from(files);
    const total = picked.length;

    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    let done = 0, fail = 0;

    picked.forEach(f => {
      this.upload.uploadCabinImage(f).subscribe({
        next: (res: { path: string }) => { this.images.push(res.path); },
        error: (err: any) => { fail++; this.errorMsg = err?.error?.message || 'Greška pri upload-u.'; },
        complete: () => { done++; if (done + fail === total) this.loading = false; }
      });
    });

    input.value = '';
  }

  // Ukloni sliku
  removeImage(i: number) { this.images.splice(i, 1); }

  // Sačuvaj izmene
  save() {
    this.errorMsg = ''; this.infoMsg = '';
    if (!this.cabin?._id) {
      this.errorMsg = 'ID vikendice nije pronađen. Vratite se nazad i pokušajte ponovo.';
      return;
    }

    // Validacija
    const requiredFields = [this.name, this.place, this.address, this.phone];
    if (requiredFields.some(f => !f.trim())) {
      this.errorMsg = 'Naziv, mesto, adresa i telefon su obavezni.'; return;
    }
    if (this.pricePerNightSummer == null || this.pricePerNightSummer <= 0) { this.errorMsg = 'Letnja cena mora biti veća od 0.'; return; }
    if (this.pricePerNightWinter == null || this.pricePerNightWinter <= 0) { this.errorMsg = 'Zimska cena mora biti veća od 0.'; return; }
    if (this.maxGuests == null || this.maxGuests <= 0) { this.errorMsg = 'Maksimalan broj gostiju mora biti veći od 0.'; return; }
    if (this.lat == null || this.lng == null) { this.errorMsg = 'Morate uneti koordinate.'; return; }

    const amenities = (this.amenitiesText || '').split(',').map(s => s.trim()).filter(Boolean);

    this.loading = true;
    this.cabins.update(this.cabin._id, {
      name: this.name.trim(),
      place: this.place.trim(),
      address: this.address.trim(),
      phone: this.phone.trim(),
      description: this.description.trim(),
      pricePerNightSummer: this.pricePerNightSummer!,
      pricePerNightWinter: this.pricePerNightWinter!,
      maxGuests: this.maxGuests!,
      lat: this.lat!,
      lng: this.lng!,
      amenities,
      images: this.images
    }).subscribe({
      next: res => { this.loading = false; this.infoMsg = res?.message || 'Sačuvano.'; },
      error: err => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri čuvanju.'; }
    });
  }
}
