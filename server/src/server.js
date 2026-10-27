import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import { notFound, errorHandler } from './middleware/errors.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'sprintboard-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', taskRoutes);
app.use(notFound);
app.use(errorHandler);


const port = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is missing');
}

// reuse the DB connection across serverless calls
let conn = null;
async function connectDB() {
  if (!conn) conn = mongoose.connect(process.env.MONGODB_URI);
  return conn;
}
app.use(async (_req, _res, next) => {
  try { await connectDB(); next(); } catch (err) { next(err); }
});

// only start a server locally, Vercel runs the exported app
if (!process.env.VERCEL) {
  connectDB().then(() => app.listen(port, () => console.log(`API on ${port}`)));
}

export default app;