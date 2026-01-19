<template>
  <div class="context-overlay" @click.self="cancel">
    <div class="context-form">
      <h3>Log a Drink</h3>
      <p class="form-subtitle">Add context to help spot patterns (optional)</p>

      <div class="form-group">
        <label for="location">Location</label>
        <select id="location" v-model="form.location">
          <option value="">Select location...</option>
          <option value="Home">Home</option>
          <option value="Bar">Bar / Restaurant</option>
          <option value="Friend's place">Friend's place</option>
          <option value="Work event">Work event</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="company">Company</label>
        <select id="company" v-model="form.company">
          <option value="">Select company...</option>
          <option value="Alone">Alone</option>
          <option value="With friends">With friends</option>
          <option value="With family">With family</option>
          <option value="With coworkers">With coworkers</option>
          <option value="With strangers">With strangers</option>
        </select>
      </div>

      <div class="form-group">
        <label for="drink_type">Drink Type</label>
        <select id="drink_type" v-model="form.drink_type">
          <option value="">Select type...</option>
          <option value="beer">Beer</option>
          <option value="wine">Wine</option>
          <option value="cocktail">Cocktail</option>
          <option value="spirits">Spirits / Shots</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="mood">Current Mood</label>
        <select id="mood" v-model="form.mood">
          <option value="">Select mood...</option>
          <option value="happy">Happy / Celebrating</option>
          <option value="relaxed">Relaxed</option>
          <option value="stressed">Stressed / Anxious</option>
          <option value="sad">Sad / Down</option>
          <option value="bored">Bored</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      <div class="form-actions">
        <button type="button" @click="cancel" class="cancel-btn">Cancel</button>
        <button type="button" @click="submit" class="save-btn">Log Drink</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit', 'cancel'])

const form = ref({
  location: '',
  company: '',
  drink_type: '',
  mood: ''
})

function submit() {
  const context = {}
  Object.keys(form.value).forEach(key => {
    if (form.value[key]) context[key] = form.value[key]
  })
  emit('submit', context)
}

function cancel() {
  emit('cancel')
}
</script>

<style scoped>
.context-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1500;
  padding: 1rem;
}

.context-form {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.context-form h3 {
  margin: 0 0 0.25rem 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.form-subtitle {
  margin: 0 0 1.25rem 0;
  color: #7f8c8d;
  font-size: 0.875rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 0.375rem;
}

.form-group select {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: white;
  color: #2c3e50;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236c757d' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.form-group select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.form-actions button {
  flex: 1;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: #f1f3f4;
  color: #5f6368;
}

.cancel-btn:hover {
  background: #e8eaed;
}

.save-btn {
  background: #2ecc71;
  color: white;
}

.save-btn:hover {
  background: #27ae60;
}

/* Mobile improvements */
@media (max-width: 480px) {
  .context-form {
    padding: 1.25rem;
  }

  .form-group select {
    padding: 1rem;
    font-size: 16px; /* Prevents iOS zoom on focus */
  }

  .form-actions button {
    padding: 1rem;
  }
}
</style>