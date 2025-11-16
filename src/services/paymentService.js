// Payment Service - Abstraction layer for payment providers (PayPal, Stripe, etc.)
// This allows easy switching between payment providers without changing application code

import paypalProvider from './providers/paypalProvider'
// import stripeProvider from './providers/stripeProvider' // Future implementation

// Configuration - select active provider
const ACTIVE_PROVIDER = process.env.VITE_PAYMENT_PROVIDER || 'paypal'

// Provider registry
const providers = {
  paypal: paypalProvider,
  // stripe: stripeProvider, // Future
}

/**
 * Get the active payment provider
 * @returns {Object} Provider implementation
 */
function getProvider() {
  const provider = providers[ACTIVE_PROVIDER]
  if (!provider) {
    throw new Error(`Payment provider "${ACTIVE_PROVIDER}" not found`)
  }
  return provider
}

/**
 * Create a subscription
 * @param {string} userId - User ID from Supabase auth
 * @param {string} userEmail - User email
 * @param {string} planId - Plan ID (optional, uses default if not provided)
 * @returns {Promise<Object>} { subscriptionId, approvalUrl }
 */
export async function createSubscription(userId, userEmail, planId = null) {
  const provider = getProvider()
  return provider.createSubscription(userId, userEmail, planId)
}

/**
 * Cancel a subscription
 * @param {string} subscriptionId - Provider's subscription ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancellation result
 */
export async function cancelSubscription(subscriptionId, reason = 'User requested cancellation') {
  const provider = getProvider()
  return provider.cancelSubscription(subscriptionId, reason)
}

/**
 * Get subscription details
 * @param {string} subscriptionId - Provider's subscription ID
 * @returns {Promise<Object>} Subscription details
 */
export async function getSubscriptionDetails(subscriptionId) {
  const provider = getProvider()
  return provider.getSubscriptionDetails(subscriptionId)
}

/**
 * Verify webhook signature
 * @param {Object} headers - Request headers
 * @param {Object} body - Request body
 * @returns {Promise<boolean>} True if valid
 */
export async function verifyWebhook(headers, body) {
  const provider = getProvider()
  return provider.verifyWebhook(headers, body)
}

/**
 * Get provider name
 * @returns {string} Active provider name
 */
export function getProviderName() {
  return ACTIVE_PROVIDER
}

/**
 * Get pricing information
 * @returns {Object} Pricing details
 */
export function getPricing() {
  return {
    free: {
      price: 0,
      currency: 'USD',
      interval: 'forever',
      aiCalls: 10,
      features: [
        'Unlimited drink tracking',
        '10 AI insights per month',
        'CBT & mindfulness exercises',
        'Progress charts',
        'Trigger tracking'
      ]
    },
    premium: {
      price: 9,
      currency: 'USD',
      interval: 'month',
      aiCalls: 100,
      features: [
        'Everything in Free',
        '100 AI insights per month',
        'Priority support',
        'Advanced analytics (coming soon)',
        'Early access to new features'
      ]
    }
  }
}

/**
 * Format price for display
 * @param {number} amount - Amount in dollars
 * @param {string} currency - Currency code
 * @returns {string} Formatted price
 */
export function formatPrice(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

export default {
  createSubscription,
  cancelSubscription,
  getSubscriptionDetails,
  verifyWebhook,
  getProviderName,
  getPricing,
  formatPrice
}
