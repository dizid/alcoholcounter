<!-- DayBars.vue — bars per day vs the daily limit (Today's week, Insights' 30 days).
     Sand = drinks, clay = only the part above the limit, sage dot = alcohol-free day,
     nothing = not logged. The limit is a faint line, labelled on the right. -->
<template>
  <div class="bars" :style="{ '--cols': days.length }">
    <div class="plot" :class="{ gutter: showLimitLabel && limit }" :style="{ height: PLOT_H + 'px' }" role="img" :aria-label="ariaLabel">
      <div v-if="limit" class="limit" :style="{ bottom: limitY + 'px' }">
        <span v-if="showLimitLabel" class="limit-label">daily limit</span>
      </div>
      <div v-for="d in days" :key="d.day" class="col">
        <div v-if="d.std > 0" class="bar" :style="{ height: barHeight(d.std) + 'px', width: barWidth + 'px' }">
          <div v-if="above(d.std) > 0" class="ab" :style="{ height: scaleY(above(d.std)) + 'px' }"></div>
          <div class="dr"></div>
        </div>
        <div v-else-if="d.af" class="dot"></div>
      </div>
    </div>
    <div v-if="showLabels" class="labels">
      <span v-for="d in days" :key="d.day" :class="{ today: d.day === today }">{{ dayLetter(d.day) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { dayLetter } from '../../lib/day'

const props = defineProps({
  days: { type: Array, required: true },     // [{ day, std, af }]
  limit: { type: Number, default: null },    // daily limit
  today: { type: String, default: '' },
  showLabels: { type: Boolean, default: true },
  showLimitLabel: { type: Boolean, default: false },
  barWidth: { type: Number, default: 22 },
})

const PLOT_H = 96
// The tallest bar fills the plot; the limit line sits at least at half height.
const maxValue = computed(() => Math.max(...props.days.map(d => d.std), (props.limit || 2) * 2, 1))
const scaleY = value => Math.round((value / maxValue.value) * (PLOT_H - 8))
const barHeight = std => Math.max(scaleY(std), 4)
const above = std => (props.limit ? Math.max(std - props.limit, 0) : 0)
const limitY = computed(() => scaleY(props.limit || 0))

const ariaLabel = computed(() => {
  const drinkDays = props.days.filter(d => d.std > 0).length
  const afDays = props.days.filter(d => d.af).length
  return `${drinkDays} days with drinks, ${afDays} alcohol-free days`
})
</script>

<style scoped>
.plot {
  position: relative; display: grid; grid-template-columns: repeat(var(--cols), 1fr); align-items: end;
}
.limit { position: absolute; left: 0; right: 0; height: 1px; background: rgba(242, 236, 228, .25); }
/* With a label, the bars leave a gutter on the right so the label never covers a bar */
.plot.gutter { padding-right: 76px; }
.limit-label {
  position: absolute; right: 0; bottom: 4px; padding: 1px 8px; border-radius: 999px;
  background: var(--surface); color: var(--muted); font-size: 12px; line-height: 1.4; white-space: nowrap;
}
.col { display: flex; justify-content: center; align-items: flex-end; height: 100%; }
.bar { border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; max-width: 80%; }
.ab { background: var(--above); flex: none; }
.dr { background: var(--drink); flex: 1; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--free); }
.labels {
  display: grid; grid-template-columns: repeat(var(--cols), 1fr); margin-top: 8px;
  font-size: 12px; color: var(--muted); text-align: center;
}
.labels .today { color: var(--ink); font-weight: 700; }
</style>
