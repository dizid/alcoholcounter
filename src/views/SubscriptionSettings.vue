<template>
  <article class="subscription-container">
    <h1>Subscription & Billing</h1>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>Loading subscription details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-box">
      <p>{{ error }}</p>
      <button @click="loadSubscription" class="btn-retry">Retry</button>
    </div>

    <!-- Loaded State -->
    <div v-else class="subscription-content">
      <!-- Current Plan -->
      <section class="plan-section">
        <h2>Your Current Plan</h2>
        <div class="plan-card" :class="{ premium: isPremium }">
          <div class="plan-header">
            <div>
              <h3>{{ isPremium ? 'Premium' : 'Free' }}</h3>
              <p class="plan-price">{{ isPremium ? '$9/month' : '$0/forever' }}</p>
            </div>
            <div class="plan-badge" :class="{ active: isActive, cancelled: isCancelled }">
              {{ subscriptionStatus }}
            </div>
          </div>

          <div class="plan-quota">
            <h4>AI Insights Quota</h4>
            <div class="quota-bar-container">
              <div class="quota-bar" :class="quotaStatusClass" :style="{ width: `${quotaPercentage}%` }"></div>
            </div>
            <p class="quota-text">
              {{ currentMonthUsage }}/{{ quotaLimit }} used ({{ quotaPercentage }}%)
              • {{ remainingQuota }} remaining
            </p>
            <p class="quota-reset">Resets {{ resetDateFormatted }}</p>
          </div>
        </div>
      </section>

      <!-- Upgrade/Manage Actions -->
      <section class="actions-section">
        <div v-if="!isPremium" class="upgrade-box">
          <h3>Upgrade to Premium</h3>
          <p>Get 10x more AI insights and priority support for just $9/month.</p>
          <ul class="benefits-list">
            <li>✓ 100 AI insights per month (vs 10 on free)</li>
            <li>✓ Priority support</li>
            <li>✓ Advanced analytics (coming soon)</li>
            <li>✓ Early access to new features</li>
          </ul>
          <button @click="handleUpgrade" class="btn-upgrade" :disabled="upgrading">
            {{ upgrading ? 'Processing...' : 'Upgrade Now →' }}
          </button>
          <p class="upgrade-note">Cancel anytime • No commitments</p>
        </div>

        <div v-else class="manage-box">
          <h3>Manage Subscription</h3>
          <p>You're on the Premium plan. Thank you for supporting us!</p>

          <div v-if="paypalSubscriptionId" class="subscription-info">
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">{{ subscriptionStatus }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Billing cycle:</span>
              <span class="info-value">Monthly</span>
            </div>
          </div>

          <button
            v-if="isActive"
            @click="showCancelConfirm = true"
            class="btn-cancel-subscription"
          >
            Cancel Subscription
          </button>

          <p v-if="isCancelled" class="cancelled-notice">
            Your subscription has been cancelled. You'll continue to have Premium access until the end of your billing period.
          </p>
        </div>
      </section>

      <!-- Navigation -->
      <div class="nav-buttons">
        <button @click="goToApp" class="btn-back">← Back to Tracker</button>
        <button @click="goToDashboard" class="btn-secondary">Dashboard</button>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCancelConfirm" class="modal-overlay" @click.self="showCancelConfirm = false">
          <div class="modal-container">
            <h2>Cancel Premium Subscription?</h2>
            <p>Are you sure you want to cancel your Premium subscription?</p>
            <p class="modal-warning">
              You'll lose access to:
            </p>
            <ul class="modal-list">
              <li>100 AI insights/month (downgrade to 10)</li>
              <li>Priority support</li>
              <li>Advanced features</li>
            </ul>
            <p>Your access will continue until the end of your current billing period.</p>

            <div class="modal-actions">
              <button @click="handleCancelSubscription" class="btn-confirm-cancel" :disabled="cancelling">
                {{ cancelling ? 'Cancelling...' : 'Yes, Cancel Subscription' }}
              </button>
              <button @click="showCancelConfirm = false" class="btn-keep">Keep Premium</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </article>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscription'

const router = useRouter()
const subscriptionStore = useSubscriptionStore()

const loading = ref(true)
const error = ref(null)
const upgrading = ref(false)
const cancelling = ref(false)
const showCancelConfirm = ref(false)

// Computed
const subscription = computed(() => subscriptionStore.subscription)
const isPremium = computed(() => subscriptionStore.isPremium)
const subscriptionStatus = computed(() => {
  const status = subscriptionStore.subscriptionStatus
  return status.charAt(0).toUpperCase() + status.slice(1)
})
const isActive = computed(() => subscriptionStore.isSubscriptionActive)
const isCancelled = computed(() => subscription.value?.status === 'cancelled')
const quotaLimit = computed(() => subscriptionStore.quotaLimit)
const currentMonthUsage = computed(() => subscriptionStore.currentMonthUsage)
const remainingQuota = computed(() => subscriptionStore.remainingQuota)
const quotaPercentage = computed(() => subscriptionStore.quotaPercentage)
const quotaResetDate = computed(() => subscriptionStore.quotaResetDate)
const paypalSubscriptionId = computed(() => subscriptionStore.paypalSubscriptionId)

