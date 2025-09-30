import { PrismaClient } from '@prisma/client'
import StripeService from './stripe'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export interface PlanLimits {
  renders: number
  minutes: number
  seats: number
  storage: number // GB
}

export interface UsageData {
  renders: number
  minutes: number
  storage: number
}

export const PLAN_CONFIGS = {
  starter: {
    name: 'Starter',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID!,
    limits: {
      renders: 80,
      minutes: 400,
      seats: 1,
      storage: 5,
    },
  },
  pro: {
    name: 'Pro',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID!,
    limits: {
      renders: 240,
      minutes: 1200,
      seats: 3,
      storage: 25,
    },
  },
  business: {
    name: 'Business',
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID!,
    limits: {
      renders: -1, // unlimited
      minutes: -1, // unlimited
      seats: -1, // unlimited
      storage: 100,
    },
  },
} as const

export type PlanType = keyof typeof PLAN_CONFIGS

export class BillingService {
  /**
   * Create a new subscription for a user
   */
  static async createSubscription(
    userId: string,
    planType: PlanType,
    customerEmail: string
  ): Promise<{ subscriptionId: string; clientSecret?: string }> {
    try {
      // Get or create Stripe customer
      let customer = await this.getOrCreateStripeCustomer(userId, customerEmail)

      // Create subscription
      const subscription = await StripeService.createSubscription({
        customerId: customer.id,
        priceId: PLAN_CONFIGS[planType].stripePriceId,
        metadata: {
          userId,
          planType,
        },
      })

      // Update user subscription in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId: customer.id,
          subscriptionId: subscription.id,
          planType,
          subscriptionStatus: subscription.status,
        },
      })

      logger.info('Subscription created for user', { userId, planType, subscriptionId: subscription.id })

      // Return client secret for payment confirmation if needed
      const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret

      return {
        subscriptionId: subscription.id,
        clientSecret: clientSecret || undefined,
      }
    } catch (error) {
      logger.error('Failed to create subscription', { error, userId, planType })
      throw error
    }
  }

  /**
   * Update user's subscription plan
   */
  static async updateSubscription(userId: string, newPlanType: PlanType): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionId: true, planType: true },
      })

      if (!user?.subscriptionId) {
        throw new Error('User does not have an active subscription')
      }

      await StripeService.updateSubscription(user.subscriptionId, {
        priceId: PLAN_CONFIGS[newPlanType].stripePriceId,
        metadata: { planType: newPlanType },
      })

      await prisma.user.update({
        where: { id: userId },
        data: { planType: newPlanType },
      })

      logger.info('Subscription updated', { userId, oldPlan: user.planType, newPlan: newPlanType })
    } catch (error) {
      logger.error('Failed to update subscription', { error, userId, newPlanType })
      throw error
    }
  }

  /**
   * Cancel user's subscription
   */
  static async cancelSubscription(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionId: true },
      })

      if (!user?.subscriptionId) {
        throw new Error('User does not have an active subscription')
      }

      await StripeService.cancelSubscription(user.subscriptionId)

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: 'canceled',
          planType: null,
        },
      })

      logger.info('Subscription cancelled', { userId })
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, userId })
      throw error
    }
  }

  /**
   * Get user's current usage
   */
  static async getUserUsage(userId: string, billingPeriodStart?: Date): Promise<UsageData> {
    try {
      const startDate = billingPeriodStart || this.getCurrentBillingPeriodStart()

      const [renderCount, minutesUsed, storageUsed] = await Promise.all([
        // Count renders in current billing period
        prisma.clip.count({
          where: {
            project: { userId },
            createdAt: { gte: startDate },
          },
        }),

        // Sum source video minutes in current billing period
        prisma.project.aggregate({
          where: {
            userId,
            createdAt: { gte: startDate },
          },
          _sum: { sourceDurationMinutes: true },
        }),

        // Calculate storage usage
        prisma.project.aggregate({
          where: { userId },
          _sum: { storageSizeGB: true },
        }),
      ])

      return {
        renders: renderCount,
        minutes: minutesUsed._sum.sourceDurationMinutes || 0,
        storage: storageUsed._sum.storageSizeGB || 0,
      }
    } catch (error) {
      logger.error('Failed to get user usage', { error, userId })
      throw error
    }
  }

  /**
   * Check if user can perform an action based on their plan limits
   */
  static async canUserPerformAction(
    userId: string,
    action: 'render' | 'upload',
    additionalMinutes?: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { planType: true, subscriptionStatus: true },
      })

      if (!user?.planType || user.subscriptionStatus !== 'active') {
        return { allowed: false, reason: 'No active subscription' }
      }

      const planConfig = PLAN_CONFIGS[user.planType]
      const usage = await this.getUserUsage(userId)

      switch (action) {
        case 'render':
          if (planConfig.limits.renders === -1) return { allowed: true }
          if (usage.renders >= planConfig.limits.renders) {
            return { allowed: false, reason: 'Render limit exceeded' }
          }
          break

        case 'upload':
          if (planConfig.limits.minutes === -1) return { allowed: true }
          const totalMinutes = usage.minutes + (additionalMinutes || 0)
          if (totalMinutes > planConfig.limits.minutes) {
            return { allowed: false, reason: 'Source minutes limit exceeded' }
          }
          break
      }

      return { allowed: true }
    } catch (error) {
      logger.error('Failed to check user permissions', { error, userId, action })
      return { allowed: false, reason: 'Error checking permissions' }
    }
  }

  /**
   * Get user's plan limits and current usage
   */
  static async getUserPlanInfo(userId: string): Promise<{
    planType: PlanType | null
    limits: PlanLimits
    usage: UsageData
    subscriptionStatus: string | null
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { planType: true, subscriptionStatus: true },
      })

      if (!user?.planType) {
        return {
          planType: null,
          limits: { renders: 0, minutes: 0, seats: 0, storage: 0 },
          usage: { renders: 0, minutes: 0, storage: 0 },
          subscriptionStatus: null,
        }
      }

      const planConfig = PLAN_CONFIGS[user.planType]
      const usage = await this.getUserUsage(userId)

      return {
        planType: user.planType,
        limits: planConfig.limits,
        usage,
        subscriptionStatus: user.subscriptionStatus,
      }
    } catch (error) {
      logger.error('Failed to get user plan info', { error, userId })
      throw error
    }
  }

  /**
   * Create checkout session for plan upgrade
   */
  static async createCheckoutSession(
    userId: string,
    planType: PlanType,
    successUrl: string,
    cancelUrl: string
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, stripeCustomerId: true },
      })

      if (!user) {
        throw new Error('User not found')
      }

      const session = await StripeService.createCheckoutSession({
        customerId: user.stripeCustomerId || undefined,
        customerEmail: user.stripeCustomerId ? undefined : user.email,
        priceId: PLAN_CONFIGS[planType].stripePriceId,
        successUrl,
        cancelUrl,
        metadata: {
          userId,
          planType,
        },
      })

      logger.info('Checkout session created', { userId, planType, sessionId: session.id })

      return {
        sessionId: session.id,
        url: session.url!,
      }
    } catch (error) {
      logger.error('Failed to create checkout session', { error, userId, planType })
      throw error
    }
  }

  /**
   * Create customer portal session
   */
  static async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      })

      if (!user?.stripeCustomerId) {
        throw new Error('User does not have a Stripe customer ID')
      }

      const session = await StripeService.createPortalSession(user.stripeCustomerId, returnUrl)

      return { url: session.url }
    } catch (error) {
      logger.error('Failed to create portal session', { error, userId })
      throw error
    }
  }

  /**
   * Get or create Stripe customer for user
   */
  private static async getOrCreateStripeCustomer(userId: string, email: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true, name: true },
    })

    if (user?.stripeCustomerId) {
      const customer = await StripeService.getCustomer(user.stripeCustomerId)
      if (customer) return customer
    }

    // Create new customer
    const customer = await StripeService.createCustomer({
      email,
      name: user?.name || undefined,
      metadata: { userId },
    })

    // Update user with customer ID
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    })

    return customer
  }

  /**
   * Get current billing period start date
   */
  private static getCurrentBillingPeriodStart(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }

  /**
   * Handle Stripe webhook events
   */
  static async handleStripeWebhook(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object)
          break

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object)
          break

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object)
          break

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object)
          break
      }
    } catch (error) {
      logger.error('Error handling Stripe webhook', { error, eventType: event.type })
      throw error
    }
  }

  private static async handleSubscriptionUpdate(subscription: any): Promise<void> {
    const userId = subscription.metadata?.userId
    if (!userId) return

    const planType = subscription.metadata?.planType as PlanType

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        planType: planType || null,
      },
    })

    logger.info('Subscription updated in database', { userId, subscriptionId: subscription.id })
  }

  private static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const userId = subscription.metadata?.userId
    if (!userId) return

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'canceled',
        planType: null,
      },
    })

    logger.info('Subscription deleted in database', { userId, subscriptionId: subscription.id })
  }

  private static async handlePaymentSucceeded(invoice: any): Promise<void> {
    // TODO: Send payment confirmation email, update payment history, etc.
    logger.info('Payment succeeded', { invoiceId: invoice.id })
  }

  private static async handlePaymentFailed(invoice: any): Promise<void> {
    // TODO: Send payment failed email, handle dunning, etc.
    logger.info('Payment failed', { invoiceId: invoice.id })
  }
}

export default BillingService
