<!-- ConsentBanner.vue — asks once whether Google Analytics may run (T-0609).
     Nothing from Google loads until the visitor taps "Allow". The answer is kept in
     this browser and can be changed any time in Me → Privacy. -->
<template>
  <aside
    v-if="visible"
    ref="bannerEl"
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getAnalyticsChoice, setAnalyticsChoice } from '../lib/analytics'

defineProps({
  // True when the bottom nav is on screen, so the banner sits above it
  aboveNav: { type: Boolean, default: false },
})

// Shown only while no choice is stored
const visible = ref(getAnalyticsChoice() === null)
const bannerEl = ref(null)
let resizeObserver = null

// T-0636: the banner floats over the bottom of the page. While it is open, the page gets
// extra room at the bottom (--consent-room, used in theme.css) of the banner's height + 8 px,
// so the last buttons of a screen can be scrolled out from under it. Before, e.g. the
// Triggers and Reframe exercises on Today could not be tapped until the question was answered.
function setRoom() {
  const room = visible.value && bannerEl.value ? bannerEl.value.offsetHeight + 8 : 0
  document.documentElement.style.setProperty('--consent-room', `${room}px`)
}

function clearRoom() {
  resizeObserver?.disconnect()
  resizeObserver = null
  document.documentElement.style.removeProperty('--consent-room')
}

onMounted(() => {
  if (!visible.value) return
  setRoom()
  // The banner's height changes with the screen width (e.g. a phone turned sideways)
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(setRoom)
    resizeObserver.observe(bannerEl.value)
  }
})

onBeforeUnmount(clearRoom)

function choose(choice) {
  setAnalyticsChoice(choice)
  visible.value = false
  clearRoom()
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
