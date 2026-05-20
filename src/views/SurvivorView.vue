<template>
  <section class="survivor-page">
    <header class="survivor-header">
      <div class="survivor-header-inner">
        <RouterLink class="survivor-back" to="/">← {{ t('nav_home') }}</RouterLink>
        <h1>Survivor</h1>
        <p>{{ surveyorSubtitle }}</p>
      </div>
    </header>

    <div class="survivor-content">
      <!-- No active survivor -->
      <div v-if="!activeSurvivor" class="no-survivor">
        <div class="no-survivor-card">
          <div class="no-survivor-icon">🎮</div>
          <h2>{{ t('survivor_no_active_title') }}</h2>
          <p>{{ t('survivor_no_active_subtitle') }}</p>
        </div>
      </div>

      <!-- Active survivor view -->
      <template v-else>
        <!-- Status bar -->
        <div class="survivor-status-bar">
          <div class="status-item">
            <span class="status-label">{{ t('survivor_status_label') }}</span>
            <span class="status-value">{{ formatSurvivorStatus(activeSurvivor.status) }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">{{ t('survivor_type_label') }}</span>
            <span class="status-value">{{ formatSurvivorType(activeSurvivor.match_source) }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">{{ t('survivor_matchday_label') }}</span>
            <span class="status-value">{{ activeSurvivor.current_matchday }} / {{ activeSurvivor.total_matchdays }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">{{ t('survivor_active_participants_label') }}</span>
            <span class="status-value">{{ activeParticipants.length }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">{{ t('survivor_eliminated_count_label') }}</span>
            <span class="status-value">{{ eliminatedParticipants.length }}</span>
          </div>
        </div>

        <!-- Current user summary -->
        <div v-if="currentUserParticipant && activeSurvivor.status === 'active' && !forceJoinMode" class="current-user-section">
          <div class="current-user-card">
            <p>
              {{ t('survivor_logged_as') }} <strong>{{ currentUserParticipant.participant_name }}</strong>
              ({{ currentUserParticipant.participant_email }})
            </p>
            <button type="button" class="btn-secondary" @click="switchUser">
              {{ t('survivor_switch_user') }}
            </button>
          </div>
        </div>

        <!-- Join section (if not joined, or if user wants to switch account) -->
        <div v-if="showJoinForm" class="survivor-join-section">
          <div class="join-card">
            <h2>{{ t('survivor_join_title') }}</h2>
            <form @submit.prevent="joinSurvivor">
              <input v-model="joinForm.name" type="text" :placeholder="t('survivor_name_placeholder')" required />
              <input v-model="joinForm.email" type="email" :placeholder="t('survivor_email_placeholder')" required />
              <button type="submit" class="btn-primary">{{ t('survivor_join_cta') }}</button>
            </form>
          </div>
        </div>

        <!-- Tabs -->
        <div class="survivor-tabs">
          <button
            :class="{ active: activeTab === 'predictions' }"
            @click="activeTab = 'predictions'"
          >
            {{ t('survivor_tab_predictions') }}
          </button>
          <button
            :class="{ active: activeTab === 'standings' }"
            @click="activeTab = 'standings'"
          >
            {{ t('survivor_tab_standings') }}
          </button>
          <button
            v-if="currentUserParticipant?.status === 'eliminated'"
            :class="{ active: activeTab === 'eliminated' }"
            @click="activeTab = 'eliminated'"
          >
            {{ t('survivor_tab_elimination') }}
          </button>
        </div>

        <!-- Predictions Tab -->
        <div v-if="activeTab === 'predictions'" class="tab-content">
          <h2>
            {{ t('survivor_pending_title') }}
            <template v-if="isWorldCupSurvivor"> - {{ t('survivor_day_short') }}{{ activeSurvivor.current_matchday }}</template>
          </h2>

          <!-- Alert if user is eliminated -->
          <div v-if="currentUserParticipant?.status === 'eliminated'" class="alert alert-warning">
            ❌ {{ t('survivor_eliminated_alert') }} {{ currentUserElimination?.match_id }}.
          </div>

          <!-- Next matches to predict -->
          <div class="predictions-list">
            <div v-for="match in nextMatches" :key="match.id" class="prediction-card">
              <div class="match-header">
                <span class="match-date">{{ formatDate(match.match_date) }}</span>
                <span class="match-comp">{{ match.competition_id }}</span>
              </div>

              <div class="match-details">
                <div class="team home">
                  <span class="team-name">{{ match.home_team }}</span>
                </div>
                <span class="vs">VS</span>
                <div class="team away">
                  <span class="team-name">{{ match.away_team }}</span>
                </div>
              </div>

              <!-- Prediction form -->
              <div v-if="canPredictMatch(match) && currentUserParticipant?.status === 'active'" class="prediction-form">
                <button
                  :disabled="isTeamAlreadyUsed(match.home_team, match.id, match) || isPredictionPending(match.id)"
                  @click="makePrediction(match.id, 'home')"
                  class="btn-predict"
                  :class="{
                    disabled: isTeamAlreadyUsed(match.home_team, match.id, match) || isPredictionPending(match.id),
                    selected: getUserPrediction(match.id)?.prediction === 'home'
                  }"
                >
                  {{ match.home_team }}
                </button>
                <button
                  :disabled="isTeamAlreadyUsed(match.away_team, match.id, match) || isPredictionPending(match.id)"
                  @click="makePrediction(match.id, 'away')"
                  class="btn-predict"
                  :class="{
                    disabled: isTeamAlreadyUsed(match.away_team, match.id, match) || isPredictionPending(match.id),
                    selected: getUserPrediction(match.id)?.prediction === 'away'
                  }"
                >
                  {{ match.away_team }}
                </button>
              </div>

              <!-- Already predicted -->
              <div v-else-if="getUserPrediction(match.id)" class="prediction-made">
                <span class="badge">
                  {{ getUserPrediction(match.id).prediction === 'home' ? match.home_team : match.away_team }}
                </span>
                <span v-if="getUserPrediction(match.id).is_correct !== null" class="badge-result">
                  {{ getUserPrediction(match.id).is_correct ? t('survivor_prediction_correct') : t('survivor_prediction_incorrect') }}
                </span>
                <button
                  v-if="canCancelPrediction(match.id)"
                  class="btn-cancel-prediction"
                  :disabled="isPredictionPending(match.id)"
                  @click="cancelPrediction(match.id)"
                >
                  {{ t('survivor_cancel_prediction') }}
                </button>
              </div>

            </div>

            <div v-if="nextMatches.length === 0" class="empty-state">
              {{ t('survivor_no_pending_matches') }}
            </div>
          </div>
        </div>

        <!-- Standings Tab -->
        <div v-if="activeTab === 'standings'" class="tab-content">
          <h2>{{ t('survivor_tab_standings') }}</h2>
          <div class="standings-table">
            <div class="standings-row standing-header">
              <div class="col-rank">#</div>
              <div class="col-name">{{ t('survivor_player_label') }}</div>
              <div class="col-correct">{{ t('survivor_predictions_label') }}</div>
              <div class="col-status">{{ t('survivor_status_label') }}</div>
            </div>
            <div
              v-for="(standing, idx) in standings"
              :key="standing.participant_id"
              class="standings-row"
              :class="{ 'is-eliminated': standing.status === 'eliminated' }"
            >
              <div class="col-rank">{{ idx + 1 }}</div>
              <div class="col-name">{{ standing.participant_name }}</div>
              <div class="col-correct">{{ standing.correct_predictions }}/{{ standing.total_predictions }}</div>
              <div class="col-status">
                <span class="badge" :class="standing.status">{{ formatSurvivorStatus(standing.status) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Elimination info -->
        <div v-if="activeTab === 'eliminated' && currentUserElimination" class="tab-content">
          <h2>{{ t('survivor_elimination_title') }}</h2>
          <div class="elimination-card">
            <p>{{ t('survivor_elimination_match_prefix') }} <strong>#{{ currentUserElimination.match_id }}</strong></p>
            <p v-if="currentUserElimination.reason">{{ t('survivor_reason_label') }}: {{ currentUserElimination.reason }}</p>
            <p class="elimination-date">{{ t('survivor_elimination_date_prefix') }} {{ formatDate(currentUserElimination.eliminated_at) }}</p>
            <p class="next-survivor">{{ t('survivor_next_join_hint') }}</p>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../lib/i18n.js'
import { sb } from '../lib/supabase.js'
import { getCurrentUserEmail, getCurrentUserDisplayName } from '../lib/auth.js'

const { t } = useI18n()
const surveyorSubtitle = t('survivor_subtitle')

const activeSurvivor = ref(null)
const allParticipants = ref([])
const allPredictions = ref([])
const allTeamsUsed = ref([])
const allMatches = ref([])
const allEliminations = ref([])

const activeTab = ref('predictions')
const joinForm = ref({ name: '', email: '' })
const forceJoinMode = ref(false)
const predictionPendingByMatch = ref({})

const currentUserEmail = ref(localStorage.getItem('survivor_user_email') || getCurrentUserEmail())
const currentUserId = ref(localStorage.getItem('survivor_user_id'))

// Computed
const activeParticipants = computed(() =>
  allParticipants.value.filter(p => p.status === 'active')
)

const eliminatedParticipants = computed(() =>
  allParticipants.value.filter(p => p.status === 'eliminated')
)

const currentUserParticipant = computed(() =>
  allParticipants.value.find(p => p.participant_email === currentUserEmail.value)
)

const currentUserElimination = computed(() =>
  allEliminations.value.find(e => e.participant_id === currentUserParticipant.value?.id)
)

const showJoinForm = computed(() =>
  Boolean(activeSurvivor.value?.status === 'active' && (!currentUserParticipant.value || forceJoinMode.value))
)

const isWorldCupSurvivor = computed(() => activeSurvivor.value?.match_source === 'world_cup')
const currentSurvivorMatchday = computed(() => Number(activeSurvivor.value?.current_matchday || 1))

const worldCupRoundByMatchId = computed(() => {
  if (!isWorldCupSurvivor.value) return {}

  const grouped = new Map()
  for (const match of allMatches.value) {
    const groupKey = extractWorldCupGroup(match)
    if (!groupKey) continue
    if (!grouped.has(groupKey)) grouped.set(groupKey, [])
    grouped.get(groupKey).push(match)
  }

  const roundByMatch = {}
  for (const [, matches] of grouped) {
    const sorted = [...matches].sort((a, b) => {
      const ta = new Date(a.match_date || 0).getTime()
      const tb = new Date(b.match_date || 0).getTime()
      if (ta !== tb) return ta - tb
      return Number(a.id || 0) - Number(b.id || 0)
    })

    sorted.forEach((match, idx) => {
      roundByMatch[match.id] = Math.floor(idx / 2) + 1
    })
  }

  return roundByMatch
})

const nextMatches = computed(() => {
  if (!activeSurvivor.value) return []

  const upcoming = allMatches.value.filter((match) => !isMatchPlayed(match))
  if (!isWorldCupSurvivor.value) return upcoming

  const targetRound = currentSurvivorMatchday.value
  const pool = upcoming.filter((match) => getMatchRound(match) === targetRound)
  return pool.length ? pool : upcoming
})

const standings = computed(() => {
  return allParticipants.value.map(p => {
    const predictions = allPredictions.value.filter(pred => pred.participant_id === p.id)
    const correctCount = predictions.filter(pred => pred.is_correct).length
    return {
      participant_id: p.id,
      participant_name: p.participant_name,
      status: p.status,
      correct_predictions: correctCount,
      total_predictions: predictions.length
    }
  }).sort((a, b) => {
    // Sort by correct predictions desc, then by total predictions desc
    if (b.correct_predictions !== a.correct_predictions) {
      return b.correct_predictions - a.correct_predictions
    }
    return b.total_predictions - a.total_predictions
  })
})

// Methods
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR')
}

function formatSurvivorStatus(status) {
  const key = `survivor_status_${String(status || '').toLowerCase()}`
  const translated = t(key)
  return translated === key ? status : translated
}

function formatSurvivorType(source) {
  if (source === 'world_cup') return t('survivor_type_world_cup')
  if (source === 'club') return t('survivor_type_club')
  return source || ''
}

function extractWorldCupGroup(match) {
  const stage = String(match?.competition_id || '')
  const groupMatch = stage.match(/group\s*([a-z])/i)
  if (!groupMatch) return null
  return String(groupMatch[1] || '').toUpperCase()
}

function getMatchRound(match) {
  if (!isWorldCupSurvivor.value) return null
  return worldCupRoundByMatchId.value[match?.id] || null
}

function isBarrageMatch(match) {
  const stage = String(match?.competition_id || '').toLowerCase()
  return (
    stage.includes('barrage') ||
    stage.includes('playoff') ||
    stage.includes('play-off') ||
    stage.includes('round of 32') ||
    stage.includes('1/16') ||
    stage.includes('seizieme')
  )
}

function shouldEnforceTeamReuseRule(match) {
  if (!isWorldCupSurvivor.value) return true
  const round = getMatchRound(match)
  if (round && round <= 3) return true
  if (isBarrageMatch(match)) return true
  return false
}

function predictionMatchId(prediction) {
  return isWorldCupSurvivor.value ? prediction?.wc_match_id : prediction?.match_id
}

function teamUsedMatchId(row) {
  return isWorldCupSurvivor.value ? row?.wc_match_id : row?.match_id
}

function getCurrentOpenPrediction() {
  return allPredictions.value.find((prediction) => {
    if (prediction.participant_id !== currentUserParticipant.value?.id) return false
    const matchId = predictionMatchId(prediction)
    const match = allMatches.value.find((m) => m.id === matchId)
    if (!match || isMatchPlayed(match)) return false
    if (!isWorldCupSurvivor.value) return true
    return getMatchRound(match) === currentSurvivorMatchday.value
  })
}

function hasOpenPrediction() {
  return Boolean(getCurrentOpenPrediction())
}

function isMatchPlayed(match) {
  return String(match?.status || '').toLowerCase() === 'played'
}

function canPredictMatch(match) {
  if (isMatchPlayed(match)) return false
  if (isWorldCupSurvivor.value && getMatchRound(match) !== currentSurvivorMatchday.value) return false
  return true
}

function hasUserPredicted(matchId) {
  return allPredictions.value.some(
    p =>
      p.participant_id === currentUserParticipant.value?.id &&
      predictionMatchId(p) === matchId
  )
}

function getUserPrediction(matchId) {
  return allPredictions.value.find(
    p =>
      p.participant_id === currentUserParticipant.value?.id &&
      predictionMatchId(p) === matchId
  )
}

function isTeamAlreadyUsed(teamName, matchId = null, match = null) {
  if (!shouldEnforceTeamReuseRule(match)) return false
  return allTeamsUsed.value.some(
    t =>
      t.participant_id === currentUserParticipant.value?.id &&
      t.team_name === teamName &&
      (matchId === null || teamUsedMatchId(t) !== matchId)
  )
}

function isPredictionPending(matchId) {
  return Boolean(predictionPendingByMatch.value[matchId])
}

function canCancelPrediction(matchId) {
  const match = allMatches.value.find((m) => m.id === matchId)
  if (!match || isMatchPlayed(match)) return false
  const prediction = getUserPrediction(matchId)
  if (!prediction) return false
  if (!isWorldCupSurvivor.value) return true
  return getMatchRound(match) === currentSurvivorMatchday.value
}

async function joinSurvivor() {
  if (!activeSurvivor.value || !joinForm.value.name || !joinForm.value.email) return

  try {
    const { data, error } = await sb
      .from('survivor_participants')
      .insert({
        survivor_id: activeSurvivor.value.id,
        participant_email: joinForm.value.email,
        participant_name: joinForm.value.name,
        status: 'active'
      })
      .select()

    if (error) throw error

    // Store user email in localStorage
    localStorage.setItem('survivor_user_email', joinForm.value.email)
    localStorage.setItem('survivor_user_id', data[0]?.id)
    currentUserEmail.value = joinForm.value.email
    currentUserId.value = data[0]?.id
    forceJoinMode.value = false

    // Reload participants
    await loadParticipants()
    joinForm.value = { name: '', email: '' }
  } catch (err) {
    console.error('Error joining survivor:', err)
  }
}

function switchUser() {
  localStorage.removeItem('survivor_user_email')
  localStorage.removeItem('survivor_user_id')
  currentUserEmail.value = null
  currentUserId.value = null
  joinForm.value = { name: '', email: '' }
  forceJoinMode.value = true
}

async function makePrediction(matchId, prediction) {
  if (!currentUserParticipant.value || !activeSurvivor.value) return
  if (isPredictionPending(matchId)) return

  const match = allMatches.value.find((m) => m.id === matchId)
  if (!match || isMatchPlayed(match)) return

  const currentOpenPrediction = getCurrentOpenPrediction()

  try {
    predictionPendingByMatch.value = { ...predictionPendingByMatch.value, [matchId]: true }

    const isWorldCup = activeSurvivor.value.match_source === 'world_cup'

    if (currentOpenPrediction && predictionMatchId(currentOpenPrediction) !== matchId) {
      const previousMatchId = predictionMatchId(currentOpenPrediction)
      if (previousMatchId != null) {
        await clearPredictionForMatch(previousMatchId, isWorldCup)
      }
    }

    const predictionPayload = {
      survivor_id: activeSurvivor.value.id,
      participant_id: currentUserParticipant.value.id,
      prediction: prediction,
      match_id: isWorldCup ? null : matchId,
      wc_match_id: isWorldCup ? matchId : null
    }
    const predictionOnConflict = isWorldCup
      ? 'survivor_id,participant_id,wc_match_id'
      : 'survivor_id,participant_id,match_id'

    // Idempotent write: duplicate click/pending retry should not fail with 409.
    const { error: predictionError } = await sb
      .from('survivor_predictions')
      .upsert(predictionPayload, {
        onConflict: predictionOnConflict,
      })

    if (predictionError) throw predictionError

    // Get match details
    const teamName = prediction === 'home' ? match.home_team : match.away_team
    const enforceTeamReuseRule = shouldEnforceTeamReuseRule(match)

    const teamUsedMatchColumn = isWorldCup ? 'wc_match_id' : 'match_id'
    const { error: deleteTeamUsedError } = await sb
      .from('survivor_teams_used')
      .delete()
      .eq('survivor_id', activeSurvivor.value.id)
      .eq('participant_id', currentUserParticipant.value.id)
      .eq(teamUsedMatchColumn, matchId)

    if (deleteTeamUsedError) throw deleteTeamUsedError

    if (enforceTeamReuseRule) {
      const teamUsedPayload = {
        survivor_id: activeSurvivor.value.id,
        participant_id: currentUserParticipant.value.id,
        team_name: teamName,
        match_id: isWorldCup ? null : matchId,
        wc_match_id: isWorldCup ? matchId : null
      }

      const { error: teamUsedError } = await sb
        .from('survivor_teams_used')
        .insert(teamUsedPayload)

      if (teamUsedError) throw teamUsedError
    }

    // Reload predictions
    await loadPredictions()
    await loadTeamsUsed()
  } catch (err) {
    console.error('Error making prediction:', err)
  } finally {
    predictionPendingByMatch.value = { ...predictionPendingByMatch.value, [matchId]: false }
  }
}

async function cancelPrediction(matchId) {
  if (!currentUserParticipant.value || !activeSurvivor.value) return
  if (isPredictionPending(matchId)) return

  const match = allMatches.value.find((m) => m.id === matchId)
  if (!match || isMatchPlayed(match)) return

  try {
    predictionPendingByMatch.value = { ...predictionPendingByMatch.value, [matchId]: true }

    const isWorldCup = activeSurvivor.value.match_source === 'world_cup'
    await clearPredictionForMatch(matchId, isWorldCup)

    await loadPredictions()
    await loadTeamsUsed()
  } catch (err) {
    console.error('Error cancelling prediction:', err)
  } finally {
    predictionPendingByMatch.value = { ...predictionPendingByMatch.value, [matchId]: false }
  }
}

async function clearPredictionForMatch(matchId, isWorldCup) {
  const matchColumn = isWorldCup ? 'wc_match_id' : 'match_id'

  const { error: predictionDeleteError } = await sb
    .from('survivor_predictions')
    .delete()
    .eq('survivor_id', activeSurvivor.value.id)
    .eq('participant_id', currentUserParticipant.value.id)
    .eq(matchColumn, matchId)

  if (predictionDeleteError) throw predictionDeleteError

  const { error: teamUsedDeleteError } = await sb
    .from('survivor_teams_used')
    .delete()
    .eq('survivor_id', activeSurvivor.value.id)
    .eq('participant_id', currentUserParticipant.value.id)
    .eq(matchColumn, matchId)

  if (teamUsedDeleteError) throw teamUsedDeleteError
}

async function loadActiveSurvivor() {
  const { data, error } = await sb
    .from('survivors')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!error && data) {
    activeSurvivor.value = data
  }
}

async function loadParticipants() {
  if (!activeSurvivor.value) return

  const { data, error } = await sb
    .from('survivor_participants')
    .select('*')
    .eq('survivor_id', activeSurvivor.value.id)

  if (!error) {
    allParticipants.value = data || []
  }
}

async function loadPredictions() {
  if (!activeSurvivor.value) return

  const { data, error } = await sb
    .from('survivor_predictions')
    .select('*')
    .eq('survivor_id', activeSurvivor.value.id)

  if (!error) {
    allPredictions.value = data || []
  }
}

async function loadTeamsUsed() {
  if (!activeSurvivor.value) return

  const { data, error } = await sb
    .from('survivor_teams_used')
    .select('*')
    .eq('survivor_id', activeSurvivor.value.id)

  if (!error) {
    allTeamsUsed.value = data || []
  }
}

async function loadMatches() {
  if (!activeSurvivor.value) return

  const isWorldCup = activeSurvivor.value.match_source === 'world_cup'
  
  if (isWorldCup) {
    // Load from wc_matches table
    const { data, error } = await sb
      .from('wc_matches')
      .select('*')
      .order('kickoff_at', { ascending: true })
      .limit(200)

    if (error) {
      console.error('⚠️ Error loading wc_matches:', error)
      return
    }

    if (data && data.length > 0) {
      allMatches.value = data.map(m => ({
        id: m.id,
        match_date: m.kickoff_at,
        home_team: m.home_team,
        away_team: m.away_team,
        competition_id: m.stage || 'World Cup',
        status: m.status || 'upcoming',
        home_team_id: null,
        away_team_id: null
      }))
    }
  } else {
    // Load from matches table (club matches)
    const { data, error } = await sb
      .from('matches')
      .select('id, match_date, status, competition_id, home_team_id, away_team_id')
      .order('match_date', { ascending: true })
      .limit(200)

    if (error) {
      console.error('⚠️ Error loading matches:', error)
      return
    }

    if (data) {
      allMatches.value = data.map(m => ({
        ...m,
        home_team: `Home ${m.home_team_id}`,
        away_team: `Away ${m.away_team_id}`
      }))
    }
  }
}

async function loadEliminations() {
  if (!activeSurvivor.value) return

  const { data, error } = await sb
    .from('survivor_eliminations')
    .select('*')
    .eq('survivor_id', activeSurvivor.value.id)

  if (!error) {
    allEliminations.value = data || []
  }
}

onMounted(async () => {
  const authEmail = getCurrentUserEmail()
  const authName = getCurrentUserDisplayName()
  if (authEmail) {
    joinForm.value.email = authEmail
    if (!currentUserEmail.value) currentUserEmail.value = authEmail
  }
  if (authName) joinForm.value.name = authName

  await loadActiveSurvivor()
  await loadMatches()
  await loadParticipants()
  await loadPredictions()
  await loadTeamsUsed()
  await loadEliminations()

  if (!currentUserParticipant.value && authEmail) {
    forceJoinMode.value = true
  }
})
</script>

<style scoped>
.survivor-page {
  min-height: 100vh;
  background: var(--navy);
}

.survivor-header {
  background: linear-gradient(135deg, rgba(232, 0, 29, 0.16), rgba(4, 19, 59, 0.95));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 48px 20px 34px;
}

.survivor-header-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.survivor-back {
  display: inline-block;
  color: #e8001d;
  text-decoration: none;
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 13px;
  margin-bottom: 14px;
}

.survivor-header h1 {
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.08em;
  color: var(--white);
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1;
}

.survivor-header p {
  margin-top: 8px;
  color: rgba(244, 244, 242, 0.72);
  font-family: 'Barlow', sans-serif;
  font-size: 15px;
}

.survivor-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px 56px;
}

.no-survivor {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.no-survivor-card {
  text-align: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 48px 32px;
  max-width: 400px;
}

.no-survivor-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.no-survivor-card h2 {
  font-size: 24px;
  color: var(--white);
  margin: 0 0 12px;
}

.no-survivor-card p {
  color: rgba(244, 244, 242, 0.65);
  margin: 0;
}

.survivor-status-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 30px;
}

.status-item {
  background: rgba(232, 0, 29, 0.12);
  border: 1px solid rgba(232, 0, 29, 0.25);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.status-value {
  color: #e8001d;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Bebas Neue', sans-serif;
}

.survivor-join-section {
  margin-bottom: 30px;
}

.current-user-section {
  margin-bottom: 20px;
}

.current-user-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  max-width: 700px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.current-user-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
}

.join-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
}

