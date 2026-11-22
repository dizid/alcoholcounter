<!-- LogView.vue — history + add (T-0588, mockup v2): a strip of the last 14 days,
     the selected day's drinks (tap to edit or delete, with undo), alcohol-free
     marks, and the "+ Add drink" button. -->
<template>
  <div class="screen">
    <header class="screen-head">
      <div class="date">{{ monthLabel }}</div>
      <h1>Log</h1>
    </header>

    <div ref="stripEl" class="strip" role="tablist" aria-label="Last 14 days">
      <button
        v-for="d in stripDays" :key="d.day" type="button" class="d" :class="{ on: d.day === selected }"
        role="tab" :aria-selected="d.day === selected" :aria-label="dayAria(d)" @click="selected = d.day"
      >
        {{ dayLetter(d.day) }}<b>{{ dayOfMonth(d.day) }}</b><i :class="{ af: d.af }"></i>
      </button>
    </div>

    <p v-if="loadError" class="error-text section" role="alert">{{ loadError }}</p>

    <section aria-live="polite">
      <div class="day-total serif">{{ selectedTitle }}<template v-if="selectedDrinks.length"> · {{ drinksLabel(selectedEntry.std) }}</template></div>

      <ul v-if="selectedDrinks.length" class="entries">
        <li v-for="drink in selectedDrinks" :key="drink.id">
          <button type="button" class="entry" :aria-label="`Edit ${entryLabel(drink)} at ${timeOfDay(drink.created_at)}`" @click="edit(drink)">
            <span class="tm">{{ timeOfDay(drink.created_at) }}</span>
            <AppIcon :name="iconFor(drink.drink_type)" />
            <span class="what">
              {{ entryLabel(drink) }}
              <!-- T-0623: the context added when logging (trigger, mood, note) -->
              <span v-if="contextLine(drink)" class="ctx">{{ contextLine(drink) }}</span>
              <span v-if="drink.note" class="note">{{ drink.note }}</span>
            </span>
            <span class="amt">{{ formatStd(drink.std_drinks) }}</span>
          </button>
        </li>
      </ul>

      <div v-else-if="loaded" class="empty">
        <p v-if="selectedEntry.af" class="free">Alcohol-free</p>
        <p v-else class="muted">Nothing logged</p>
        <div class="empty-buttons">
          <button type="button" class="btn-2" @click="openAdd">Add a drink</button>
          <button v-if="selectedEntry.af" type="button" class="ghost" @click="unmark(selected)">Unmark alcohol-free</button>
          <button v-else type="button" class="ghost" @click="mark(selected)">Mark alcohol-free</button>
        </div>
      </div>
    </section>

    <button type="button" class="fab" @click="openAdd"><AppIcon name="plus" />Add drink</button>

    <AddDrinkSheet
      :open="sheetOpen" :drink="editingDrink" :default-date="selected"
      @close="closeSheet" @save="saveFromSheet" @delete="removeDrink"
    />
    <UndoToast :message="toast.message" :can-undo="Boolean(toast.undo)" @undo="runUndo" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import AppIcon from '../components/ui/AppIcon.vue'
import UndoToast from '../components/ui/UndoToast.vue'
import AddDrinkSheet from '../components/AddDrinkSheet.vue'
import { getDrinksBetween, getDays, addDrink, updateDrink, deleteDrinkLog, markAlcoholFree, unmarkAlcoholFree } from '../services/db'
import { addDays, dayLetter, dayOfMonth, monthName, timeOfDay, formatStd, drinksLabel, longDate } from '../lib/day'
import { typeLabel, iconFor } from '../lib/drinks'

const STRIP_DAYS = 14
const today = ref(new Date().toLocaleDateString('en-CA'))
const selected = ref(today.value)
const drinks = ref([])   // drinks of the strip's days, each with `day`
const days = ref([])     // [{ day, std, count, af }]
const loaded = ref(false)
const loadError = ref('')
const sheetOpen = ref(false)
const editingDrink = ref(null)
const toast = reactive({ message: '', undo: null })
const stripEl = ref(null)
let toastTimer = null

const from = computed(() => addDays(today.value, -(STRIP_DAYS - 1)))
const stripDays = computed(() => Array.from({ length: STRIP_DAYS }, (_, i) => {
  const day = addDays(from.value, i)
  return days.value.find(d => d.day === day) || { day, std: 0, count: 0, af: false }
}))
const selectedEntry = computed(() => stripDays.value.find(d => d.day === selected.value) || { std: 0, af: false })
const selectedDrinks = computed(() => drinks.value
  .filter(d => d.day === selected.value)
  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)))
const monthLabel = computed(() => monthName(selected.value))
const selectedTitle = computed(() => {
  if (selected.value === today.value) return 'Today'
  if (selected.value === addDays(today.value, -1)) return 'Yesterday'
  return longDate(selected.value)
})

// "Wine, large" (older entries without a size: just the type)
function entryLabel(drink) {
  return drink.size ? `${typeLabel(drink.drink_type)}, ${drink.size}` : typeLabel(drink.drink_type)
}

// "Social · Happy" from the trigger and mood (older entries: place and company)
function contextLine(drink) {
  return [drink.trigger, drink.mood, drink.location, drink.company].filter(Boolean).join(' · ')
}

function dayAria(d) {
  const status = d.af ? ', alcohol-free' : d.count ? `, ${drinksLabel(d.std)}` : ''
  return `${longDate(d.day)}${status}`
}

