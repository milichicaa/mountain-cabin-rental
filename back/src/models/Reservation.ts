import { Schema, model, Types } from 'mongoose';

export type ReservationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

const ReservationSchema = new Schema({
  cabin: { type: Types.ObjectId, ref: 'Cabin', required: true },
  tourist: { type: Types.ObjectId, ref: 'User', required: true },
  dateFrom: { type: Date, required: true },
  dateTo: { type: Date, required: true },
  adults: { type: Number, default: 1, min: 1 },
  children: { type: Number, default: 0, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'], default: 'pending' },
  userComment: { type: String, default: '' },
  ownerComment: { type: String, default: '' },
  userRating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

ReservationSchema.index({ cabin: 1, dateFrom: 1, dateTo: 1 });

export const Reservation = model('Reservation', ReservationSchema);
export default Reservation;
