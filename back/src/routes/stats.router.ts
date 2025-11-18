// routes/stats.router.ts
import express from 'express';
import { StatsController } from '../controllers/stats.controller';
import { authOnly, mustBe } from '../middlewares/auth';

const statsRouter = express.Router();

// GET /stats/home — osnovni dashboard
statsRouter.get('/home', (req, res, next) => new StatsController().home(req, res, next));

// GET /stats/owner/monthly?year=YYYY — mesečno (owner)
statsRouter.get(
  '/owner/monthly',
  authOnly,
  mustBe('vlasnik'),
  (req, res, next) => new StatsController().monthly(req, res, next)
);

// GET /stats/owner/weekend?year=YYYY — weekend vs weekday (owner)
statsRouter.get(
  '/owner/weekend',
  authOnly,
  mustBe('vlasnik'),
  (req, res, next) => new StatsController().weekend(req, res, next)
);

export default statsRouter;
