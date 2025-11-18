import { Request, Response, RequestHandler } from 'express';
import Reservation from '../models/Reservation';
import Cabin from '../models/Cabin';
import mongoose from 'mongoose';

const isValidId = (id?: string) => Boolean(id) && mongoose.Types.ObjectId.isValid(String(id));

function isSummerMonth(d: Date) {
  const m = d.getMonth();
  return m >= 4 && m <= 7;
}

function computeTotalPrice(from: Date, to: Date, cabin: any) {
  let cur = new Date(from);
  let total = 0;
  while (cur < to) {
    total += isSummerMonth(cur) ? cabin.pricePerNightSummer : cabin.pricePerNightWinter;
    cur.setDate(cur.getDate() + 1);
    cur.setHours(0, 0, 0, 0);
  }
  return total;
}

export class ReservationController {
  // POST /reservations
  create: RequestHandler = async (req, res) => {
    try {
      const { cabinId, dateFrom, dateTo, adults = 1, children = 0, userComment } = req.body;
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste prijavljeni.' }); return; }
      if (!isValidId(cabinId)) { res.status(400).json({ message: 'Nevažeća vikendica.' }); return; }

      const cabin = await Cabin.findById(cabinId);
      if (!cabin) { res.status(404).json({ message: 'Vikendica nije pronađena.' }); return; }

      const fromRaw = new Date(dateFrom);
      const toRaw   = new Date(dateTo);
      if (isNaN(+fromRaw) || isNaN(+toRaw)) { res.status(400).json({ message: 'Neispravni datumi.' }); return; }
      const from = new Date(fromRaw); from.setHours(14, 0, 0, 0);
      const to   = new Date(toRaw);   to.setHours(10, 0, 0, 0);

      const today = new Date(); today.setHours(0,0,0,0);
      if (from < today) { res.status(400).json({ message: 'Nije moguće rezervisati u prošlosti.' }); return; }
      if (to <= from) { res.status(400).json({ message: 'Minimalno 1 noćenje.' }); return; }

      const maxGuests = (cabin as any).maxGuests ?? (cabin as any).capacity ?? 0;
      const adultsN = Math.max(1, parseInt(String(adults), 10) || 1);
      const childrenN = Math.max(0, parseInt(String(children), 10) || 0);
      if (adultsN + childrenN > maxGuests) {
        res.status(400).json({ message: `Kapacitet: ${maxGuests}.` }); return;
      }

      const now = new Date();
      if ((cabin.blockedUntil && cabin.blockedUntil > now) || cabin.isBlocked === true) {
        res.status(400).json({ message: 'Vikendica ne radi.' }); return;
      }

      const clash = await Reservation.findOne({
        cabin: cabinId,
        status: { $in: ['pending', 'accepted'] },
        dateFrom: { $lt: to },
        dateTo: { $gt: from }
      });
      if (clash) { res.status(400).json({ message: 'Termin je zauzet.' }); return; }

      if (typeof cabin.pricePerNightSummer !== 'number' || typeof cabin.pricePerNightWinter !== 'number') {
        res.status(400).json({ message: 'Cenovnik nije podešen.' }); return;
      }
      const totalPrice = computeTotalPrice(from, to, cabin);

      const r = await Reservation.create({
        cabin: cabin._id,
        tourist: u.sub,
        dateFrom: from,
        dateTo: to,
        adults: adultsN,
        children: childrenN,
        totalPrice,
        status: 'pending',
        userComment: String(userComment || '').trim().slice(0, 500)
      });

      res.status(201).json(r); return;
    } catch (err:any) {
      res.status(500).json({ message: 'Greška pri kreiranju rezervacije.', error: err?.message }); return;
    }
  };

