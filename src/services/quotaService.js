// Quota Service - Helper functions for AI usage tracking and quota enforcement
import { supabase } from '../supabase'

/**
 * Get user's quota information from Supabase function
 * Uses the get_user_quota_info() SQL function for accurate server-side calculation
 * @returns {Promise<Object>} Quota info object
 */
export async function getUserQuotaInfo() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase.rpc('get_user_quota_info', {
      p_user_id: user.id
    })

    if (error) throw error

    return data || {
      tier: 'free',
      quota_limit: 10,
      usage_count: 0,
      remaining: 10,
      reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    }
  } catch (err) {
    console.error('Error getting quota info:', err)
    // Return default free tier on error
    return {
      tier: 'free',
      quota_limit: 10,
      usage_count: 0,
      remaining: 10,
      reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
    }
  }
}

/**
 * Check if user can make an AI call (has quota available)
 * This is a client-side pre-check - final enforcement happens server-side
 * @returns {Promise<boolean>} True if quota available
 * @throws {Error} If quota exceeded with upgrade message
 */
export async function checkQuotaAvailable() {
  try {
    const quotaInfo = await getUserQuotaInfo()

    if (quotaInfo.remaining <= 0) {
      const message = quotaInfo.tier === 'premium'
        ? `You've used all ${quotaInfo.quota_limit} AI calls this month. Your quota resets on ${new Date(quotaInfo.reset_date).toLocaleDateString()}.`
        : `You've used all ${quotaInfo.quota_limit} AI calls this month. Upgrade to Premium for 100 AI insights! Resets ${new Date(quotaInfo.reset_date).toLocaleDateString()}.`

      throw new Error(message)
    }

    return true
  } catch (err) {
    console.error('Quota check failed:', err)
    throw err
  }
}

/**
 * Track an AI usage call
 * Note: This should primarily be called from server-side (Netlify function)
 * Client can call this to refresh local state after a call
 * @param {string} requestType - 'dashboard' or 'mindfulness'
 * @param {number} tokensInput - Number of input tokens
 * @param {number} tokensOutput - Number of output tokens
 * @param {number} costEstimate - Estimated cost in USD
 * @returns {Promise<void>}
 */
export async function trackAIUsage(requestType, tokensInput = 0, tokensOutput = 0, costEstimate = 0) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const { error } = await supabase
      .from('ai_usage')
      .insert([{
        user_id: user.id,
        request_type: requestType,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        cost_estimate: costEstimate
      }])

    if (error) throw error

    console.log(`AI usage tracked: ${requestType}, ${tokensOutput} tokens`)
  } catch (err) {
    console.error('Error tracking AI usage:', err)
    // Non-critical error - don't throw, just log
    // Usage will still be tracked server-side
  }
}

/**
 * Get AI usage history for current month
 * @returns {Promise<Array>} Array of usage records
 */
export async function getCurrentMonthUsage() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', firstDayOfMonth)
      .lte('created_at', lastDayOfMonth)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (err) {
    console.error('Error fetching current month usage:', err)
    return []
  }
}

/**
 * Calculate estimated cost for an AI call
 * Based on Grok pricing: ~$15/million tokens output
 * @param {number} tokensOutput - Number of output tokens
 * @param {string} tier - User tier ('free' or 'premium')
 * @returns {number} Estimated cost in USD
 */
export function estimateAICost(tokensOutput, tier = 'free') {
  // Grok-2 pricing is approximately $15 per million tokens output
  // We'll use a simplified model
  const costPerMillionTokens = 15.00
  const baseCost = (tokensOutput / 1_000_000) * costPerMillionTokens

  // Add a multiplier for free tier to account for infrastructure
  const multiplier = tier === 'free' ? 1.5 : 1.0

  return baseCost * multiplier
}

/**
 * Get quota status message for UI display
 * @param {Object} quotaInfo - Quota info from getUserQuotaInfo()
 * @returns {Object} Status message and styling info
 */
export function getQuotaStatusMessage(quotaInfo) {
  const percentage = (quotaInfo.usage_count / quotaInfo.quota_limit) * 100

  let message = ''
  let variant = 'info' // 'info', 'warning', 'danger', 'success'

  if (quotaInfo.remaining === 0) {
    message = `Quota exceeded! Resets ${new Date(quotaInfo.reset_date).toLocaleDateString()}`
    variant = 'danger'
  } else if (percentage >= 90) {
    message = `Only ${quotaInfo.remaining} AI calls left this month`
    variant = 'danger'
  } else if (percentage >= 70) {
    message = `${quotaInfo.remaining} AI calls remaining`
    variant = 'warning'
  } else if (percentage >= 50) {
    message = `${quotaInfo.remaining}/${quotaInfo.quota_limit} AI calls available`
    variant = 'info'
  } else {
    message = `${quotaInfo.remaining}/${quotaInfo.quota_limit} AI calls available`
    variant = 'success'
  }

  return {
    message,
    variant,
    percentage: Math.round(percentage),
    resetDate: new Date(quotaInfo.reset_date).toLocaleDateString()
  }
}

/**
 * Validate request type
 * @param {string} requestType - Type to validate
 * @returns {boolean} True if valid
 */
export function isValidRequestType(requestType) {
  const validTypes = ['dashboard', 'mindfulness']
  return validTypes.includes(requestType)
}
