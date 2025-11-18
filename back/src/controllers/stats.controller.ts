import { Request, Response, RequestHandler } from 'express';
import Cabin from '../models/Cabin';
import Reservation from '../models/Reservation';
import { User } from '../models/User';

// clamp funkcija — ograniči datum u opsegu [lo, hi]
function clamp(a: Date, lo: Date, hi: Date) {
  const t = Math.max(lo.getTime(), Math.min(a.getTime(), hi.getTime()));
  return new Date(t);
}

export class StatsController {
  // GET /stats/home — osnovne statistike za dashboard
  home: RequestHandler = async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const t24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const t7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
      const t30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [totalCabins, totalOwners, totalTourists, r24h, r7d, r30d] = await Promise.all([
        Cabin.countDocuments({}),
        User.countDocuments({ role: 'vlasnik' }),
        User.countDocuments({ role: 'turista' }),
        Reservation.countDocuments({ createdAt: { $gte: t24h }, status: { $in: ['pending','accepted','completed,'] } }),
        Reservation.countDocuments({ createdAt: { $gte: t7d  }, status: { $in: ['pending','accepted','completed'] } }),
        Reservation.countDocuments({ createdAt: { $gte: t30d }, status: { $in: ['pending','accepted','completed'] } }),
      ]);

      res.json({ totalCabins, totalOwners, totalTourists, r24h, r7d, r30d });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri statistici.', error: err?.message });
    }
  };

  // GET /stats/owner/monthly?year=YYYY — broj ostvarenih (completed) po mesecu početka
  monthly: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const year = Number(req.query.year) || new Date().getFullYear();
      const cabins = await Cabin.find({ owner: u.sub }).select('_id name').lean();
      const ids = cabins.map(c => c._id);
      const from = new Date(year, 0, 1);
      const to   = new Date(year + 1, 0, 1);

      const reservations = await Reservation.find({
        cabin:   { $in: ids },
        status:  'completed',
        dateFrom:{ $gte: from, $lt: to }
      }).select('cabin dateFrom').lean();

      const perCabin: Record<string, number[]> = {};
      cabins.forEach(c => (perCabin[String(c._id)] = Array(12).fill(0)));

      for (const r of reservations) {
        const m = new Date(r.dateFrom).getMonth();
        perCabin[String(r.cabin)][m] += 1;
      }

      res.json({
        months: [1,2,3,4,5,6,7,8,9,10,11,12],
        cabins: cabins.map(c => ({
          id: String(c._id),
          name: c.name,
          data: perCabin[String(c._id)]
        }))
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri mesečnoj statistici.', error: err?.message });
    }
  };

  // GET /stats/owner/weekend?year=YYYY[&weekendRule=any|major|both]
  weekend: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const year = Number(req.query.year) || new Date().getFullYear();
      const weekendRule = (req.query.weekendRule as string) || 'any';

      const cabins = await Cabin.find({ owner: u.sub }).select('_id name').lean();
      const ids = cabins.map(c => c._id);

      const from = new Date(year, 0, 1);
      const to   = new Date(year + 1, 0, 1);

      const reservations = await Reservation.find({
        cabin:   { $in: ids },
        status:  'completed',
        dateFrom:{ $gte: from, $lt: to }
      }).select('cabin dateFrom dateTo').lean();

      const agg: Record<string, { weekend: number; weekday: number }> = {};
      cabins.forEach(c => (agg[String(c._id)] = { weekend: 0, weekday: 0 }));

      const countNights = (a: Date, b: Date) => {
        const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
        const end   = new Date(b.getFullYear(), b.getMonth(), b.getDate());
        let nights = 0, weekendNights = 0;
        let hasFri = false, hasSat = false;

        for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          nights++;
          const dow = d.getDay();
          if (dow === 5) { weekendNights++; hasFri = true; }
          else if (dow === 6) { weekendNights++; hasSat = true; }
        }
        return { nights, weekendNights, hasFri, hasSat };
      };

      for (const r of reservations) {
        const s = clamp(new Date(r.dateFrom), from, to);
        const e = clamp(new Date(r.dateTo),   from, to);
        if (e <= s) continue;

        const { nights, weekendNights, hasFri, hasSat } = countNights(s, e);
        if (nights <= 0) continue;

        let isWeekend: boolean;
        if (weekendRule === 'major') {
          isWeekend = weekendNights >= Math.ceil(nights / 2);
        } else if (weekendRule === 'both') {
          isWeekend = hasFri && hasSat;
        } else {
          isWeekend = weekendNights >= 1;
        }

        const key = String(r.cabin);
        if (isWeekend) agg[key].weekend += 1;
        else agg[key].weekday += 1;
      }

      res.json(
        cabins.map(c => ({
          cabinId: String(c._id),
          name: c.name,
          weekend: agg[String(c._id)].weekend,
          weekday: agg[String(c._id)].weekday
        }))
      );
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri weekend statistici.', error: err?.message });
    }
  };
}
