<template>
  <AdminLogin v-if="!authed" @auth="authed = true" />
  <AdminLayout v-else :active-tab="tab" @set-tab="tab = $event" @logout="logout">
    <ResultsTab  v-if="tab === 'results'" />
    <CalendarTab v-else-if="tab === 'calendar'" />
    <PlayersTab  v-else-if="tab === 'players'" />
    <WorldCupTab v-else-if="tab === 'world-cup'" />
    <EventsTab   v-else-if="tab === 'events'" />
    <HistoryTab  v-else-if="tab === 'history'" />
    <MembersTab  v-else-if="tab === 'members'" />
    <SettingsTab   v-else-if="tab === 'settings'" />
    <TransfersTab v-else-if="tab === 'transfers'" />
    <TrophiesTab v-else-if="tab === 'trophies'" />
    <SurvivorTab v-else-if="tab === 'survivor'" />
  </AdminLayout>
</template>

<script setup>
import { ref, watch } from 'vue'
import AdminLogin  from '../components/admin/AdminLogin.vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import ResultsTab  from '../components/admin/tabs/ResultsTab.vue'
import CalendarTab from '../components/admin/tabs/CalendarTab.vue'
import PlayersTab  from '../components/admin/tabs/PlayersTab.vue'
import WorldCupTab from '../components/admin/tabs/WorldCupTab.vue'
import EventsTab   from '../components/admin/tabs/EventsTab.vue'
import HistoryTab  from '../components/admin/tabs/HistoryTab.vue'
import MembersTab  from '../components/admin/tabs/MembersTab.vue'
import SettingsTab   from '../components/admin/tabs/SettingsTab.vue'
import TransfersTab from '../components/admin/tabs/TransfersTab.vue'
import TrophiesTab from '../components/admin/tabs/TrophiesTab.vue'
import SurvivorTab from '../components/admin/tabs/SurvivorTab.vue'
import { useAuth, signOut } from '../lib/auth.js'

const { isAuthenticated } = useAuth()
const authed = ref(isAuthenticated.value)
const tab    = ref('results')

watch(isAuthenticated, (value) => {
  authed.value = value
})

async function logout() {
  await signOut()
  authed.value = false
}
</script>
