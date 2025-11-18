import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Cabin } from '../models/Cabin';
import { CreateCabinBody } from '../models/CreateCabinBody';
import { HomeStats } from '../models/HomeStats';
import { Observable } from 'rxjs';

// Definišemo tip odgovora sa novog endpointa
export interface HomeData {
  cabins: Cabin[];
  stats: HomeStats;
}

/**
 * Servis za rad sa vikendicama (listanje, detalji, kreiranje, izmena, brisanje).
 */
@Injectable({ providedIn: 'root' })
export class CabinService {
  private http = inject(HttpClient);
  private base = 'http://localhost:4000';

  /**
   * Vraća listu vikendica sa statistikom za prikaz na početnoj strani.
   */
  listWithStats(): Observable<HomeData> {
    return this.http.get<HomeData>(`${this.base}/cabins/home`);
  }

  /**
   * Vraća listu vikendica po zadatim filterima.
   */
  list(qName: string, qPlace: string) {
    let params = new HttpParams();
    if (qName)  params = params.set('q', qName);
    if (qPlace) params = params.set('place', qPlace);
    return this.http.get<Cabin[]>(`${this.base}/cabins`, { params });
  }

  /**
   * Vraća detalje vikendice po ID-ju.
   */
  detail(id: string){
    return this.http.get<Cabin>(`${this.base}/cabins/${id}`);
  }

  /**
   * Kreira novu vikendicu (za vlasnika).
   */
  create(body: CreateCabinBody){
    return this.http.post<Cabin>(`${this.base}/cabins`, body);
  }

  /**
   * Vraća vikendice prijavljenog vlasnika.
   */
  mine(){
    return this.http.post<Cabin[]>(`${this.base}/cabins/mine`, {});
  }

  /**
   * Ažurira podatke o vikendici.
   */
  update(id: string, body: Partial<Cabin>){
    return this.http.post<{message: string}>(`${this.base}/cabins/${id}/update`, body);
  }

  /**
   * Briše vikendicu po ID-ju.
   */
  remove(id: string){
    return this.http.post<{message:string}>(`${this.base}/cabins/${id}/delete`, {});
  }
}
