import express from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authOnly, mustBe } from '../middlewares/auth';

const reviewRouter = express.Router();
const rc = new ReviewController();

// POST /reviews — dodaj recenziju (tourist)
reviewRouter
  .route('/')
  .post(authOnly, mustBe('turista'), (req, res, next) => rc.add(req, res, next));

// GET /reviews/cabin/:id — recenzije za vikendicu
reviewRouter
  .route('/cabin/:id')
  .get((req, res, next) => rc.listByCabin(req, res, next));

// POST /reviews/:id/delete — obriši svoju recenziju (tourist)
reviewRouter
  .route('/:id/delete')
  .post(authOnly, mustBe('turista'), (req, res, next) => rc.remove(req, res, next));

// POST /reviews/for-reservation — ocena za konkretnu rezervaciju (tourist)
reviewRouter.post(
  '/for-reservation',
  authOnly,
  mustBe('turista'),
  (req, res, next) => rc.addForReservation(req, res, next)
);

export default reviewRouter;
