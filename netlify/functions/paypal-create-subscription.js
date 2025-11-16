// netlify/functions/paypal-create-subscription.js
// Creates a PayPal subscription and returns approval URL for user redirect
const { createClient } = require('@supabase/supabase-js')

// PayPal API URLs
const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Get PayPal OAuth access token
 * Tokens are valid for ~9 hours, could implement caching
 */
async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to get PayPal access token: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.access_token
}

/**
 * Main handler function
 */
exports.handler = async (event) => {
  console.log('paypal-create-subscription invoked:', new Date().toISOString())

  const sendResponse = (statusCode, body) => ({
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  })

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return sendResponse(405, { error: 'Method Not Allowed' })
  }

  try {
    // Parse request body
    const { userId, userEmail, planId } = JSON.parse(event.body || '{}')

    if (!userId || !userEmail) {
      return sendResponse(400, { error: 'Missing userId or userEmail' })
    }

    // Check environment variables
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('PayPal credentials missing')
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
        return sendResponse(200, {
          subscriptionId: 'MOCK_SUB_' + Date.now(),
          approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=MOCK_TOKEN'
        })
      }
      return sendResponse(500, { error: 'PayPal not configured' })
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()

    // Use provided plan ID or default from environment
    const effectivePlanId = planId || process.env.PAYPAL_PLAN_ID

    if (!effectivePlanId) {
      return sendResponse(500, { error: 'No PayPal plan ID configured' })
    }

    // Create subscription via PayPal API
    const subscriptionResponse = await fetch(`${PAYPAL_API}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${userId}-${Date.now()}` // Idempotency key
      },
      body: JSON.stringify({
        plan_id: effectivePlanId,
        subscriber: {
          email_address: userEmail
        },
        application_context: {
          brand_name: 'Daily Drink Tracker',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          return_url: `${process.env.URL || 'http://localhost:8888'}/app?paypal=success`,
          cancel_url: `${process.env.URL || 'http://localhost:8888'}/app?paypal=cancel`
        }
      })
    })

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text()
      console.error('PayPal subscription creation failed:', errorText)
      return sendResponse(500, {
        error: `PayPal API error: ${subscriptionResponse.status}`,
        details: errorText
      })
    }

    const subscriptionData = await subscriptionResponse.json()
    console.log('PayPal subscription created:', subscriptionData.id)

    // Find approval URL
    const approvalUrl = subscriptionData.links?.find(
      link => link.rel === 'approve'
    )?.href

    if (!approvalUrl) {
      console.error('No approval URL in PayPal response:', subscriptionData)
      return sendResponse(500, { error: 'No approval URL received from PayPal' })
    }

    // Create/update subscription record in Supabase
    // Set status to 'pending' until webhook confirms activation
    const { error: dbError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        tier: 'free', // Still free until activated
        status: 'pending',
        paypal_subscription_id: subscriptionData.id,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          plan_id: effectivePlanId,
          created_via: 'web'
        }
      }, {
        onConflict: 'user_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request - webhook will sync later
    }

    return sendResponse(200, {
      subscriptionId: subscriptionData.id,
      approvalUrl: approvalUrl
    })

  } catch (error) {
    console.error('Error in paypal-create-subscription:', error)
    return sendResponse(500, {
      error: 'Failed to create subscription',
      message: error.message
    })
  }
}
