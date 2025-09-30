import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import BillingService, { PlanType, PLAN_CONFIGS } from '../services/billing'
import StripeService from '../services/stripe'
import { authenticateUser } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = Router()

// Validation middleware
const validateRequest = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}

/**
 * GET /billing/plans
 * Get available subscription plans
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
      id: key,
      name: config.name,
      limits: config.limits,
    }))

    res.json({ plans })
  } catch (error) {
    logger.error('Error fetching plans', { error })
    res.status(500).json({ error: 'Failed to fetch plans' })
  }
})

/**
 * GET /billing/usage
 * Get current user's usage and plan info
 */
router.get('/usage', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id
    const planInfo = await BillingService.getUserPlanInfo(userId)

    res.json(planInfo)
  } catch (error) {
    logger.error('Error fetching user usage', { error, userId: req.user?.id })
    res.status(500).json({ error: 'Failed to fetch usage information' })
  }
})

/**
 * POST /billing/checkout
 * Create checkout session for subscription
 */
router.post(
  '/checkout',
  authenticateUser,
  [
    body('planType').isIn(Object.keys(PLAN_CONFIGS)).withMessage('Invalid plan type'),
    body('successUrl').isURL().withMessage('Valid success URL required'),
    body('cancelUrl').isURL().withMessage('Valid cancel URL required'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { planType, successUrl, cancelUrl } = req.body
      const userId = req.user.id

      const session = await BillingService.createCheckoutSession(
        userId,
        planType as PlanType,
        successUrl,
        cancelUrl
      )

      res.json(session)
    } catch (error) {
      logger.error('Error creating checkout session', { error, userId: req.user?.id })
      res.status(500).json({ error: 'Failed to create checkout session' })
    }
  }
)

/**
 * POST /billing/portal
 * Create customer portal session
 */
router.post(
  '/portal',
  authenticateUser,
  [body('returnUrl').isURL().withMessage('Valid return URL required')],
  validateRequest,
  async (req, res) => {
    try {
      const { returnUrl } = req.body
      const userId = req.user.id

      const session = await BillingService.createPortalSession(userId, returnUrl)

      res.json(session)
    } catch (error) {
      logger.error('Error creating portal session', { error, userId: req.user?.id })
      res.status(500).json({ error: 'Failed to create portal session' })
    }
  }
)

/**
 * PUT /billing/subscription
 * Update subscription plan
 */
router.put(
  '/subscription',
  authenticateUser,
  [body('planType').isIn(Object.keys(PLAN_CONFIGS)).withMessage('Invalid plan type')],
  validateRequest,
  async (req, res) => {
    try {
      const { planType } = req.body
      const userId = req.user.id

      await BillingService.updateSubscription(userId, planType as PlanType)

      res.json({ success: true, message: 'Subscription updated successfully' })
    } catch (error) {
      logger.error('Error updating subscription', { error, userId: req.user?.id })
      res.status(500).json({ error: 'Failed to update subscription' })
    }
  }
)

/**
 * DELETE /billing/subscription
 * Cancel subscription
 */
router.delete('/subscription', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id

    await BillingService.cancelSubscription(userId)

    res.json({ success: true, message: 'Subscription cancelled successfully' })
  } catch (error) {
    logger.error('Error cancelling subscription', { error, userId: req.user?.id })
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

/**
 * POST /billing/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  try {
    // Verify webhook signature
    const event = StripeService.constructWebhookEvent(
      req.body,
      signature,
      webhookSecret
    )

    // Handle the event
    await BillingService.handleStripeWebhook(event)

    res.json({ received: true })
  } catch (error) {
    logger.error('Webhook signature verification failed', { error })
    res.status(400).json({ error: 'Webhook signature verification failed' })
  }
})

/**
 * GET /billing/invoices
 * Get user's invoice history
 */
router.get('/invoices', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Get user's Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    })

    if (!user?.stripeCustomerId) {
      return res.json({ invoices: [] })
    }

    // Fetch invoices from Stripe
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 20,
    })

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
    }))

    res.json({ invoices: formattedInvoices })
  } catch (error) {
    logger.error('Error fetching invoices', { error, userId: req.user?.id })
    res.status(500).json({ error: 'Failed to fetch invoices' })
  }
})

/**
 * POST /billing/check-limits
 * Check if user can perform an action
 */
router.post(
  '/check-limits',
  authenticateUser,
  [
    body('action').isIn(['render', 'upload']).withMessage('Invalid action'),
    body('additionalMinutes').optional().isNumeric().withMessage('Additional minutes must be numeric'),
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { action, additionalMinutes } = req.body
      const userId = req.user.id

      const result = await BillingService.canUserPerformAction(
        userId,
        action,
        additionalMinutes
      )

      res.json(result)
    } catch (error) {
      logger.error('Error checking user limits', { error, userId: req.user?.id })
      res.status(500).json({ error: 'Failed to check limits' })
    }
  }
)

export default router
