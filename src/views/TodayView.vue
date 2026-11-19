<!-- TodayView.vue — the Today screen (T-0588, mockup v2):
     ring vs daily limit, alcohol-free days this week, one-tap logging with undo,
     "Nothing today", this week's bars, and the coach card. -->
<template>
  <div class="screen">
    <header class="screen-head">
      <div class="date">{{ todayLabel }}</div>
      <h1>Today</h1>
    </header>

    <p v-if="loadError" class="error-text section" role="alert">{{ loadError }}</p>

    <!-- T-0623: nothing below shows before the first load, so no "0 today" flash -->
    <template v-if="loaded">
    <!-- Yesterday had nothing logged: ask once whether it was alcohol-free -->
    <div v-if="askYesterday" class="card section ask">
      <p>Yesterday has nothing logged. Was it alcohol-free?</p>
      <div class="ask-buttons">
        <button type="button" class="ghost" @click="markDay(yesterday, 'Yesterday marked alcohol-free')">Yes, alcohol-free</button>
        <button type="button" class="btn-2" @click="dismissYesterday">Not now</button>
      </div>
    </div>

    <section class="card section ring-card" aria-label="Today so far">
      <DrinkRing :std="todayStd" :limit="dailyLimit" />
      <div class="ring-text">
        <div class="ring-main" :class="{ free: todayStd === 0 }">{{ ringMessage }}</div>
        <div class="ring-sub">{{ dailyLimit ? 'Resets at midnight' : 'Set a daily limit in Me' }}</div>
        <div v-if="afThisWeek > 0" class="af-count">
          <AppIcon name="moon" />
          <span>{{ afThisWeek }} alcohol-free {{ afThisWeek === 1 ? 'day' : 'days' }} this week</span>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="log-label">
      <div id="log-label" class="label">Log a drink</div>
      <div class="tiles">
        <button
          v-for="(q, index) in quickDrinks" :key="index" type="button" class="tile"
          :class="{ flash: flashIndex === index }" :disabled="logging"
          :aria-label="`Log a ${typeLabel(q.type).toLowerCase()}, ${drinksLabel(q.std)}`"
          @click="quickLog(q, index)"
        >
          <AppIcon :name="iconFor(q.type)" />
          <span class="t">{{ typeLabel(q.type) }}</span>
          <span class="s">{{ drinksLabel(q.std) }}</span>
        </button>
        <button type="button" class="tile other" aria-label="Log another drink, with size and time" @click="sheetOpen = true">
          <AppIcon name="plus" />
          <span class="t">Other</span>
          <span class="s">size, time</span>
        </button>
      </div>
      <button v-if="showNothingToday" type="button" class="ghost nothing" @click="markDay(today, 'Today marked alcohol-free')">Nothing today</button>
      <p v-else-if="todayAf" class="af-today">Alcohol-free today</p>
    </section>

    <section class="section" aria-labelledby="week-label">
      <div class="row">
        <div id="week-label" class="label">This week</div>
        <div class="label">{{ weekSummary }}</div>
      </div>
      <DayBars :days="weekDays" :limit="dailyLimit" :today="today" />
    </section>

    <section v-if="coachOn" class="card coach" aria-labelledby="coach-label">
      <div id="coach-label" class="label">A thought for today</div>
      <div v-if="coachAnswer" class="coach-answer">
        <p v-for="(paragraph, index) in coachAnswer" :key="index">{{ paragraph }}</p>
      </div>
      <p v-else>{{ thought }}</p>
      <p v-if="coachError" class="error-text coach-error" role="alert">{{ coachError }}</p>
      <!-- T-0609: the first time, ask before anything goes to xAI -->
      <div v-if="consentOpen" class="coach-consent" role="group" aria-labelledby="coach-consent-text">
        <p id="coach-consent-text" class="coach-consent-text">
          To answer, the coach sends your drinks per day for the last 30 days, and how often you logged each
          place, company, drink type, mood and trigger, to xAI (the company behind Grok). Never your name or email.
          <router-link to="/privacy">Privacy</router-link>
        </p>
        <div class="coach-consent-buttons">
          <button type="button" class="btn-2" @click="consentOpen = false">Not now</button>
          <button type="button" class="btn-primary" :disabled="coachLoading" @click="agreeAndAsk">
            {{ coachLoading ? 'Thinking…' : 'Agree and ask' }}
          </button>
        </div>
      </div>
      <button v-else type="button" class="btn-2 ask-coach" :disabled="coachLoading" @click="onAskCoach">
        {{ coachLoading ? 'Thinking…' : coachAnswer ? 'Ask again' : 'Ask the coach' }}
      </button>
    </section>

    <!-- T-0623: the exercises from the old tracker (breathing, urge surfing, triggers, reframe) -->
    <SupportTools />
    </template>

    <AddDrinkSheet :open="sheetOpen" initial-type="other" @close="sheetOpen = false" @save="saveFromSheet" />
    <UndoToast :message="toast.message" :can-undo="Boolean(toast.undo)" @undo="runUndo" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '../components/ui/AppIcon.vue'
