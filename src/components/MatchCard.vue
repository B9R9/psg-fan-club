<template>
  <Teleport to="body">
    <Transition name="match-modal">
      <div v-if="match" class="match-modal-backdrop" @click.self="$emit('close')">
        <div class="match-modal" role="dialog">
          <button class="match-modal-close" @click="$emit('close')">✕</button>

          <!-- Header -->
          <div class="match-header">
            <div class="match-competition-date">
              <span class="match-comp">{{ match.competition }}</span>
              <span class="match-date">{{ formatDate(match.date) }}</span>
            </div>
            <div class="match-score">
              <div class="team-col">
                <div class="team-name">{{ match.home }}</div>
                <div class="score-large">{{ match.scoreHome ?? '—' }}</div>
              </div>
              <div class="score-dash">–</div>
              <div class="team-col">
                <div class="team-name">{{ match.away }}</div>
                <div class="score-large">{{ match.scoreAway ?? '—' }}</div>
              </div>
            </div>
            <!-- <div class="match-overview">
              <div class="overview-pill">
                <span class="overview-label">Stats</span>
                <span class="overview-value">{{ hasDetailedStats ? detailedHomeStats.length + detailedAwayStats.length : stats.length }}</span>
              </div>
              <div class="overview-pill">
                <span class="overview-label">Compos</span>
                <span class="overview-value">{{ lineups.length }}</span>
              </div>
              <div class="overview-pill">
                <span class="overview-label">Événements</span>
                <span class="overview-value">{{ events.length }}</span>
              </div>
            </div> -->
          </div>

          <!-- Tabs -->
          <div class="match-tabs">
            <button
              v-for="tab in visibleTabs"
              :key="tab"
              :class="{ active: activeTab === tab }"
              @click="activeTab = tab"
            >
              {{ tabLabels[tab] }}
            </button>
          </div>

          <!-- Formations Tab -->
          <div v-if="activeTab === 'formations'" class="match-content match-formations">
            <div v-if="hasFormationStats">
              <div class="formation-row">
                <div class="formation-team">
                  <div class="formation-label">{{ match.home }}</div>
                  <div class="formation-value">{{ matchStats.formations.homeSystem || matchStats.formations.home || '—' }}</div>
                </div>
                <div class="formation-vs">vs</div>
                <div class="formation-team">
                  <div class="formation-label">{{ match.away }}</div>
                  <div class="formation-value">{{ matchStats.formations.awaySystem || matchStats.formations.away || '—' }}</div>
                </div>
              </div>
            </div>
            <div v-else class="match-empty">{{ ui.formationsUnavailable }}</div>
          </div>

          <!-- Lineups Tab -->
          <div v-if="activeTab === 'lineups'" class="match-content match-lineups">
            <div v-if="loading" class="match-loading">{{ ui.loadingLineups }}</div>
            <div v-else-if="lineups.length">
              <div class="lineup-section">
                <h4>{{ match.home }}</h4>
                <div class="lineup-list">
                  <div v-for="p in homeLineup.starters" :key="`${p.id}-${p.shirt_number}`" class="lineup-player">
                    <span class="shirt-number">{{ p.shirt_number }}</span>
                    <span class="player-name">{{ p.player_name }}</span>
                    <span class="position-badge">{{ p.position_detail || p.position }}</span>
                  </div>
                </div>
                <div v-if="homeLineup.subs.length" class="lineup-subs">
                  <strong>{{ ui.substitutes }} :</strong>
                  <div class="lineup-list">
                    <div v-for="p in homeLineup.subs" :key="`${p.id}-${p.shirt_number}`" class="lineup-player lineup-player--sub">
                      <span class="shirt-number">{{ p.shirt_number }}</span>
                      <span class="player-name">{{ p.player_name }}</span>
                      <span class="position-badge">{{ p.position_detail || p.position }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="lineup-section">
                <h4>{{ match.away }}</h4>
                <div class="lineup-list">
                  <div v-for="p in awayLineup.starters" :key="`${p.id}-${p.shirt_number}`" class="lineup-player">
                    <span class="shirt-number">{{ p.shirt_number }}</span>
                    <span class="player-name">{{ p.player_name }}</span>
                    <span class="position-badge">{{ p.position_detail || p.position }}</span>
                  </div>
                </div>
                <div v-if="awayLineup.subs.length" class="lineup-subs">
                  <strong>{{ ui.substitutes }} :</strong>
                  <div class="lineup-list">
                    <div v-for="p in awayLineup.subs" :key="`${p.id}-${p.shirt_number}`" class="lineup-player lineup-player--sub">
                      <span class="shirt-number">{{ p.shirt_number }}</span>
                      <span class="player-name">{{ p.player_name }}</span>
                      <span class="position-badge">{{ p.position_detail || p.position }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="match-empty">{{ ui.lineupsUnavailable }}</div>
          </div>

          <!-- Events Tab -->
          <div v-if="activeTab === 'events'" class="match-content match-events">
            <div v-if="loading" class="match-loading">{{ ui.loadingEvents }}</div>
            <div v-else-if="events.length" class="events-timeline">
              <div v-for="evt in sortedEvents" :key="evt.id" :class="['event-item', `event-type-${evt.event_type}`]">
                <div class="event-minute">{{ evt.minute }}'</div>
                <div class="event-badge" :class="`badge-${evt.event_type}`">
                  <span v-if="evt.event_type.includes('goal')">⚽</span>
                  <span v-else-if="evt.event_type === 'assist'">🎯</span>
                  <span v-else-if="evt.event_type === 'sub_in'">↓</span>
                  <span v-else-if="evt.event_type === 'sub_out'">↑</span>
                  <span v-else-if="evt.event_type.includes('yellow')">🟨</span>
                  <span v-else-if="evt.event_type.includes('red')">🟥</span>
                </div>
                <div class="event-content">
                  <div class="event-team" :class="{ 'is-home': evt.team === 'home' }">{{ evt.team === 'home' ? match.home : match.away }}</div>
                  <div class="event-player">{{ evt.player_name }}</div>
                  <div v-if="evt.related_player_name" class="event-assist">{{ evt.event_type === 'assist' ? `${ui.assistBy} ` : `${ui.forPlayer} ` }}{{ evt.related_player_name }}</div>
                </div>
              </div>
            </div>
            <div v-else class="match-empty">{{ ui.eventsUnavailable }}</div>
          </div>

          <!-- Stats Tab -->
          <div v-if="activeTab === 'stats'" class="match-content match-stats">
            <div v-if="hasDetailedStats || stats.length">
              <div v-if="hasDetailedStats" class="detailed-stats">
                <div class="stats-compare-shell">
                  <div class="stats-compare-head">
                    <div class="compare-team compare-team--home">{{ match.home }}</div>
                    <div class="compare-title">{{ ui.compareTitle }}</div>
                    <div class="compare-team compare-team--away">{{ match.away }}</div>
                  </div>
                  <div class="stats-compare-list">
                    <div v-for="row in comparisonStats" :key="row.key" class="compare-row">
                      <div class="compare-value compare-value--home">{{ formatStatValue(row.key, row.homeValue) }}</div>
                      <div class="compare-center">
                        <div class="compare-label">{{ formatStatLabel(row.key) }}</div>
                        <div class="compare-bars">
                          <div class="compare-bar compare-bar--home">
                            <span :style="{ width: `${row.homeShare}%` }"></span>
                          </div>
                          <div class="compare-bar compare-bar--away">
                            <span :style="{ width: `${row.awayShare}%` }"></span>
                          </div>
                        </div>
                      </div>
                      <div class="compare-value compare-value--away">{{ formatStatValue(row.key, row.awayValue) }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="stats.length && !hasDetailedStats" class="simple-stats">
                <div v-for="stat in stats" :key="`${stat.team}-${stat.type}`" class="stat-row">
                  <div class="stat-team">{{ stat.team === 'home' ? match.home : match.away }}</div>
                  <div class="stat-value">{{ stat.count }}</div>
                  <div class="stat-label">{{ stat.label }}</div>
                </div>
              </div>
            </div>
            <div v-else class="match-empty">{{ ui.statsUnavailable }}</div>
          </div>

          <!-- Performances Tab -->
          <div v-if="activeTab === 'performances'" class="match-content match-performances">
            <div v-if="matchStats?.player_performances?.home?.length || matchStats?.player_performances?.away?.length">
              <div class="performance-teams">
                <div class="performance-section">
                  <h4>{{ match.home }}</h4>
                  <div class="performance-list">
                    <div v-for="p in (matchStats?.player_performances?.home || [])" :key=p.name class="perf-card">
                      <div class="perf-name">{{ p.name }}</div>
                      <div v-if="p.position" class="perf-position">{{ p.position }}</div>
                      <div class="perf-meta">
                        <span v-if="p.rating" class="perf-rating" :class="{ 'rating-high': p.rating >= 7, 'rating-mid': p.rating >= 6 }">{{ p.rating }}</span>
                        <span v-if="p.minutesPlayed" class="perf-minutes">{{ p.minutesPlayed }}'</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="performance-section">
                  <h4>{{ match.away }}</h4>
                  <div class="performance-list">
                    <div v-for="p in (matchStats?.player_performances?.away || [])" :key=p.name class="perf-card">
                      <div class="perf-name">{{ p.name }}</div>
                      <div v-if="p.position" class="perf-position">{{ p.position }}</div>
                      <div class="perf-meta">
                        <span v-if="p.rating" class="perf-rating" :class="{ 'rating-high': p.rating >= 7, 'rating-mid': p.rating >= 6 }">{{ p.rating }}</span>
                        <span v-if="p.minutesPlayed" class="perf-minutes">{{ p.minutesPlayed }}'</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="match-empty">{{ ui.performancesUnavailable }}</div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { sb } from '../lib/supabase.js'
import { useI18n } from '../lib/i18n.js'

const props = defineProps({ match: Object })
const emit = defineEmits(['close'])
const { currentLang } = useI18n()

const TAB_ORDER = ['stats', 'formations', 'performances', 'events', 'lineups']

const activeTab = ref('stats')
const loading = ref(false)
const lineups = ref([])
const events = ref([])
const matchStats = ref(null)

const UI_TEXT = {
  en: {
    tabs: { formations: 'Formations', lineups: 'Lineups', events: 'Events', stats: 'Stats', performances: 'Performances' },
    formationsUnavailable: 'Formations unavailable',
    loadingLineups: 'Loading lineups...',
    substitutes: 'Substitutes',
    lineupsUnavailable: 'Lineups unavailable',
    loadingEvents: 'Loading events...',
    assistBy: 'assist by',
    forPlayer: 'for',
    eventsUnavailable: 'No events available',
    compareTitle: 'Comparison',
    statsUnavailable: 'Stats unavailable',
    performancesUnavailable: 'Performances unavailable',
    labels: {
      goals: 'Goals', expectedGoals: 'xG', possession: 'Possession', shots: 'Shots', shotsOffTarget: 'Shots off target',
      blockedShots: 'Blocked shots', bigChances: 'Big chances', bigChancesMissed: 'Big chances missed',
      touchesInOppositionBox: 'Touches in box', shotsOnTarget: 'Shots on target', passes: 'Passes',
      accuratePasses: 'Accurate passes', passAccuracy: 'Pass accuracy', fouls: 'Fouls', corners: 'Corners',
      freeKicks: 'Free kicks', throwIns: 'Throw-ins', offsides: 'Offsides', yellowCards: 'Yellow cards',
      redCards: 'Red cards', saves: 'Saves', tackles: 'Tackles', interceptions: 'Interceptions', clearances: 'Clearances'
    }
  },
  fr: {
    tabs: { formations: 'Formations', lineups: 'Compos', events: 'Événements', stats: 'Statistiques', performances: 'Performances' },
    formationsUnavailable: 'Formations non disponibles',
    loadingLineups: 'Chargement des compos...',
    substitutes: 'Remplaçants',
    lineupsUnavailable: 'Compos non disponibles',
    loadingEvents: 'Chargement des événements...',
    assistBy: 'assist par',
    forPlayer: 'pour',
    eventsUnavailable: 'Aucun événement disponible',
    compareTitle: 'Comparaison',
    statsUnavailable: 'Statistiques non disponibles',
    performancesUnavailable: 'Performances non disponibles',
    labels: {
      goals: 'Buts', expectedGoals: 'xG', possession: 'Possession', shots: 'Tirs', shotsOffTarget: 'Tirs non cadrés',
      blockedShots: 'Tirs contrés', bigChances: 'Grosses occasions', bigChancesMissed: 'Grosses occasions ratées',
      touchesInOppositionBox: 'Touches dans la surface', shotsOnTarget: 'Tirs cadrés', passes: 'Passes',
      accuratePasses: 'Passes réussies', passAccuracy: 'Précision passes', fouls: 'Fautes', corners: 'Corners',
      freeKicks: 'Coups francs', throwIns: 'Touches', offsides: 'Hors-jeux', yellowCards: 'Cartons jaunes',
      redCards: 'Cartons rouges', saves: 'Arrêts', tackles: 'Tacles', interceptions: 'Interceptions', clearances: 'Dégagements'
    }
  }
}

const ui = computed(() => UI_TEXT[currentLang.value] || UI_TEXT.en)
const tabLabels = computed(() => ui.value.tabs)

const homeLineup = computed(() => {
  const home = lineups.value.filter(l => l.team === 'home')
  return {
    starters: home.filter(p => p.is_starter),
    subs: home.filter(p => !p.is_starter).sort((a, b) => (a.bench_order || 999) - (b.bench_order || 999))
  }
})

const awayLineup = computed(() => {
  const away = lineups.value.filter(l => l.team === 'away')
  return {
    starters: away.filter(p => p.is_starter),
    subs: away.filter(p => !p.is_starter).sort((a, b) => (a.bench_order || 999) - (b.bench_order || 999))
  }
})

const sortedEvents = computed(() => {
  return [...events.value].sort((a, b) => {
    const aOrder = Number(a.minute || 0) + Number(a.extra_minute || 0) / 100
    const bOrder = Number(b.minute || 0) + Number(b.extra_minute || 0) / 100
    return aOrder - bOrder
  })
})

const stats = computed(() => {
  const goalsByTeam = {}
  const subsByTeam = {}
  const cardsByTeam = {}
  
  events.value.forEach(evt => {
    if (!goalsByTeam[evt.team]) goalsByTeam[evt.team] = 0
    if (!subsByTeam[evt.team]) subsByTeam[evt.team] = 0
    if (!cardsByTeam[evt.team]) cardsByTeam[evt.team] = 0
    
    if (evt.event_type.includes('goal')) goalsByTeam[evt.team]++
    if (evt.event_type.includes('sub_in')) subsByTeam[evt.team]++
    if (evt.event_type.includes('yellow') || evt.event_type.includes('red')) cardsByTeam[evt.team]++
  })

  const result = []
  if (goalsByTeam.home !== undefined) result.push({ team: 'home', type: 'goals', label: ui.value.labels.goals, count: goalsByTeam.home })
  if (goalsByTeam.away !== undefined) result.push({ team: 'away', type: 'goals', label: ui.value.labels.goals, count: goalsByTeam.away })
  if (subsByTeam.home !== undefined) result.push({ team: 'home', type: 'subs', label: currentLang.value === 'fr' ? 'Changements' : 'Substitutions', count: subsByTeam.home })
  if (subsByTeam.away !== undefined) result.push({ team: 'away', type: 'subs', label: currentLang.value === 'fr' ? 'Changements' : 'Substitutions', count: subsByTeam.away })
  if (cardsByTeam.home !== undefined) result.push({ team: 'home', type: 'cards', label: currentLang.value === 'fr' ? 'Cartons' : 'Cards', count: cardsByTeam.home })
  if (cardsByTeam.away !== undefined) result.push({ team: 'away', type: 'cards', label: currentLang.value === 'fr' ? 'Cartons' : 'Cards', count: cardsByTeam.away })
  return result
})

const detailedHomeStats = computed(() => filterDetailedStats(matchStats.value?.stats?.home))
const detailedAwayStats = computed(() => filterDetailedStats(matchStats.value?.stats?.away))

const hasFormationStats = computed(() => {
  const formations = matchStats.value?.formations
  if (!formations) return false
  return Boolean(formations.home || formations.away || formations.homeSystem || formations.awaySystem)
})

const hasDetailedStats = computed(() => detailedHomeStats.value.length > 0 || detailedAwayStats.value.length > 0)

const hasPerformanceStats = computed(() => {
  const performances = matchStats.value?.player_performances
  return Boolean(performances?.home?.length || performances?.away?.length)
})

const visibleTabs = computed(() => {
  const available = []
  if (hasDetailedStats.value || stats.value.length) available.push('stats')
  if (hasFormationStats.value) available.push('formations')
  if (hasPerformanceStats.value) available.push('performances')
  if (events.value.length) available.push('events')
  if (lineups.value.length) available.push('lineups')
  return available.length ? available : TAB_ORDER
})

const comparisonStats = computed(() => {
  const home = matchStats.value?.stats?.home || {}
  const away = matchStats.value?.stats?.away || {}
  const orderedKeys = [
    'goals',
    'expectedGoals',
    'possession',
    'shots',
    'shotsOnTarget',
    'shotsOffTarget',
    'blockedShots',
    'bigChances',
    'bigChancesMissed',
    'touchesInOppositionBox',
    'passes',
    'accuratePasses',
    'passAccuracy',
    'saves',
    'tackles',
    'interceptions',
    'clearances',
    'corners',
    'freeKicks',
    'throwIns',
    'offsides',
    'fouls',
    'yellowCards',
    'redCards'
  ]

  const allKeys = [...new Set([...Object.keys(home), ...Object.keys(away)])]
  const remainingKeys = allKeys
    .filter((key) => !orderedKeys.includes(key))
    .sort((a, b) => a.localeCompare(b))

  return [...orderedKeys, ...remainingKeys]
    .map((key) => {
      const homeValue = home[key] ?? null
      const awayValue = away[key] ?? null
      if (homeValue == null && awayValue == null) return null
      const { homeShare, awayShare } = computeShares(homeValue, awayValue)
      return { key, homeValue, awayValue, homeShare, awayShare }
    })
    .filter(Boolean)
})

async function loadMatchData() {
  if (!props.match?.id) return
  loading.value = true
  lineups.value = []
  events.value = []
  matchStats.value = null
  try {
    const [{ data: lineupData }, { data: eventData }, { data: statsData }] = await Promise.all([
      sb.from('match_lineups').select('*').eq('match_id', props.match.id),
      sb.from('match_events').select('*').eq('match_id', props.match.id),
      sb.from('match_stats').select('*').eq('match_id', props.match.id).single()
    ])
    lineups.value = lineupData || []
    events.value = eventData || []
    matchStats.value = statsData || null
    selectBestTab()
  } catch (err) {
    console.error('Error loading match data:', err)
  } finally {
    loading.value = false
  }
}

function selectBestTab() {
  const tabs = visibleTabs.value
  activeTab.value = tabs[0] || 'stats'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

function formatStatLabel(key) {
  return ui.value.labels[key] || splitCamelCase(key)
}

function formatStatValue(key, value) {
  if (value == null) return '—'
  const lowerKey = key.toLowerCase()
  if (lowerKey.includes('possession') || lowerKey.includes('accuracy') || lowerKey.includes('percentage')) {
    return `${value}%`
  }
  if (lowerKey.includes('expectedgoals') || lowerKey === 'xg') {
    return Number(value).toFixed(2)
  }
  return value
}

function splitCamelCase(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function computeShares(homeValue, awayValue) {
  const home = Number(homeValue || 0)
  const away = Number(awayValue || 0)
  const total = home + away
  if (total <= 0) return { homeShare: 50, awayShare: 50 }
  return {
    homeShare: (home / total) * 100,
    awayShare: (away / total) * 100
  }
}

function filterDetailedStats(teamStats) {
  if (!teamStats || typeof teamStats !== 'object') return []
  return Object.entries(teamStats)
    .filter(([, value]) => value != null)
    .map(([key, value]) => ({ key, value }))
}

onMounted(() => loadMatchData())
watch(() => props.match?.id, () => loadMatchData())
</script>

<style scoped>
.match-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.match-modal {
  background:
    radial-gradient(circle at top, rgba(232, 0, 29, 0.14), transparent 36%),
    linear-gradient(180deg, #201b1d 0%, #151412 100%);
  border: 1px solid rgba(232, 0, 29, 0.18);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  border-radius: 18px;
  max-width: 760px;
  width: 100%;
  max-height: 84vh;
  overflow-y: auto;
  position: relative;
}

.match-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  z-index: 10;
  padding: 4px 8px;
}

.match-modal-close:hover {
  color: rgba(255, 255, 255, 0.9);
}

.match-header {
  padding: 28px 24px 22px;
  padding-right: 44px;
  border-bottom: 1px solid rgba(232, 0, 29, 0.15);
}

.match-competition-date {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.match-comp {
  background: rgba(232, 0, 29, 0.15);
  padding: 4px 8px;
  border-radius: 3px;
}

.match-score {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.match-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.overview-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.overview-label {
  color: rgba(255, 255, 255, 0.55);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.overview-value {
  color: #f4f4f2;
  font-size: 16px;
  font-weight: 700;
}

.team-col {
  flex: 1;
  text-align: center;
}

.team-name {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
}

.score-large {
  font-size: 56px;
  font-weight: 700;
  color: #f4f4f2;
  line-height: 1;
}

.score-dash {
  color: rgba(255, 255, 255, 0.22);
  font-size: 38px;
}

.match-tabs {
  display: flex;
  gap: 8px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(232, 0, 29, 0.12);
  background: rgba(0, 0, 0, 0.16);
  flex-wrap: wrap;
}

.match-tabs button {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid transparent;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s;
}

.match-tabs button.active {
  color: #fff3f5;
  background: rgba(232, 0, 29, 0.18);
  border-color: rgba(232, 0, 29, 0.4);
  box-shadow: inset 0 0 0 1px rgba(232, 0, 29, 0.08);
}

.match-tabs button:hover {
  color: rgba(255, 255, 255, 0.82);
  border-color: rgba(255, 255, 255, 0.12);
}

.match-content {
  padding: 24px;
  min-height: 320px;
}

.match-loading {
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 40px 20px;
}

.match-empty {
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 40px 20px;
  font-size: 13px;
}

/* Lineups */
.match-lineups {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.lineup-section h4 {
  color: #f4f4f2;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(232, 0, 29, 0.15);
}

.lineup-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.lineup-player {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 12px;
}

.lineup-player--sub {
  background: rgba(255, 255, 255, 0.025);
  opacity: 0.82;
}

.shirt-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #e8001d;
  color: white;
  font-weight: 700;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 11px;
}

.player-name {
  flex: 1;
  color: #f4f4f2;
  font-weight: 500;
}

.position-badge {
  background: rgba(232, 0, 29, 0.14);
  color: #ffd8de;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
}

.lineup-subs {
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
}

/* Events */
.events-timeline {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.event-minute {
  flex-shrink: 0;
  min-width: 46px;
  color: #ffd8de;
  font-weight: 700;
  font-size: 12px;
  padding-top: 4px;
}

.event-badge {
  flex-shrink: 0;
  min-width: 24px;
  height: 24px;
  background: rgba(232, 0, 29, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.event-content {
  flex: 1;
}

.event-team {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.event-team.is-home::before {
  content: '🏠 ';
}

.event-player {
  font-weight: 600;
  color: #f4f4f2;
  font-size: 13px;
  margin: 1px 0;
}

.event-assist {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 2px;
  font-style: italic;
}

/* Stats */
.match-stats {
  display: block;
}

.stats-compare-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stats-compare-head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

.compare-team {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.compare-team--home {
  text-align: left;
}

.compare-team--away {
  text-align: right;
}

.compare-title {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.stats-compare-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compare-row {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr) 70px;
  gap: 12px;
  align-items: center;
}

.compare-center {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.compare-label {
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.52);
}

.compare-bars {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.compare-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  overflow: hidden;
}

.compare-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.compare-bar--home span {
  margin-left: auto;
  background: linear-gradient(90deg, rgba(232, 0, 29, 0.35), rgba(232, 0, 29, 0.95));
}

.compare-bar--away span {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.35));
}

.compare-value {
  font-size: 22px;
  font-weight: 700;
  color: #f4f4f2;
  line-height: 1;
}

.compare-value--home {
  text-align: left;
}

.compare-value--away {
  text-align: right;
}

.stat-row {
  background: rgba(232, 0, 29, 0.08);
  padding: 12px;
  border-radius: 4px;
  text-align: center;
}

.stat-team {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #e8001d;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

/* Formations */
.match-formations {
  display: flex;
  align-items: center;
  justify-content: center;
}

.formation-row {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 40px;
  width: 100%;
}

.formation-team {
  flex: 1;
  text-align: center;
  padding: 22px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
}

.formation-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.formation-value {
  font-size: 42px;
  font-weight: 700;
  color: #f4f4f2;
  font-family: 'Bebas Neue', sans-serif;
}

.formation-vs {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* Detailed Stats */
.detailed-stats {
  width: 100%;
}

/* Performances */
.match-performances {
  padding: 0;
}

.performance-teams {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  padding: 24px;
}

.performance-section {
  padding: 0;
}

.performance-section h4 {
  font-size: 12px;
  font-weight: 700;
  color: #e8001d;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(232, 0, 29, 0.15);
}

.performance-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.perf-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  background: transparent;
  border-radius: 0;
  border-left: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.perf-name {
  font-weight: 600;
  color: #f4f4f2;
  font-size: 13px;
  margin-bottom: 2px;
}

.perf-position {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.perf-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 0;
  font-size: 11px;
}

.perf-rating {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
}

.perf-rating.rating-high {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.perf-rating.rating-mid {
  background: rgba(232, 0, 29, 0.2);
  color: #e8001d;
}

.perf-minutes {
  color: rgba(255, 255, 255, 0.5);
}

/* Animations */
.match-modal-enter-active,
.match-modal-leave-active {
  transition: opacity 0.2s;
}

.match-modal-enter-from,
.match-modal-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .match-modal {
    max-width: 100%;
    border-radius: 12px 12px 0 0;
    max-height: 90vh;
  }

  .match-header {
    padding: 22px 18px 18px;
  }

  .match-overview {
    grid-template-columns: 1fr;
  }

  .match-lineups {
    grid-template-columns: 1fr;
  }

  .match-score {
    font-size: 14px;
  }

  .score-large {
    font-size: 36px;
  }

  .performance-teams {
    grid-template-columns: 1fr;
  }

  .formation-row {
    flex-direction: column;
    gap: 20px;
  }

  .compare-row {
    grid-template-columns: 56px minmax(0, 1fr) 56px;
    gap: 8px;
  }

  .compare-value {
    font-size: 18px;
  }

  .match-tabs button {
    font-size: 11px;
    padding: 10px 8px;
  }

  .match-content,
  .performance-teams {
    padding: 18px;
  }
}
</style>
