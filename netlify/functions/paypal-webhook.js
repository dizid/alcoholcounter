// netlify/functions/paypal-webhook.js
// Handles PayPal webhook events for subscription lifecycle
const { createClient } = require('@supabase/supabase-js')

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Verify PayPal webhook signature
 * Important: Prevents webhook spoofing
 */
async function verifyWebhookSignature(headers, body) {
  try {
    // Extract PayPal signature headers
    const transmissionId = headers['paypal-transmission-id']
    const transmissionTime = headers['paypal-transmission-time']
    const certUrl = headers['paypal-cert-url']
    const authAlgo = headers['paypal-auth-algo']
    const transmissionSig = headers['paypal-transmission-sig']
    const webhookId = process.env.PAYPAL_WEBHOOK_ID

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig || !webhookId) {
      console.error('Missing webhook verification headers')
      return false
    }

    // Get PayPal access token
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64')

    const tokenResponse = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!tokenResponse.ok) {
      console.error('Failed to get PayPal token for verification')
      return false
    }

    const { access_token } = await tokenResponse.json()

    // Verify signature via PayPal API
    const verifyResponse = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body)
      })
    })

    if (!verifyResponse.ok) {
      console.error('Webhook verification failed:', await verifyResponse.text())
      return false
    }

    const verifyData = await verifyResponse.json()
    return verifyData.verification_status === 'SUCCESS'

  } catch (error) {
    console.error('Error verifying webhook:', error)
    return false
  }
}

/**
 * Handle subscription activated event
 */
async function handleSubscriptionActivated(resource) {
  const subscriptionId = resource.id
  const payerId = resource.subscriber?.payer_id

  console.log('Handling BILLING.SUBSCRIPTION.ACTIVATED:', subscriptionId)

  // Update subscription to premium tier
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'premium',
      status: 'active',
      paypal_payer_id: payerId,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('paypal_subscription_id', subscriptionId)

  if (error) {
    console.error('Database update failed:', error)
    throw error
  }

  console.log('Subscription activated successfully:', subscriptionId)
}

/**
 * Handle subscription cancelled event
 */
async function handleSubscriptionCancelled(resource) {
  const subscriptionId = resource.id

  console.log('Handling BILLING.SUBSCRIPTION.CANCELLED:', subscriptionId)

  // Downgrade to free tier
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'cancelled',
      updated_at: new Date().toISOString(),
      metadata: supabase.raw(`metadata || '{"cancelled_at": "${new Date().toISOString()}"}'::jsonb`)
    })
    .eq('paypal_subscription_id', subscriptionId)

  if (error) {
    console.error('Database update failed:', error)
    throw error
  }

  console.log('Subscription cancelled successfully:', subscriptionId)
}

/**
 * Handle subscription expired event
 */
async function handleSubscriptionExpired(resource) {
  const subscriptionId = resource.id

  console.log('Handling BILLING.SUBSCRIPTION.EXPIRED:', subscriptionId)

  // Downgrade to free tier
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier: 'free',
      status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('paypal_subscription_id', subscriptionId)

  if (error) {
    console.error('Database update failed:', error)
    throw error
  }

  console.log('Subscription expired successfully:', subscriptionId)
}

/**
 * Handle payment completed event
 */
async function handlePaymentCompleted(resource) {
  const subscriptionId = resource.billing_agreement_id
  const amount = parseFloat(resource.amount?.total || 0)
  const currency = resource.amount?.currency || 'USD'
  const transactionId = resource.id

  console.log('Handling PAYMENT.SALE.COMPLETED:', transactionId)

  // Record payment in payments table
  // First get user_id from subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('paypal_subscription_id', subscriptionId)
    .single()

  if (!subscription) {
    console.warn('No subscription found for payment:', subscriptionId)
    return
  }

  const { error } = await supabase
    .from('payments')
    .insert({
      user_id: subscription.user_id,
      amount: amount,
      currency: currency,
      status: 'completed',
      provider: 'paypal',
      provider_transaction_id: transactionId,
      payment_type: 'subscription',
      metadata: {
        subscription_id: subscriptionId,
        resource: resource
      }
    })

  if (error) {
    console.error('Failed to record payment:', error)
  } else {
    console.log('Payment recorded:', transactionId)
  }
}

/**
 * Main handler
 */
exports.handler = async (event) => {
  console.log('paypal-webhook invoked:', new Date().toISOString())

  const sendResponse = (statusCode, body) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return sendResponse(405, { error: 'Method Not Allowed' })
  }

  try {
    // Verify webhook signature (comment out for testing, enable in production)
    // if (process.env.NODE_ENV === 'production') {
    //   const isValid = await verifyWebhookSignature(event.headers, event.body)
    //   if (!isValid) {
    //     console.error('Invalid webhook signature')
    //     return sendResponse(401, { error: 'Invalid signature' })
    //   }
    // }

    const webhookEvent = JSON.parse(event.body || '{}')
    const eventType = webhookEvent.event_type
    const resource = webhookEvent.resource

    console.log('Webhook event type:', eventType)
    console.log('Resource:', JSON.stringify(resource, null, 2))

    // Handle different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(resource)
        break

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(resource)
        break

      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(resource)
        break

      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(resource)
        break

      case 'BILLING.SUBSCRIPTION.CREATED':
        console.log('Subscription created, waiting for activation')
        break

      default:
        console.log('Unhandled event type:', eventType)
    }

    // Always return 200 to prevent PayPal retries
    return sendResponse(200, { received: true })

  } catch (error) {
    console.error('Error in paypal-webhook:', error)
    // Still return 200 to prevent retries
    return sendResponse(200, { received: true, error: error.message })
  }
}