import DrinkRing from '../components/ui/DrinkRing.vue'
import DayBars from '../components/ui/DayBars.vue'
import UndoToast from '../components/ui/UndoToast.vue'
import AddDrinkSheet from '../components/AddDrinkSheet.vue'
import SupportTools from '../components/SupportTools.vue'
import {
  addDrink, deleteDrinkLog, getDays, getGoals, markAlcoholFree, unmarkAlcoholFree,
  getContextFrequencies, getMoodCorrelations, saveGoals,
} from '../services/db'
import { getGrokAdvice } from '../services/grok'
import { addDays, longDate, formatStd, drinksLabel } from '../lib/day'
import { DEFAULT_QUICK_DRINKS, typeLabel, iconFor } from '../lib/drinks'
import { todayThought, splitAdvice } from '../lib/coach'

// ---- State ----
const days = ref([])          // local days from Monday-1 to Sunday: [{ day, std, count, af }]
const goals = ref({ daily_limit: null, weekly_limit: null, af_days_goal: null, settings: {} })
const loadError = ref('')
const loaded = ref(false)     // true after the first load (success or error)
const logging = ref(false)
const flashIndex = ref(-1)
const sheetOpen = ref(false)
const toast = reactive({ message: '', undo: null })
const yesterdayDismissed = ref(sessionStorage.getItem('askYesterdayDismissed') === localToday())
const coachAnswer = ref(null)
const coachLoading = ref(false)
const coachError = ref('')
const consentOpen = ref(false) // T-0609: the "OK to send to xAI?" box
let toastTimer = null

// Today in the phone's own time zone ("YYYY-MM-DD")
function localToday() {
  return new Date().toLocaleDateString('en-CA')
}
const today = ref(localToday())
const yesterday = computed(() => addDays(today.value, -1))
// Monday of this week
const monday = computed(() => {
  const weekday = (new Date(`${today.value}T12:00:00`).getDay() + 6) % 7 // Monday = 0
  return addDays(today.value, -weekday)
})

// ---- Derived ----
const todayLabel = computed(() => longDate(today.value))
const dailyLimit = computed(() => goals.value.daily_limit || null)
const coachOn = computed(() => goals.value.settings?.coachOn !== false)
// Set by the server when the user agreed to send their numbers to xAI (T-0609)
const aiConsented = computed(() => Boolean(goals.value.settings?.aiConsentAt))
const quickDrinks = computed(() => goals.value.settings?.quickDrinks || DEFAULT_QUICK_DRINKS)
const dayEntry = day => days.value.find(d => d.day === day) || { day, std: 0, count: 0, af: false }
const todayEntry = computed(() => dayEntry(today.value))
const todayStd = computed(() => todayEntry.value.std)
const todayAf = computed(() => todayEntry.value.af)
const weekDays = computed(() => Array.from({ length: 7 }, (_, i) => dayEntry(addDays(monday.value, i))))
const weekStd = computed(() => weekDays.value.reduce((sum, d) => sum + d.std, 0))
const afThisWeek = computed(() => weekDays.value.filter(d => d.af).length)
const showNothingToday = computed(() => days.value.length > 0 && todayEntry.value.count === 0 && !todayAf.value)
const askYesterday = computed(() => {
  if (!days.value.length || yesterdayDismissed.value) return false
  const y = dayEntry(yesterday.value)
  return y.count === 0 && !y.af
})

