import express from 'express';
import { CabinController } from '../controllers/cabin.controller';
import { authOnly, mustBe } from '../middlewares/auth';
import multer from 'multer';

const cabinRouter = express.Router();
const jsonUpload = multer({ storage: multer.memoryStorage() });

// GET /cabins/home — podaci za početnu (pre /:id)
cabinRouter
  .route('/home')
  .get((req, res, next) => new CabinController().homeData(req, res, next));

// GET/POST /cabins — lista i kreiranje (owner)
cabinRouter
  .route('/')
  .get((req, res, next) => new CabinController().list(req, res, next))
  .post(authOnly, mustBe('vlasnik'), (req, res, next) => new CabinController().create(req, res, next));

// POST /cabins/mine — moje vikendice (owner) (pre /:id)
cabinRouter
  .route('/mine')
  .post(authOnly, mustBe('vlasnik'), (req, res, next) => new CabinController().mine(req, res, next));

// GET /cabins/:id — detalji vikendice
cabinRouter
  .route('/:id')
  .get((req, res, next) => new CabinController().detail(req, res, next));

// POST /cabins/:id/update — izmena (owner)
cabinRouter
  .route('/:id/update')
  .post(authOnly, mustBe('vlasnik'), (req, res, next) => new CabinController().update(req, res, next));

// POST /cabins/:id/delete — brisanje (owner)
cabinRouter
  .route('/:id/delete')
  .post(authOnly, mustBe('vlasnik'), (req, res, next) => new CabinController().remove(req, res, next));

// POST /cabins/parse-json — učitaj JSON (owner)
cabinRouter
  .route('/parse-json')
  .post(authOnly, mustBe('vlasnik'), jsonUpload.single('file'), (req, res, next) => {
    if (!req.file) {
      res.status(400).json({ message: 'JSON fajl nije poslat.' });
      return;
    }

    try {
      const json = JSON.parse(req.file.buffer.toString('utf-8'));
      res.json({
        name: json.name || '',
        place: json.place || '',
        address: json.address || '',
        description: json.description || '',
        maxGuests: json.maxGuests || 2,
        amenities: json.amenities || [],
        lat: json.lat || 0,
        lng: json.lng || 0,
        phone: json.phone || '',
        pricePerNightSummer: json.pricePerNightSummer || 0,
        pricePerNightWinter: json.pricePerNightWinter || 0
      });
    } catch {
      res.status(400).json({ message: 'Neispravan JSON format.' });
    }
  });

export default cabinRouter;
