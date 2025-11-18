import express from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { authOnly, mustBe } from '../middlewares/auth';

const reservationRouter = express.Router();

// POST /reservations — kreiranje (tourist)
reservationRouter
  .route('/')
  .post(authOnly, mustBe('turista'), (req, res, next) => new ReservationController().create(req, res, next));

// GET /reservations/mine — moje rezervacije (tourist)
reservationRouter
  .route('/mine')
  .get(authOnly, mustBe('turista'), (req, res, next) => new ReservationController().mine(req, res, next));

// GET /reservations/for-owner — rezervacije za vlasnika (owner)
reservationRouter
  .route('/for-owner')
  .get(authOnly, mustBe('vlasnik'), (req, res, next) => new ReservationController().forOwner(req, res, next));

// POST /reservations/:id/accept — prihvati (owner)
reservationRouter
  .route('/:id/accept')
  .post(authOnly, mustBe('vlasnik'), (req, res, next) => new ReservationController().accept(req, res, next));

// POST /reservations/:id/reject — odbij (owner)
reservationRouter
  .route('/:id/reject')
  .post(authOnly, mustBe('vlasnik'), (req, res, next) => new ReservationController().reject(req, res, next));

// POST /reservations/:id/cancel — otkaži (tourist)
reservationRouter
  .route('/:id/cancel')
  .post(authOnly, mustBe('turista'),
        (req, res, next) => new ReservationController().cancel(req, res, next));

// POST /reservations/:id/complete — završi (owner)
reservationRouter
  .route('/:id/complete')
  .post(authOnly, mustBe('vlasnik'),
        (req, res, next) => new ReservationController().complete(req, res, next));

export default reservationRouter;