const quotaStatusClass = computed(() => {
  if (quotaPercentage.value >= 90) return 'quota-danger'
  if (quotaPercentage.value >= 70) return 'quota-warning'
  return 'quota-good'
})

const resetDateFormatted = computed(() => {
  if (!quotaResetDate.value) return ''
  return new Date(quotaResetDate.value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})

// Methods
async function loadSubscription() {
  loading.value = true
  error.value = null

  try {
    await subscriptionStore.fetchSubscription()
    await subscriptionStore.fetchAIUsage()
  } catch (err) {
    error.value = 'Failed to load subscription details. Please try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function handleUpgrade() {
  upgrading.value = true

  try {
    const approvalUrl = await subscriptionStore.upgradeToPremium()
    // Redirect to PayPal
    window.location.href = approvalUrl
  } catch (err) {
    error.value = 'Failed to start upgrade. Please try again.'
    console.error(err)
  } finally {
    upgrading.value = false
  }
}

async function handleCancelSubscription() {
  cancelling.value = true

  try {
    await subscriptionStore.cancelSubscription('User requested cancellation via settings')
    showCancelConfirm.value = false
    await loadSubscription() // Reload to show updated status
  } catch (err) {
    error.value = 'Failed to cancel subscription. Please try again.'
    console.error(err)
  } finally {
    cancelling.value = false
  }
}

function goToApp() {
  router.push('/app')
}

function goToDashboard() {
  router.push('/dashboard')
}

// Lifecycle
onMounted(() => {
  loadSubscription()
})
</script>

<style scoped>
.subscription-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  margin-bottom: 2rem;
  color: #2c3e50;
}

.loading, .error-box {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-box {
  background: #fee;
  border: 2px solid #e74c3c;
  border-radius: 8px;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.plan-section, .actions-section {
  margin-bottom: 2rem;
}

h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.plan-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
}

.plan-card.premium {
  border-color: #667eea;
  background: #f0f7ff;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 2rem;
}

.plan-header h3 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.plan-price {
  font-size: 1.25rem;
  color: #667eea;
  font-weight: 600;
}

.plan-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.plan-badge.active {
  background: #27ae60;
  color: white;
}

.plan-badge.cancelled {
  background: #e74c3c;
  color: white;
}

.plan-quota h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.quota-bar-container {
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.quota-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.quota-good {
  background: #27ae60;
}

.quota-warning {
  background: #f39c12;
}

.quota-danger {
  background: #e74c3c;
}

.quota-text {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.quota-reset {
  font-size: 0.85rem;
  color: #999;
}

.upgrade-box, .manage-box {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
}

.upgrade-box h3, .manage-box h3 {
  margin-bottom: 0.75rem;
  color: #2c3e50;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
}

.benefits-list li {
  padding: 0.5rem 0;
  color: #555;
}

.btn-upgrade, .btn-cancel-subscription {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1rem;
}

.btn-upgrade {
  background: #667eea;
  color: white;
  margin-top: 1rem;
}

.btn-upgrade:hover:not(:disabled) {
  background: #5568d3;
}

.btn-upgrade:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.upgrade-note {
  text-align: center;
  font-size: 0.85rem;
  color: #999;
  margin-top: 0.75rem;
}

.subscription-info {
  margin: 1.5rem 0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.info-label {
  color: #666;
}

.info-value {
  font-weight: 600;
  color: #2c3e50;
}

.btn-cancel-subscription {
  background: transparent;
  color: #e74c3c;
  border: 2px solid #e74c3c;
  margin-top: 1.5rem;
}

.btn-cancel-subscription:hover {
  background: #e74c3c;
  color: white;
}

.cancelled-notice {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee;
  border-left: 4px solid #e74c3c;
  border-radius: 4px;
  color: #c0392b;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-back, .btn-secondary {
  flex: 1;
  padding: 0.875rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-back {
  background: #667eea;
  color: white;
}

.btn-back:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #f0f0f0;
  color: #2c3e50;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-container h2 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.modal-warning {
  font-weight: 600;
  margin-top: 1rem;
}

.modal-list {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: #666;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-confirm-cancel, .btn-keep {
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-confirm-cancel {
  background: #e74c3c;
  color: white;
}

.btn-confirm-cancel:hover:not(:disabled) {
  background: #c0392b;
}

.btn-confirm-cancel:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-keep {
  background: #667eea;
  color: white;
}

.btn-keep:hover {
  background: #5568d3;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
