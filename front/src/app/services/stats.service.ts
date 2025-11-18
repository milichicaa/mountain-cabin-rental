import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HomeStats } from '../models/HomeStats';

/**
 * Servis za prikaz statistike (početna, vlasnik).
 */
@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private base = 'http://localhost:4000';
  constructor(private http: HttpClient) { }

  /**
   * Statistika za početnu stranicu.
   */
  home() {
    return this.http.get<HomeStats>(`${this.base}/stats/home`);
  }

  /**
   * Statistika po mesecima za vlasnika.
   */
  ownerMonthly(year: number) {
    const params = new HttpParams().set('year', String(year));
    return this.http.get<{
      months: number[],
      cabins: { id: string; name: string; data: number[] }[]
    }>(`${this.base}/stats/owner/monthly`, { params });
  }

  /**
   * Statistika vikend/radni dan za vlasnika.
   */
  ownerWeekend(year: number) {
    const params = new HttpParams().set('year', String(year));
    return this.http.get<Array<{ cabinId:string; name:string; weekend:number; weekday:number }>>(
      `${this.base}/stats/owner/weekend`,
      { params }
    );
  }
}
