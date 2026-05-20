import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AdminView from '../views/AdminView.vue'
import WorldCupView from '../views/WorldCupView.vue'
import SquadView from '../views/SquadView.vue'
import TrophyRoomView from '../views/TrophyRoomView.vue'
import SurvivorView from '../views/SurvivorView.vue'
import LoginView from '../views/LoginView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/world-cup', component: WorldCupView },
    { path: '/squad', component: SquadView },
    { path: '/trophies', component: TrophyRoomView },
    { path: '/survivor', component: SurvivorView },
    { path: '/admin', component: AdminView },
    { path: '/login', component: LoginView },
  ],
})
