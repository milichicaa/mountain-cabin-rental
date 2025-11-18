import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '../models/User';

type UpdateProfileBody = {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;             // očišćen (+ i cifre)
  profileImagePath: string;  // npr. /uploads/profili/mika.jpg
  cardNumber?: string;       // OPCIONO – šalješ samo ako menjaš karticu
};

type MessageResp = { message: string };

/**
 * Servis za rad sa korisničkim profilom (dohvatanje i izmena podataka).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = 'http://localhost:4000';

  /**
   * Dohvata podatke o prijavljenom korisniku.
   */
  dohvatiKorisnika() {
    // POST (bez tela), interceptor šalje Bearer token
    return this.http.post<User>(`${this.base}/users/me`, {});
  }

  /**
   * Ažurira podatke o profilu korisnika.
   */
  updateProfile(body: UpdateProfileBody){
    return this.http.post<MessageResp>(`${this.base}/users/update`, body);
  }
}
