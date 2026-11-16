<!-- AppIcon.vue — 24px line icons, 1.75 stroke, no emoji (T-0588 mockup v2) -->
<template>
  <svg class="i" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path v-for="(d, index) in paths" :key="index" :d="d" />
    <circle v-for="(c, index) in circles" :key="'c' + index" :cx="c[0]" :cy="c[1]" :r="c[2]" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ name: { type: String, required: true } })

// Path data per icon name (from the approved mockup)
const ICONS = {
  beer: ['M6 8h9v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z', 'M15 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2', 'M6 8a2.5 2.5 0 0 1 3-3.5 2.5 2.5 0 0 1 4.5 0A2.5 2.5 0 0 1 15 8', 'M9.5 12v5M12 12v5'],
  wine: ['M8 3h8l-.4 5.2a3.6 3.6 0 0 1-7.2 0z', 'M8.3 7h7.4', 'M12 11.8V20', 'M8.5 20.5h7'],
  spirit: ['M5 6h14l-1.6 13.2a2 2 0 0 1-2 1.8H8.6a2 2 0 0 1-2-1.8z', 'M5.9 13h12.2'],
  plus: ['M12 6v12M6 12h12'],
  minus: ['M6 12h12'],
  moon: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
  chev: ['M9 6l6 6-6 6'],
  'chev-d': ['M6 9l6 6 6-6'],
  today: ['M12 4a8 8 0 0 1 8 8'],
  log: ['M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01'],
  insights: ['M5 20V12M11 20V5M17 20v-9M3 20.5h18'],
  me: ['M4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5'],
  close: ['M6 6l12 12M18 6L6 18'],
}
const CIRCLES = {
  today: [[12, 12, 8]],
  me: [[12, 8, 4]],
}

const paths = computed(() => ICONS[props.name] || [])
const circles = computed(() => CIRCLES[props.name] || [])
</script>
