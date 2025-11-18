import { Request, Response, RequestHandler } from 'express';
import { RegistrationRequest } from '../models/RegistrationRequest';
import { User } from '../models/User';
import Cabin from '../models/Cabin';
import type { PipelineStage } from 'mongoose';
import bcrypt from 'bcrypt';
import path from 'path';
import mongoose from 'mongoose';

/* AdminController — administracija (zahtevi, korisnici, vikendice)*/

// --- Pomoćne funkcije/konstante ---

// Provera validnosti MongoDB ObjectId
const isValidId = (id?: string) => mongoose.Types.ObjectId.isValid(String(id));

// Regex za lozinku (format iz zadatka)
const passRegex = /^(?=.{6,10}$)(?=(?:.*[a-z]){3,})(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].*$/;

// Default profilna za vlasnika (ako nije prosleđena)
const DEFAULT_OWNER_IMG = '/uploads/defaults/owner.jpg';

// Normalizacija telefona (čuvam samo cifre i +)
const normalizePhone = (p: any) => String(p || '').replace(/[^\d+]/g, '');

// Lokalna putanja do profilne (samo /uploads/profiles/*.jpg|png)
const isValidProfileImagePath = (p: string) => /^\/uploads\/profiles\/.+\.(jpe?g|png)$/i.test(p);

// Dozvoljeni role (admin se ne kreira ovde)
const validRole = (r: any) => ['turista', 'vlasnik'].includes(r);

// Case-insensitive exact match (po potrebi)
const ciExact = (s: string) => new RegExp(`^${s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}$`, 'i');

export class AdminController {
  // GET /admin/requests — lista svih zahteva (sort: najnoviji prvi)
  listRequests: RequestHandler = async (req: Request, res: Response) => {
    try {
      const list = await RegistrationRequest.find().sort({ createdAt: -1 });
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri listanju zahteva.', error: err?.message });
    }
  };

