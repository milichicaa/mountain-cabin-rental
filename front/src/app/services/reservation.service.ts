// src/app/services/reservation.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Reservation, CreateReservationBody } from '../models/Reservation';

/**
 * Servis za rad sa rezervacijama (kreiranje, listanje, izmena statusa).
 */
@Injectable({ providedIn: 'root' })
export class ReservationService {
  private base = 'http://localhost:4000';
  constructor(private http: HttpClient) {}

  /**
   * Kreira novu rezervaciju (turista).
   */
  create(body: CreateReservationBody){
    return this.http.post<Reservation>(`${this.base}/reservations`, body);
  }

  /**
   * Vraća rezervacije prijavljenog korisnika (turista).
   */
  mine(){
    return this.http.get<Reservation[]>(`${this.base}/reservations/mine`);
  }

  /**
   * Prihvata rezervaciju (vlasnik).
   */
  accept(id: string){
    return this.http.post<{ message: string }>(`${this.base}/reservations/${id}/accept`, {});
  }

  /**
   * Odbija rezervaciju (vlasnik).
   */
  reject(id: string, comment: string){
    return this.http.post<{ message: string }>(`${this.base}/reservations/${id}/reject`, { comment });
  }

  /**
   * Vraća rezervacije za vlasnika (samo pending).
   */
  forOwner(){
    return this.http.get<Reservation[]>(`${this.base}/reservations/for-owner?status=pending`);
  }

  /**
   * Otkazuje rezervaciju (turista).
   */
  cancel(id: string){
    return this.http.post<{ message: string }>(`${this.base}/reservations/${id}/cancel`, {});
  }

  /**
   * Označava rezervaciju kao završenu (vlasnik).
   */
  complete(id: string){
    return this.http.post<{ message: string }>(`${this.base}/reservations/${id}/complete`, {});
  }

  /**
   * Vraća sve rezervacije za vlasnika (svi statusi).
   */
  forOwnerAll(){
    return this.http.get<Reservation[]>(`${this.base}/reservations/for-owner?status=all`);
  }
}
