import { User } from "./User";

// Recenzija vikendice
export interface Review {
  _id: string;
  cabin: string;     // Cabin["_id"]
  tourist: string | User; // Može biti ID ili ceo User
  rating: number;    // 1..5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

// Telo za dodavanje recenzije
export interface AddReviewBody {
  cabinId: string;
  rating: number;     // 1..5
  comment: string;
}
