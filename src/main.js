import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { initAuth } from './lib/auth.js'

await initAuth()

createApp(App).use(router).mount('#app')
