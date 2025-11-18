import { ReservationCabinInfo } from './ReservationCabinInfo';
import { User } from './User';

/** Telo za kreiranje rezervacije */
export interface CreateReservationBody {
  cabinId: string;
  dateFrom: string;
  dateTo: string;
  adults: number;
  children: number;
  userComment?: string;
}

// Rezervacija
export interface Reservation {
  _id: string;
  cabin: string | ReservationCabinInfo;
  tourist: string | User;
  dateFrom: string;
  dateTo: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  totalPrice: number;
  adults: number;
  children: number;
  userComment?: string;
  ownerComment?: string;
  userRating?: number;
  createdAt: string;
  updatedAt: string;
}
