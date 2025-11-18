// src/server.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { uploadsRoot } from './utils/uploads';

// ⬇️ tvoje rute (napravi ove fajlove u src/routes/)
import authRouter from './routes/auth.router';
import userRouter from './routes/user.router';
import cabinRouter from './routes/cabin.router';
import reservationRouter from './routes/reservation.router';
import adminRouter from './routes/admin.router';
import reviewRouter from './routes/review.router';
import statsRouter from './routes/stats.router';
import fileRouter from './routes/file.router';

const app = express();

app.use(cors());

app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vikendica2025')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const router = express.Router();
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/cabins', cabinRouter);
router.use('/reservations', reservationRouter);
router.use('/reviews', reviewRouter);
router.use('/admin', adminRouter);
router.use('/stats', statsRouter);
router.use('/files', fileRouter);

app.use('/', router);

// Middleware za serviranje statičkih fajlova iz 'uploads' foldera
// Ovo omogućava da se slikama pristupa preko URL-a npr. http://localhost:4000/uploads/ime_slike.png
app.use('/uploads', express.static(uploadsRoot));

app.listen(4000, () => console.log('Express server running on port 4000'));
