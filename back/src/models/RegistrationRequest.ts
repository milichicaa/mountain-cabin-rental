import { Schema, model } from 'mongoose';

const RegistrationRequestSchema = new Schema({
  username: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['M', 'Ž'], required: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  role: { type: String, enum: ['turista', 'vlasnik'], required: true },
  profileImagePath: { type: String, required: true },
  creditCardMasked: { type: String, required: true },
  creditCardFull: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const RegistrationRequest = model('RegistrationRequest', RegistrationRequestSchema);