const ringMessage = computed(() => {
  const std = todayStd.value
  const limit = dailyLimit.value
  if (std === 0) return 'Alcohol-free so far'
  if (!limit) return `${drinksLabel(std)} today`
  if (std < limit) return `${formatStd(limit - std)} left before your limit`
  if (std === limit) return 'At your limit for today'
  return `${formatStd(std - limit)} above your limit today, that's okay, tomorrow's new`
})

const weekSummary = computed(() => {
  const limit = goals.value.weekly_limit
  return limit ? `${formatStd(weekStd.value)} of ${limit} this week` : `${formatStd(weekStd.value)} this week`
})

const thought = computed(() => todayThought({
  todayStd: todayStd.value,
  dailyLimit: dailyLimit.value,
  afThisWeek: afThisWeek.value,
  weekDays: weekDays.value,
  today: today.value,
}))

// ---- Loading ----
async function load() {
  loadError.value = ''
  today.value = localToday()
  try {
    const [daysResult, goalsResult] = await Promise.all([
      getDays(addDays(monday.value, -1), addDays(monday.value, 6)),
      getGoals(),
    ])
    days.value = daysResult.days
    goals.value = { ...goals.value, ...goalsResult }
  } catch {
    loadError.value = "Couldn't load your day. Check your connection and try again."
  } finally {
    loaded.value = true
  }
}

// Adds a drink to the local numbers right away (the server already has it)
function bumpToday(std, count) {
  const entry = days.value.find(d => d.day === today.value)
  if (entry) {
    entry.std = Math.round((entry.std + std) * 10) / 10
    entry.count += count
    entry.af = false
  } else {
    days.value.push({ day: today.value, std, count, af: false })
  }
}

// ---- Toast ----
function showToast(message, undo = null) {
  clearTimeout(toastTimer)
  toast.message = message
  toast.undo = undo
  toastTimer = setTimeout(() => { toast.message = ''; toast.undo = null }, 5000)
}

async function runUndo() {
  const undo = toast.undo
  clearTimeout(toastTimer)
  toast.message = ''
  toast.undo = null
  if (!undo) return
  try {
    await undo()
  } catch {
    showToast("Couldn't undo. Please try again.")
  }
  await load()
}

// ---- Actions ----
async function quickLog(quick, index) {
  if (logging.value) return
  logging.value = true
  flashIndex.value = index
  setTimeout(() => { flashIndex.value = -1 }, 300)
  try {
    const row = await addDrink({ drink_type: quick.type, std_drinks: quick.std })
    bumpToday(Number(row.std_drinks ?? quick.std), 1)
    showToast(`${typeLabel(quick.type)} logged`, () => deleteDrinkLog(row.id))
  } catch {
    showToast("Couldn't log that drink. Please try again.")
  } finally {
    logging.value = false
  }
}

// From the Add sheet: saves `count` drinks of the same kind
async function saveFromSheet({ drink, count, done, fail }) {
  try {
    const rows = []
    for (let i = 0; i < count; i++) rows.push(await addDrink(drink))
    sheetOpen.value = false
    done()
    await load()
    const label = count > 1 ? `${count} drinks logged` : `${typeLabel(drink.drink_type)} logged`
    showToast(label, () => Promise.all(rows.map(r => deleteDrinkLog(r.id))))
  } catch (err) {
    fail(new Error("Couldn't save. Please try again."))
  }
}

async function markDay(day, message) {
  try {
    await markAlcoholFree(day)
    await load()
    showToast(message, () => unmarkAlcoholFree(day))
  } catch {
    showToast("Couldn't save that. Please try again.")
  }
}

