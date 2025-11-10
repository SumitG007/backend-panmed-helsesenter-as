import User from '../models/User.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/emailService.js';

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res) => {
  try {
    const { status, role, search } = req.query;
    
    // Build query
    const query = {};
    
    if (status) {
      if (status === 'active') {
        query.isActive = true;
        query.isBlocked = false;
      } else if (status === 'inactive') {
        query.isActive = false;
      } else if (status === 'locked') {
        query.isBlocked = true;
      }
    }
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    const users = await User.find(query)
      .select('-password -emailVerificationToken -emailVerificationTokenExpiry -passwordResetToken -passwordResetTokenExpiry')
      .sort({ createdAt: -1 });
    
    // Transform users to match frontend format
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || 'Norge',
      status: user.isBlocked ? 'locked' : (user.isActive ? 'active' : 'inactive'),
      role: user.role === 'patient' ? 'users' : user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || null,
      loginAttempts: 0, // We don't track this currently
      emailVerified: user.emailVerified || false,
    }));
    
    res.status(200).json({
      success: true,
      data: {
        users: transformedUsers,
        total: transformedUsers.length,
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

/**
 * @desc    Get single user (Admin only)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -emailVerificationTokenExpiry -passwordResetToken -passwordResetTokenExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    const transformedUser = {
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || 'Norge',
      status: user.isBlocked ? 'locked' : (user.isActive ? 'active' : 'inactive'),
      role: user.role === 'patient' ? 'users' : user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || null,
      loginAttempts: 0,
      emailVerified: user.emailVerified || false,
    };
    
    res.status(200).json({
      success: true,
      data: {
        user: transformedUser,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

/**
 * @desc    Update user (Admin only)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating admin users' status
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.role === 'admin' && (updates.status || updates.isActive || updates.isBlocked)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot modify admin user status',
      });
    }
    
    // Map status to isActive and isBlocked
    if (updates.status) {
      if (updates.status === 'active') {
        updates.isActive = true;
        updates.isBlocked = false;
      } else if (updates.status === 'inactive') {
        updates.isActive = false;
        updates.isBlocked = false;
      } else if (updates.status === 'locked') {
        updates.isBlocked = true;
        updates.isActive = true;
      } else if (updates.status === 'suspended') {
        updates.isActive = false;
        updates.isBlocked = true;
      }
      delete updates.status;
    }
    
    // Remove fields that shouldn't be updated directly
    delete updates.password;
    delete updates.role; // Don't allow role changes via this endpoint
    delete updates._id;
    delete updates.id;
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -emailVerificationTokenExpiry -passwordResetToken -passwordResetTokenExpiry');
    
    const transformedUser = {
      id: updatedUser._id.toString(),
      firstName: updatedUser.firstName || '',
      lastName: updatedUser.lastName || '',
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      address: updatedUser.address || '',
      city: updatedUser.city || '',
      country: updatedUser.country || 'Norge',
      status: updatedUser.isBlocked ? 'locked' : (updatedUser.isActive ? 'active' : 'inactive'),
      role: updatedUser.role === 'patient' ? 'users' : updatedUser.role,
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin || null,
      loginAttempts: 0,
      emailVerified: updatedUser.emailVerified || false,
    };
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: transformedUser,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message,
    });
  }
};

/**
 * @desc    Reset user password (Admin only)
 * @route   POST /api/admin/users/:id/reset-password
 * @access  Private/Admin
 */
export const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
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
      return res.status(500).json({
        success: false,
        message: 'Error sending password reset email',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    console.error('Reset user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting user password',
      error: error.message,
    });
  }
};

/**
 * @desc    Send verification email (Admin only)
 * @route   POST /api/admin/users/:id/send-verification
 * @access  Private/Admin
 */
export const sendVerificationEmailToUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User email is already verified',
      });
    }
    
    // Generate verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.firstName || 'User');
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Error sending verification email',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: error.message,
    });
  }
};

