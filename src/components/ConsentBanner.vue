<!-- ConsentBanner.vue — asks once whether Google Analytics may run (T-0609).
     Nothing from Google loads until the visitor taps "Allow". The answer is kept in
     this browser and can be changed any time in Me → Privacy. -->
<template>
  <aside
    v-if="visible"
    class="consent card"
    :class="{ 'above-nav': aboveNav }"
    role="region"
    aria-labelledby="consent-title"
  >
    <p id="consent-title" class="consent-text">
      Can we count visits with Google Analytics? It uses cookies. Your drinks and moods are never sent to it.
      <router-link to="/privacy" class="consent-link">Privacy</router-link>
    </p>
    <div class="consent-buttons">
      <button type="button" class="btn-2" @click="choose('denied')">No thanks</button>
      <button type="button" class="btn-primary" @click="choose('granted')">Allow</button>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { getAnalyticsChoice, setAnalyticsChoice } from '../lib/analytics'

defineProps({
  // True when the bottom nav is on screen, so the banner sits above it
  aboveNav: { type: Boolean, default: false },
})

// Shown only while no choice is stored
const visible = ref(getAnalyticsChoice() === null)

function choose(choice) {
  setAnalyticsChoice(choice)
  visible.value = false
}
</script>

<style scoped>
.consent {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(var(--safe) + 12px);
  z-index: 30;
  max-width: 536px;
  margin: 0 auto;
  padding: 16px;
  border: 1px solid var(--line);
  box-shadow: 0 8px 24px rgba(0, 0, 0, .4);
}
.consent.above-nav { bottom: calc(var(--nav-h) + var(--safe) + 8px); }
.consent-text { font-size: 14px; line-height: 1.45; margin: 0 0 12px; color: var(--ink); }
.consent-link { color: var(--drink); text-decoration: underline; white-space: nowrap; }
.consent-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.consent-buttons button { height: 44px; }
</style>
