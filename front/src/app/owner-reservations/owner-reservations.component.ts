import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { ReservationService } from '../services/reservation.service';
import { Reservation } from '../models/Reservation';
import { ReservationCabinInfo } from '../models/ReservationCabinInfo';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

/**
 * Komponenta za prikaz i upravljanje rezervacijama vlasnika (kalendar i tabela).
 * Omogućava prihvatanje, odbijanje i završavanje rezervacija.
 */
@Component({
  selector: 'app-owner-reservations',
  standalone: true,
  imports: [FormsModule, CommonModule, FullCalendarModule],
  templateUrl: './owner-reservations.component.html',
  styleUrl: './owner-reservations.component.css'
})
export class OwnerReservationsComponent implements OnInit {
  private reservationsApi = inject(ReservationService);

  // Stanje komponente
  loading = false;
  errorMsg = '';
  infoMsg = '';
  itemsAll: Reservation[] = [];       // Sve rezervacije (za kalendar)
  itemsPending: Reservation[] = [];   // Samo 'pending' (za tabelu)

  // Modalni dijalog
  isDialogOpen = false;
  selectedReservation: Reservation | null = null;
  dialogRejectReason = '';

  /**
   * Inicijalizacija komponente i učitavanje rezervacija.
   */
  ngOnInit() { this.load(); }

  /**
   * Učitava sve rezervacije za vlasnika.
   */
  load() {
    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.reservationsApi.forOwnerAll().subscribe({
      next: (rows) => {
        this.loading = false;
        // Sortiraj po datumu kreiranja
        const sorted = (rows || []).sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.itemsAll = sorted;
        this.itemsPending = sorted
          .filter(r => r.status === 'pending')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.updateCalendarEvents(this.itemsAll);
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri učitavanju.';
      }
    });
  }

  /**
   * Prihvata rezervaciju.
   */
  accept(r: Reservation) {
    if (this.loading || r.status !== 'pending') return;
    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.reservationsApi.accept(r._id).subscribe({
      next: (res) => {
        this.loading = false;
        r.status = 'accepted';
        this.itemsPending = this.itemsPending.filter(x => x._id !== r._id);
        this.updateCalendarEvents(this.itemsAll);
        this.infoMsg = res?.message || 'Rezervacija prihvaćena.';
        this.closeDialog();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri prihvatanju.';
      }
    });
  }

  /**
   * Odbija rezervaciju sa razlogom.
   */
  reject(r: Reservation) {
    if (this.loading || r.status !== 'pending') return;
    if (this.dialogRejectReason.trim().length < 3) {
      this.errorMsg = 'Unesite razlog (min 3 znaka).'; return;
    }
    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.reservationsApi.reject(r._id, this.dialogRejectReason.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        r.status = 'rejected';
        this.itemsPending = this.itemsPending.filter(x => x._id !== r._id);
        this.updateCalendarEvents(this.itemsAll);
        this.infoMsg = res?.message || 'Rezervacija odbijena.';
        this.closeDialog();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri odbijanju.';
      }
    });
  }

  /**
   * Označava rezervaciju kao završenu.
   */
  complete(r: Reservation) {
    if (this.loading || !this.canComplete(r)) return;
    this.loading = true; this.errorMsg = ''; this.infoMsg = '';
    this.reservationsApi.complete(r._id).subscribe({
      next: (res) => {
        this.loading = false;
        r.status = 'completed';
        this.updateCalendarEvents(this.itemsAll);
        this.infoMsg = res?.message || 'Rezervacija završena.';
        this.closeDialog();
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri završavanju.';
      }
    });
  }

  /**
   * Otvara modalni dijalog za rezervaciju.
   */
  openDialog(reservation: Reservation) {
    this.selectedReservation = reservation;
    this.isDialogOpen = true;
    this.dialogRejectReason = '';
    this.errorMsg = '';
  }

  /**
   * Zatvara modalni dijalog.
   */
  closeDialog() {
    this.isDialogOpen = false;
    this.selectedReservation = null;
    this.dialogRejectReason = '';
  }

  /**
   * Proverava tip podatka za vikendicu (da li je objekat).
   */
  isCabinInfo(cabin: string | ReservationCabinInfo): cabin is ReservationCabinInfo {
    return typeof cabin === 'object' && cabin !== null;
  }

  /**
   * Proverava da li je moguće završiti rezervaciju.
   */
  canComplete(r: Reservation): boolean {
    return r.status === 'accepted' && new Date(r.dateTo).getTime() < Date.now();
  }

  /**
   * Formatira datum (YYYY-MM-DD).
   */
  fmtDate(iso?: string) { return iso ? iso.slice(0, 10) : '—'; }

  /**
   * Opcije za FullCalendar prikaz.
   */
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    height: 'auto',
    eventDisplay: 'block',
    events: [],
    eventClick: (info) => {
      const id = info.event.id;
      const r = this.itemsAll.find(x => x._id === id);
      if (r) this.openDialog(r);
    }
  };

  /**
   * Ažurira događaje u kalendaru na osnovu rezervacija.
   */
  private updateCalendarEvents(rows: Reservation[]) {
    const events = rows.map(r => {
      const title = this.isCabinInfo(r.cabin) ? r.cabin.name : r.cabin;
      const color =
        r.status === 'pending' ? '#facc15' : // žuta
        r.status === 'accepted' ? '#22c55e' : // zelena
        r.status === 'completed' ? '#64748b' : // siva
        r.status === 'rejected' ? '#ef4444' : // crvena
        '#94a3b8';
      return {
        id: r._id,
        title: `${title} (${r.adults + r.children})`,
        start: r.dateFrom,
        end: r.dateTo,
        color
      };
    });
    this.calendarOptions = { ...this.calendarOptions, events };
  }
}
