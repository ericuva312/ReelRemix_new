const express = require('express');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validatePasswordChange, 
  validateProfileUpdate 
} = require('../middleware/validation');
const { 
  authLimiter, 
  createAccountLimiter, 
  passwordResetLimiter 
} = require('../middleware/rateLimiter');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Helper function to verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Helper function to generate user ID
const generateUserId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// User signup
router.post('/signup', 
  createAccountLimiter,
  validateUserRegistration,
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 'USER_EXISTS', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        id: generateUserId(),
        name,
        email,
        password: hashedPassword,
        credits: 100, // Give new users 100 credits
      },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user,
        token
      }
    });
  })
);

// User signin
router.post('/signin',
  authLimiter,
  validateUserLogin,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }

    // Generate JWT token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Signed in successfully',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  })
);

// Get user profile
router.get('/profile',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  })
);

// Update user profile
router.put('/profile',
  authenticateToken,
  validateProfileUpdate,
  asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: req.user.id }
        }
      });

      if (existingUser) {
        throw new AppError('Email is already taken', 'EMAIL_TAKEN', 409);
      }
      updateData.email = email;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  })
);

// Change password
router.put('/password',
  authenticateToken,
  validatePasswordChange,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 'INVALID_PASSWORD', 400);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  })
);

// Refresh token
router.post('/refresh',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Generate new token
    const token = generateToken(req.user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token }
    });
  })
);

// Sign out (client-side token removal)
router.post('/signout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // In a more sophisticated setup, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  })
);

// Get user stats
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const [projectCount, clipCount] = await Promise.all([
      prisma.project.count({
        where: { userId: req.user.id }
      }),
      prisma.clip.count({
        where: { 
          project: { userId: req.user.id }
        }
      })
    ]);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { credits: true }
    });

    res.json({
      success: true,
      data: {
        projects: projectCount,
        clips: clipCount,
        credits: user?.credits || 0
      }
    });
  })
);

module.exports = router;
