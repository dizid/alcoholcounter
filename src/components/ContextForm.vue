<template>
  <div class="context-form">
    <h3>Add Context (Optional)</h3>
    <select v-model="form.location">
      <option value="">Where?</option>
      <option>Home</option>
      <option>Bar</option>
      <option>Other</option>
    </select>
    <select v-model="form.company">
      <option value="">With whom?</option>
      <option>Alone</option>
      <option>With friends</option>
      <option>With family</option>
      <option>With strangers</option>
    </select>
    <select v-model="form.drink_type">
      <option value="">What kind?</option>
      <option>beer</option>
      <option>wine</option>
      <option>stronger</option>
    </select>
    <select v-model="form.mood">
      <option value="">Mood?</option>
      <option>positive</option>
      <option>negative</option>
      <option>neutral</option>
    </select>
    <button @click="submit">Save</button>
      </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit', 'cancel']);  // Declare all emitted events here

const form = ref({
  location: '',
  company: '',
  drink_type: '',
  mood: ''
})

// Emit submit with form data (nullify empty strings)
function submit() {
  const context = {}
  Object.keys(form.value).forEach(key => {
    if (form.value[key]) context[key] = form.value[key]
  })
  emit('submit', context)  // Use 'emit' instead of '$emit'
}
</script>

<style scoped>
.context-form {
  border: 1px solid #ccc;
  padding: 1rem;
  margin: 1rem 0;
  background: #f9f9f9;
}
select, button {
  display: block;
  margin: 0.5rem 0;
}
</style>