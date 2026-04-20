import express from 'express';

const router = express.Router();

import { sendEmail } from '../controllers/emailController.js';
import authMiddleware from '../middleware/Auth.js';

const { auth } = authMiddleware;

// POST /api/email
router.post('/', auth, sendEmail);

export default router;
