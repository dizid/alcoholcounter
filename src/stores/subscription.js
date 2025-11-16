// Subscription Store - Manages user tier, quota, and payment status
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../supabase'

export const useSubscriptionStore = defineStore('subscription', () => {
  // State
  const subscription = ref(null)
  const aiUsage = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed: User tier
  const tier = computed(() => subscription.value?.tier || 'free')

  // Computed: Is premium user
  const isPremium = computed(() => tier.value === 'premium')

  // Computed: Quota limits based on tier
  const quotaLimit = computed(() => isPremium.value ? 100 : 10)

  // Computed: Current month usage count
  const currentMonthUsage = computed(() => {
    if (!aiUsage.value.length) return 0

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    return aiUsage.value.filter(usage => {
      const usageDate = new Date(usage.created_at)
      return usageDate >= firstDayOfMonth && usageDate <= lastDayOfMonth
    }).length
  })

  // Computed: Remaining quota
  const remainingQuota = computed(() => {
    const remaining = quotaLimit.value - currentMonthUsage.value
    return Math.max(remaining, 0)
  })

  // Computed: Quota percentage used
  const quotaPercentage = computed(() => {
    if (quotaLimit.value === 0) return 0
    return Math.round((currentMonthUsage.value / quotaLimit.value) * 100)
  })

  // Computed: Quota reset date (first day of next month)
  const quotaResetDate = computed(() => {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return nextMonth
  })

  // Computed: Has quota available
  const hasQuotaAvailable = computed(() => remainingQuota.value > 0)

  // Computed: Subscription status
  const subscriptionStatus = computed(() => subscription.value?.status || 'active')

  // Computed: Is subscription active
  const isSubscriptionActive = computed(() => subscriptionStatus.value === 'active')

  // Computed: PayPal subscription ID
  const paypalSubscriptionId = computed(() => subscription.value?.paypal_subscription_id)

  // Actions

  /**
   * Fetch user's subscription from Supabase
   */
  async function fetchSubscription() {
    loading.value = true
    error.value = null

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        // If no subscription exists, it will be auto-created by trigger
        // Retry once after a short delay
        if (fetchError.code === 'PGRST116') {
          await new Promise(resolve => setTimeout(resolve, 500))
          const { data: retryData, error: retryError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (retryError) throw retryError
          subscription.value = retryData
        } else {
          throw fetchError
        }
      } else {
        subscription.value = data
      }

      console.log('Subscription fetched:', subscription.value)
    } catch (err) {
      console.error('Error fetching subscription:', err)
      error.value = err.message
      // Default to free tier on error
      subscription.value = {
        tier: 'free',
        status: 'active'
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch AI usage for current month
   */
  async function fetchAIUsage() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Get current month date range
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

      const { data, error: fetchError } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      aiUsage.value = data || []
      console.log('AI usage fetched:', aiUsage.value.length, 'calls this month')
    } catch (err) {
      console.error('Error fetching AI usage:', err)
      // Don't throw, just log - usage tracking is non-critical
      aiUsage.value = []
    }
  }

  /**
   * Check if user has quota available before making AI call
   * @returns {boolean} - True if quota available, false otherwise
   * @throws {Error} - If quota exceeded
   */
  function checkQuotaBeforeCall() {
    if (!hasQuotaAvailable.value) {
      const message = isPremium.value
        ? `You've used all ${quotaLimit.value} AI calls this month. Your quota resets on ${quotaResetDate.value.toLocaleDateString()}.`
        : `You've used all ${quotaLimit.value} AI calls this month. Upgrade to Premium for ${quotaLimit.value * 10}x more AI insights!`

      throw new Error(message)
    }

    return true
  }

  /**
   * Track an AI usage call (called after successful API response)
   * Note: This should be called from the Netlify function, not directly from client
   * @param {string} requestType - 'dashboard' or 'mindfulness'
   * @param {number} tokensInput - Input tokens used
   * @param {number} tokensOutput - Output tokens used
   */
  async function trackAIUsage(requestType, tokensInput = 0, tokensOutput = 0) {
    try {
      // This is a client-side helper that refreshes the local state
      // Actual tracking happens server-side in Netlify function
      await fetchAIUsage()
    } catch (err) {
      console.warn('Failed to refresh AI usage:', err)
      // Non-critical - don't throw
    }
  }

  /**
   * Upgrade to premium (initiates PayPal flow)
   * @returns {string} - PayPal approval URL
   */
  async function upgradeToPremium() {
    loading.value = true
    error.value = null

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error('User not authenticated')
      }

      // Call Netlify function to create PayPal subscription
      const response = await fetch('/.netlify/functions/paypal-create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create subscription')
      }

      const data = await response.json()

      // Return approval URL for redirect
      return data.approvalUrl
    } catch (err) {
      console.error('Error upgrading to premium:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Cancel premium subscription (downgrade to free)
   * @param {string} reason - Cancellation reason
   */
  async function cancelSubscription(reason = 'User requested cancellation') {
    loading.value = true
    error.value = null

    try {
      if (!paypalSubscriptionId.value) {
        throw new Error('No active PayPal subscription found')
      }

      // Call Netlify function to cancel PayPal subscription
      const response = await fetch('/.netlify/functions/paypal-cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: paypalSubscriptionId.value,
          reason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel subscription')
      }

      // Refresh subscription to reflect cancellation
      await fetchSubscription()
      await fetchAIUsage()

      console.log('Subscription cancelled successfully')
    } catch (err) {
      console.error('Error cancelling subscription:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Initialize store (call on app mount)
   */
  async function initialize() {
    await fetchSubscription()
    await fetchAIUsage()
  }

  /**
   * Reset store state
   */
  function reset() {
    subscription.value = null
    aiUsage.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    subscription,
    aiUsage,
    loading,
    error,

    // Computed
    tier,
    isPremium,
    quotaLimit,
    currentMonthUsage,
    remainingQuota,
    quotaPercentage,
    quotaResetDate,
    hasQuotaAvailable,
    subscriptionStatus,
    isSubscriptionActive,
    paypalSubscriptionId,

    // Actions
    fetchSubscription,
    fetchAIUsage,
    checkQuotaBeforeCall,
    trackAIUsage,
    upgradeToPremium,
    cancelSubscription,
    initialize,
    reset
  }
})
