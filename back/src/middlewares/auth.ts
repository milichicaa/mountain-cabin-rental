import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

// Tajna reč za JWT 
const JWT_SECRET = 'dev-secret';

// Payload iz tokena
export type JWTPayload = {
  sub: string;
  role: 'turista' | 'vlasnik' | 'admin';
  username: string;
  iat?: number;
  exp?: number;
};

// Middleware: provera da li je korisnik ulogovan (validan JWT)
export const authOnly: RequestHandler = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Nedostaje token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Neispravan ili istekao token' });
    return;
  }
};

// Middleware: provera uloge (npr. mustBe('admin'))
export const mustBe =
  (...roles: Array<'turista' | 'vlasnik' | 'admin'>): RequestHandler =>
  (req, res, next) => {
    const u = (req as any).user as JWTPayload | undefined;
    if (!u || !roles.includes(u.role)) {
      res.status(403).json({ message: 'Zabranjeno' });
      return;
    }
    next();
  };

// Izdavanje tokena (2h)
export const issueToken = (u: { _id: any; role: 'turista' | 'vlasnik' | 'admin'; username: string }) =>
  jwt.sign({ sub: String(u._id), role: u.role, username: u.username }, JWT_SECRET, { expiresIn: '2h' });
