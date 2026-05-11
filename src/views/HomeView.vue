<template>
  <NavBar @open-modal="modalOpen = true" />

  <HeroSection :video-url="settings.videoUrl" />
  <LogoSection />
  <EventsSection :events="events" />
  <ResultsSection :results="results" />
  <CalendarSection :matches="calendar" />
  <WorldCupSnapshotSection v-if="settings.worldCupEnabled" :top-players="wcTop3" :today-matches="wcTodayMatches" />
  <HistorySection :memories="history" @open-modal="modalOpen = true" />
  <JoinSection :join-url="settings.joinUrl" :join-bg="settings.joinBg" />

  <RouterLink class="admin-link" to="/admin">Admin ⚙</RouterLink>

  <ContributeModal v-model="modalOpen" />
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { sb } from '../lib/supabase.js'
import { DEFAULT_RESULTS, DEFAULT_CALENDAR, DEFAULT_HISTORY, DEFAULT_SETTINGS, mapMatch, mapEvent, MATCHES_SELECT } from '../lib/defaults.js'

import NavBar from '../components/NavBar.vue'
import HeroSection from '../components/HeroSection.vue'
import LogoSection from '../components/LogoSection.vue'
import EventsSection from '../components/EventsSection.vue'
import ResultsSection from '../components/ResultsSection.vue'
import CalendarSection from '../components/CalendarSection.vue'
import WorldCupSnapshotSection from '../components/WorldCupSnapshotSection.vue'
import HistorySection from '../components/HistorySection.vue'
import JoinSection from '../components/JoinSection.vue'
import ContributeModal from '../components/ContributeModal.vue'

const modalOpen = ref(false)
const results  = ref(DEFAULT_RESULTS)
const calendar = ref(DEFAULT_CALENDAR)
const events   = ref([])
const history  = ref(DEFAULT_HISTORY)
const wcMatches = ref([])
const wcTop3 = ref([])

const wcTodayMatches = computed(() => {
  const today = localDateKey(new Date())
  return [...wcMatches.value]
    .filter((m) => localDateKey(new Date(m.kickoff_at)) === today)
    .sort((a, b) => String(a.kickoff_at || '').localeCompare(String(b.kickoff_at || '')))
})

const settings = ref({ ...DEFAULT_SETTINGS })

onMounted(async () => {
  const [
    { data: mData },
    { data: eData },
    { data: hData },
    { data: sData },
    { data: wcMData },
    { data: wcPData },
  ] = await Promise.all([
    sb.from('matches').select(MATCHES_SELECT),
    sb.from('events').select('*'),
    sb.from('history').select('*').order('date', { ascending: false }),
    sb.from('settings').select('*').eq('id', 1).single(),
    sb.from('wc_matches').select('*'),
    sb.from('wc_predictions').select('*'),
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

  if (wcMData?.length) wcMatches.value = wcMData
  if (wcMData?.length && wcPData?.length) wcTop3.value = computeTop3Players(wcMData, wcPData)

  if (sData) {
    settings.value = {
      joinUrl: sData.join_url,
      videoUrl: sData.video_url,
      heroTitle: sData.hero_title || DEFAULT_SETTINGS.heroTitle,
      joinBg: sData.join_bg || null,
      worldCupEnabled: !!sData.world_cup_enabled,
    }
  }
})

function computeTop3Players(matches, predictions) {
  const played = new Map(
    matches
      .filter((m) => m.status === 'played' && m.home_score != null && m.away_score != null)
      .map((m) => [m.id, m])
  )

  const stats = new Map()
  for (const p of predictions) {
    const match = played.get(p.match_id)
    if (!match) continue

    if (!stats.has(p.user_email)) {
      stats.set(p.user_email, {
        email: p.user_email,
        name: p.user_name || p.user_email,
        points: 0,
        exact: 0,
      })
    }

    const row = stats.get(p.user_email)
    const exact = p.predicted_home === match.home_score && p.predicted_away === match.away_score
    const sameOutcome = outcome(p.predicted_home, p.predicted_away) === outcome(match.home_score, match.away_score)

    row.points += exact ? 3 : sameOutcome ? 1 : 0
    if (exact) row.exact += 1
  }

  return Array.from(stats.values())
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.exact !== a.exact) return b.exact - a.exact
      return String(a.name).localeCompare(String(b.name))
    })
    .slice(0, 3)
}

function outcome(home, away) {
  if (home > away) return 'H'
  if (home < away) return 'A'
  return 'D'
}

function localDateKey(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
</script>
