<!-- BottomNav.vue — solid bar with Today / Log / Insights / Me (T-0588) -->
<template>
  <nav class="nav" aria-label="Main">
    <router-link
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tab"
      :class="{ on: isActive(tab.to) }"
      :aria-current="isActive(tab.to) ? 'page' : undefined"
    >
      <AppIcon :name="tab.icon" />
      <span>{{ tab.label }}</span>
      <span class="pip" aria-hidden="true"></span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'
import AppIcon from './AppIcon.vue'

const route = useRoute()

const tabs = [
  { to: '/', label: 'Today', icon: 'today' },
  { to: '/log', label: 'Log', icon: 'log' },
  { to: '/insights', label: 'Insights', icon: 'insights' },
  { to: '/me', label: 'Me', icon: 'me' },
]

// "/" is only active on itself; the others also for their sub-pages
function isActive(path) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path)
}
</script>

<style scoped>
.nav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
  height: calc(var(--nav-h) + var(--safe)); padding-bottom: var(--safe);
  background: var(--surface); border-top: 1px solid var(--line);
  display: grid; grid-template-columns: repeat(4, 1fr);
}
.tab {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  font-size: 12px; font-weight: 500; color: var(--muted); text-decoration: none;
}
.tab.on { color: var(--ink); }
.pip { width: 4px; height: 4px; border-radius: 50%; background: transparent; }
.tab.on .pip { background: var(--drink); }
</style>
