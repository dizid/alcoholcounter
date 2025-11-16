<template>
  <div class="step-content">
    <h1>Choose Your Plan</h1>
    <p class="subtitle">Start free. Upgrade anytime for more AI insights.</p>

    <div class="pricing-comparison">
      <!-- Free Plan -->
      <div class="plan-card" :class="{ selected: localData.selectedPlan === 'free' }" @click="selectPlan('free')">
        <input type="radio" value="free" v-model="localData.selectedPlan" @change="updateStore" />
        <h3>Free</h3>
        <div class="plan-price">
          <span class="price">$0</span>
          <span class="period">/forever</span>
        </div>
        <ul class="plan-features">
          <li>✓ Unlimited drink tracking</li>
          <li>✓ <strong>10 AI insights/month</strong></li>
          <li>✓ CBT & mindfulness tools</li>
          <li>✓ Progress charts</li>
          <li>✓ Trigger tracking</li>
        </ul>
        <div class="plan-badge">Perfect to start</div>
      </div>

      <!-- Premium Plan -->
      <div class="plan-card plan-featured" :class="{ selected: localData.selectedPlan === 'premium' }" @click="selectPlan('premium')">
        <div class="popular-badge">Most Popular</div>
        <input type="radio" value="premium" v-model="localData.selectedPlan" @change="updateStore" />
        <h3>Premium</h3>
        <div class="plan-price">
          <span class="price">$9</span>
          <span class="period">/month</span>
        </div>
        <ul class="plan-features">
          <li>✓ Everything in Free</li>
          <li>✓ <strong>100 AI insights/month</strong></li>
          <li>✓ Priority support</li>
          <li>✓ Advanced analytics</li>
          <li>✓ Early new features</li>
        </ul>
        <div class="plan-badge">10x more AI help</div>
      </div>
    </div>

    <div class="plan-info">
      <h4>What are "AI insights"?</h4>
      <p>
        Every time you view your Dashboard or get a Mindfulness tip, our AI analyzes YOUR data
        (drinking patterns, triggers, reflections) to give personalized advice.
      </p>
      <p><strong>Free: 10 insights/month • Premium: 100 insights/month</strong></p>
      <p class="info-highlight">
        💡 The more data you log, the smarter the AI gets about helping YOU specifically.
      </p>
    </div>

    <p class="guarantee">🔒 No credit card required • Cancel anytime • Privacy-first</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useOnboardingStore } from '../../stores/onboarding'

const onboardingStore = useOnboardingStore()

const localData = ref({
  selectedPlan: 'free'
})

function selectPlan(plan) {
  localData.value.selectedPlan = plan
  updateStore()
}

function updateStore() {
  onboardingStore.updateStep4(localData.value)
}

onMounted(() => {
  localData.value = { ...onboardingStore.step4Data }
})
</script>

<style scoped>
.step-content {
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

h1 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
}

.pricing-comparison {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.plan-card {
  border: 3px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  text-align: center;
}

.plan-card input[type="radio"] {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.plan-card.selected {
  border-color: #667eea;
  background: #f0f7ff;
  transform: translateY(-4px);
}

.plan-featured {
  border-color: #667eea;
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

.plan-card h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.plan-price {
  margin: 1.5rem 0;
}

.price {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
}

.period {
  font-size: 1rem;
  color: #666;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  text-align: left;
}

.plan-features li {
  padding: 0.5rem 0;
  color: #555;
}

.plan-badge {
  background: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
  margin-top: 1rem;
}

.plan-card.selected .plan-badge {
  background: #667eea;
  color: white;
}

.plan-info {
  background: #f9f9f9;
  border-left: 4px solid #667eea;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.plan-info h4 {
  margin-top: 0;
  margin-bottom: 0.75rem;
  color: #2c3e50;
}

.plan-info p {
  margin: 0.5rem 0;
  line-height: 1.6;
  color: #555;
}

.info-highlight {
  color: #667eea;
  font-style: italic;
}

.guarantee {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .pricing-comparison {
    grid-template-columns: 1fr;
  }
}
</style>
