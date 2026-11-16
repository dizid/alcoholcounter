<!-- UndoToast.vue — "Beer logged · Undo" above the nav for 5 seconds (T-0588) -->
<template>
  <Transition name="toast">
    <div v-if="message" class="toast" role="status" aria-live="polite">
      <span>{{ message }}</span>
      <button v-if="canUndo" type="button" class="undo" @click="$emit('undo')">Undo</button>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
  canUndo: { type: Boolean, default: true },
})
defineEmits(['undo'])
</script>

<style scoped>
.toast {
  position: fixed; left: 20px; right: 20px; z-index: 30; max-width: 520px; margin: 0 auto;
  bottom: calc(var(--nav-h) + var(--safe) + 12px); min-height: 48px;
  background: var(--surface-2); border-radius: 14px; padding: 0 16px;
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .45); font-size: 14px;
}
.undo { color: var(--drink); font-weight: 600; padding: 12px 0 12px 12px; }
.toast-enter-active, .toast-leave-active { transition: opacity .2s, transform .2s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(8px); }
@media (prefers-reduced-motion: reduce) { .toast-enter-active, .toast-leave-active { transition: none; } }
</style>
