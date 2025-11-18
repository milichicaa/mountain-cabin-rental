import { Schema, model, Types } from 'mongoose';

const ReviewSchema = new Schema({
  cabin: { type: Types.ObjectId, ref: 'Cabin', required: true },
  tourist: { type: Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' }
}, { timestamps: true });

ReviewSchema.index({ cabin: 1, createdAt: -1 });

export const Review = model('Review', ReviewSchema);
export default Review;
