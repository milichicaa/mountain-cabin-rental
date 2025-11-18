import { Schema, model } from 'mongoose';

const CabinSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  place: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  maxGuests: { type: Number, required: true, min: 1 },
  amenities: [String],
  images: [String],
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  blockedUntil: { type: Date, default: null },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  phone: { type: String },
  pricePerNightSummer: { type: Number, required: true },
  pricePerNightWinter: { type: Number, required: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuelno polje — recenzije za vikendicu
CabinSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'cabin'
});

export const Cabin = model('Cabin', CabinSchema);
export default Cabin;
