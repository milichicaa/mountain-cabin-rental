// src/routes/file.router.ts
import express, { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ensureUploadsDirs } from '../utils/uploads';

const fileRouter = express.Router();

const { profiles, cabins } = ensureUploadsDirs();
const profilesDir = profiles;
const cabinsDir = cabins;

// Zajednički filter (samo jpg/png)
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ok = /image\/(jpeg|png)/i.test(file.mimetype) || /\.(jpe?g|png)$/i.test(file.originalname);
  cb(null, ok);
};

// PROFILNE SLIKE (ograničenja dimenzija)
const storageProfiles = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profilesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const uploadProfile = multer({
  storage: storageProfiles,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// VIKENDICE SLIKE (bez ograničenja dimenzija)
const storageCabins = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, cabinsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const uploadCabin = multer({
  storage: storageCabins,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // veći limit po potrebi
});

// PROFIL: POST /files/uploadProfile (zadržavamo dimenzije 100–300px)
fileRouter.post('/uploadProfile', uploadProfile.single('file'), async (req: Request, res: Response): Promise<void> => {
  const filename = req.file?.filename;
  if (!filename) { res.status(400).json({ message: 'Fajl nije primljen ili tip nije dozvoljen (JPG/PNG).' }); return; }

  const absPath = path.join(profilesDir, filename);
  try {
    const meta = await sharp(absPath).metadata();
    const w = meta.width || 0, h = meta.height || 0;
    if (w < 100 || h < 100 || w > 300 || h > 300) {
      try { fs.unlinkSync(absPath); } catch {}
      res.status(400).json({ message: 'Profilna slika mora biti između 100x100 i 300x300 px.' });
      return;
    }
  } catch {
    try { fs.unlinkSync(absPath); } catch {}
    res.status(400).json({ message: 'Neuspešno čitanje slike.' });
    return;
  }
  res.json({ path: `/uploads/profiles/${filename}` });
});

// VIKENDICA: POST /files/uploadCabin (bez provere dimenzija)
fileRouter.post('/uploadCabin', uploadCabin.single('file'), async (req: Request, res: Response): Promise<void> => {
  const filename = req.file?.filename;
  if (!filename) { res.status(400).json({ message: 'Fajl nije primljen ili tip nije dozvoljen (JPG/PNG).' }); return; }
  res.json({ path: `/uploads/cabins/${filename}` });
});

export default fileRouter;
