// Telo za kreiranje vikendice
export interface CreateCabinBody{
  name: string;
  place: string;
  address: string;
  description: string;
  maxGuests: number;
  amenities: string[];
  images: string[];
  lat: number;
  lng: number;
  phone: string;
  pricePerNightSummer: number;
  pricePerNightWinter: number;
}
