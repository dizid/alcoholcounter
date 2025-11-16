// netlify/functions/paypal-cancel-subscription.js
// Cancels a PayPal subscription and downgrades user to free tier
const { createClient } = require('@supabase/supabase-js')

const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Get PayPal OAuth access token
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
 * Main handler
 */
exports.handler = async (event) => {
  console.log('paypal-cancel-subscription invoked:', new Date().toISOString())

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
    const { subscriptionId, reason } = JSON.parse(event.body || '{}')

    if (!subscriptionId) {
      return sendResponse(400, { error: 'Missing subscriptionId' })
    }

    // Check environment variables
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('PayPal credentials missing')
      return sendResponse(500, { error: 'PayPal not configured' })
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()

    // Cancel subscription via PayPal API
    const cancelResponse = await fetch(
      `${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reason || 'User requested cancellation'
        })
      }
    )

    // PayPal returns 204 No Content on success
    if (!cancelResponse.ok && cancelResponse.status !== 204) {
      const errorText = await cancelResponse.text()
      console.error('PayPal cancellation failed:', errorText)
      return sendResponse(500, {
        error: `PayPal API error: ${cancelResponse.status}`,
        details: errorText
      })
    }

    console.log('PayPal subscription cancelled:', subscriptionId)

    // Update subscription in database - separate update and fetch to avoid PGRST116 error
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        tier: 'free',
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        metadata: supabase.raw(`metadata || '{"cancelled_at": "${new Date().toISOString()}", "cancellation_reason": "${reason || 'User requested'}"}'::jsonb`)
      })
      .eq('paypal_subscription_id', subscriptionId)

    if (updateError) {
      console.error('Database update failed:', updateError)
      // Don't fail the request - cancellation succeeded on PayPal
    }

    // Fetch updated subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paypal_subscription_id', subscriptionId)
      .single()

    return sendResponse(200, {
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: subscription
    })

  } catch (error) {
    console.error('Error in paypal-cancel-subscription:', error)
    return sendResponse(500, {
      error: 'Failed to cancel subscription',
      message: error.message
    })
  }
}
