import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RegistrationRequest } from '../models/RegistrationRequest';
import { User } from '../models/User';
type MessageResp = { message: string };
export type AdminCabinRow = {
  _id: string;
  name: string;
  place: string;
  pricePerNightSummer: number;
  pricePerNightWinter: number;
  blockedUntil?: string | null;   // ISO datum ili null
  createdAt?: string;
  last3?: { rating: number; createdAt: string }[];
  low3: boolean;                   // poslednje 3 ocene < 2 ?
};
/**
 * Servis za administraciju korisnika, vikendica i zahteva za registraciju.
 * Omogućava listanje, kreiranje, izmenu, aktivaciju, deaktivaciju i brisanje.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = 'http://localhost:4000';
  constructor(private http: HttpClient) {}

  /**
   * Vraća sve zahteve za registraciju vlasnika.
   */
  listRequests() {
    return this.http.get<RegistrationRequest[]>(`${this.base}/admin/requests`);
  }

  /**
   * Prihvata zahtev za registraciju vlasnika.
   */
  acceptRequest(id: string) {
    return this.http.post<MessageResp>(`${this.base}/admin/requests/${id}/accept`, {});
  }

  /**
   * Odbija zahtev za registraciju vlasnika.
   */
  rejectRequest(id: string, reason: string) {
    return this.http.post<MessageResp>(`${this.base}/admin/requests/${id}/reject`, { reason });
  }

  /**
   * Vraća sve vikendice za administraciju.
   */
  listCabins() {
    return this.http.get<AdminCabinRow[]>(`${this.base}/admin/cabins`);
  }

  /**
   * Blokira vikendicu na 48h.
   */
  blockCabin(id: string) {
    return this.http.post<MessageResp>(`${this.base}/admin/cabins/${id}/block`, {});
  }

  /**
   * Odblokira vikendicu.
   */
  unblockCabin(id: string) {
    return this.http.post<MessageResp>(`${this.base}/admin/cabins/${id}/unblock`, {});
  }

  /**
   * Vraća sve korisnike za administraciju.
   */
  listUsers() {
    return this.http.post<User[]>(`${this.base}/admin/users`, {});
  }

  /**
   * Deaktivira korisnika.
   */
  deactivateUser(id: string) {
    return this.http.post<{message:string}>(`${this.base}/admin/users/${id}/deactivate`, {});
  }

  /**
   * Aktivira korisnika.
   */
  activateUser(id: string) {
    return this.http.post<{message:string}>(`${this.base}/admin/users/${id}/activate`, {});
  }

  /**
   * Kreira novog korisnika.
   */
  createUser(body: any) {
    return this.http.post<{message:string; id:string}>(`${this.base}/admin/users/create`, body);
  }

  /**
   * Ažurira podatke o korisniku.
   */
  updateUser(id: string, body: any) {
    return this.http.post<{message:string}>(`${this.base}/admin/users/${id}/update`, body);
  }

  /**
   * Briše korisnika.
   */
  deleteUser(id: string) {
    return this.http.post<{message:string}>(`${this.base}/admin/users/${id}/delete`, {});
  }
}
