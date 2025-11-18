import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminCabinRow } from '../services/admin.service';
import { CommonModule, DatePipe } from '@angular/common';

/**
 * Komponenta za administraciju vikendica (pregled, blokiranje, odblokiranje).
 */
@Component({
  selector: 'app-admin-cabins',
  standalone: true,
  imports: [FormsModule, DatePipe, CommonModule],
  templateUrl: './admin-cabins.component.html',
  styleUrl: './admin-cabins.component.css'
})
export class AdminCabinsComponent implements OnInit {
  loading = false;
  errorMsg = '';
  infoMsg = '';
  rows: AdminCabinRow[] = [];

  constructor(private admin: AdminService) {}

  ngOnInit() { this.load(); }
  /**
   * Učitava vikendice iz baze.
   */
  load() {
    this.loading = true;
    this.errorMsg = '';
    this.infoMsg = '';
    this.admin.listCabins().subscribe({
      next: xs => { this.loading = false; this.rows = xs || []; },
      error: err => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri učitavanju.'; }
    });
  }

  /**
   * Spoji poslednje 3 ocene u string.
   */
  ratingsList(c: AdminCabinRow): string {
    return (c.last3 ?? []).map(r => r.rating).join(', ');
  }

  /**
   * Proverava da li je vikendica trenutno blokirana.
   */
  isBlockedNow(c: AdminCabinRow): boolean {
    if (!c.blockedUntil) return false;
    return new Date(c.blockedUntil) > new Date();
  }

  /**
   * Blokira vikendicu na 48h.
   */
  block(c: AdminCabinRow) {
    if (!c._id || this.isBlockedNow(c)) return;
    this.loading = true;
    this.admin.blockCabin(c._id).subscribe({
      next: res => {
        this.loading = false;
        c.blockedUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        this.infoMsg = res?.message || 'Vikendica blokirana.';
        this.errorMsg = '';
      },
      error: err => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri blokiranju.'; }
    });
  }

  /**
   * Odblokira vikendicu.
   */
  unblock(c: AdminCabinRow) {
    if (!c._id || !this.isBlockedNow(c)) return;
    this.loading = true;
    this.admin.unblockCabin(c._id).subscribe({
      next: res => {
        this.loading = false;
        c.blockedUntil = null;
        this.infoMsg = res?.message || 'Vikendica odblokirana.';
        this.errorMsg = '';
      },
      error: err => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri odblokiranju.'; }
    });
  }
}
