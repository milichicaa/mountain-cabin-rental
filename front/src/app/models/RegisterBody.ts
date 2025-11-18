import { Role } from "./Role";

export type RequestStatus = 'pending'|'accepted'|'rejected';

// Telo za registraciju
export interface RegisterBody {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'Ž';
  address: string;
  phone: string;
  role: Exclude<Role, 'admin'>;
  profileImagePath?: string;
  creditCardMasked: string;
  creditCardFull: string;
}