  // GET /reservations/mine
  mine: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const list = await Reservation.find({ tourist: u.sub })
        .sort({ createdAt: -1 })
        .populate('cabin', 'name place');

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri dohvatanju rezervacija.', error: err?.message });
    }
  };

  // GET /reservations/for-owner
  forOwner: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const status = (req.query.status as string) || 'pending';

      const cabins = await Cabin.find({ owner: u.sub }).select('_id');
      const cabinIds = cabins.map(c => c._id);

      const filter: any = { cabin: { $in: cabinIds } };
      if (status !== 'all') filter.status = status;

      const list = await Reservation.find(filter)
        .sort({ createdAt: -1 })
        .populate('cabin', 'name place');

      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri dohvatanju rezervacija za vlasnika.', error: err?.message });
    }
  };

  // POST /reservations/:id/accept
  accept: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const r = await Reservation.findById(req.params.id);
      if (!r) { res.status(404).json({ message: 'Rezervacija ne postoji.' }); return; }

      const cab = await Cabin.findById(r.cabin);
      if (!cab) { res.status(400).json({ message: 'Vikendica ne postoji.' }); return; }
      if (String(cab.owner) !== String(u.sub)) { res.status(403).json({ message: 'Nije vaša vikendica.' }); return; }

      if (r.status !== 'pending') { res.status(400).json({ message: 'Rezervacija nije u statusu pending.' }); return; }

      const clash = await Reservation.findOne({
        _id: { $ne: r._id },
        cabin: r.cabin,
        status: { $in: ['pending', 'accepted'] },
        dateFrom: { $lt: r.dateTo },
        dateTo: { $gt: r.dateFrom }
      });

      if (clash) { res.status(409).json({ message: 'Termin je već zauzet.' }); return; }

      await Reservation.findByIdAndUpdate(r._id, { status: 'accepted' });
      res.json({ message: 'Prihvaćeno' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri prihvatanju rezervacije.', error: err?.message });
    }
  };

  // POST /reservations/:id/reject
  reject: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const comment = (req.body?.comment || '').trim();
      if (comment.length < 10) {
        res.status(400).json({ message: 'Komentar mora imati najmanje 10 karaktera.' });
        return;
      }

      const r = await Reservation.findById(req.params.id);
      if (!r) { res.status(404).json({ message: 'Rezervacija ne postoji.' }); return; }

      const cab = await Cabin.findById(r.cabin);
      if (!cab) { res.status(400).json({ message: 'Vikendica ne postoji.' }); return; }
      if (String(cab.owner) !== String(u.sub)) { res.status(403).json({ message: 'Nije vaša vikendica.' }); return; }

      if (r.status !== 'pending') { res.status(400).json({ message: 'Rezervacija nije u statusu pending.' }); return; }

      r.status = 'rejected';
      r.ownerComment = comment;
      await r.save();

      res.json({ message: 'Odbijeno' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri odbijanju rezervacije.', error: err?.message });
    }
  };

  // POST /reservations/:id/cancel
  cancel: RequestHandler = async (req, res) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const r = await Reservation.findById(req.params.id);
      if (!r) { res.status(404).json({ message: 'Rezervacija ne postoji.' }); return; }
      if (String(r.tourist) !== String(u.sub)) { res.status(403).json({ message: 'Nije vaša rezervacija.' }); return; }

      const now = Date.now();
      const from = new Date(r.dateFrom).getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      if ((from - now) < oneDay) { res.status(400).json({ message: 'Možete otkazati najkasnije 24h pre.' }); return; }

      if (!(r.status === 'pending' || r.status === 'accepted')) {
        res.status(400).json({ message: 'Otkazivanje nije dozvoljeno.' }); return;
      }

      r.status = 'cancelled';
      await r.save();
      res.json({ message: 'Rezervacija otkazana.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri otkazivanju.', error: err?.message });
    }
  };

  // POST /reservations/:id/complete
  complete: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const r = await Reservation.findById(req.params.id).populate('cabin', 'owner');
      if (!r) { res.status(404).json({ message: 'Rezervacija ne postoji.' }); return; }

      const cabinOwnerId = ((r as any).cabin?.owner || '').toString();
      if (cabinOwnerId !== String(u.sub)) { res.status(403).json({ message: 'Nije vaša vikendica.' }); return; }

      const now = new Date();
      if (new Date(r.dateTo) > now) { res.status(400).json({ message: 'Još nije istekla.' }); return; }
      if (r.status !== 'accepted') { res.status(400).json({ message: 'Može se završiti samo prihvaćena.' }); return; }

      r.status = 'completed';
      await r.save();
      res.json({ message: 'Označena kao završena.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri završetku.', error: err?.message });
    }
  };
}
