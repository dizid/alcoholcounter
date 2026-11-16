// Entry point for the Vue app
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/theme.css' // Global theme (T-0588)

const app = createApp(App)
app.use(createPinia()) // Use Pinia for state management
app.use(router) // Use Vue Router
app.mount('#app')
