// Entry point for the Vue app
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/theme.css' // Global theme (T-0588)
import { startAnalyticsIfAllowed } from './lib/analytics'

// Google Analytics only for visitors who said yes in the consent banner (T-0609)
startAnalyticsIfAllowed()

const app = createApp(App)
app.use(createPinia()) // Use Pinia for state management
app.use(router) // Use Vue Router
app.mount('#app')
