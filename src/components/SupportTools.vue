<!-- SupportTools.vue — the exercises from the old tracker, brought back on Today (T-0623):
     Breathing (60 s, 4-4-4), Urge surfing (3 steps), Triggers (save a trigger + coping idea)
     and Reframe (a kinder version of an unhelpful thought). Tap a tile to open it, tap again
     to close. Nothing here is sent to the AI coach. -->
<template>
  <section class="card section tools" aria-labelledby="tools-label">
    <div id="tools-label" class="label">Exercises</div>
    <div class="tool-tiles" role="group" aria-label="Exercises">
      <button
        v-for="tool in TOOLS" :key="tool.id" type="button" class="tool-tile"
        :class="{ on: active === tool.id }" :aria-pressed="active === tool.id" :aria-controls="`tool-${tool.id}`"
        @click="toggle(tool.id)"
      >
        <span class="t">{{ tool.title }}</span>
        <span class="s">{{ tool.hint }}</span>
      </button>
    </div>

    <!-- Breathing: 5 rounds of in 4, hold 4, out 4 = 60 seconds -->
    <div v-if="active === 'breathing'" id="tool-breathing" class="panel">
      <p>Breathe in for 4, hold for 4, breathe out for 4. Five rounds, one minute.</p>
      <div v-if="breathLeft > 0" class="breath" aria-live="polite">
        <div class="phase serif">{{ breathPhase }}</div>
        <div class="muted">{{ breathLeft }} s left</div>
      </div>
      <p v-else-if="breathDone" class="done">Well done. You finished the breathing exercise.</p>
      <button v-if="breathLeft > 0" type="button" class="btn-2" @click="stopBreathing">Stop</button>
      <button v-else type="button" class="btn-primary" @click="startBreathing">{{ breathDone ? 'Again' : 'Start' }}</button>
      <ReflectionBox v-if="breathDone" exercise="awareness" />
    </div>

    <!-- Urge surfing: cravings rise, peak and fall -->
    <div v-if="active === 'urge'" id="tool-urge" class="panel">
      <p>A craving is like a wave: it rises, peaks and falls. Watch it without acting on it.</p>
      <label v-for="(step, index) in URGE_STEPS" :key="index" class="step">
        <input v-model="urgeSteps[index]" type="checkbox" />
        <span>{{ step }}</span>
      </label>
      <p v-if="urgeSteps.every(Boolean)" class="done">You rode the wave.</p>
      <ReflectionBox v-if="urgeSteps.every(Boolean)" exercise="intervention" />
    </div>

    <!-- Triggers: what set off the urge, and what you could do instead -->
    <div v-if="active === 'triggers'" id="tool-triggers" class="panel">
      <p>Knowing what sets off a craving helps you plan a different answer.</p>
      <form class="form" @submit.prevent="saveTrigger">
        <label class="sub-label" :for="`trig-${uid}`">What set it off?</label>
        <input :id="`trig-${uid}`" v-model.trim="triggerText" maxlength="200" placeholder="e.g. a long day at work" required />
        <label class="sub-label" :for="`cope-${uid}`">What could you do instead?</label>
        <input :id="`cope-${uid}`" v-model.trim="copingText" maxlength="200" placeholder="e.g. a walk, tea, call a friend" />
        <button type="submit" class="btn-primary" :disabled="!triggerText || savingTrigger">{{ savingTrigger ? 'Saving…' : 'Save' }}</button>
      </form>
      <p v-if="triggerMessage" class="done" role="status">{{ triggerMessage }}</p>
      <p v-if="triggerError" class="error-text" role="alert">{{ triggerError }}</p>
      <div v-if="savedTriggers.length" class="saved">
        <div class="sub-label">Your triggers</div>
        <ul>
          <li v-for="t in savedTriggers.slice(0, 5)" :key="t.id">
            <b>{{ t.trigger_text }}</b><span v-if="t.coping_strategy"> → {{ t.coping_strategy }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Reframe: swap an unhelpful thought for a more balanced one -->
    <div v-if="active === 'reframe'" id="tool-reframe" class="panel">
      <p>Write down a thought that pushes you to drink. Then read a more balanced version.</p>
      <form class="form" @submit.prevent="reframe">
        <label class="sub-label" :for="`thought-${uid}`">The thought</label>
        <input :id="`thought-${uid}`" v-model.trim="thoughtText" maxlength="200" placeholder="e.g. I need a drink to relax" />
        <button type="submit" class="btn-primary" :disabled="!thoughtText">Reframe</button>
      </form>
      <blockquote v-if="reframed" class="reframed" aria-live="polite">{{ reframed }}</blockquote>
    </div>
  </section>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import ReflectionBox from './ReflectionBox.vue'
import { addUserTrigger, getUserTriggers } from '../services/db'
import { reframeThought } from '../lib/reframe'

const TOOLS = [
  { id: 'breathing', title: 'Breathing', hint: 'calm your mind' },
  { id: 'urge', title: 'Urge surfing', hint: 'ride the wave' },
  { id: 'triggers', title: 'Triggers', hint: 'know your patterns' },
  { id: 'reframe', title: 'Reframe', hint: 'change the thought' },
]
const URGE_STEPS = [
  'Notice where you feel the urge in your body',
  'Watch it peak and fade (1 to 2 minutes)',
  'Tell yourself: "This will pass"',
]
const BREATH_SECONDS = 60
const PHASES = ['Breathe in', 'Hold', 'Breathe out'] // 4 seconds each

const uid = Math.random().toString(36).slice(2, 8)
const active = ref(null)

// Breathing
const breathLeft = ref(0)
const breathDone = ref(false)
const breathPhase = ref(PHASES[0])
let breathTimer = null

// Urge surfing
const urgeSteps = ref([false, false, false])

// Triggers
const triggerText = ref('')
const copingText = ref('')
const savingTrigger = ref(false)
const triggerMessage = ref('')
const triggerError = ref('')
const savedTriggers = ref([])
let triggersLoaded = false

// Reframe
const thoughtText = ref('')
const reframed = ref('')

function toggle(id) {
  active.value = active.value === id ? null : id
  if (active.value !== 'breathing') stopBreathing()
  if (active.value === 'triggers' && !triggersLoaded) loadTriggers()
}

function startBreathing() {
  stopBreathing()
  breathDone.value = false
  breathLeft.value = BREATH_SECONDS
  breathPhase.value = PHASES[0]
  breathTimer = setInterval(() => {
    breathLeft.value -= 1
    const elapsed = BREATH_SECONDS - breathLeft.value
    breathPhase.value = PHASES[Math.floor(elapsed / 4) % 3]
    if (breathLeft.value <= 0) {
      stopBreathing()
      breathDone.value = true
    }
  }, 1000)
}

function stopBreathing() {
  clearInterval(breathTimer)
  breathTimer = null
  breathLeft.value = 0
}

async function loadTriggers() {
  try {
    savedTriggers.value = await getUserTriggers()
    triggersLoaded = true
  } catch {
    // The list is a nice-to-have; saving still works
  }
}

async function saveTrigger() {
  if (!triggerText.value) return
  savingTrigger.value = true
  triggerError.value = ''
  triggerMessage.value = ''
  try {
    await addUserTrigger(triggerText.value, copingText.value || null)
    triggerMessage.value = 'Saved.'
    triggerText.value = ''
    copingText.value = ''
    await loadTriggers()
  } catch {
    triggerError.value = "Couldn't save. Please try again."
  } finally {
    savingTrigger.value = false
  }
}

function reframe() {
  if (!thoughtText.value) return
  reframed.value = reframeThought(thoughtText.value)
}

onBeforeUnmount(stopBreathing)
</script>

<style scoped>
.tools { margin-top: 24px; }
.tool-tiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tool-tile {
  min-height: 64px; border-radius: 14px; background: var(--surface-2); border: 1px solid transparent;
  display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px;
  padding: 10px 14px; text-align: left;
}
.tool-tile.on { border-color: var(--drink); }
.tool-tile .t { font-weight: 600; font-size: 15px; }
.tool-tile .s { font-size: 13px; color: var(--muted); }
.panel { margin-top: 16px; display: grid; gap: 12px; }
.panel p { margin: 0; line-height: 1.5; }
.breath { text-align: center; padding: 8px 0; }
.phase { font-size: 28px; color: var(--drink); }
.done { color: var(--free); }
.step { display: flex; gap: 12px; align-items: flex-start; line-height: 1.4; cursor: pointer; }
.step input { width: 20px; height: 20px; padding: 0; margin-top: 1px; accent-color: var(--drink); flex: none; }
.form { display: grid; gap: 8px; }
.form .btn-primary { margin-top: 4px; }
.sub-label { font-size: 13px; color: var(--muted); }
.saved ul { list-style: none; display: grid; gap: 6px; margin-top: 6px; }
.saved li { font-size: 14px; line-height: 1.4; }
.saved li span { color: var(--muted); }
.reframed { margin: 0; padding: 12px 16px; border-left: 3px solid var(--free); background: var(--surface-2); border-radius: 0 12px 12px 0; line-height: 1.5; }
</style>
