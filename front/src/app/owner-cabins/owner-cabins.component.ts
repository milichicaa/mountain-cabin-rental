import { Component, OnInit } from '@angular/core';
import { CabinService } from '../services/cabin.service';
import { Cabin } from '../models/Cabin';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Komponenta za prikaz i upravljanje vikendicama vlasnika.
 * Omogućava izmenu i brisanje vikendica.
 */
@Component({
  selector: 'app-owner-cabins',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './owner-cabins.component.html',
  styleUrl: './owner-cabins.component.css'
})
export class OwnerCabinsComponent implements OnInit {
  // Stanje komponente
  loading = false;
  errorMsg = '';
  infoMsg = '';
  rows: Cabin[] = [];

  constructor(private cabins: CabinService, private router: Router) {}

  /**
   * Inicijalizacija komponente i učitavanje vikendica.
   */
  ngOnInit() {
    this.load();
  }

  /**
   * Učitava vikendice koje pripadaju ulogovanom vlasniku.
   */
  load() {
    this.loading = true;
    this.errorMsg = '';
    this.infoMsg = '';
    this.cabins.mine().subscribe({
      next: xs => {
        this.loading = false;
        this.rows = xs || [];
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri učitavanju vikendica.';
      }
    });
  }

  /**
   * Preusmerava na stranicu za izmenu vikendice.
   */
  edit(c: Cabin) {
    this.router.navigate(['/owner/cabins', c._id, 'edit'], { state: { cabin: c } });
  }

  /**
   * Briše izabranu vikendicu.
   */
  remove(c: Cabin) {
    if (!c._id || this.loading) return;
    if (!confirm(`Da li ste sigurni da želite da obrišete vikendicu "${c.name}"?`)) return;

    this.loading = true;
    this.errorMsg = '';
    this.infoMsg = '';
    this.cabins.remove(c._id).subscribe({
      next: res => {
        this.loading = false;
        // Uklanjamo vikendicu iz lokalnog niza da se tabela odmah ažurira
        this.rows = this.rows.filter(x => x._id !== c._id);
        this.infoMsg = res?.message || 'Vikendica je uspešno obrisana.';
      },
      error: err => {
        this.loading = false;
        this.errorMsg = err?.error?.message || 'Greška pri brisanju.';
      }
    });
  }
}
