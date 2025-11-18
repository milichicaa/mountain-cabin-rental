import { Request, Response, RequestHandler } from 'express';
import { User } from '../models/User';
import path from 'path';
const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');
const webToDisk = (p: string) => path.join(uploadsRoot, p.replace(/^\/uploads[\\/]/, ''));
import fs from 'fs';

function isValidCardNumber(digits: string): boolean {
  if (/^(?:30[0-3]\d{11}|36\d{13}|38\d{13})$/.test(digits)) return true;
  if (/^5[1-5]\d{14}$/.test(digits)) return true;
  if (/^(?:4539|4556|4916|4532|4929|4485|4716)\d{12}$/.test(digits)) return true;
  return false;
}

export class UserController {
  // POST /users/me
  me: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const user = await User.findById(u.sub).select('-passwordHash');
      if (!user) { res.status(404).json({ message: 'Korisnik ne postoji.' }); return; }

      res.json(user);
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri dohvatanju profila.', error: err?.message });
    }
  };

  // POST /users/update
  updateProfile: RequestHandler = async (req: Request, res: Response) => {
    try {
      const u = (req as any).user;
      if (!u?.sub) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      let { firstName, lastName, email, address, phone, profileImagePath, cardNumber } = req.body || {};
      const update: any = {};

      if (typeof firstName === 'string') update.firstName = firstName.trim();
      if (typeof lastName === 'string')  update.lastName  = lastName.trim();
      if (typeof email === 'string')     update.email     = email.trim();
      if (typeof address === 'string')   update.address   = address.trim();

      if (typeof phone === 'string') {
        const phoneClean = phone.replace(/[^\d+]/g, '');
        if (phoneClean && !/^\+?\d{7,15}$/.test(phoneClean)) {
          res.status(400).json({ message: 'Neispravan format telefona.' }); return;
        }
        update.phone = phoneClean;
      }

      if (typeof profileImagePath === 'string' && profileImagePath.trim()) {
        const p = profileImagePath.trim();
        const okLocal = /^\/uploads\/.+\.(jpe?g|png)$/i.test(p);
        if (!okLocal) { res.status(400).json({ message: 'Slika mora biti JPG/PNG iz /uploads.' }); return; }
        const diskPath = webToDisk(p);
        if (!fs.existsSync(diskPath)) { res.status(400).json({ message: 'Slika ne postoji.' }); return; }

        update.profileImagePath = p;
      }

      if (typeof cardNumber === 'string' && cardNumber.trim().length) {
        const digits = cardNumber.replace(/\D/g, '');
        if (!isValidCardNumber(digits)) {
          res.status(400).json({ message: 'Kartica nije validna.' });
          return;
        }
        update.creditCardFull = digits;
      }

      if (Object.keys(update).length === 0) { res.status(400).json({ message: 'Nema ništa za izmenu.' }); return; }

      try {
        await User.findByIdAndUpdate(u.sub, update);
        const safe = await User.findById(u.sub).select('-passwordHash');
        res.json({ message: 'Profil ažuriran', user: safe });
      } catch (e: any) {
        if (e?.code === 11000) { res.status(400).json({ message: 'Email je već zauzet.' }); return; }
        throw e;
      }
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri ažuriranju profila.', error: err?.message });
    }
  };
}
