<!-- AddDrinkSheet.vue — bottom sheet to add (or edit) a drink (T-0588):
     type tiles, size presets with live standard drinks, how many, when,
     and optional context (trigger, mood, note), collapsed by default. -->
<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="dim" @click.self="close">
        <div class="sheet" role="dialog" aria-modal="true" :aria-labelledby="titleId">
          <div class="handle" aria-hidden="true"></div>
          <h2 :id="titleId">{{ editing ? 'Edit drink' : 'Add a drink' }}</h2>

          <div class="tiles" role="radiogroup" aria-label="Type">
            <button
              v-for="d in DRINK_TYPES" :key="d.type" type="button" class="tile"
              :class="{ sel: form.type === d.type }" role="radio" :aria-checked="form.type === d.type"
              @click="form.type = d.type"
            >
              <AppIcon :name="iconFor(d.type)" />
              <span class="t">{{ d.label }}</span>
            </button>
          </div>

          <div class="sub-label">Size</div>
          <div class="chips" role="radiogroup" aria-label="Size">
            <button
              v-for="s in SIZES" :key="s.size" type="button" class="chip" :class="{ on: form.size === s.size }"
              role="radio" :aria-checked="form.size === s.size" @click="form.size = s.size"
            >{{ s.label }}</button>
          </div>
          <div class="std">= <b>{{ formatStd(totalStd) }}</b> {{ stdWord }}</div>

          <div class="rows">
            <div v-if="!editing" class="line-row">
              <span>How many</span>
              <div class="stepper">
                <button type="button" aria-label="One less" :disabled="form.count <= 1" @click="form.count--"><AppIcon name="minus" /></button>
                <b class="serif" aria-live="polite">{{ form.count }}</b>
                <button type="button" aria-label="One more" :disabled="form.count >= 10" @click="form.count++"><AppIcon name="plus" /></button>
              </div>
            </div>
            <div class="line-row">
              <label :for="timeId">When</label>
              <button v-if="!pickTime" type="button" class="chip on when" @click="startPickTime">{{ whenLabel }}</button>
              <input v-else :id="timeId" v-model="form.time" type="datetime-local" class="time-input" :max="maxTime" />
            </div>
            <button type="button" class="line-row context-toggle" :aria-expanded="showContext" @click="showContext = !showContext">
              <span>Add context <span class="hint">· trigger, mood, note</span></span>
              <AppIcon name="chev-d" :class="{ flip: showContext }" />
            </button>
          </div>

          <div v-if="showContext" class="context">
            <div class="sub-label">What led to it</div>
            <div class="chips wrap">
              <button
                v-for="t in TRIGGERS" :key="t" type="button" class="chip" :class="{ on: form.trigger === t }"
                :aria-pressed="form.trigger === t" @click="form.trigger = form.trigger === t ? null : t"
              >{{ t }}</button>
            </div>
            <div class="sub-label">How you felt</div>
            <div class="chips wrap">
              <button
                v-for="m in MOODS" :key="m" type="button" class="chip" :class="{ on: form.mood === m }"
                :aria-pressed="form.mood === m" @click="form.mood = form.mood === m ? null : m"
              >{{ m }}</button>
            </div>
            <label class="sub-label" :for="noteId">Note</label>
            <textarea :id="noteId" v-model="form.note" maxlength="500" rows="2" placeholder="Optional"></textarea>
          </div>

          <p v-if="error" class="error-text" role="alert">{{ error }}</p>
          <button type="button" class="btn-primary save" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
          <button v-if="editing" type="button" class="delete" :disabled="saving" @click="$emit('delete', drink)">Delete this drink</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import AppIcon from './ui/AppIcon.vue'
import { DRINK_TYPES, SIZES, TRIGGERS, MOODS, stdFor, iconFor } from '../lib/drinks'
import { formatStd, timeOfDay } from '../lib/day'

const props = defineProps({
  open: { type: Boolean, default: false },
  initialType: { type: String, default: 'beer' },
  drink: { type: Object, default: null },  // an existing drink to edit
  defaultDate: { type: String, default: '' }, // "YYYY-MM-DD" when adding to an earlier day
})
const emit = defineEmits(['close', 'save', 'delete'])

const uid = Math.random().toString(36).slice(2, 8)
const titleId = `sheet-title-${uid}`
const timeId = `sheet-time-${uid}`
const noteId = `sheet-note-${uid}`

const form = reactive({ type: 'beer', size: 'regular', count: 1, time: '', trigger: null, mood: null, note: '' })
const pickTime = ref(false)
const showContext = ref(false)
const saving = ref(false)
const error = ref('')

const editing = computed(() => Boolean(props.drink))
const totalStd = computed(() => stdFor(form.type, form.size) * form.count)
// "= 1 standard drink" / "= 1.2 standard drinks"
const stdWord = computed(() => (formatStd(totalStd.value) === '1' ? 'standard drink' : 'standard drinks'))

