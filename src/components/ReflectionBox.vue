<!-- ReflectionBox.vue — "How do you feel now?" after an exercise (T-0623).
     Saved with the exercise type the old tracker used ('awareness' = breathing,
     'intervention' = urge surfing), so old and new reflections stay comparable. -->
<template>
  <form class="reflect" @submit.prevent="save">
    <label class="sub-label" :for="id">How do you feel now? (optional)</label>
    <textarea :id="id" v-model.trim="text" rows="2" maxlength="1000"></textarea>
    <button type="submit" class="btn-2" :disabled="!text || saving">{{ saving ? 'Saving…' : 'Save reflection' }}</button>
    <p v-if="message" class="saved" role="status">{{ message }}</p>
    <p v-if="error" class="error-text" role="alert">{{ error }}</p>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { addUserReflection } from '../services/db'

const props = defineProps({
  exercise: { type: String, required: true }, // 'awareness' | 'intervention'
})

const id = `reflect-${Math.random().toString(36).slice(2, 8)}`
const text = ref('')
const saving = ref(false)
const message = ref('')
const error = ref('')

async function save() {
  if (!text.value) return
  saving.value = true
  message.value = ''
  error.value = ''
  try {
    await addUserReflection(text.value, props.exercise)
    text.value = ''
    message.value = 'Saved.'
  } catch {
    error.value = "Couldn't save. Please try again."
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.reflect { display: grid; gap: 8px; }
.reflect textarea { min-height: 72px; }
.sub-label { font-size: 13px; color: var(--muted); }
.saved { color: var(--free); margin: 0; }
</style>
