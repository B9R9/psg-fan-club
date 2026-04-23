<template>
  <AdminLogin v-if="!authed" @auth="authed = true" />
  <AdminLayout v-else :active-tab="tab" @set-tab="tab = $event" @logout="logout">
    <ResultsTab  v-if="tab === 'results'" />
    <CalendarTab v-else-if="tab === 'calendar'" />
    <EventsTab   v-else-if="tab === 'events'" />
    <HistoryTab  v-else-if="tab === 'history'" />
    <MembersTab  v-else-if="tab === 'members'" />
    <SettingsTab v-else-if="tab === 'settings'" />
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { sb } from '../lib/supabase.js'
import AdminLogin  from '../components/admin/AdminLogin.vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import ResultsTab  from '../components/admin/tabs/ResultsTab.vue'
import CalendarTab from '../components/admin/tabs/CalendarTab.vue'
import EventsTab   from '../components/admin/tabs/EventsTab.vue'
import HistoryTab  from '../components/admin/tabs/HistoryTab.vue'
import MembersTab  from '../components/admin/tabs/MembersTab.vue'
import SettingsTab from '../components/admin/tabs/SettingsTab.vue'

const authed = ref(false)
const tab    = ref('results')

onMounted(async () => {
  const { data: { session } } = await sb.auth.getSession()
  authed.value = !!session
})

async function logout() {
  await sb.auth.signOut()
  authed.value = false
}
</script>
