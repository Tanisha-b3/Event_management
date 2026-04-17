import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import http from 'http';

// ✅ Import routes correctly
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import ticketRoutes from './routes/ticket.js';
import notificationRoutes from './routes/notifications.js';
import emailRoutes from './routes/email.js';
import cartRoutes from './routes/cart.js';
import favoritesRoutes from './routes/favorites.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';

import { initializeSocket } from './socketHandler.js';
import { startReminderScheduler } from './services/eventReminderScheduler.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Initialize app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

// CORS: Allow frontend origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  "http://localhost:4173/",
  "http://localhost:5174",
  
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Initialize Socket.io
const io = initializeSocket(server, allowedOrigins);

// Make io available in routes
app.set('io', io);

app.get('/', (req, res) => { 
  res.send('EventPro API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/users', userRoutes);
app.use("/api/messages", messageRoutes);
app.use('/api/email', emailRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('WebSocket server initialized');
      
      startReminderScheduler(60 * 60 * 1000);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