async function load() {
  loadError.value = ''
  today.value = new Date().toLocaleDateString('en-CA')
  try {
    const [drinkRows, dayResult] = await Promise.all([
      getDrinksBetween(from.value, today.value),
      getDays(from.value, today.value),
    ])
    drinks.value = drinkRows
    days.value = dayResult.days
  } catch {
    loadError.value = "Couldn't load your log. Check your connection and try again."
  } finally {
    loaded.value = true
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
  try { await undo() } catch { showToast("Couldn't undo. Please try again.") }
  await load()
}

// ---- Sheet ----
function openAdd() {
  editingDrink.value = null
  sheetOpen.value = true
}
function edit(drink) {
  editingDrink.value = drink
  sheetOpen.value = true
}
function closeSheet() {
  sheetOpen.value = false
}

async function saveFromSheet({ drink, count, done, fail }) {
  try {
    if (editingDrink.value) {
      const before = editingDrink.value
      await updateDrink(before.id, drink)
      sheetOpen.value = false
      done()
      await load()
      const previous = { drink_type: before.drink_type, size: before.size, std_drinks: Number(before.std_drinks), trigger: before.trigger, mood: before.mood, note: before.note, created_at: before.created_at }
      showToast('Drink updated', () => updateDrink(before.id, previous))
    } else {
      const rows = []
      for (let i = 0; i < count; i++) rows.push(await addDrink(drink))
      sheetOpen.value = false
      done()
      await load()
      showToast(count > 1 ? `${count} drinks logged` : `${typeLabel(drink.drink_type)} logged`, () => Promise.all(rows.map(r => deleteDrinkLog(r.id))))
    }
  } catch {
    fail(new Error("Couldn't save. Please try again."))
  }
}

// Deletes a drink; Undo logs it again with the same details and time
async function removeDrink(drink) {
  try {
    await deleteDrinkLog(drink.id)
    sheetOpen.value = false
    await load()
    const copy = { drink_type: drink.drink_type, size: drink.size, std_drinks: Number(drink.std_drinks), trigger: drink.trigger, mood: drink.mood, note: drink.note, location: drink.location, company: drink.company, created_at: drink.created_at }
    showToast('Drink deleted', () => addDrink(copy))
  } catch {
    showToast("Couldn't delete that drink. Please try again.")
  }
}

async function mark(day) {
  try {
    await markAlcoholFree(day)
    await load()
    showToast('Marked alcohol-free', () => unmarkAlcoholFree(day))
  } catch {
    showToast("Couldn't save that. Please try again.")
  }
}
async function unmark(day) {
  try {
    await unmarkAlcoholFree(day)
    await load()
    showToast('Alcohol-free mark removed', () => markAlcoholFree(day))
  } catch {
    showToast("Couldn't save that. Please try again.")
  }
}

onMounted(async () => {
  await load()
  // Show the newest days (today sits at the right end of the strip)
  await nextTick()
  if (stripEl.value) stripEl.value.scrollLeft = stripEl.value.scrollWidth
})
onBeforeUnmount(() => clearTimeout(toastTimer))
</script>

<style scoped>
/* Room for the floating "Add drink" button (16 px gap + 48 px button + 16 px) above the
   bottom nav, so the last entry can always scroll clear of it (the shared .screen leaves 24 px) */
.screen { padding-bottom: calc(var(--nav-h) + var(--safe) + 80px); }
.strip { display: flex; gap: 6px; margin: 0 -20px 24px; padding: 0 20px; overflow-x: auto; scrollbar-width: none; }
.strip::-webkit-scrollbar { display: none; }
.d {
  width: 44px; flex: none; height: 64px; border-radius: 14px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px; font-size: 12px; color: var(--muted);
}
.d b { font-size: 16px; color: var(--ink); font-weight: 600; line-height: 1.2; }
.d.on { background: var(--surface-2); }
.d i { width: 6px; height: 6px; border-radius: 50%; background: transparent; display: block; }
.d i.af { background: var(--free); }
.day-total { font-size: 20px; margin-bottom: 8px; }
.entries { list-style: none; }
.entry {
  width: 100%; min-height: 56px; display: grid; grid-template-columns: 48px 24px 1fr auto; gap: 12px;
  align-items: center; border-bottom: 1px solid var(--line); text-align: left; padding: 8px 0;
}
.what { min-width: 0; }
.ctx { display: block; font-size: 13px; color: var(--muted); margin-top: 2px; }
.note { display: block; font-size: 13px; color: var(--muted); font-style: italic; margin-top: 2px; overflow-wrap: anywhere; }
.tm { font-size: 14px; color: var(--muted); font-variant-numeric: tabular-nums; }
.amt { font-variant-numeric: tabular-nums; color: var(--muted); }
.empty { padding: 16px 0; display: grid; gap: 16px; }
.empty .free { color: var(--free); font-weight: 600; }
.empty-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fab {
  position: fixed; right: max(20px, calc(50% - 260px)); z-index: 15;
  bottom: calc(var(--nav-h) + var(--safe) + 16px); height: 48px; padding: 0 20px; border-radius: 999px;
  background: var(--drink); color: var(--on-drink); font-weight: 600; display: flex; align-items: center; gap: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .35);
}
.fab .i { width: 20px; height: 20px; }
</style>