.join-card h2 {
  font-size: 20px;
  color: var(--white);
  margin: 0 0 20px;
}

.join-card form {
  display: grid;
  gap: 12px;
}

.join-card input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--white);
  font-size: 14px;
}

.join-card input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.survivor-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.survivor-tabs button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.survivor-tabs button.active {
  color: #e8001d;
  border-bottom-color: #e8001d;
}

.survivor-tabs button:hover {
  color: rgba(255, 255, 255, 0.8);
}

.tab-content {
  margin-top: 20px;
}

.tab-content h2 {
  font-size: 20px;
  color: var(--white);
  margin: 0 0 20px;
}

.alert {
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 20px;
  font-size: 14px;
}

.alert-warning {
  background: rgba(232, 0, 29, 0.15);
  border: 1px solid rgba(232, 0, 29, 0.3);
  color: #ffd8de;
}

.predictions-list {
  display: grid;
  gap: 14px;
}

.prediction-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 16px;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 12px;
}

.match-date {
  color: rgba(255, 255, 255, 0.6);
}

.match-comp {
  background: rgba(232, 0, 29, 0.15);
  padding: 4px 8px;
  border-radius: 3px;
  color: #ffd8de;
  font-weight: 600;
}

.match-details {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.team {
  text-align: center;
}

.team-name {
  display: block;
  color: #f4f4f2;
  font-weight: 600;
  font-size: 15px;
}

.vs {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.prediction-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.btn-predict {
  background: rgba(232, 0, 29, 0.2);
  border: 1px solid rgba(232, 0, 29, 0.4);
  border-radius: 6px;
  color: #e8001d;
  font-weight: 600;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-predict:hover:not(.disabled) {
  background: rgba(232, 0, 29, 0.35);
  border-color: rgba(232, 0, 29, 0.6);
}

.btn-predict.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-predict.selected {
  background: rgba(34, 197, 94, 0.25);
  border-color: rgba(34, 197, 94, 0.6);
  color: #a7f3d0;
}

.prediction-note {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(244, 244, 242, 0.6);
}

.btn-cancel-prediction {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(244, 244, 242, 0.8);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
}

.btn-cancel-prediction:hover:enabled {
  border-color: rgba(232, 0, 29, 0.6);
  color: #ffd8de;
}

.prediction-made {
  display: flex;
  gap: 10px;
  align-items: center;
}

.badge {
  display: inline-block;
  background: rgba(232, 0, 29, 0.2);
  border: 1px solid rgba(232, 0, 29, 0.4);
  color: #e8001d;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-result {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
  color: #22c55e;
}

.badge.eliminated {
  background: rgba(100, 100, 100, 0.2);
  border-color: rgba(100, 100, 100, 0.4);
  color: rgba(255, 255, 255, 0.5);
}

.standings-table {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
}

.standings-row {
  display: grid;
  grid-template-columns: 50px 1fr 120px 100px;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  align-items: center;
}

.standings-row.standing-header {
  background: rgba(232, 0, 29, 0.1);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.05em;
  color: rgba(255, 255, 255, 0.7);
}

.standings-row.is-eliminated {
  opacity: 0.6;
}

.col-rank {
  text-align: center;
  font-weight: 600;
  color: #e8001d;
}

.col-name {
  color: #f4f4f2;
  font-weight: 500;
}

.col-correct {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.col-status {
  text-align: center;
}

.elimination-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 24px;
  text-align: center;
}

.elimination-card p {
  margin: 12px 0;
  color: rgba(255, 255, 255, 0.8);
}

.elimination-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.next-survivor {
  color: #e8001d;
  font-weight: 600;
  margin-top: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.btn-primary {
  background: #e8001d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: rgba(232, 0, 29, 0.8);
}

.btn-secondary {
  background: transparent;
  color: #f4f4f2;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 6px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary:hover {
  border-color: rgba(232, 0, 29, 0.6);
  color: #ffd8de;
}

@media (max-width: 700px) {
  .survivor-status-bar {
    grid-template-columns: 1fr 1fr;
  }

  .standings-row {
    grid-template-columns: 40px 1fr 80px;
  }

  .col-status {
    display: none;
  }

  .survivor-tabs {
    flex-wrap: wrap;
  }
}
</style>
