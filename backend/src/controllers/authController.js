const User = require('../models/User');
const Company = require('../models/Company');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendWelcomeCompanyEmail, sendPasswordResetEmail } = require('../services/emailService');
const logAuditAction = require('../utils/auditLogger');

// Generate JWT Helper
const generateTokens = (user) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables.');
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );

  return { token, refreshToken };
};

// Register Company & Admin User
const registerCompany = async (req, res, next) => {
  let createdCompany = null;
  try {
    const { companyName, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields to register.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists. Please sign in instead.',
      });
    }

    const slug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 10000);

    createdCompany = await Company.create({
      name: companyName,
      slug,
      apiKey: 'sh_live_' + crypto.randomBytes(16).toString('hex'),
    });

    const user = await User.create({
      name,
      email: cleanEmail,
      password,
      role: 'Company Admin',
      companyId: createdCompany._id,
      isVerified: true,
    });

    const { token, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    // Log Audit Event
    await logAuditAction({
      companyId: createdCompany._id,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'WORKSPACE_CREATED',
      entityType: 'Company',
      entityId: createdCompany._id.toString(),
      details: `Created new company workspace "${companyName}"`,
    });

    // Trigger Resend Welcome Email to Admin Work Email (non-blocking)
    sendWelcomeCompanyEmail(name, cleanEmail, companyName).catch((emailErr) => {
      console.error('[Welcome Email Notice]', emailErr.message);
    });

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        company: {
          id: createdCompany._id,
          name: createdCompany.name,
          slug: createdCompany.slug,
          plan: createdCompany.subscription.plan,
        },
      },
    });
  } catch (error) {
    if (createdCompany && createdCompany._id) {
      await Company.findByIdAndDelete(createdCompany._id).catch(() => {});
    }
    next(error);
  }
};

// Login User
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both your work email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail }).select('+password').populate('companyId');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password. Please verify your credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password. Please verify your credentials.' });
    }

    user.lastLogin = new Date();
    const { token, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    // Log Audit Event
    await logAuditAction({
      companyId: user.companyId?._id || user.companyId,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'UserSession',
      entityId: user._id.toString(),
      details: `User logged into dashboard session`,
    });

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        company: user.companyId
          ? {
              id: user.companyId._id,
              name: user.companyId.name,
              slug: user.companyId.slug,
              logoUrl: user.companyId.logoUrl,
              brandColor: user.companyId.brandColor,
              plan: user.companyId.subscription.plan,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get Current User Profile
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('companyId');
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        company: user.companyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update User Profile (Name, Avatar Image, Password)
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const { name, password } = req.body;
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';

    if (name) user.name = name;
    if (password) user.password = password;
    if (req.file) {
      user.avatar = `${serverUrl}/uploads/${req.file.filename}`;
    }

    await user.save();

    // Log Audit Event
    await logAuditAction({
      companyId: user.companyId,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'PROFILE_UPDATED',
      entityType: 'UserProfile',
      entityId: user._id.toString(),
      details: `Updated name and profile picture avatar`,
    });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        companyId: user.companyId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh Token
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Session refresh token is required.' });
    }

    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({ success: false, message: 'Server configuration error. Please contact support.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Security session expired. Please sign in again.' });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      token: tokens.token,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Security session expired. Please sign in again.' });
  }
};

// Request Password Reset Link (Sends Resend Email)
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please enter your work email address.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      // Return success for security obfuscation (prevents user enumeration)
      return res.status(200).json({
        success: true,
        message: 'If an account exists for this email, password reset instructions have been sent via email.',
      });
    }

    // Generate unhashed reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token & set expiration (1 hour)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save();

    // Trigger email with reset token
    await sendPasswordResetEmail(user.name, user.email, resetToken);

    // Audit log
    await logAuditAction({
      companyId: user.companyId?._id || user.companyId || user._id,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      entityType: 'UserAccount',
      entityId: String(user._id),
      details: `Requested password reset link for ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email! Please check your inbox.',
      // resetToken exposed only in development for testing
      ...(process.env.NODE_ENV !== 'production' && { resetToken }),
    });
  } catch (error) {
    next(error);
  }
};

// Reset Password via Token Link
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Hash incoming token to match DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset link.' });
    }

    // Update password (triggers bcrypt hashing in User.js pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Audit log
    await logAuditAction({
      companyId: user.companyId?._id || user.companyId || user._id,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'UserAccount',
      entityId: String(user._id),
      details: `Successfully reset password for ${user.email}`,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful! You may now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCompany,
  login,
  getMe,
  updateUserProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
};
