import { Role } from "./Role";

// Telo za login
export interface LoginBody { username: string; password: string; }

// Odgovor na login
export interface LoginResp { token: string; role: Role; username: string; }
