import { Role } from "./Role";

// Osnovni podaci o korisniku
export interface User {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: 'M'|'Ž';
  address: string;
  phone: string;
  profileImagePath: string;
  creditCardMasked: string;

  role: Role;
  active: boolean;
  createdAt: string;
}
