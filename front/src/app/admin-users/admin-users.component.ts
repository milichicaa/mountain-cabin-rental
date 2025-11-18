// src/app/admin-users/admin-users.component.ts
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { AdminService } from '../services/admin.service';
import { UploadService } from '../services/upload.service';
import { User } from '../models/User';
import { emailOk, passwordOk, phoneOk } from '../utils/validators';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
/**
 * Komponenta za administraciju korisnika (pregled, pretraga, kreiranje, izmena, aktivacija, deaktivacija).
 */
export class AdminUsersComponent {
  private admin = inject(AdminService);
  private upload = inject(UploadService);

  loading = false;
  errorMsg = '';
  infoMsg = '';
  q = '';
  rows: User[] = [];

  /**
   * Filtrirani korisnici po pretrazi.
   */
  get filtered(): User[] {
    const qq = this.q.trim().toLowerCase();
    if (!qq) return this.rows;
    return this.rows.filter(u => {
      const un = (u.username || '').toLowerCase();
      const em = (u.email || '').toLowerCase();
      return un.startsWith(qq) || em.startsWith(qq);
    });
  }

  /**
   * Pokreće pretragu korisnika.
   */
  doSearch() { this.q = this.q.trim(); }

  // Model za kreiranje
  creating: any = {
    username: '', email: '', password: '',
    firstName: '', lastName: '', gender: '',
    address: '', phone: '', role: 'turista',
    profileImagePath: ''
  };
  selectedCreateFile?: File;

  editingId: string | null = null;
  editModel: any = {};
  selectedEditFile?: File;

  /**
   * Učitava korisnike iz baze.
   */
  ngOnInit(){ this.load(); }

  load(){
    this.loading = true; this.errorMsg=''; this.infoMsg='';
    this.admin.listUsers().subscribe({
      next: (xs) => { this.rows = xs || []; this.loading = false; },
      error: (err) => { this.loading=false; this.errorMsg = err?.error?.message || 'Greška pri učitavanju.'; }
    });
  }

  /**
   * Proverava da li je korisnik admin.
   */
  isAdmin(u: User){ return u.role === 'admin'; }
  /**
   * Proverava da li je korisnik trenutno prijavljen.
   */
  isSelf(u: User){
    const me = localStorage.getItem('username') || '';
    return u.username === me;
  }

  /**
   * Postavlja fajl za upload slike pri kreiranju.
   */
  onCreateFileChange(ev: any){
    this.selectedCreateFile = ev?.target?.files?.[0];
  }

  /**
   * Postavlja fajl za upload slike pri izmeni.
   */
  onEditFileChange(ev: any){
    this.selectedEditFile = ev?.target?.files?.[0];
  }

  /**
   * Kreira novog korisnika.
   */
  async doCreate(){
    const c = this.creating;

    if (!c.username || !c.email || !c.password || !c.firstName || !c.lastName || !c.gender || !c.address || !c.phone || !c.role) {
      this.errorMsg = 'Sva polja su obavezna.'; return;
    }
    if (!emailOk(c.email)) { this.errorMsg = 'Email nije ispravan.'; return; }
    if (!phoneOk(c.phone)) { this.errorMsg = 'Telefon nije ispravan.'; return; }
    if (!passwordOk(c.password)) { this.errorMsg='Lozinka nije u traženom formatu.'; return; }

    this.loading = true; this.errorMsg=''; this.infoMsg='';
    try {
      let profilePath = '';

      if (this.selectedCreateFile) {
        const up = await firstValueFrom<{ path: string }>(this.upload.uploadProfile(this.selectedCreateFile!));
        profilePath = up.path;
      }

      await firstValueFrom(this.admin.createUser({ ...c, profileImagePath: profilePath }));

      this.infoMsg = 'Korisnik kreiran.';
      this.creating = { username:'', email:'', password:'', firstName:'', lastName:'', gender:'', address:'', phone:'', role:'turista', profileImagePath:'' };
      this.selectedCreateFile = undefined;
      this.load();
    } catch (err:any) {
      this.errorMsg = err?.error?.message || 'Greška pri kreiranju.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Započinje izmenu korisnika.
   */
  startEdit(u: any){
    this.editingId = u._id;
    this.editModel = {
      email: u.email, firstName: u.firstName, lastName: u.lastName,
      gender: u.gender, address: u.address, phone: u.phone, role: u.role,
      newPassword: '', profileImagePath: ''
    };
    this.selectedEditFile = undefined;
  }

  /**
   * Otkazuje izmenu korisnika.
   */
  cancelEdit(){ this.editingId = null; }

  /**
   * Ažurira podatke o korisniku.
   */
  async doUpdate(u: any){
    if (!u._id) return;
    const b = this.editModel;

    if (b.email && !emailOk(b.email)) { this.errorMsg='Email nije ispravan.'; return; }
    if (b.phone && !phoneOk(b.phone)) { this.errorMsg='Telefon nije ispravan.'; return; }
    if (b.newPassword && !passwordOk(b.newPassword)) { this.errorMsg='Nova lozinka nije u traženom formatu.'; return; }

    this.loading = true; this.errorMsg=''; this.infoMsg='';
    try {
      let profilePath: string | undefined = undefined;

      if (this.selectedEditFile) {
        const up = await firstValueFrom<{ path: string }>(this.upload.uploadProfile(this.selectedEditFile!));
        profilePath = up.path;
      }

      const body:any = {};
      ['email','firstName','lastName','gender','address','phone','role'].forEach(k=>{
        if (b[k] !== undefined && b[k] !== null && String(b[k]).trim() !== '') body[k] = b[k];
      });
      if (b.newPassword) body.newPassword = b.newPassword;
      if (profilePath)   body.profileImagePath = profilePath;

      await firstValueFrom(this.admin.updateUser(u._id, body));
      this.infoMsg = 'Korisnik ažuriran.';
      this.editingId = null;
      this.load();
    } catch (err:any) {
      this.errorMsg = err?.error?.message || 'Greška pri ažuriranju.';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Briše korisnika.
   */
  doDelete(u: any){
    if (!u._id) return;
    if (!confirm(`Da li ste sigurni da želite da obrišete ${u.username}?`)) return;

    this.loading = true; this.errorMsg=''; this.infoMsg='';
    this.admin.deleteUser(u._id).subscribe({
      next: _ => { this.loading=false; this.infoMsg='Korisnik obrisan.'; this.load(); },
      error: err => { this.loading=false; this.errorMsg = err?.error?.message || 'Greška pri brisanju.'; }
    });
  }

  /**
   * Aktivira korisnika.
   */
  activate(u: any){
    if (!u._id || u.active) return;
    this.loading = true; this.errorMsg=''; this.infoMsg='';
    this.admin.activateUser(u._id).subscribe({
      next: res => { this.loading=false; this.infoMsg = res?.message; u.active = true; },
      error: err => { this.loading=false; this.errorMsg = err?.error?.message; }
    });
  }
  /**
   * Deaktivira korisnika.
   */
  deactivate(u: any){
    if (!u._id || !u.active) return;
    this.loading = true; this.errorMsg=''; this.infoMsg='';
    this.admin.deactivateUser(u._id).subscribe({
      next: res => { this.loading=false; this.infoMsg = res?.message; u.active = false; },
      error: err => { this.loading=false; this.errorMsg = err?.error?.message; }
    });
  }
}
