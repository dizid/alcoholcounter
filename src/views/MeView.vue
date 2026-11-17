<!-- MeView.vue — goals, quick drinks, coach, export and account (T-0588, mockup v2).
     Grouped plain rows, no cards. Left out for now (need Marc's OK or more setup):
     reminders, app lock and "Delete all my data" (by email for now, see the privacy notice).
     T-0609 added the privacy notice link and the Google Analytics switch. -->
<template>
  <div class="screen">
    <header class="screen-head me-head">
      <h1>Me</h1>
      <div class="date">Signed in with Google<template v-if="maskedEmail"> · {{ maskedEmail }}</template></div>
    </header>

    <p v-if="error" class="error-text" role="alert">{{ error }}</p>

    <h2 class="group">Goals</h2>
    <div v-for="g in GOAL_ROWS" :key="g.key" class="r">
      <span :id="`goal-${g.key}`">{{ g.label }}</span>
      <div class="stepper" role="group" :aria-labelledby="`goal-${g.key}`">
        <button type="button" :aria-label="`Lower ${g.label.toLowerCase()}`" :disabled="(goals[g.key] ?? 0) <= 0" @click="changeGoal(g, -1)"><AppIcon name="minus" /></button>
        <span class="val" aria-live="polite">{{ goals[g.key] == null ? 'Not set' : `${goals[g.key]} ${g.unit}` }}</span>
        <button type="button" :aria-label="`Raise ${g.label.toLowerCase()}`" :disabled="(goals[g.key] ?? 0) >= g.max" @click="changeGoal(g, 1)"><AppIcon name="plus" /></button>
      </div>
    </div>

    <h2 class="group">Drinks</h2>
    <button type="button" class="r row-button" :aria-expanded="editQuick" @click="editQuick = !editQuick">
      <span>My quick drinks</span>
      <span class="val">{{ quickSummary }}<AppIcon name="chev" :class="{ down: editQuick }" /></span>
    </button>
    <div v-if="editQuick" class="quick-edit">
      <div v-for="(q, index) in quickDraft" :key="index" class="quick-row">
        <label class="sr-only" :for="`quick-type-${index}`">Tile {{ index + 1 }} type</label>
        <select :id="`quick-type-${index}`" v-model="q.type">
          <option v-for="d in DRINK_TYPES" :key="d.type" :value="d.type">{{ d.label }}</option>
        </select>
        <label class="sr-only" :for="`quick-size-${index}`">Tile {{ index + 1 }} size</label>
        <select :id="`quick-size-${index}`" v-model="q.size">
          <option v-for="s in SIZES" :key="s.size" :value="s.size">{{ s.label }} ({{ formatStd(stdFor(q.type, s.size)) }})</option>
        </select>
      </div>
      <button type="button" class="btn-primary" :disabled="savingQuick" @click="saveQuick">{{ savingQuick ? 'Saving…' : 'Save quick drinks' }}</button>
    </div>

    <h2 class="group">Coach</h2>
    <div class="r">
      <div class="txt" id="coach-label">Coach<small>When you ask, sends your daily counts and patterns to xAI (Grok), never your name or email. Off also withdraws your OK</small></div>
      <button
        type="button" class="tg" role="switch" :aria-checked="coachOn" aria-labelledby="coach-label"
        :class="{ on: coachOn }" @click="toggleCoach"
      ></button>
    </div>

    <h2 class="group">Privacy</h2>
    <button type="button" class="r row-button" :disabled="exporting" @click="exportCsv">
      <span>{{ exporting ? 'Preparing your file…' : 'Export my data (CSV)' }}</span>
      <span class="val"><AppIcon name="chev" /></span>
    </button>
    <div class="r">
      <div class="txt" id="analytics-label">Google Analytics<small>Counts visits with cookies in this browser. Never your drinks or moods</small></div>
      <button
        type="button" class="tg" role="switch" :aria-checked="analyticsOn" aria-labelledby="analytics-label"
        :class="{ on: analyticsOn }" @click="toggleAnalytics"
      ></button>
    </div>
    <router-link to="/privacy" class="r row-button"><span>Privacy notice</span><span class="val"><AppIcon name="chev" /></span></router-link>

    <h2 class="group sr-only">More</h2>
    <router-link to="/about-tracker" class="r row-button first"><span>About</span><span class="val"><AppIcon name="chev" /></span></router-link>
    <router-link to="/feedback" class="r row-button"><span>Feedback</span><span class="val"><AppIcon name="chev" /></span></router-link>
    <button type="button" class="r row-button" @click="signOut"><span>Sign out</span><span class="val"></span></button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/ui/AppIcon.vue'
import { useUserStore } from '../stores/user'
import { logout } from '../firebase'
import { getGoals, saveGoals, getRecentDrinkLogs } from '../services/db'
import { DRINK_TYPES, SIZES, DEFAULT_QUICK_DRINKS, stdFor, typeLabel } from '../lib/drinks'
import { formatStd } from '../lib/day'
import { drinksToCsv } from '../lib/exportCsv'
import { getAnalyticsChoice, setAnalyticsChoice } from '../lib/analytics'

const GOAL_ROWS = [
  { key: 'daily_limit', label: 'Daily limit', unit: 'drinks', max: 50 },
  { key: 'weekly_limit', label: 'Weekly limit', unit: 'drinks', max: 200 },
  { key: 'af_days_goal', label: 'Alcohol-free days', unit: 'a week', max: 7 },
]

const router = useRouter()
const userStore = useUserStore()
const goals = reactive({ daily_limit: null, weekly_limit: null, af_days_goal: null })
const settings = ref({})
const error = ref('')
const editQuick = ref(false)
const quickDraft = ref([])
const savingQuick = ref(false)
const exporting = ref(false)
let goalTimer = null

// m•••@gmail.com
const maskedEmail = computed(() => {
  const email = userStore.user?.email || ''
  const [name, domain] = email.split('@')
  return name && domain ? `${name.charAt(0)}•••@${domain}` : ''
})
const coachOn = computed(() => settings.value.coachOn !== false)
const quickDrinks = computed(() => settings.value.quickDrinks || DEFAULT_QUICK_DRINKS)
const quickSummary = computed(() => quickDrinks.value.map(q => typeLabel(q.type)).join(', '))

// The size whose standard drinks match a saved quick drink (for the editor)
function sizeOf(q) {
  const match = SIZES.find(s => stdFor(q.type, s.size) === q.std)
  return match ? match.size : 'regular'
}

async function load() {
  try {
    const result = await getGoals()
    Object.assign(goals, { daily_limit: result.daily_limit, weekly_limit: result.weekly_limit, af_days_goal: result.af_days_goal })
    settings.value = result.settings || {}
  } catch {
    error.value = "Couldn't load your settings. Check your connection and try again."
  }
  quickDraft.value = quickDrinks.value.map(q => ({ type: q.type, size: sizeOf(q) }))
}

// Steppers save shortly after the last tap
function changeGoal(row, step) {
  const current = goals[row.key] ?? (step > 0 ? 0 : 1)
  goals[row.key] = Math.min(Math.max(current + step, 0), row.max)
  clearTimeout(goalTimer)
  goalTimer = setTimeout(saveLimits, 600)
}

async function saveLimits() {
  error.value = ''
  try {
    await saveGoals({ daily_limit: goals.daily_limit, weekly_limit: goals.weekly_limit, af_days_goal: goals.af_days_goal })
  } catch {
    error.value = "Couldn't save your goals. Please try again."
  }
}

async function saveQuick() {
  savingQuick.value = true
  error.value = ''
  const quick = quickDraft.value.map(q => ({ type: q.type, std: stdFor(q.type, q.size) }))
  try {
    await saveGoals({ settings: { quickDrinks: quick } })
    settings.value = { ...settings.value, quickDrinks: quick }
    editQuick.value = false
  } catch {
    error.value = "Couldn't save your quick drinks. Please try again."
  } finally {
    savingQuick.value = false
  }
}

// Turning the coach off also withdraws the OK to send data to xAI (T-0609);
// turning it on again asks for that OK before the next answer.
async function toggleCoach() {
  const previous = settings.value
  const next = !coachOn.value
  settings.value = next ? { ...previous, coachOn: true } : { ...previous, coachOn: false, aiConsentAt: null }
  try {
    await saveGoals({ settings: next ? { coachOn: true } : { coachOn: false, aiConsent: false } })
  } catch {
    settings.value = previous
    error.value = "Couldn't save that. Please try again."
  }
}

// Google Analytics on/off for this browser (T-0609, same choice as the banner)
const analyticsOn = ref(getAnalyticsChoice() === 'granted')
function toggleAnalytics() {
  analyticsOn.value = !analyticsOn.value
  setAnalyticsChoice(analyticsOn.value ? 'granted' : 'denied')
}

// Downloads all drinks as a CSV file (fetched 100 at a time)
async function exportCsv() {
  exporting.value = true
  error.value = ''
  try {
    const all = []
    for (let offset = 0; offset < 20000; offset += 100) {
      const page = await getRecentDrinkLogs(100, offset)
      all.push(...page)
      if (page.length < 100) break
    }
    const blob = new Blob([drinksToCsv(all)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `drinktracker-${new Date().toLocaleDateString('en-CA')}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch {
    error.value = "Couldn't export your data. Please try again."
  } finally {
    exporting.value = false
  }
}

async function signOut() {
  await logout()
  router.push('/login')
}

onMounted(load)
</script>

<style scoped>
.me-head { margin-bottom: 8px; }
.group { font-family: var(--sans); font-size: 14px; color: var(--muted); font-weight: 500; margin: 24px 0 4px; line-height: 1.5; }
.r {
  width: 100%; min-height: 52px; display: flex; align-items: center; justify-content: space-between; gap: 12px;
  border-bottom: 1px solid var(--line); text-align: left; color: var(--ink); text-decoration: none;
}
.r.first { border-top: 1px solid var(--line); margin-top: 24px; }
.val { color: var(--muted); display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.val .i { width: 16px; height: 16px; }
.down { transform: rotate(90deg); }
.txt { padding-top: 8px; }
.txt small { display: block; font-size: 12px; color: var(--muted); line-height: 1.4; padding-bottom: 8px; }
.stepper { display: flex; align-items: center; gap: 12px; }
.stepper button { width: 32px; height: 32px; border-radius: 50%; background: var(--surface-2); display: grid; place-items: center; }
.stepper button .i { width: 18px; height: 18px; }
.stepper .val { min-width: 76px; justify-content: center; font-variant-numeric: tabular-nums; }
.tg { width: 44px; height: 26px; border-radius: 999px; background: var(--surface-2); position: relative; flex: none; transition: background .2s; }
.tg::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: var(--muted); transition: transform .2s; }
.tg.on { background: var(--drink); }
.tg.on::after { transform: translateX(18px); background: var(--on-drink); }
.quick-edit { display: grid; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--line); }
.quick-row { display: grid; grid-template-columns: 1fr 1.3fr; gap: 8px; }
@media (prefers-reduced-motion: reduce) { .tg, .tg::after { transition: none; } }
</style>
