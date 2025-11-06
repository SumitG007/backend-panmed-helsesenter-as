import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: function() {
        return this.role !== 'admin';
      },
      trim: true,
    },
    lastName: {
      type: String,
      required: function() {
        return this.role !== 'admin';
      },
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['patient', 'specialist', 'admin'],
      required: true,
    },
    
    // Contact Information
    phone: {
      type: String,
      required: function() {
        return this.role !== 'admin';
      },
      trim: true,
    },
    address: {
      type: String,
      required: function() {
        return this.role !== 'admin';
      },
      trim: true,
    },
    city: {
      type: String,
      required: function() {
        return this.role !== 'admin';
      },
      trim: true,
    },
    postalCode: {
      type: String,
      required: function() {
        return this.role !== 'admin';
      },
      trim: true,
    },
    country: {
      type: String,
      default: 'Norge',
      trim: true,
    },
    
    // Personal Information
    dateOfBirth: {
      type: Date,
      required: function() {
        return this.role !== 'admin';
      },
    },
    
    // Email Verification
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationTokenExpiry: {
      type: Date,
      select: false,
    },
    
    // Password Reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetTokenExpiry: {
      type: Date,
      select: false,
    },
    
    // Specialist Specific Fields
    medicalSpecialty: {
      type: String,
      required: function() {
        return this.role === 'specialist';
      },
      trim: true,
    },
    professionalSummary: {
      type: String,
      trim: true,
    },
    workExperience: [
      {
        company: { type: String, trim: true },
        position: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        current: { type: Boolean, default: false },
        description: { type: String, trim: true },
      },
    ],
    education: [
      {
        institution: { type: String, trim: true },
        degree: { type: String, trim: true },
        field: { type: String, trim: true },
        startDate: { type: Date },
        endDate: { type: Date },
        gpa: { type: String, trim: true },
      },
    ],
    languages: [
      {
        language: { type: String, trim: true },
        proficiency: { type: String, trim: true },
      },
    ],
    
    // Specialist Verification Status
    cvStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    profileImageStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    profileImageUrl: {
      type: String,
      trim: true,
    },
    cvDocumentUrl: {
      type: String,
      trim: true,
    },
    
    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    
    // Timestamps
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.emailVerificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return token;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  this.passwordResetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return token;
};

// Method to clear password reset token
userSchema.methods.clearPasswordResetToken = function () {
  this.passwordResetToken = undefined;
  this.passwordResetTokenExpiry = undefined;
};

const User = mongoose.model('User', userSchema);

export default User;

