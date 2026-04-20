import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import logger from './utils/logger.js';
import { requestLogger, errorLogger } from './middleware/requestLogger.js';
import mongoose from 'mongoose';
import cors from 'cors';
import { apiLimiter } from './middleware/rateLimiter.js';
import http from 'http';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import ticketRoutes from './routes/ticket.js';
import notificationRoutes from './routes/notifications.js';
import emailRoutes from './routes/email.js';
import cartRoutes from './routes/cart.js';
import favoritesRoutes from './routes/favorites.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import discussionRoutes from './routes/discussions.js';

import socketHandler from './socketHandler.js';
import cron from './services/eventReminderScheduler.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
// if (process.env.NODE_ENV === 'development') {

//   const logsDir = path.join('logs');

//   if (!fs.existsSync(logsDir)) {
//     fs.mkdirSync(logsDir, { recursive: true });
//   }
// }

// Initialize app
const app = express();
const server = http.createServer(app);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Security middleware
app.use(helmet());

// Request logging middleware
app.use(requestLogger);



// Body parser
app.use(express.json());

// CORS: Allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  "http://localhost:4173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Simple CORS - allow all in development
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Handle preflight
app.options('*', cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

 

// Initialize Socket.io
const io = socketHandler.initializeSocket(server, allowedOrigins);

// Make io available in routes
app.set('io', io);


app.get('/', (req, res) => { 
  logger.info('Health check route hit');
  res.send('EventPro API is running');
});

// Routes
// Rate limiting middleware (apply to all API routes)
app.use('/api/', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/users', userRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/email', emailRoutes);


// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error logging middleware (should be after all routes)
app.use(errorLogger);



import { initQueue } from './jobs/queue.js';

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    logger.info('MongoDB Connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, async () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info('WebSocket server initialized');
      cron.startReminderScheduler(60 * 60 * 1000);
      await initQueue();
    });
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });
