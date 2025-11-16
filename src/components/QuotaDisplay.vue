<template>
  <div class="quota-display" v-if="subscription">
    <div class="quota-info" @click="showDetails = !showDetails">
      <div class="quota-icon" :class="statusClass">
        {{ remainingQuota }}/{{ quotaLimit }}
      </div>
      <div class="quota-text">
        <span class="quota-label">AI Insights</span>
        <span class="quota-tier">{{ isPremium ? 'Premium' : 'Free' }}</span>
      </div>
    </div>

    <!-- Dropdown Details -->
    <Transition name="slide-down">
      <div v-if="showDetails" class="quota-details">
        <div class="quota-bar-container">
          <div class="quota-bar" :class="statusClass" :style="{ width: `${quotaPercentage}%` }"></div>
        </div>
        <p class="quota-status">
          {{ quotaPercentage }}% used • Resets {{ resetDateFormatted }}
        </p>
        <button v-if="!isPremium" @click="handleUpgrade" class="btn-upgrade-mini">
          Upgrade for 100 insights →
        </button>
        <router-link v-else to="/subscription" class="link-manage">
          Manage subscription
        </router-link>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSubscriptionStore } from '../stores/subscription'

const router = useRouter()
const subscriptionStore = useSubscriptionStore()

const showDetails = ref(false)

// Computed
const subscription = computed(() => subscriptionStore.subscription)
const isPremium = computed(() => subscriptionStore.isPremium)
const quotaLimit = computed(() => subscriptionStore.quotaLimit)
const remainingQuota = computed(() => subscriptionStore.remainingQuota)
const quotaPercentage = computed(() => subscriptionStore.quotaPercentage)
const quotaResetDate = computed(() => subscriptionStore.quotaResetDate)

const statusClass = computed(() => {
  if (quotaPercentage.value >= 90) return 'status-danger'
  if (quotaPercentage.value >= 70) return 'status-warning'
  return 'status-good'
})

const resetDateFormatted = computed(() => {
  if (!quotaResetDate.value) return ''
  return new Date(quotaResetDate.value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
})

// Methods
function handleUpgrade() {
  router.push('/subscription?action=upgrade')
  showDetails.value = false
}

// Lifecycle
onMounted(async () => {
  await subscriptionStore.fetchSubscription()
  await subscriptionStore.fetchAIUsage()
})
</script>

<style scoped>
.quota-display {
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.quota-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.quota-info:hover {
  background: #f9f9f9;
}

.quota-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  color: white;
}

.status-good {
  background: #27ae60;
}

.status-warning {
  background: #f39c12;
}

.status-danger {
  background: #e74c3c;
}

.quota-text {
  display: flex;
  flex-direction: column;
}

.quota-label {
  font-size: 0.85rem;
  color: #666;
}

.quota-tier {
  font-weight: 600;
  color: #2c3e50;
}

.quota-details {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  background: #f9f9f9;
}

.quota-bar-container {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.quota-bar {
  height: 100%;
  transition: width 0.3s ease;
}

.quota-status {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.75rem;
}

.btn-upgrade-mini {
  width: 100%;
  padding: 0.625rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.9rem;
}

.btn-upgrade-mini:hover {
  background: #5568d3;
}

.link-manage {
  display: block;
  text-align: center;
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.link-manage:hover {
  text-decoration: underline;
}

/* Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile */
@media (max-width: 768px) {
  .quota-icon {
    width: 40px;
    height: 40px;
    font-size: 0.8rem;
  }
}
</style>
