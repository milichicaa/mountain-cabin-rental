import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * Servis za upload slika (profil, vikendica).
 */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private base = 'http://localhost:4000';
  constructor(private http: HttpClient) {}

  /**
   * Upload profilne slike korisnika.
   */
  uploadProfile(file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<{path:string}>(`${this.base}/files/uploadProfile`, data);
  }

  /**
   * Upload slike vikendice.
   */
  uploadCabinImage(file: File) {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<{path:string}>(`${this.base}/files/uploadCabin`, data);
  }
}
