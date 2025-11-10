import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  sendVerificationEmailToUser,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication
router.use(protect);

// Check if user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
  next();
};

// User Management Routes
router.get('/users', adminOnly, getAllUsers);
router.get('/users/:id', adminOnly, getUserById);
router.put('/users/:id', adminOnly, updateUser);
router.post('/users/:id/reset-password', adminOnly, resetUserPassword);
router.post('/users/:id/send-verification', adminOnly, sendVerificationEmailToUser);

export default router;

