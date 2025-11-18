import { Request, Response, RequestHandler } from 'express';
import { Cabin } from '../models/Cabin';
import Reservation from '../models/Reservation';
import {User} from '../models/User';
import path from 'path';
const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');
const webToDisk = (p: string) => path.join(uploadsRoot, p.replace(/^\/uploads[\\/]/, ''));
import fs from 'fs';
import { Review } from '../models/Review';
import { isValidObjectId } from 'mongoose';

const escapeRegex = (s: string) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isLocalUploadPath = (p: string) => /^\/uploads\/.+\.(jpe?g|png)$/i.test(p);
const isValidId = (id: string) => isValidObjectId(id);

export class CabinController {

  // GET /cabins/home
  homeData: RequestHandler = async (req: Request, res: Response) => {
    try {
      const now = new Date();

      const cabinFilter = {
        $and: [
          { $or: [{ isBlocked: { $exists: false } }, { isBlocked: false }] },
          { $or: [{ blockedUntil: null }, { blockedUntil: { $lte: now } }] }
        ]
      };
      const cabins = await Cabin.find(cabinFilter).sort({ createdAt: -1 });

      const totalCabins = cabins.length;
      const totalOwners = await User.countDocuments({ role: 'vlasnik', status: 'approved' });
      const totalTourists = await User.countDocuments({ role: 'turista', status: 'approved' });

      const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const d7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const d30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const r24h = await Reservation.countDocuments({ createdAt: { $gte: d24h }, status: { $ne: 'rejected' } });
      const r7d  = await Reservation.countDocuments({ createdAt: { $gte: d7d  }, status: { $ne: 'rejected' } });
      const r30d = await Reservation.countDocuments({ createdAt: { $gte: d30d }, status: { $ne: 'rejected' } });

      const stats = { totalCabins, totalOwners, totalTourists, r24h, r7d, r30d };

      res.json({ cabins, stats });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri dohvatanju podataka.', error: err?.message });
    }
  };

  // GET /cabins
  list: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { place, q } = req.query as { place?: string; q?: string };
      const now = new Date();

      const filter: any = {
        $and: [
          { $or: [{ isBlocked: { $exists: false } }, { isBlocked: false }] },
          { $or: [{ blockedUntil: null }, { blockedUntil: { $lte: now } }] }
        ]
      };

      if (place) filter.place = { $regex: '^' + escapeRegex(String(place).trim()), $options: 'i' };
      if (q)     filter.name  = { $regex: '^' + escapeRegex(String(q).trim()),     $options: 'i' };

