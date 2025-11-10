import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/**
 * @desc    Register Patient
 * @route   POST /api/auth/register/patient
 * @access  Public
 */
export const registerPatient = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, city, postalCode, country, dateOfBirth, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'En bruker med denne e-postadressen eksisterer allerede',
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      country: country || 'Norge',
      dateOfBirth,
      password,
      role: 'patient',
      emailVerified: false,
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.firstName);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'Registrering fullført. Sjekk e-posten din for å bekrefte kontoen din.',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering patient',
      error: error.message,
    });
  }
};

/**
 * @desc    Register Specialist
 * @route   POST /api/auth/register/specialist
 * @access  Public
 */
export const registerSpecialist = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      dateOfBirth,
      password,
      medicalSpecialty,
      professionalSummary,
      workExperience,
      education,
      languages,
      profileImage,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'En bruker med denne e-postadressen eksisterer allerede',
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postalCode,
      country: country || 'Norge',
      dateOfBirth,
      password,
      role: 'specialist',
      emailVerified: false,
      medicalSpecialty: medicalSpecialty || '',
      professionalSummary: professionalSummary || '',
      workExperience: workExperience || [],
      education: education || [],
      languages: languages || [],
      profileImageUrl: profileImage || '',
      profileImageStatus: profileImage ? 'pending' : 'pending',
      cvStatus: 'pending',
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.firstName);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Don't fail registration if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'Registrering fullført. Sjekk e-posten din for å bekrefte kontoen din. CV-en din vil bli vurdert av admin.',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Specialist registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering specialist',
      error: error.message,
    });
  }
};

/**
 * @desc    Login User
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vennligst oppgi e-postadresse og passord',
      });
    }

    // Validate role if provided
    if (role && !['patient', 'specialist', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Ugyldig rolle spesifisert',
      });
    }

    // Check for user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ugyldig e-postadresse eller passord',
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Vennligst bekreft din e-postadresse før du logger inn. Sjekk e-posten din for bekreftelseslenken.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Kontoen din har blitt deaktivert. Vennligst kontakt administrator.',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Check if account is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Kontoen din har blitt blokkert. Vennligst kontakt administrator.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Ugyldig e-postadresse eller passord',
      });
    }

    // Validate role if provided - check if user's role matches the requested role
    if (role) {
      const roleMapping = {
        'patient': 'patient',
        'specialist': 'specialist',
        'admin': 'admin',
        'users': 'patient' // Frontend uses 'users' for patient
      };
      
      const expectedRole = roleMapping[role] || role;
      
      if (user.role !== expectedRole) {
        const roleNames = {
          'patient': 'pasient',
          'specialist': 'spesialist',
          'admin': 'admin'
        };
        const roleName = roleNames[expectedRole] || role;
        return res.status(403).json({
          success: false,
          message: `Denne kontoen har ikke ${roleName} tilgang. Vennligst logg inn fra riktig fane.`,
        });
      }
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Innlogging vellykket',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Feil ved innlogging',
      error: error.message,
    });
  }
};

/**
 * @desc    Verify Email
 * @route   GET /api/auth/verify-email
 * @access  Public
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Bekreftelseslenke er påkrevd',
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token and valid expiry
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Ugyldig eller utløpt bekreftelseslenke',
      });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'E-post bekreftet. Du kan nå logge inn.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Feil ved bekreftelse av e-post',
      error: error.message,
    });
  }
};

/**
 * @desc    Resend Verification Email
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.firstName);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Error sending verification email',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bekreftelses-e-post sendt',
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Feil ved gjenutsending av bekreftelses-e-post',
      error: error.message,
    });
  }
};

/**
 * @desc    Forgot Password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.firstName || 'User');
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpiry = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Feil ved sending av e-post for tilbakestilling av passord',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hvis en konto eksisterer med denne e-postadressen, er en tilbakestillingslenke sendt.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Feil ved behandling av glemt passord-forespørsel',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset Password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Lenke og passord er påkrevd',
      });
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token and valid expiry
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpiry: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Ugyldig eller utløpt tilbakestillingslenke',
      });
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Passord tilbakestilt. Du kan nå logge inn med ditt nye passord.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Feil ved tilbakestilling av passord',
      error: error.message,
    });
  }
};

/**
 * @desc    Get Current User
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          phone: user.phone || null,
          address: user.address || null,
          city: user.city || null,
          postalCode: user.postalCode || null,
          country: user.country || null,
          dateOfBirth: user.dateOfBirth || null,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message,
    });
  }
};

