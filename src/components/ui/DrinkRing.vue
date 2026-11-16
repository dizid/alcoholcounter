<!-- DrinkRing.vue — today's standard drinks against the daily limit (T-0588).
     Up to the limit the ring fills in sand; drinks above it draw a thinner inner
     arc in clay. No red, no shake. -->
<template>
  <div class="ring" role="img" :aria-label="ariaLabel">
    <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
      <circle cx="70" cy="70" :r="R" stroke="var(--surface-2)" stroke-width="14" fill="none" />
      <circle
        v-if="mainFraction > 0"
        class="arc" cx="70" cy="70" :r="R" stroke="var(--drink)" stroke-width="14" fill="none"
        stroke-linecap="round" :stroke-dasharray="C" :stroke-dashoffset="C * (1 - mainFraction)"
        transform="rotate(-90 70 70)"
      />
      <circle
        v-if="aboveFraction > 0"
        class="arc" cx="70" cy="70" :r="R_IN" stroke="var(--above)" stroke-width="5" fill="none"
        stroke-linecap="round" :stroke-dasharray="C_IN" :stroke-dashoffset="C_IN * (1 - aboveFraction)"
        transform="rotate(-90 70 70)"
      />
    </svg>
    <div class="center">
      <div>
        <div class="num serif">{{ formatStd(std) }}</div>
        <div class="of">{{ limit ? `of ${limit} today` : 'today' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatStd } from '../../lib/day'

const props = defineProps({
  std: { type: Number, default: 0 },      // standard drinks today
  limit: { type: Number, default: null }, // daily limit (null = not set)
})

const R = 63
const C = 2 * Math.PI * R
const R_IN = 50
const C_IN = 2 * Math.PI * R_IN

// Without a limit the ring shows one full turn per 3 drinks, just as a visual.
const scale = computed(() => props.limit || 3)
const mainFraction = computed(() => Math.min(props.std / scale.value, 1))
// Drinks above the limit: one inner turn = another full limit
const aboveFraction = computed(() => (props.limit && props.std > props.limit ? Math.min((props.std - props.limit) / props.limit, 1) : 0))
const ariaLabel = computed(() => `${formatStd(props.std)} standard drinks today${props.limit ? ` of a limit of ${props.limit}` : ''}`)
</script>

<style scoped>
.ring { position: relative; width: 140px; height: 140px; flex: none; }
.arc { transition: stroke-dashoffset .4s ease; }
.center { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; }
.num { font-size: 48px; line-height: 1; }
.of { font-size: 14px; color: var(--muted); margin-top: 4px; }
@media (prefers-reduced-motion: reduce) { .arc { transition: none; } }
</style>
