// Model vikendice
export interface Cabin {
  _id: string;
  owner: string | { _id?: string; firstName?: string; lastName?: string; username?: string };
  name: string;
  place: string;
  address: string;
  description: string;
  maxGuests: number;
  amenities: string[];
  images: string[];
  ratingAvg: number;
  ratingCount: number;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  lat: number;
  lng: number;
  phone: string;
  pricePerNightSummer: number;
  pricePerNightWinter: number;
}
