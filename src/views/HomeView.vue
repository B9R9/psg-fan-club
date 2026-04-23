<template>
  <NavBar @open-modal="modalOpen = true" />

  <HeroSection :video-url="settings.videoUrl" />
  <LogoSection />
  <EventsSection :events="events" />
  <ResultsSection :results="results" />
  <CalendarSection :matches="calendar" />
  <HistorySection :memories="history" @open-modal="modalOpen = true" />
  <JoinSection :join-url="settings.joinUrl" :join-bg="settings.joinBg" />

  <RouterLink class="admin-link" to="/admin">Admin ⚙</RouterLink>

  <ContributeModal v-model="modalOpen" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { sb } from '../lib/supabase.js'
import { DEFAULT_RESULTS, DEFAULT_CALENDAR, DEFAULT_HISTORY, DEFAULT_SETTINGS, mapMatch, mapEvent, MATCHES_SELECT } from '../lib/defaults.js'

import NavBar from '../components/NavBar.vue'
import HeroSection from '../components/HeroSection.vue'
import LogoSection from '../components/LogoSection.vue'
import EventsSection from '../components/EventsSection.vue'
import ResultsSection from '../components/ResultsSection.vue'
import CalendarSection from '../components/CalendarSection.vue'
import HistorySection from '../components/HistorySection.vue'
import JoinSection from '../components/JoinSection.vue'
import ContributeModal from '../components/ContributeModal.vue'

const modalOpen = ref(false)
const results  = ref(DEFAULT_RESULTS)
const calendar = ref(DEFAULT_CALENDAR)
const events   = ref([])
const history  = ref(DEFAULT_HISTORY)

const settings = ref({ ...DEFAULT_SETTINGS })

onMounted(async () => {
  const [
    { data: mData },
    { data: eData },
    { data: hData },
    { data: sData },
  ] = await Promise.all([
    sb.from('matches').select(MATCHES_SELECT),
    sb.from('events').select('*'),
    sb.from('history').select('*'),
    sb.from('settings').select('*').eq('id', 1).single(),
  ])

  if (mData?.length) {
    const mapped = mData.map(mapMatch)
    const played   = mapped.filter(m => m.status === 'played')
    const upcoming  = mapped.filter(m => m.status === 'upcoming')
    if (played.length)   results.value  = played
    if (upcoming.length) calendar.value = upcoming
  }
  if (eData?.length) events.value   = eData.map(mapEvent)
  if (hData?.length) history.value = hData.map(r => ({
    id: r.id,
    author: r.author || '',
    title: r.title || '',
    text: r.text || '',
    type: r.type || 'text',
    date: r.date ? r.date.slice(0, 7) : '',
    media_url: r.media_url || null,
  }))
  if (sData) settings.value = { joinUrl: sData.join_url, videoUrl: sData.video_url, heroTitle: sData.hero_title || DEFAULT_SETTINGS.heroTitle, joinBg: sData.join_bg || null }
})
</script>
