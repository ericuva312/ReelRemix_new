import Stripe from 'stripe'
import { logger } from '../utils/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export interface CreateCustomerData {
  email: string
  name?: string
  metadata?: Record<string, string>
}

export interface CreateSubscriptionData {
  customerId: string
  priceId: string
  metadata?: Record<string, string>
}

export interface CreateCheckoutSessionData {
  customerId?: string
  customerEmail?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export class StripeService {
  /**
   * Create a new customer
   */
  static async createCustomer(data: CreateCustomerData): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        metadata: data.metadata || {},
      })

      logger.info('Customer created', { customerId: customer.id, email: data.email })
      return customer
    } catch (error) {
      logger.error('Failed to create customer', { error, email: data.email })
      throw error
    }
  }

  /**
   * Get customer by ID
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      return customer as Stripe.Customer
    } catch (error) {
      logger.error('Failed to get customer', { error, customerId })
      return null
    }
  }

  /**
   * Update customer
   */
  static async updateCustomer(
    customerId: string,
    data: Partial<CreateCustomerData>
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.update(customerId, {
        email: data.email,
        name: data.name,
        metadata: data.metadata,
      })

      logger.info('Customer updated', { customerId })
      return customer
    } catch (error) {
      logger.error('Failed to update customer', { error, customerId })
      throw error
    }
  }

  /**
   * Create a subscription
   */
  static async createSubscription(data: CreateSubscriptionData): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: data.customerId,
        items: [{ price: data.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: data.metadata || {},
      })

      logger.info('Subscription created', { 
        subscriptionId: subscription.id, 
        customerId: data.customerId,
        priceId: data.priceId 
      })
      return subscription
    } catch (error) {
      logger.error('Failed to create subscription', { error, data })
      throw error
    }
  }

  /**
   * Get subscription by ID
   */
  static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      return subscription
    } catch (error) {
      logger.error('Failed to get subscription', { error, subscriptionId })
      return null
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId)
      logger.info('Subscription cancelled', { subscriptionId })
      return subscription
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, subscriptionId })
      throw error
    }
  }

  /**
   * Update subscription
   */
  static async updateSubscription(
    subscriptionId: string,
    data: { priceId?: string; metadata?: Record<string, string> }
  ): Promise<Stripe.Subscription> {
    try {
      const updateData: Stripe.SubscriptionUpdateParams = {
        metadata: data.metadata,
      }

      if (data.priceId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        updateData.items = [
          {
            id: subscription.items.data[0].id,
            price: data.priceId,
          },
        ]
      }

      const subscription = await stripe.subscriptions.update(subscriptionId, updateData)
      logger.info('Subscription updated', { subscriptionId })
      return subscription
    } catch (error) {
      logger.error('Failed to update subscription', { error, subscriptionId })
      throw error
    }
  }

  /**
   * Create checkout session
   */
  static async createCheckoutSession(data: CreateCheckoutSessionData): Promise<Stripe.Checkout.Session> {
    try {
      const sessionData: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        line_items: [
          {
            price: data.priceId,
            quantity: 1,
          },
        ],
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: data.metadata || {},
      }

      if (data.customerId) {
        sessionData.customer = data.customerId
      } else if (data.customerEmail) {
        sessionData.customer_email = data.customerEmail
      }

      const session = await stripe.checkout.sessions.create(sessionData)
      logger.info('Checkout session created', { sessionId: session.id })
      return session
    } catch (error) {
      logger.error('Failed to create checkout session', { error, data })
      throw error
    }
  }

  /**
   * Create customer portal session
   */
  static async createPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })

      logger.info('Portal session created', { customerId })
      return session
    } catch (error) {
      logger.error('Failed to create portal session', { error, customerId })
      throw error
    }
  }

  /**
   * Get all prices
   */
  static async getPrices(): Promise<Stripe.Price[]> {
    try {
      const prices = await stripe.prices.list({
        active: true,
        expand: ['data.product'],
      })
      return prices.data
    } catch (error) {
      logger.error('Failed to get prices', { error })
      throw error
    }
  }

  /**
   * Construct webhook event
   */
  static constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret)
    } catch (error) {
      logger.error('Failed to construct webhook event', { error })
      throw error
    }
  }

  /**
   * Handle webhook events
   */
  static async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    logger.info('Processing webhook event', { type: event.type, id: event.id })

    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
          break

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
          break

        default:
          logger.info('Unhandled webhook event type', { type: event.type })
      }
    } catch (error) {
      logger.error('Error handling webhook event', { error, eventType: event.type })
      throw error
    }
  }

  private static async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    logger.info('Subscription created webhook', { subscriptionId: subscription.id })
    // TODO: Update user subscription status in database
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    logger.info('Subscription updated webhook', { subscriptionId: subscription.id })
    // TODO: Update user subscription status in database
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    logger.info('Subscription deleted webhook', { subscriptionId: subscription.id })
    // TODO: Update user subscription status in database
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Payment succeeded webhook', { invoiceId: invoice.id })
    // TODO: Update payment status in database
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Payment failed webhook', { invoiceId: invoice.id })
    // TODO: Handle failed payment (send email, update status, etc.)
  }
}

export default StripeService