  // POST /admin/requests/:id/accept — admin prihvata zahtev, pravi User
  acceptRequest: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!isValidId(id)) { res.status(400).json({ message: 'ID nije validan.' }); return; }

      const r = await RegistrationRequest.findById(id);
      if (!r) { res.status(404).json({ message: 'Zahtev ne postoji.' }); return; }

      // Kolizija: username/email već postoje
      const uname = String(r.username).trim();
      const mail = String(r.email).trim().toLowerCase();
      const clash = await User.findOne({ $or: [{ username: uname }, { email: mail }] });
      if (clash) {
        const message = clash.username === uname ? 'Korisničko ime je zauzeto.' : 'Email je zauzet.';
        res.status(409).json({ message });
        return;
      }

      // Profilna slika — dobija default ako nema/ako je nevalidna putanja
      let profileImagePath = r.profileImagePath || '';
      if (r.role === 'vlasnik' && !profileImagePath) profileImagePath = DEFAULT_OWNER_IMG;
      if (profileImagePath && profileImagePath !== DEFAULT_OWNER_IMG && !isValidProfileImagePath(profileImagePath)) {
        profileImagePath = DEFAULT_OWNER_IMG;
      }

      // Kreiranje korisnika iz zahteva (passwordHash preuzet)
      const u = await User.create({
        username: uname,
        email: mail,
        passwordHash: r.passwordHash,
        firstName: r.firstName,
        lastName: r.lastName,
        gender: r.gender,
        address: r.address,
        phone: normalizePhone(r.phone),
        profileImagePath,
        creditCardMasked: r.creditCardMasked,
        role: r.role,
        active: true,
        creditCardFull: r.creditCardFull
      });

      // Obeleži zahtev kao accepted
      r.status = 'accepted';
      await r.save();

      res.json({ message: 'Prihvaćen', id: u._id });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri prihvatanju zahteva.', error: err?.message });
    }
  };

  // POST /admin/requests/:id/reject — admin odbija zahtev (čuvam reason)
  rejectRequest: RequestHandler = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      if (!isValidId(id)) { res.status(400).json({ message: 'Nevalidan id zahteva.' }); return; }

      const r = await RegistrationRequest.findById(id);
      if (!r) { res.status(404).json({ message: 'Nema zahteva.' }); return; }

      r.status = 'rejected';
      r.reason = req.body?.reason || 'Nije navedeno';
      await r.save();

      res.json({ message: 'Odbijen' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri odbijanju zahteva.', error: err?.message });
    }
  };

  // POST /admin/cabins/:id/block — blokiraj vikendicu na 48h
  blockCabin: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) { res.status(400).json({ message: 'Nevalidan id.' }); return; }

      const until = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const updated = await Cabin.findByIdAndUpdate(id, { blockedUntil: until }, { new: true });
      if (!updated) { res.status(404).json({ message: 'Vikendica ne postoji.' }); return; }

      res.json({ message: 'Vikendica blokirana na 48h.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri blokiranju vikendice.', error: err?.message });
    }
  };

  // POST /admin/cabins/:id/unblock — ukloni blokadu
  unblockCabin: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) { res.status(400).json({ message: 'Nevalidan id.' }); return; }

      const updated = await Cabin.findByIdAndUpdate(id, { blockedUntil: null }, { new: true });
      if (!updated) { res.status(404).json({ message: 'Vikendica ne postoji.' }); return; }

      res.json({ message: 'Vikendica odblokirana.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri odblokiranju vikendice.', error: err?.message });
    }
  };

  // GET /admin/users — svi korisnici (bez passwordHash)
  listUsers: RequestHandler = async (req: Request, res: Response) => {
    try {
      const rows = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri listanju korisnika.', error: err?.message });
    }
  };

  // POST /admin/users/:id/activate — aktiviraj nalog (ne i admin)
  activateUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) { res.status(400).json({ message: 'Nevalidan id.' }); return; }

      const u = await User.findById(id);
      if (!u) { res.status(404).json({ message: 'Korisnik ne postoji.' }); return; }
      if (u.role === 'admin') { res.status(400).json({ message: 'Ne možeš menjati status admin naloga.' }); return; }

      await User.findByIdAndUpdate(id, { active: true });
      res.json({ message: 'Korisnik aktiviran.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri aktivaciji korisnika.', error: err?.message });
    }
  };

  // POST /admin/users/:id/deactivate — deaktiviraj nalog (ne i admin)
  deactivateUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) { res.status(400).json({ message: 'Nevalidan id.' }); return; }

      const u = await User.findById(id);
      if (!u) { res.status(404).json({ message: 'Korisnik ne postoji.' }); return; }
      if (u.role === 'admin') { res.status(400).json({ message: 'Ne možeš menjati status admin naloga.' }); return; }

      await User.findByIdAndUpdate(id, { active: false });
      res.json({ message: 'Korisnik deaktiviran.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri deaktivaciji korisnika.', error: err?.message });
    }
  };

  // GET /admin/cabins — lista + poslednje 3 ocene i indikator loših 3
  listCabins: RequestHandler = async (req: Request, res: Response) => {
    try {
      // Agregacija: poslednje 3 recenzije, niz ocena i indikator "low3"
      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: 'reviews',
            let: { cid: '$_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$cabin', '$$cid'] } } },
              { $sort: { createdAt: -1 as -1 } },
              { $limit: 3 },
              { $project: { _id: 0, rating: 1, createdAt: 1 } }
            ],
            as: 'last3'
          }
        },
        {
          $addFields: {
            last3Ratings: { $map: { input: '$last3', as: 'r', in: '$$r.rating' } }
          }
        },
        {
          $addFields: {
            low3: {
              $and: [
                { $eq: [{ $size: '$last3Ratings' }, 3] },
                { $lt: [{ $max: '$last3Ratings' }, 2] }
              ]
            }
          }
        },
        {
          $project: {
            name: 1,
            place: 1,
            pricePerNightWinter: 1,
            pricePerNightSummer: 1,
            blockedUntil: 1,
            createdAt: 1,
            last3: 1,
            low3: 1
          }
        },
        { $sort: { createdAt: -1 as -1 } }
      ];

      const data = await Cabin.aggregate(pipeline);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri listanju vikendica.', error: err?.message });
    }
  };

  // POST /admin/users — kreiraj korisnika (turista/owner)
  createUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const {
        username, email, password, firstName, lastName, gender, address, phone, role, profileImagePath
      } = req.body;

      // Obavezna polja
      if (!username || !email || !password || !firstName || !lastName || !gender || !address || !phone || !role) { res.status(400).json({ message: 'Sva polja su obavezna.' }); return; }

      const uname = String(username).trim();
      const mail = String(email).trim().toLowerCase();
      const phoneClean = normalizePhone(phone);

      if (!validRole(role)) { res.status(400).json({ message: 'Role mora biti turista ili vlasnik.' }); return; }
      if (!passRegex.test(String(password))) { res.status(400).json({ message: 'Lozinka nije u traženom formatu.' }); return; }

      // Kolizija username/email
      const clash = await User.findOne({ $or: [{ username: uname }, { email: mail }] });
      if (clash) {
        const message = clash.username === uname ? 'Korisničko ime je zauzeto.' : 'Email je zauzet.';
        res.status(409).json({ message });
        return;
      }

      // Hash lozinke i upis
      const passwordHash = await bcrypt.hash(String(password), 10);

      const u = await User.create({
        username: uname,
        email: mail,
        passwordHash,
        firstName,
        lastName,
        gender,
        address,
        phone: phoneClean,
        role,
        profileImagePath: profileImagePath,
        active: true
      });

      res.status(201).json({ message: 'Korisnik kreiran.', id: u._id });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri kreiranju korisnika.', error: err?.message });
    }
  };

  // PUT /admin/users/:id — izmena korisnika (bez admina)
  updateUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) { res.status(400).json({ message: 'Nevalidan id.' }); return; }

      const { username, firstName, lastName, email, address, phone, role, gender, newPassword, profileImagePath } = req.body;

      const u = await User.findById(id);
      if (!u) { res.status(404).json({ message: 'Korisnik ne postoji.' }); return; }
      if (u.role === 'admin') { res.status(400).json({ message: 'Ne možeš menjati admin nalog.' }); return; }

      const patch: any = {};

      // promena username-a (case-sensitive), uz proveru kolizije
      if (username !== undefined) {
        const uname = String(username).trim();
        if (!uname) { res.status(400).json({ message: 'Korisničko ime ne može biti prazno.' }); return; }
        const clashUser = await User.findOne({ _id: { $ne: id }, username: uname });
        if (clashUser) { res.status(409).json({ message: 'Korisničko ime je zauzeto.' }); return; }
        // (opciono) blok pending RR sa istim username-om
        // const rrClash = await RegistrationRequest.findOne({ username: uname, status: 'pending' });
        // if (rrClash) { res.status(409).json({ message: 'Korisničko ime je u pending registraciji.' }); return; }
        patch.username = uname;
      }

      if (email !== undefined) {
        const mail = String(email).trim().toLowerCase();
        const clash = await User.findOne({ _id: { $ne: id }, email: mail });
        if (clash) { res.status(409).json({ message: 'Email je zauzet.' }); return; }
        patch.email = mail;
      }

      if (role !== undefined) {
        if (!validRole(role)) { res.status(400).json({ message: 'Role mora biti turista ili vlasnik.' }); return; }
        patch.role = role;
      }

      if (firstName !== undefined) patch.firstName = firstName;
      if (lastName !== undefined) patch.lastName = lastName;
      if (gender !== undefined) patch.gender = gender;
      if (address !== undefined) patch.address = address;
      if (phone !== undefined) patch.phone = normalizePhone(phone);

      if (newPassword) {
        if (!passRegex.test(String(newPassword))) { res.status(400).json({ message: 'Nova lozinka nije u traženom formatu.' }); return; }
        patch.passwordHash = await bcrypt.hash(String(newPassword), 10);
      }

      if (profileImagePath !== undefined) {
        const imgPath = String(profileImagePath).trim();
        if (imgPath) {
          if (!isValidProfileImagePath(imgPath)) { res.status(400).json({ message: 'Slika mora biti JPG/PNG iz /uploads/profiles (bez eksternih linkova).' }); return; }
          patch.profileImagePath = imgPath;
        }
      }

      await User.findByIdAndUpdate(id, patch);
      res.json({ message: 'Korisnik ažuriran.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri ažuriranju korisnika.', error: err?.message });
    }
  };

  // DELETE /admin/users/:id — obriši korisnika (ne i admin)
  deleteUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) { res.status(400).json({ message: 'Nevalidan id.' }); return; }

      const u = await User.findById(id);
      if (!u) { res.status(404).json({ message: 'Korisnik ne postoji.' }); return; }
      if (u.role === 'admin') { res.status(400).json({ message: 'Ne možeš obrisati admin nalog.' }); return; }

      await User.findByIdAndDelete(id);
      res.json({ message: 'Korisnik obrisan.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri brisanju korisnika.', error: err?.message });
    }
  };
}
