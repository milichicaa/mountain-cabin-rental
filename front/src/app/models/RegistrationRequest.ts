import { Role } from "./Role";

export type RequestStatus = 'pending'|'accepted'|'rejected';

// Zahtev za registraciju
export interface RegistrationRequest {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'Ž';
  address: string;
  phone: string;
  role: Exclude<Role, 'admin'>;
  profileImagePath: string;
  creditCardMasked: string;
  creditCardFull: string;
  status: RequestStatus;
  reason: string;
  createdAt: string;
}
