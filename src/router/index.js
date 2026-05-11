import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AdminView from '../views/AdminView.vue'
import WorldCupView from '../views/WorldCupView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/world-cup', component: WorldCupView },
    { path: '/admin', component: AdminView },
  ],
})
