<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <button @click="closeModal" class="btn-close">×</button>

          <div class="modal-header">
            <div class="quota-icon-large">{{ remainingQuota }}/{{ quotaLimit }}</div>
            <h2>You've Used All Your AI Insights</h2>
            <p>{{ quotaMessage }}</p>
          </div>

          <div class="modal-body">
            <div class="comparison-grid">
              <!-- Current Plan -->
              <div class="plan-column">
                <h3>Your Current Plan</h3>
                <div class="plan-name">Free</div>
                <div class="plan-quota">10 AI insights/month</div>
                <div class="quota-visual">
                  <div class="quota-bar-full">
                    <div class="quota-bar-used" :style="{ width: '100%' }"></div>
                  </div>
                  <p class="quota-used-text">All used!</p>
                </div>
                <p class="reset-text">Resets {{ resetDateFormatted }}</p>
              </div>

              <!-- Premium Plan -->
              <div class="plan-column plan-premium">
                <div class="popular-badge">Recommended</div>
                <h3>Upgrade to Premium</h3>
                <div class="plan-name">$9/month</div>
                <div class="plan-quota">100 AI insights/month</div>
                <div class="plan-benefits">
                  <div class="benefit-item">✓ 10x more AI insights</div>
                  <div class="benefit-item">✓ Priority support</div>
                  <div class="benefit-item">✓ Advanced analytics</div>
                  <div class="benefit-item">✓ Cancel anytime</div>
                </div>
              </div>
            </div>

            <div class="info-box">
              <p><strong>💡 What are AI insights?</strong></p>
              <p>Every Dashboard view and Mindfulness tip uses AI to analyze YOUR data and give personalized advice.</p>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="handleUpgrade" class="btn-upgrade" :disabled="loading">
              <span v-if="loading">Processing...</span>
              <span v-else>Upgrade to Premium →</span>
            </button>
            <button @click="closeModal" class="btn-cancel">Maybe Later</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscription'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'upgrade'])

const router = useRouter()
const subscriptionStore = useSubscriptionStore()
const loading = ref(false)

// Computed
const quotaLimit = computed(() => subscriptionStore.quotaLimit)
const remainingQuota = computed(() => subscriptionStore.remainingQuota)
const quotaResetDate = computed(() => subscriptionStore.quotaResetDate)

const quotaMessage = computed(() => {
  return `You've used all ${quotaLimit.value} AI insights this month. Upgrade to Premium for 10x more insights!`
})

const resetDateFormatted = computed(() => {
  if (!quotaResetDate.value) return ''
  return new Date(quotaResetDate.value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  })
})

// Methods
function closeModal() {
  emit('update:modelValue', false)
}

async function handleUpgrade() {
  loading.value = true

  try {
    const approvalUrl = await subscriptionStore.upgradeToPremium()

    // Emit upgrade event
    emit('upgrade')

    // Redirect to PayPal
    window.location.href = approvalUrl
  } catch (error) {
    console.error('Upgrade error:', error)
    alert('Failed to start upgrade process. Please try again.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
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
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #999;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
}

.quota-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e74c3c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto 1.5rem;
}

.modal-header h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.modal-header p {
  color: #666;
  line-height: 1.6;
}

.modal-body {
  padding: 1rem 2rem;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.plan-column {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
}

.plan-premium {
  border-color: #667eea;
  background: #f0f7ff;
}

.popular-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #667eea;
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
}

.plan-column h3 {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.75rem;
}

.plan-name {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.plan-quota {
  font-size: 1.1rem;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 1rem;
}

.quota-visual {
  margin: 1rem 0;
}

.quota-bar-full {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.quota-bar-used {
  height: 100%;
  background: #e74c3c;
  transition: width 0.3s ease;
}

.quota-used-text {
  font-size: 0.85rem;
  color: #e74c3c;
  font-weight: 600;
  margin-top: 0.5rem;
}

.reset-text {
  font-size: 0.85rem;
  color: #999;
}

.plan-benefits {
  margin-top: 1rem;
}

.benefit-item {
  padding: 0.5rem 0;
  color: #555;
}

.info-box {
  background: #f9f9f9;
  border-left: 4px solid #667eea;
  padding: 1rem;
  border-radius: 8px;
}

.info-box p {
  margin: 0.5rem 0;
  line-height: 1.6;
  color: #555;
}

.modal-footer {
  padding: 1rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-upgrade, .btn-cancel {
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-upgrade {
  background: #667eea;
  color: white;
}

.btn-upgrade:hover:not(:disabled) {
  background: #5568d3;
}

.btn-upgrade:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background: transparent;
  color: #666;
  border: 2px solid #e0e0e0;
}

.btn-cancel:hover {
  background: #f0f0f0;
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

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container {
  transform: scale(0.9);
}

.modal-leave-to .modal-container {
  transform: scale(0.9);
}

/* Mobile */
@media (max-width: 768px) {
  .comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