function dismissYesterday() {
  sessionStorage.setItem('askYesterdayDismissed', today.value)
  yesterdayDismissed.value = true
}

// Asks the AI coach (counts against the daily AI limit, so only on tap)
async function askCoach() {
  coachLoading.value = true
  coachError.value = ''
  try {
    const [month, contextFrequencies, moodCorrelations] = await Promise.all([
      getDays(addDays(today.value, -29), today.value),
      getContextFrequencies(),
      getMoodCorrelations(),
    ])
    const historicalDrinkingPatterns = Object.fromEntries(month.days.map(d => [d.day, d.af ? 'alcohol-free' : d.std]))
    // T-0623: how often each trigger was picked when logging (counts only, never notes)
    const triggers = Object.entries(contextFrequencies?.trigger || {})
      .sort((a, b) => b[1] - a[1])
      .map(([trigger, count]) => ({ trigger, count }))
    const advice = await getGrokAdvice({ triggers, historicalDrinkingPatterns, contextFrequencies, moodCorrelations, reflections: [] })
    coachAnswer.value = splitAdvice(advice)
  } catch (err) {
    coachError.value = err?.message || "The coach couldn't answer right now."
  } finally {
    coachLoading.value = false
  }
}

// "Ask the coach": nothing goes to xAI before the user agreed once (T-0609)
function onAskCoach() {
  if (!aiConsented.value) {
    consentOpen.value = true
    return
  }
  askCoach()
}

// Saves the yes (the server stamps the time), then asks the coach
async function agreeAndAsk() {
  coachError.value = ''
  coachLoading.value = true
  try {
    await saveGoals({ settings: { aiConsent: true } })
  } catch {
    coachError.value = "Couldn't save your choice. Please try again."
    coachLoading.value = false
    return
  }
  goals.value = { ...goals.value, settings: { ...goals.value.settings, aiConsentAt: new Date().toISOString() } }
  consentOpen.value = false
  await askCoach()
}

// Reload when the app comes back to the front (the day may have changed)
function onVisible() {
  if (document.visibilityState === 'visible') load()
}

onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<style scoped>
.ring-card { display: flex; align-items: center; gap: 20px; }
.ring-main { font-size: 16px; font-weight: 600; line-height: 1.35; }
.ring-main.free { color: var(--free); }
.ring-sub { font-size: 14px; color: var(--muted); margin-top: 4px; }
.af-count { margin-top: 16px; display: flex; gap: 8px; align-items: flex-start; color: var(--free); font-size: 14px; font-weight: 500; line-height: 1.35; }
.af-count .i { width: 18px; height: 18px; margin-top: 1px; }

.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.tile {
  height: 72px; border-radius: 14px; background: var(--surface); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px; transition: background .3s;
}
.tile .t { font-size: 14px; font-weight: 600; line-height: 1.2; }
.tile .s { font-size: 12px; color: var(--muted); line-height: 1.2; }
.tile.other { background: transparent; border: 1px dashed rgba(255, 240, 220, .2); }
.tile.flash { background: var(--drink); color: var(--on-drink); }
.tile.flash .s { color: var(--on-drink); }
.tile:disabled { opacity: 1; }
.nothing { margin-top: 12px; }
.af-today { margin-top: 12px; color: var(--free); font-size: 14px; font-weight: 500; text-align: center; }

.row { display: flex; justify-content: space-between; align-items: baseline; }

.coach p { font-size: 16px; line-height: 1.5; }
.coach-answer { display: grid; gap: 8px; }
.coach-error { margin-top: 8px; font-size: 14px; }
.ask-coach { margin-top: 16px; }
.coach-consent { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--line); }
.coach .coach-consent-text { font-size: 14px; line-height: 1.45; color: var(--muted); margin: 0 0 12px; }
.coach-consent-text a { color: var(--drink); text-decoration: underline; }
.coach-consent-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.ask p { margin-bottom: 12px; }
.ask-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

@media (prefers-reduced-motion: reduce) { .tile { transition: none; } }
</style>
