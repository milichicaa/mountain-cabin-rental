// src/app/admin-requests/admin-requests.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { RegistrationRequest, RequestStatus } from '../models/RegistrationRequest';

/**
 * Komponenta za administraciju zahteva za registraciju vlasnika.
 */
@Component({
  standalone: true,
  selector: 'app-admin-requests',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-requests.component.html',
  styleUrl: './admin-requests.component.css'
})
export class AdminRequestsComponent {
  loading = false;
  errorMsg = '';
  infoMsg = '';

  // Filter za status
  status: 'all' | RequestStatus = 'pending';

  all: RegistrationRequest[] = [];

  constructor(private admin: AdminService) {}

  /**
   * Učitava sve zahteve iz baze.
   */
  ngOnInit() { this.load(); }
  load() {
    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.admin.listRequests().subscribe({
      next: (list) => { this.loading = false; this.all = list || []; },
      error: (err) => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri učitavanju.'; }
    });
  }

  /**
   * Filtrira zahteve po statusu.
   */
  get filtered(): RegistrationRequest[] {
    if (this.status === 'all') return this.all;
    return this.all.filter(r => r.status === this.status);
  }

  /**
   * Prihvata zahtev za registraciju.
   */
  accept(r: RegistrationRequest) {
    if (r.status !== 'pending') return;
    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.admin.acceptRequest(r._id).subscribe({
      next: (res) => {
        this.loading = false;
        r.status = 'accepted';
        this.infoMsg = res?.message || 'Zahtev prihvaćen.';
      },
      error: (err) => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri prihvatanju.'; }
    });
  }

  /**
   * Odbija zahtev za registraciju.
   */
  reject(r: RegistrationRequest) {
    if (r.status !== 'pending') return;
    const reason = window.prompt('Razlog odbijanja (opciono):');
    if (reason === null) return;

    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.admin.rejectRequest(r._id, reason || 'Nije navedeno').subscribe({
      next: (res) => {
        this.loading = false;
        r.status = 'rejected';
        this.infoMsg = res?.message || 'Zahtev odbijen.';
      },
      error: (err) => { this.loading = false; this.errorMsg = err?.error?.message || 'Greška pri odbijanju.'; }
    });
  }
}
