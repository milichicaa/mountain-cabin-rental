import express from 'express';
import { authOnly, mustBe } from '../middlewares/auth';
import { AdminController } from '../controllers/admin.controller';
import { AuthController } from '../controllers/auth.controller';

const adminRouter = express.Router();

// POST /admin/login — admin login (bez middleware-a)
adminRouter
  .route('/login')
  .post((req, res, next) => new AuthController().adminLogin(req, res, next));

// GET /admin/requests — lista zahteva (admin)
adminRouter
  .route('/requests')
  .get(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().listRequests(req, res, _next));

// POST /admin/requests/:id/accept — prihvati zahtev (admin)
adminRouter
  .route('/requests/:id/accept')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().acceptRequest(req, res, _next));

// POST /admin/requests/:id/reject — odbij zahtev (admin)
adminRouter
  .route('/requests/:id/reject')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().rejectRequest(req, res, _next));

// POST /admin/cabins/:id/block — blokiraj vikendicu 48h (admin)
adminRouter
  .route('/cabins/:id/block')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().blockCabin(req, res, _next));

// POST /admin/cabins/:id/unblock — ukloni blokadu (admin)
adminRouter
  .route('/cabins/:id/unblock')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().unblockCabin(req, res, _next));

// POST /admin/users — lista korisnika (bez passwordHash) (admin)
adminRouter
  .route('/users')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().listUsers(req, res, _next));

// POST /admin/users/:id/activate — aktiviraj korisnika (admin)
adminRouter
  .route('/users/:id/activate')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().activateUser(req, res, _next));

// POST /admin/users/:id/deactivate — deaktiviraj korisnika (admin)
adminRouter
  .route('/users/:id/deactivate')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().deactivateUser(req, res, _next));

// GET /admin/cabins — lista vikendica + indikator low3 (admin)
adminRouter
  .route('/cabins')
  .get(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().listCabins(req, res, _next));

// POST /admin/users/create — kreiraj korisnika (tourist/owner) (admin)
adminRouter
  .route('/users/create')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().createUser(req, res, _next));

// POST /admin/users/:id/update — izmeni korisnika (admin)
adminRouter
  .route('/users/:id/update')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().updateUser(req, res, _next));

// POST /admin/users/:id/delete — obriši korisnika (admin)
adminRouter
  .route('/users/:id/delete')
  .post(authOnly, mustBe('admin'), (req, res, _next) => new AdminController().deleteUser(req, res, _next));

export default adminRouter;