      const cabins = await Cabin.find(filter).sort({ createdAt: -1 });
      res.json(cabins);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri listanju vikendica.', error: err?.message });
    }
  };

  // GET /cabins/:id
  detail: RequestHandler = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (!isValidId(id)) { res.status(400).json({ message: 'Nevažeći ID.' }); return; }
    try {
      const cabin = await Cabin.findById(id)
        .populate('owner', 'firstName lastName')
        .populate({ path: 'reviews', options: { sort: { createdAt: -1 } } });
      if (!cabin) { res.status(404).json({ message: 'Vikendica nije pronađena.' }); return; }
      res.json(cabin);
    } catch (error: any) {
      res.status(500).json({ message: 'Greška pri učitavanju detalja.', error: error?.message });
    }
  };

  // POST /cabins
  create: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u || u.role !== 'vlasnik') { res.status(403).json({ message: 'Samo vlasnici mogu dodati vikendicu.' }); return; }

      const {
        name, place, address, description,
        maxGuests, amenities, images, lat, lng, phone, pricePerNightSummer, pricePerNightWinter
      } = req.body || {};

      if (!name?.trim() || !place?.trim() || !address?.trim() || !description?.trim() || !(maxGuests > 0)) {
        res.status(400).json({ message: 'Popuni obavezna polja.' }); return;
      }
      if (!(pricePerNightSummer > 0) || !(pricePerNightWinter > 0)) {
        res.status(400).json({ message: 'Unesi pozitivne cene.' }); return;
      }
      if (lat === undefined || lng === undefined) {
        res.status(400).json({ message: 'Unesi koordinate.' });
        return;
      }

      const latNum = parseFloat(String(lat));
      const lngNum = parseFloat(String(lng));

      if (isNaN(latNum) || isNaN(lngNum)) {
        res.status(400).json({ message: 'Koordinate moraju biti brojevi.' });
        return;
      }

      if (latNum < -90 || latNum > 90) {
        res.status(400).json({ message: 'Latituda mora biti u [-90,90].' });
        return;
      }
      if (lngNum < -180 || lngNum > 180) {
        res.status(400).json({ message: 'Longituda mora biti u [-180,180].' });
        return;
      }

      if (!Array.isArray(images) || images.length === 0) { res.status(400).json({ message: 'Dodaj bar jednu sliku.' }); return; }
      for (const p of images) {
        if (typeof p !== 'string' || !isLocalUploadPath(p)) { res.status(400).json({ message: 'Slike moraju biti JPG/PNG iz /uploads.' }); return; }
        const diskPath = webToDisk(p);
        if (!fs.existsSync(diskPath)) { res.status(400).json({ message: `Slika ${p} ne postoji.` }); return; }
      }

      if (!phone?.trim()) { res.status(400).json({ message: 'Telefon je obavezan.' }); return; }

      const amenitiesArr = Array.isArray(amenities)
        ? amenities.map((s: any) => String(s || '').trim()).filter(Boolean)
        : [];

      const data = {
        name: name.trim(),
        place: place.trim(),
        address: address.trim(),
        description: description.trim(),
        maxGuests,
        pricePerNightSummer,
        pricePerNightWinter,
        amenities: amenitiesArr,
        images,
        lat: latNum, lng: lngNum,
        owner: u.sub,
        isBlocked: false,
        phone: String(phone).trim()
      };

      const c = await Cabin.create(data);
      res.status(201).json(c);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri kreiranju vikendice.', error: err?.message });
    }
  };

  // POST /cabins/mine
  mine: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }
      const rows = await Cabin.find({ owner: u.sub }).sort({ createdAt: -1 });
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri dohvatanju vaših vikendica.', error: err?.message });
    }
  };

  // POST /cabins/:id/update
  update: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      const { id } = req.params;
      const c = await Cabin.findById(id);
      if (!c) { res.status(404).json({ message: 'Vikendica ne postoji.' }); return; }
      if (String(c.owner) !== String(u.sub)) { res.status(403).json({ message: 'Nije vaša vikendica.' }); return; }

      const {
        name, place, address, description,
        maxGuests, pricePerNightSummer, pricePerNightWinter,
        amenities, images, lat, lng, phone
      } = req.body || {};

      const patch: any = {};
      if (typeof name === 'string' && name.trim()) patch.name = name.trim();
      if (typeof description === 'string') patch.description = description.trim();
      if (typeof place === 'string' && place.trim()) patch.place = place.trim();
      if (typeof address === 'string' && address.trim()) patch.address = address.trim();
      if (typeof pricePerNightSummer === 'number' && pricePerNightSummer > 0) patch.pricePerNightSummer = pricePerNightSummer;
      if (typeof pricePerNightWinter === 'number' && pricePerNightWinter > 0) patch.pricePerNightWinter = pricePerNightWinter;
      if (typeof maxGuests === 'number' && maxGuests > 0) patch.maxGuests = maxGuests;
      if (Array.isArray(amenities)) patch.amenities = amenities.map((s: any) => String(s || '').trim()).filter(Boolean);

      if (Array.isArray(images)) {
        for (const p of images) {
          if (typeof p !== 'string' || !isLocalUploadPath(p)) { res.status(400).json({ message: 'Slike moraju biti JPG/PNG iz /uploads.' }); return; }
          const diskPath = webToDisk(p);
          if (!fs.existsSync(diskPath)) { res.status(400).json({ message: `Slika ${p} ne postoji.` }); return; }
        }
        patch.images = images;
      }

      if (typeof lat === 'number') {
        if (lat < -90 || lat > 90) { res.status(400).json({ message: 'Latituda mora biti u [-90,90].' }); return; }
        patch.lat = lat;
      }
      if (typeof lng === 'number') {
        if (lng < -180 || lng > 180) { res.status(400).json({ message: 'Longituda mora biti u [-180,180].' }); return; }
        patch.lng = lng;
      }
      if (typeof phone === 'string' && phone.trim()) patch.phone = String(phone).trim();

      if (Object.keys(patch).length === 0) { res.status(400).json({ message: 'Nema ništa za izmenu.' }); return; }

      await Cabin.findByIdAndUpdate(id, patch);
      res.json({ message: 'Vikendica izmenjena.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri izmeni vikendice.', error: err?.message });
    }
  };

  // POST /cabins/:id/delete
  remove: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      const { id } = req.params;

      const c = await Cabin.findById(id);
      if (!c) { res.status(404).json({ message: 'Vikendica ne postoji.' }); return; }
      if (String(c.owner) !== String(u.sub)) { res.status(403).json({ message: 'Nije vaša vikendica.' }); return; }

      const now = new Date();
      const busy = await Reservation.countDocuments({
        cabin: id,
        status: { $in: ['pending', 'accepted'] },
        dateFrom: { $gte: now }
      });

      if (busy > 0) { res.status(400).json({ message: 'Vikendica ima aktivne rezervacije.' }); return; }

      await Cabin.findByIdAndDelete(id);
      res.json({ message: 'Vikendica obrisana.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri brisanju vikendice.', error: err?.message });
    }
  };
}
