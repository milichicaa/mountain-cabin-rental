import { Request, Response, RequestHandler } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { User } from '../models/User';
import { RegistrationRequest } from '../models/RegistrationRequest';
import { issueToken } from '../middlewares/auth';
import fs from 'fs';
import path from 'path';
import { webToDisk } from '../utils/uploads';

// Konstante i regex-i
const DEFAULT_OWNER_IMG = '/uploads/defaults/owner.jpg';
const passRegex = /^(?=.{6,10}$)(?=(?:.*[a-z]){3,})(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z].*$/;
const maskedRe = /^\*{4}\s\*{4}\s\*{4}\s\d{4}$/;

// Helperi
const normalizePhone = (phone: any) => String(phone || '').replace(/[^\d+]/g, '');
const isUploadPath = (p: string) => /^\/uploads\/.+\.(jpe?g|png)$/i.test(p);

export class AuthController {
  loginValidators = [body('username').notEmpty(), body('password').notEmpty()];

  // POST /auth/login — javni login (turist/owner)
  publicLogin: RequestHandler = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

      const { username, password } = req.body;
      const uname = String(username || '').trim();

      const user = await User.findOne({ username: uname });
      if (!user) {
        const pending = await RegistrationRequest.findOne({ username: uname, status: 'pending' });
        if (pending) {
          res.status(403).json({ message: 'Zahtev na čekanju.', code: 'REGISTRATION_PENDING' });
          return;
        }
        res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka.' });
        return;
      }

      if (!user.active) { res.status(403).json({ message: 'Nalog je deaktiviran.', code: 'USER_INACTIVE' }); return; }

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) { res.status(401).json({ message: 'Pogrešno korisničko ime ili lozinka.' }); return; }

      if (user.role === 'admin') { res.status(403).json({ message: 'Admin koristi zaseban login.', code: 'ADMIN_USE_SEPARATE_LOGIN' }); return; }

      const token = issueToken(user);
      res.json({ token, role: user.role, username: user.username });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri loginu.', error: err?.message });
    }
  };

  // POST /auth/admin/login — admin login
  adminLogin: RequestHandler = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

      const { username, password } = req.body;
      const uname = String(username || '').trim();

      const user = await User.findOne({ username: uname });
      if (!user) { res.status(401).json({ message: 'Pogrešni kredencijali.' }); return; }

      const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
      if (!ok) { res.status(401).json({ message: 'Pogrešni kredencijali.' }); return; }
      if (user.role !== 'admin') { res.status(403).json({ message: 'Niste administrator.' }); return; }
      if (!user.active) { res.status(403).json({ message: 'Admin nalog je deaktiviran.' }); return; }

      const token = issueToken(user);
      res.json({ token, role: user.role, username: user.username });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri admin loginu.', error: err?.message });
    }
  };

  // POST /auth/register — kreira RegistrationRequest
  register: RequestHandler = async (req: Request, res: Response) => {
    try {
      const {
        username, email, password, firstName, lastName, gender, address, phone,
        role, profileImagePath, creditCardMasked, creditCardFull
      } = req.body;

      if (role !== 'turista' && role !== 'vlasnik') { res.status(400).json({ message: 'Uloga mora biti turista ili vlasnik.' }); return; }
      if (!passRegex.test(String(password))) { res.status(400).json({ message: 'Lozinka nije u traženom formatu.' }); return; }
      if (!maskedRe.test(String(creditCardMasked))) { res.status(400).json({ message: 'Kartica mora biti u formatu **** **** **** 1234.' }); return; }

      const uname = String(username || '').trim();
      const mail = String(email || '').trim().toLowerCase();
      const phoneClean = normalizePhone(phone);

      const rejectedExists = await RegistrationRequest.findOne({
        status: 'rejected',
        $or: [{ username: uname }, { email: mail }]
      });
      if (rejectedExists) { res.status(409).json({ message: 'Korisničko ime ili email su ranije odbijeni.' }); return; }

      const existsUser = await User.findOne({ $or: [{ username: uname }, { email: mail }] });
      if (existsUser) { res.status(409).json({ message: 'Korisničko ime ili email su zauzeti.' }); return; }

      const existsPending = await RegistrationRequest.findOne({
        status: 'pending',
        $or: [{ username: uname }, { email: mail }]
      });
      if (existsPending) { res.status(409).json({ message: 'Već postoji pending zahtev sa ovim podacima.' }); return; }

      let finalProfile = String(profileImagePath || '').trim();
      if (!finalProfile) {
        finalProfile = DEFAULT_OWNER_IMG;
      } else {
        if (!isUploadPath(finalProfile)) { res.status(400).json({ message: 'Slika mora biti iz /uploads (JPG/PNG).' }); return; }
        const diskPath = webToDisk(finalProfile);
        if (!fs.existsSync(diskPath)) { res.status(400).json({ message: 'Slika ne postoji na serveru.' }); return; }
      }

      if (!username || !email || !password || !firstName || !lastName || !gender || !address || !phone || !role || !creditCardMasked) {
        res.status(400).json({ message: 'Sva polja su obavezna.' }); return;
      }

      const passwordHash = await bcrypt.hash(String(password), 10);
      const reqDoc = await RegistrationRequest.create({
        username: uname,
        email: mail,
        passwordHash,
        firstName: String(firstName || '').trim(),
        lastName: String(lastName || '').trim(),
        gender,
        address,
        phone: phoneClean,
        role,
        profileImagePath: finalProfile,
        creditCardMasked,
        status: 'pending',
        creditCardFull,
      });

      res.status(201).json({ message: 'Zahtev poslat', id: reqDoc._id });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri registraciji.', error: err?.message });
    }
  };

  // POST /auth/change-password — promena lozinke
  changePassword: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword, newPasswordRepeat } = req.body;
      const userId = (req as any).user?.sub;
      if (!userId) { res.status(401).json({ message: 'Niste autentifikovani.' }); return; }

      const user = await User.findById(userId);
      if (!user) { res.status(404).json({ message: 'Korisnik ne postoji.' }); return; }

      const ok = await bcrypt.compare(String(oldPassword), user.passwordHash);
      if (!ok) { res.status(400).json({ message: 'Stara lozinka nije tačna.' }); return; }
      if (!oldPassword || !newPassword || !newPasswordRepeat) { res.status(400).json({ message: 'Sva tri polja su obavezna.' }); return; }
      if (newPassword !== newPasswordRepeat) { res.status(400).json({ message: 'Nova lozinka i ponovljena nisu iste.' }); return; }
      if (newPassword === oldPassword) { res.status(400).json({ message: 'Stara i nova lozinka ne smeju biti iste.' }); return; }
      if (!passRegex.test(String(newPassword))) { res.status(400).json({ message: 'Nova lozinka nije u traženom formatu.' }); return; }

      user.passwordHash = await bcrypt.hash(String(newPassword), 10);
      await user.save();
      res.json({ message: 'Lozinka promenjena. Prijavite se ponovo.' });
    } catch (err: any) {
      res.status(500).json({ message: 'Greška pri promeni lozinke.', error: err?.message });
    }
  };
}