// "YYYY-MM-DDTHH:mm" in the phone's local time, for <input type="datetime-local">
function toLocalInput(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const maxTime = computed(() => toLocalInput(new Date()))
const whenLabel = computed(() => (editing.value && props.drink?.created_at ? timeOfDay(props.drink.created_at) : 'Now'))

function startPickTime() {
  form.time = toLocalInput(props.drink?.created_at ? new Date(props.drink.created_at) : new Date())
  pickTime.value = true
}

// Reset the form each time the sheet opens
watch(() => props.open, isOpen => {
  if (!isOpen) return
  const d = props.drink
  form.type = d ? (DRINK_TYPES.some(t => t.type === d.drink_type) ? d.drink_type : 'other') : props.initialType
  form.size = d?.size || 'regular'
  form.count = 1
  form.time = ''
  form.trigger = d?.trigger || null
  form.mood = d?.mood || null
  form.note = d?.note || ''
  pickTime.value = false
  if (!d && props.defaultDate && props.defaultDate !== new Date().toLocaleDateString('en-CA')) {
    // An earlier day: start at 20:00 that evening; the user can change it
    form.time = `${props.defaultDate}T20:00`
    pickTime.value = true
  }
  showContext.value = Boolean(d && (d.trigger || d.mood || d.note))
  saving.value = false
  error.value = ''
})

function close() {
  if (!saving.value) emit('close')
}

// Hands the drink to the parent, which saves it and closes the sheet
async function save() {
  error.value = ''
  let createdAt = null
  if (pickTime.value && form.time) {
    const picked = new Date(form.time)
    if (Number.isNaN(picked.getTime()) || picked.getTime() > Date.now() + 60000) {
      error.value = 'Pick a time that is not in the future.'
      return
    }
    createdAt = picked.toISOString()
  }
  saving.value = true
  try {
    await new Promise((resolve, reject) => emit('save', {
      drink: {
        drink_type: form.type,
        size: form.size,
        std_drinks: stdFor(form.type, form.size),
        trigger: form.trigger,
        mood: form.mood,
        note: form.note.trim() || null,
        ...(createdAt ? { created_at: createdAt } : {}),
      },
      count: editing.value ? 1 : form.count,
      done: resolve,
      fail: reject,
    }))
  } catch (err) {
    error.value = err?.message || 'Could not save. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.dim { position: fixed; inset: 0; z-index: 40; background: rgba(10, 8, 6, .62); display: flex; align-items: flex-end; justify-content: center; }
.sheet {
  width: 100%; max-width: 560px; max-height: 92vh; overflow-y: auto;
  background: var(--surface); border-radius: 18px 18px 0 0;
  padding: 12px 20px calc(20px + var(--safe));
}
.handle { width: 36px; height: 4px; border-radius: 999px; background: rgba(255, 240, 220, .18); margin: 0 auto 16px; }
h2 { margin-bottom: 16px; }
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.tile {
  height: 72px; border-radius: 14px; background: var(--bg); display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px;
}
.tile .t { font-size: 14px; font-weight: 600; line-height: 1.2; }
.tile.sel { background: var(--surface-2); box-shadow: inset 0 0 0 1.5px var(--drink); }
.sub-label { display: block; font-size: 14px; color: var(--muted); font-weight: 500; margin: 20px 0 8px; }
.chips { display: flex; gap: 8px; }
.chips.wrap { flex-wrap: wrap; }
.std { font-size: 14px; color: var(--muted); margin-top: 8px; }
.std b { color: var(--ink); font-weight: 600; }
.rows { margin-top: 16px; }
.line-row {
  width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px;
  min-height: 56px; border-bottom: 1px solid var(--line); text-align: left;
}
.rows > .line-row:first-child { border-top: 1px solid var(--line); }
.context-toggle { color: var(--muted); }
.hint { font-size: 14px; }
.flip { transform: rotate(180deg); }
.stepper { display: flex; align-items: center; gap: 16px; }
.stepper button { width: 36px; height: 36px; border-radius: 50%; background: var(--surface-2); display: grid; place-items: center; }
.stepper button .i { width: 20px; height: 20px; }
.stepper b { font-size: 20px; min-width: 12px; text-align: center; }
.when { height: 36px; }
.time-input { width: auto; max-width: 60%; padding: 8px 10px; }
.save { margin-top: 16px; }
.delete { display: block; margin: 12px auto 0; padding: 8px 12px; color: var(--above); font-size: 14px; font-weight: 500; }
.error-text { margin-top: 12px; }
.sheet-enter-active, .sheet-leave-active { transition: opacity .2s; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform .25s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(40px); }
@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active, .sheet-leave-active, .sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: none; }
}
</style>
