import express from 'express';
import {
  registerPatient,
  registerSpecialist,
  login,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
} from '../controllers/authController.js';
import {
  validatePatientRegistration,
  validateSpecialistRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/validation.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register/patient', validatePatientRegistration, registerPatient);
router.post('/register/specialist', validateSpecialistRegistration, registerSpecialist);
router.post('/login', validateLogin, login);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected routes
router.get('/me', protect, getMe);

export default router;

