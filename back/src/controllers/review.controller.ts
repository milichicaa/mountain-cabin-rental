import { Request, Response, RequestHandler } from 'express';
import Review from '../models/Review';
import Cabin from '../models/Cabin';
import Reservation from '../models/Reservation';

export class ReviewController {
  // POST /reviews
  add: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const { cabinId, rating, comment } = req.body;
      if (!cabinId) { res.status(400).json({ message: 'cabinId je obavezan.' }); return; }
      const rVal = parseInt(String(rating || ''), 10);
      if (!rVal || rVal < 1 || rVal > 5) { res.status(400).json({ message: 'Rating mora biti 1-5.' }); return; }

      const cabin = await Cabin.findById(cabinId);
      if (!cabin) { res.status(404).json({ message: 'Vikendica ne postoji.' }); return; }

      const rev = await Review.create({ cabin: cabinId, tourist: u.sub, rating: rVal, comment: String(comment || '').trim() });

      const agg = await Review.aggregate([
        { $match: { cabin: rev.cabin } },
        { $group: { _id: '$cabin', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
      ]);
      const { avg = 0, cnt = 0 } = agg[0] || {};
      await Cabin.findByIdAndUpdate(cabinId, { ratingAvg: avg, ratingCount: cnt });

      const populated = await Review.findById(rev._id).populate('tourist', 'username');
      res.status(201).json(populated);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri dodavanju recenzije.', error: err?.message });
    }
  };

  // GET /reviews/cabin/:id
  listByCabin: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const rows = await Review.find({ cabin: id })
        .sort({ createdAt: -1 })
        .populate('tourist', 'username');
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri dohvatanju recenzija.', error: err?.message });
    }
  };

  // POST /reviews/:id/delete
  remove: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const { id } = req.params;
      const r = await Review.findById(id);
      if (!r) { res.status(404).json({ message: 'Recenzija ne postoji.' }); return; }
      if (String(r.tourist) !== String(u.sub)) { res.status(403).json({ message: 'Nije vaša recenzija.' }); return; }

      await Review.findByIdAndDelete(id);

      const agg = await Review.aggregate([
        { $match: { cabin: r.cabin } },
        { $group: { _id: '$cabin', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
      ]);
      const { avg = 0, cnt = 0 } = agg[0] || {};
      await Cabin.findByIdAndUpdate(r.cabin, { ratingAvg: avg, ratingCount: cnt });

      res.json({ message: 'Recenzija obrisana.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri brisanju recenzije.', error: err?.message });
    }
  };

  // POST /reviews/for-reservation
  addForReservation: RequestHandler = async (req, res) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const { reservationId, rating, comment } = req.body || {};
      const r = await Reservation.findById(String(reservationId || '')).lean();
      if (!r) { res.status(404).json({ message: 'Rezervacija ne postoji.' }); return; }
      if (String(r.tourist) !== String(u.sub)) { res.status(403).json({ message: 'Nije vaša rezervacija.' }); return; }
      if (r.status !== 'completed') { res.status(400).json({ message: 'Možete oceniti samo završene rezervacije.' }); return; }
      if (r.userRating) { res.status(400).json({ message: 'Već ocenjeno.' }); return; }

      const rv = parseInt(String(rating || ''), 10);
      if (!rv || rv < 1 || rv > 5) { res.status(400).json({ message: 'Ocena mora biti 1–5.' }); return; }

      const rev = await Review.create({
        cabin: r.cabin,
        tourist: r.tourist,
        rating: rv,
        comment: String(comment || '').trim().slice(0, 1000)
      });

      await Reservation.findByIdAndUpdate(r._id, {
        userRating: rv,
        userComment: String(comment || '').trim().slice(0, 1000)
      });

      const agg = await Review.aggregate([
        { $match: { cabin: rev.cabin } },
        { $group: { _id: '$cabin', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } }
      ]);
      const { avg = 0, cnt = 0 } = agg[0] || {};
      await Cabin.findByIdAndUpdate(rev.cabin, { ratingAvg: avg, ratingCount: cnt });
      const populated = await Review.findById(rev._id).populate('tourist', 'username');
      res.status(201).json(populated);
      // res.status(201).json({ message: 'Ocena sačuvana.' });
    } catch (err:any) {
      res.status(500).json({ message: 'Greška pri ocenjivanju.', error: err?.message });
    }
  }
}
