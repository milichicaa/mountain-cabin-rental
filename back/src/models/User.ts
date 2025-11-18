// src/models/User.ts
import { Schema, model } from 'mongoose';
export type Role = 'turista'|'owner'|'admin';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['M', 'Ž'] },
  address: { type: String, trim: true },
  phone: { type: String, trim: true },
  profileImagePath: { type: String, default: '' },
  creditCardMasked: { type: String, default: '' },
  creditCardFull: { type: String, default: '' },
  role: { type: String, enum: ['turista', 'vlasnik', 'admin'], default: 'turista' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = model('User', UserSchema);
