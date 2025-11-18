import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authOnly } from '../middlewares/auth';

const authRouter = express.Router();

// Auth rute — login/registracija/lozinka

// POST /auth/login — javni login (tourist/owner)
authRouter
  .route('/login')
  .post((req, res, next) => new AuthController().publicLogin(req, res, next));

// POST /auth/admin/login — admin login
authRouter
  .route('/admin/login')
  .post((req, res, next) => new AuthController().adminLogin(req, res, next));

// POST /auth/register — kreira RegistrationRequest (tourist/owner)
authRouter
  .route('/register')
  .post((req, res, next) => new AuthController().register(req, res, next));

// POST /auth/change-password — promena lozinke (ulogovani)
authRouter
  .route('/change-password')
  .post(authOnly, (req, res, next) => new AuthController().changePassword(req, res, next));

export default authRouter;
