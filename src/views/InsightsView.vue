<!-- InsightsView.vue — patterns for Week / Month / Year (T-0588, mockup v2):
     the chart vs the daily limit, per week, alcohol-free days, top trigger, mood,
     and a short summary written from the numbers (no AI call). -->
<template>
  <div class="screen">
    <header class="screen-head">
      <div class="date">Your patterns</div>
      <h1>Insights</h1>
    </header>

    <div class="seg" role="tablist" aria-label="Period">
      <button
        v-for="r in RANGE_TABS" :key="r.range" type="button" role="tab" :aria-selected="range === r.range"
        :class="{ on: range === r.range }" @click="setRange(r.range)"
      >{{ r.label }}</button>
    </div>

    <p v-if="loadError" class="error-text section" role="alert">{{ loadError }}</p>

    <template v-if="summary">
      <section class="section" aria-labelledby="chart-label">
        <div id="chart-label" class="label">{{ chartTitle }}</div>
        <DayBars
          :days="chartDays" :limit="chartLimit" :today="summary.to"
          :show-labels="range === 'week'" :show-limit-label="Boolean(chartLimit)" :bar-width="barWidth"
        />
        <div class="legend">
          <span><i class="sw" style="background: var(--drink)"></i>Drinks</span>
          <span><i class="sw" style="background: var(--above)"></i>Above limit</span>
          <span v-if="range !== 'year'"><i class="sw round" style="background: var(--free)"></i>Alcohol-free</span>
        </div>
      </section>

      <section class="section grid2" aria-label="Numbers">
        <div class="cell">
          <div class="k">Per week</div>
          <div class="v serif">{{ formatStd(summary.perWeek) }}</div>
          <div class="s" :class="{ good: summary.changePct !== null && summary.changePct < 0 }">{{ changeText }}</div>
        </div>
        <div class="cell">
          <div class="k">Alcohol-free days</div>
          <div class="v serif">{{ summary.afDays }} of {{ summary.dayCount }}</div>
          <div class="s">{{ goals.af_days_goal ? `goal ${goals.af_days_goal} a week` : 'tap "Nothing today" to count one' }}</div>
        </div>
        <div class="cell">
          <div class="k">Top trigger</div>
          <div class="v t serif">{{ summary.topTrigger ? summary.topTrigger.name : '–' }}</div>
          <div class="s">{{ summary.topTrigger ? timesText(summary.topTrigger.count) : 'add context when you log' }}</div>
        </div>
        <div class="cell">
          <div class="k">Mood when drinking</div>
          <div class="v t serif">{{ summary.topMood ? summary.topMood.name : '–' }}</div>
          <div class="s">{{ summary.topMood ? `${summary.topMood.pct}% of drinks with a mood` : 'add context when you log' }}</div>
        </div>
      </section>

      <section v-if="points.length" class="card" aria-labelledby="short-label">
        <div id="short-label" class="label">{{ shortTitle }}</div>
        <ol class="tips">
          <li v-for="(point, index) in points" :key="index"><span class="n serif">{{ index + 1 }}</span><span>{{ point }}</span></li>
        </ol>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DayBars from '../components/ui/DayBars.vue'
import { getInsights, getGoals } from '../services/db'
import { formatStd } from '../lib/day'
import { insightPoints, weeklyBuckets } from '../lib/insightsText'

const RANGE_TABS = [
  { range: 'week', label: 'Week' },
  { range: 'month', label: 'Month' },
  { range: 'year', label: 'Year' },
]
const range = ref('month')
const summary = ref(null)
const goals = ref({ daily_limit: null, weekly_limit: null, af_days_goal: null })
const loadError = ref('')

const chartTitle = computed(() => ({ week: 'Last 7 days', month: 'Last 30 days', year: 'Last 12 months, per week' })[range.value])
const shortTitle = computed(() => ({ week: 'This week, in short', month: 'This month, in short', year: 'This year, in short' })[range.value])
// The year shows weekly totals against the weekly limit; week and month show days
const chartDays = computed(() => (range.value === 'year' ? weeklyBuckets(summary.value.days) : summary.value.days))
const chartLimit = computed(() => (range.value === 'year' ? goals.value.weekly_limit : goals.value.daily_limit) || null)
const barWidth = computed(() => ({ week: 22, month: 7, year: 4 })[range.value])
const previousName = computed(() => ({ week: 'last week', month: 'last month', year: 'last year' })[range.value])
const changeText = computed(() => {
  const pct = summary.value.changePct
  if (pct === null) return `no data for ${previousName.value} yet`
  if (pct === 0) return `same as ${previousName.value}`
  return `${pct < 0 ? '▼' : '▲'} ${Math.abs(pct)}% vs ${previousName.value}`
})
const points = computed(() => (summary.value ? insightPoints(summary.value, goals.value, range.value) : []))

const timesText = n => (n === 1 ? 'once' : `${n} times`)

async function load() {
  loadError.value = ''
  try {
    summary.value = await getInsights(range.value)
  } catch {
    loadError.value = "Couldn't load your insights. Check your connection and try again."
  }
}

function setRange(next) {
  if (next === range.value) return
  range.value = next
  load()
}

onMounted(async () => {
  load()
  try {
    goals.value = { ...goals.value, ...(await getGoals()) }
  } catch {
    // Goals only add the limit line and the goal text
  }
})
</script>

<style scoped>
.seg { display: grid; grid-template-columns: repeat(3, 1fr); background: var(--surface); border-radius: 999px; padding: 4px; margin-bottom: 24px; }
.seg button { height: 36px; border-radius: 999px; font-size: 14px; font-weight: 500; color: var(--muted); }
.seg button.on { background: var(--surface-2); color: var(--ink); }
.legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; font-size: 12px; color: var(--muted); }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.sw { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.sw.round { border-radius: 50%; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--line); }
.cell { padding: 16px 0; border-bottom: 1px solid var(--line); min-width: 0; }
.cell:nth-child(odd) { border-right: 1px solid var(--line); padding-right: 16px; }
.cell:nth-child(even) { padding-left: 16px; }
.k { font-size: 14px; color: var(--muted); font-weight: 500; }
.v { font-size: 28px; line-height: 1.25; margin: 2px 0; }
.v.t { font-size: 20px; line-height: 1.4; overflow-wrap: anywhere; }
.s { font-size: 14px; color: var(--muted); }
.s.good { color: var(--free); }
.tips { list-style: none; display: grid; gap: 12px; }
.tips li { display: flex; gap: 12px; font-size: 16px; line-height: 1.5; }
/* Fixed-width number column, so every point's text starts on the same line ("1" is narrower than "2") */
.tips .n { color: var(--drink); font-size: 18px; line-height: 1.4; flex: none; min-width: 14px; text-align: center; }
</style>
