const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { validateIdParam } = require('../middleware/validation');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

const router = express.Router();
const prisma = new PrismaClient();

// Mock Stripe configuration (in production, use real Stripe)
const STRIPE_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 59,
    credits: 80,
    features: [
      '80 renders per month',
      '400 minutes source content',
      '3 preset styles',
      'MP4 + SRT export',
      'Email support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 99,
    credits: 240,
    features: [
      '240 renders per month',
      '1,200 minutes source content',
      'Team collaboration',
      'Priority processing',
      'Advanced analytics',
      'Priority support'
    ]
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 199,
    credits: 999999, // Unlimited
    features: [
      'Unlimited renders',
      'Unlimited source content',
      'White-label solution',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ]
  }
};

// Get available subscription plans
router.get('/plans',
  asyncHandler(async (req, res) => {
    const plans = Object.values(STRIPE_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      credits: plan.credits,
      features: plan.features,
      popular: plan.id === 'pro' // Mark Pro as popular
    }));

    res.json({
      success: true,
      data: { plans }
    });
  })
);

// Get user's current subscription and usage
router.get('/subscription',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        credits: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionId: true,
        billingCycle: true,
        nextBillingDate: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Get usage statistics
    const [projectCount, clipCount] = await Promise.all([
      prisma.project.count({
        where: { 
          userId: req.user.id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
          }
        }
      }),
      prisma.clip.count({
        where: { 
          project: { userId: req.user.id },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
          }
        }
      })
    ]);

    const currentPlan = STRIPE_PLANS[user.plan] || STRIPE_PLANS.starter;

    res.json({
      success: true,
      data: {
        subscription: {
          plan: user.plan || 'starter',
          status: user.subscriptionStatus || 'active',
          subscriptionId: user.subscriptionId,
          billingCycle: user.billingCycle || 'monthly',
          nextBillingDate: user.nextBillingDate
        },
        usage: {
          credits: user.credits,
          maxCredits: currentPlan.credits,
          projectsThisMonth: projectCount,
          clipsThisMonth: clipCount
        },
        plan: currentPlan
      }
    });
  })
);

// Create checkout session for subscription
router.post('/checkout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { planId, billingCycle = 'monthly' } = req.body;

    if (!planId || !STRIPE_PLANS[planId]) {
      throw new AppError('Invalid plan selected', 'INVALID_PLAN', 400);
    }

    const plan = STRIPE_PLANS[planId];
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Mock checkout session (in production, create real Stripe session)
    const sessionId = `cs_${Math.random().toString(36).substring(2, 15)}`;
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;

    // Store pending subscription
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        pendingPlan: planId,
        pendingBillingCycle: billingCycle
      }
    });

    res.json({
      success: true,
      message: 'Checkout session created',
      data: {
        sessionId,
        checkoutUrl,
        plan: {
          id: planId,
          name: plan.name,
          price: plan.price,
          billingCycle
        }
      }
    });
  })
);

// Handle successful payment (webhook simulation)
router.post('/webhook/payment-success',
  asyncHandler(async (req, res) => {
    const { sessionId, userId, planId } = req.body;

    if (!sessionId || !userId || !planId) {
      throw new AppError('Missing required fields', 'MISSING_FIELDS', 400);
    }

    const plan = STRIPE_PLANS[planId];
    if (!plan) {
      throw new AppError('Invalid plan', 'INVALID_PLAN', 400);
    }

    // Update user subscription
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: planId,
        subscriptionStatus: 'active',
        subscriptionId: `sub_${Math.random().toString(36).substring(2, 15)}`,
        credits: plan.credits === 999999 ? 999999 : plan.credits, // Set credits based on plan
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        pendingPlan: null,
        pendingBillingCycle: null
      }
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully'
    });
  })
);

// Cancel subscription
router.post('/cancel',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    if (!user.subscriptionId) {
      throw new AppError('No active subscription found', 'NO_SUBSCRIPTION', 400);
    }

    // In production, cancel Stripe subscription
    // await stripe.subscriptions.del(user.subscriptionId);

    // Update user record
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        subscriptionStatus: 'cancelled',
        // Keep plan active until end of billing period
        nextBillingDate: null
      }
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. Access will continue until the end of your billing period.'
    });
  })
);

// Purchase additional credits
router.post('/credits/purchase',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount < 10 || amount > 1000) {
      throw new AppError('Credit amount must be between 10 and 1000', 'INVALID_AMOUNT', 400);
    }

    const pricePerCredit = 0.50; // $0.50 per credit
    const totalPrice = amount * pricePerCredit;

    // Mock payment processing
    const paymentId = `pi_${Math.random().toString(36).substring(2, 15)}`;

    // Add credits to user account
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        credits: {
          increment: amount
        }
      }
    });

    res.json({
      success: true,
      message: `${amount} credits purchased successfully`,
      data: {
        paymentId,
        creditsAdded: amount,
        totalPrice,
        pricePerCredit
      }
    });
  })
);

// Get billing history
router.get('/history',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Mock billing history (in production, fetch from Stripe)
    const history = [
      {
        id: 'inv_001',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        description: 'Pro Plan - Monthly',
        amount: 99.00,
        status: 'paid',
        downloadUrl: '/api/billing/invoice/inv_001'
      },
      {
        id: 'inv_002',
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        description: 'Additional Credits (50)',
        amount: 25.00,
        status: 'paid',
        downloadUrl: '/api/billing/invoice/inv_002'
      }
    ];

    res.json({
      success: true,
      data: { history }
    });
  })
);

// Download invoice
router.get('/invoice/:id',
  authenticateToken,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Mock invoice download (in production, fetch from Stripe)
    res.json({
      success: true,
      message: 'Invoice download would be handled here',
      data: {
        invoiceId: id,
        downloadUrl: `https://files.stripe.com/invoices/${id}.pdf`
      }
    });
  })
);

// Update payment method
router.post('/payment-method',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      throw new AppError('Payment method ID is required', 'MISSING_PAYMENT_METHOD', 400);
    }

    // Mock payment method update (in production, update in Stripe)
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        paymentMethodId
      }
    });

    res.json({
      success: true,
      message: 'Payment method updated successfully'
    });
  })
);

module.exports = router;
