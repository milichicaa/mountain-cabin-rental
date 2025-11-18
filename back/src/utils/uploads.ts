import fs from 'fs';
import path from 'path';

// Root folder za sve upload-e
export const uploadsRoot = path.resolve(__dirname, '..', '..', 'uploads');

// Kreira podfoldere za profile/cabins ako ne postoje
export function ensureUploadsDirs() {
  if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });

  const profiles = path.join(uploadsRoot, 'profiles');
  const cabins = path.join(uploadsRoot, 'cabins');

  if (!fs.existsSync(profiles)) fs.mkdirSync(profiles, { recursive: true });
  if (!fs.existsSync(cabins)) fs.mkdirSync(cabins, { recursive: true });

  return { profiles, cabins };
}

// Mapira web putanju (/uploads/...) na disk putanju
export function webToDisk(webPath: string) {
  const rel = String(webPath || '').replace(/^\/?uploads[\\/]/i, '');
  return path.join(uploadsRoot, rel);
}