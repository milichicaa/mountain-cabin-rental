import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authOnly } from '../middlewares/auth';

const userRouter = express.Router();

// POST /users/me — info o prijavljenom korisniku
userRouter
  .route('/me')
  .post(authOnly, (req, res, next) => new UserController().me(req, res, next));

// POST /users/update — izmena profila (ulogovani)
userRouter
  .route('/update')
  .post(authOnly, (req, res, next) => new UserController().updateProfile(req, res, next));

export default userRouter;
