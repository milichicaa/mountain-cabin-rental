import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Review } from '../models/Review';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private base = 'http://localhost:4000';

  listByCabin(cabinId: string) {
    return this.http.get<Review[]>(`${this.base}/reviews/cabin/${cabinId}`);
  }

  create(body: { cabinId: string, rating: number, comment: string }) {
    return this.http.post<Review>(`${this.base}/reviews`, body);
  }

  remove(reviewId: string) {
    return this.http.post<{ message: string }>(`${this.base}/reviews/${reviewId}/delete`, {});
  }

  createForReservation(reservationId: string, rating: number, comment: string) {
    const body = { reservationId, rating, comment };
    return this.http.post<{ message: string }>(`${this.base}/reviews/for-reservation`, body);
  }
}
