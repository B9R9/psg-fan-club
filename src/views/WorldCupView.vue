<template>
  <section class="wc-page">
    <template v-if="accessGranted">
      <header class="wc-header">
        <h1>{{ t('wc_title') }}</h1>
        <p>{{ t('wc_subtitle') }}</p>
        <RouterLink class="wc-back" to="/">{{ t('wc_back_home') }}</RouterLink>
      </header>

      <section class="wc-card">
        <h2>{{ t('wc_profile_title') }}</h2>
        <div class="wc-profile-grid">
          <label>
            {{ t('wc_profile_pseudo') }}
            <input v-model="profile.name" :placeholder="t('wc_profile_placeholder')" />
          </label>
          <button class="wc-btn" @click="saveProfile">{{ t('wc_save') }}</button>
        </div>
        <p class="wc-note">{{ t('wc_note_lock') }}</p>
      </section>

      <section class="wc-layout">
        <section class="wc-card wc-matches">
          <div class="wc-title-row">
            <h2>{{ t('wc_matches_title') }}</h2>
            <div class="wc-actions">
              <select v-model="selectedGroup" class="wc-group-filter" :aria-label="t('wc_filter_group_aria')">
                <option value="all">{{ t('wc_filter_all') }}</option>
                <option v-for="group in availableGroupFilters" :key="group.value" :value="group.value">
                  {{ group.label }}
                </option>
              </select>
              <select
                v-if="selectedGroup === 'other'"
                v-model="selectedFinalRound"
                class="wc-group-filter"
                :aria-label="t('wc_filter_round_aria')"
              >
                <option value="all">{{ t('wc_filter_round_all') }}</option>
                <option v-for="round in availableFinalRounds" :key="round" :value="round">
                  {{ round }}
                </option>
              </select>
              <button class="wc-btn wc-btn-ghost" @click="loadPage">{{ t('wc_refresh') }}</button>
            </div>
          </div>

          <p v-if="errorMsg" class="wc-error">{{ errorMsg }}</p>
          <p v-if="loading" class="wc-muted">{{ t('wc_loading') }}</p>
          <p v-else-if="!matches.length" class="wc-muted">{{ t('wc_no_matches') }}</p>

          <div v-else class="wc-grouped">
            <section v-for="group in filteredGroupedMatches" :key="group.key" class="wc-group-card">
              <h3 class="wc-group-title">{{ group.label }}</h3>

              <div v-if="group.key !== 'other'" class="wc-group-table-wrap">
                <div class="wc-standings-switcher">
                  <span class="wc-standings-switcher-label">{{ t('wc_group_standings_toggle_label') }}</span>
                  <div class="wc-standings-switcher-controls" role="tablist" :aria-label="t('wc_group_standings_toggle_label')">
                    <button
                      class="wc-standings-switcher-btn"
                      :class="{ active: standingsView === 'real' }"
                      type="button"
                      role="tab"
                      :aria-selected="standingsView === 'real'"
                      @click="standingsView = 'real'"
                    >
                      {{ t('wc_group_standings_toggle_real') }}
                    </button>
                    <button
                      class="wc-standings-switcher-btn"
                      :class="{ active: standingsView === 'predictions' }"
                      type="button"
                      role="tab"
                      :aria-selected="standingsView === 'predictions'"
                      @click="standingsView = 'predictions'"
                    >
                      {{ t('wc_group_standings_toggle_pred') }}
                    </button>
                  </div>
                  <p class="wc-standings-switcher-hint">
                    {{ standingsView === 'real' ? t('wc_group_standings_real_hint') : t('wc_group_standings_pred_hint') }}
                  </p>
                </div>

                <table class="wc-group-table">
                  <thead>
                    <tr>
                      <th>{{ t('wc_table_team') }}</th>
                      <th>{{ t('wc_table_played') }}</th>
                      <th>{{ t('wc_table_points') }}</th>
                      <th>{{ t('wc_table_diff') }}</th>
                      <th>{{ t('wc_table_goals_for') }}</th>
                      <th>{{ t('wc_table_goals_against') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in activeStandingsByGroup.get(group.key) || []" :key="row.team">
                      <td>{{ teamLabel(row.team) }}</td>
                      <td>{{ row.played }}</td>
                      <td>{{ row.points }}</td>
                      <td>{{ row.gd }}</td>
                      <td>{{ row.gf }}</td>
                      <td>{{ row.ga }}</td>
                    </tr>
                    <tr v-if="!(activeStandingsByGroup.get(group.key) || []).length">
                      <td colspan="6" class="wc-muted-cell">
                        {{ standingsView === 'real' ? t('wc_group_standings_waiting') : t('wc_group_standings_predictions_waiting') }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="wc-match-list">
                <article v-for="match in group.matches" :key="match.id" class="wc-match-item">
                  <div class="wc-match-top">
                    <div>
                      <div class="wc-teams">{{ teamLabel(match.home_team) }} vs {{ teamLabel(match.away_team) }}</div>
                      <div class="wc-meta">
                        {{ formatKickoff(match.kickoff_at) }}
                        <span v-if="match.stage"> · {{ match.stage }}</span>
                      </div>
                    </div>
                    <div class="wc-status" :class="match.status">{{ statusLabel(match.status) }}</div>
                  </div>

                  <div v-if="match.status === 'played'" class="wc-final-score">
                    {{ t('wc_final_score') }}: {{ match.home_score }} - {{ match.away_score }}
                  </div>

                  <div class="wc-predict-row">
                    <input
                      type="number"
                      min="0"
                      :disabled="isLocked(match)"
                      v-model.number="draftFor(match.id).home"
                      :placeholder="t('wc_home_short')"
                    />
                    <span>-</span>
                    <input
                      type="number"
                      min="0"
                      :disabled="isLocked(match)"
                      v-model.number="draftFor(match.id).away"
                      :placeholder="t('wc_away_short')"
                    />
                    <button
                      class="wc-btn"
                      :disabled="isLocked(match) || savingMatchId === match.id"
                      @click="savePrediction(match)"
                    >
                      {{ savingMatchId === match.id ? '...' : t('wc_validate') }}
                    </button>
                  </div>

                  <p v-if="myPredictionMap.has(match.id)" class="wc-my-pred">
                    {{ t('wc_my_prediction') }}: {{ myPredictionMap.get(match.id).predicted_home }} - {{ myPredictionMap.get(match.id).predicted_away }}
                    <span v-if="match.status === 'played'"> · +{{ pointsForPrediction(myPredictionMap.get(match.id), match) }} {{ t('wc_points_short') }}</span>
                  </p>
                </article>
              </div>
            </section>
          </div>
        </section>

        <aside class="wc-side">
          <section class="wc-card">
            <h2>{{ t('wc_my_stats_title') }}</h2>
            <p v-if="!myTodayStats.totalPredicted && !myTodayStats.totalEvaluated" class="wc-muted">{{ t('wc_my_rank_empty') }}</p>
            <div v-else class="wc-my-stats">
              <div class="wc-my-stats-grid">
                <div class="wc-stat-pill">
                  <span>{{ t('wc_today_predicted') }}</span>
                  <strong>{{ myTodayStats.totalPredicted }}</strong>
                </div>
                <div class="wc-stat-pill">
                  <span>{{ t('wc_today_exact') }}</span>
                  <strong>{{ myTodayStats.exact }}</strong>
                </div>
                <div class="wc-stat-pill">
                  <span>{{ t('wc_today_good') }}</span>
                  <strong>{{ myTodayStats.good }}</strong>
                </div>
                <div class="wc-stat-pill">
                  <span>{{ t('wc_today_bad') }}</span>
                  <strong>{{ myTodayStats.bad }}</strong>
                </div>
              </div>
              <div class="wc-my-rank-meta">
                <strong>{{ t('wc_my_rank_label') }}</strong>
                <span v-if="myLeaderboardRow">#{{ myRank }} · {{ myLeaderboardRow.points }} {{ t('wc_points_short') }}</span>
                <span v-else>{{ t('wc_my_rank_pending') }}</span>
              </div>
            </div>
          </section>

          <section class="wc-card">
            <h2>{{ t('wc_leaderboard_title') }}</h2>
            <p v-if="!leaderboard.length" class="wc-muted">{{ t('wc_leaderboard_empty') }}</p>
            <ol v-else class="wc-leaderboard">
              <li v-for="(row, idx) in leaderboard" :key="row.email">
                <span class="rank">{{ idx + 1 }}</span>
                <span class="name">{{ row.name }}</span>
                <span class="pts">{{ row.points }} {{ t('wc_points_short') }}</span>
              </li>
            </ol>
          </section>

          <section class="wc-card">
            <h2>{{ t('wc_badges_title') }}</h2>
            <p v-if="!myBadges.length" class="wc-muted">{{ t('wc_badges_empty') }}</p>
            <ul v-else class="wc-badges">
              <li v-for="badge in myBadges" :key="badge.code">
                <strong>{{ badge.title }}</strong>
                <span>{{ badge.desc }}</span>
              </li>
            </ul>
          </section>
        </aside>
      </section>
    </template>

    <section v-else class="wc-card wc-access">
      <h2>{{ t('wc_access_title') }}</h2>
      <p class="wc-muted">{{ t('wc_access_sub') }}</p>
      <label class="wc-access-label" for="wc-access-email">{{ t('wc_access_email_label') }}</label>
      <input
        id="wc-access-email"
        class="wc-access-input"
        type="email"
        v-model="accessEmailInput"
        :placeholder="t('wc_access_email_placeholder')"
        @keydown.enter="grantAccess"
      />
      <p v-if="accessError" class="wc-error">{{ accessError }}</p>
      <button class="wc-btn" :disabled="accessLoading" @click="grantAccess">
        {{ accessLoading ? '...' : t('wc_access_continue') }}
      </button>
      <RouterLink class="wc-back" to="/">{{ t('wc_back_home') }}</RouterLink>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { sb } from '../lib/supabase.js'
import { useI18n, currentLang } from '../lib/i18n.js'
import { getCurrentUserDisplayName, getCurrentUserEmail } from '../lib/auth.js'

const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

const loading = ref(true)
const errorMsg = ref('')
const matches = ref([])
const myPredictions = ref([])
const allPredictions = ref([])
const drafts = ref({})
const savingMatchId = ref(null)
const teamMetaMap = ref(new Map())
const selectedGroup = ref('all')
const selectedFinalRound = ref('all')
const standingsView = ref('real')

const accessGranted = ref(false)
const accessLoading = ref(false)
const accessError = ref('')
const accessEmailInput = ref(localStorage.getItem('wc_access_email') || getCurrentUserEmail())

const profile = ref({
  name: localStorage.getItem('wc_name') || getCurrentUserDisplayName(),
  email: localStorage.getItem('wc_email') || getCurrentUserEmail(),
})

const myPredictionMap = computed(() => {
  const map = new Map()
  for (const row of myPredictions.value) map.set(row.match_id, row)
  return map
})

const groupedMatches = computed(() => {
  const groups = new Map()

  for (const match of matches.value) {
    const key = groupKeyForMatch(match)
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: key === 'other' ? 'Phase finale' : `Groupe ${key}`,
        matches: [],
      })
    }
    groups.get(key).matches.push(match)
  }

  const ordered = Array.from(groups.values())
  ordered.sort((a, b) => {
    if (a.key === 'other') return 1
    if (b.key === 'other') return -1
    return a.key.localeCompare(b.key)
  })

  return ordered
})

const availableGroupFilters = computed(() => {
  return groupedMatches.value.map((g) => ({
    value: g.key,
    label: g.key === 'other' ? t('wc_phase_final') : `${t('wc_group_label')} ${g.key}`,
  }))
})

const filteredGroupedMatches = computed(() => {
  if (selectedGroup.value === 'all') return groupedMatches.value

  const selected = groupedMatches.value.find((g) => g.key === selectedGroup.value)
  if (!selected) return []

  if (selected.key !== 'other' || selectedFinalRound.value === 'all') return [selected]

  return [{
    ...selected,
    matches: selected.matches.filter((m) => finalRoundLabelForMatch(m) === selectedFinalRound.value),
  }]
})

const availableFinalRounds = computed(() => {
  const finalGroup = groupedMatches.value.find((g) => g.key === 'other')
  if (!finalGroup) return []

  const set = new Set()
  for (const match of finalGroup.matches) {
    const label = finalRoundLabelForMatch(match)
    if (label) set.add(label)
  }

  const rounds = Array.from(set)
  rounds.sort((a, b) => finalRoundRank(a) - finalRoundRank(b) || a.localeCompare(b))
  return rounds
})

function buildStandingsByGroup(scoreResolver, seedAllTeams = false) {
  const tableByGroup = new Map()

  for (const match of matches.value) {
    const groupKey = groupKeyForMatch(match)
    if (groupKey === 'other') continue

    if (!tableByGroup.has(groupKey)) tableByGroup.set(groupKey, new Map())
    const groupTable = tableByGroup.get(groupKey)

    ensureStandingRow(groupTable, match.home_team)
    ensureStandingRow(groupTable, match.away_team)

    const score = scoreResolver(match)
    if (!score) continue

    const home = groupTable.get(match.home_team)
    const away = groupTable.get(match.away_team)
    const homeScore = Number(score.home)
    const awayScore = Number(score.away)

    home.played += 1
    away.played += 1
    home.gf += homeScore
    home.ga += awayScore
    away.gf += awayScore
    away.ga += homeScore
    home.gd = home.gf - home.ga
    away.gd = away.gf - away.ga

    if (homeScore > awayScore) {
      home.points += 3
      home.wins += 1
      away.losses += 1
    } else if (homeScore < awayScore) {
      away.points += 3
      away.wins += 1
      home.losses += 1
    } else {
      home.points += 1
      away.points += 1
      home.draws += 1
      away.draws += 1
    }
  }

  const result = new Map()
  for (const [groupKey, table] of tableByGroup.entries()) {
    const rows = Array.from(table.values())
    rows.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.gd !== a.gd) return b.gd - a.gd
      if (b.gf !== a.gf) return b.gf - a.gf
      return a.team.localeCompare(b.team)
    })
    result.set(groupKey, rows)
  }

  return result
}

const realStandingsByGroup = computed(() => {
  return buildStandingsByGroup((match) => {
    if (match.status !== 'played') return null
    if (match.home_score == null || match.away_score == null) return null
    return { home: match.home_score, away: match.away_score }
  }, true)
})

const standingsByGroup = computed(() => {
  const predictionMap = myPredictionMap.value
  return buildStandingsByGroup((match) => {
    const prediction = predictionMap.get(match.id)
    if (!prediction || prediction.predicted_home == null || prediction.predicted_away == null) return null
    return { home: prediction.predicted_home, away: prediction.predicted_away }
  })
})

const activeStandingsByGroup = computed(() => {
  return standingsView.value === 'real' ? realStandingsByGroup.value : standingsByGroup.value
})

const playedMatchesMap = computed(() => {
  const map = new Map()
  for (const m of matches.value) {
    if (m.status === 'played' && m.home_score != null && m.away_score != null) map.set(m.id, m)
  }
  return map
})

const leaderboard = computed(() => {
  const stats = new Map()

  for (const p of allPredictions.value) {
    const match = playedMatchesMap.value.get(p.match_id)
    if (!match) continue

    if (!stats.has(p.user_email)) {
      stats.set(p.user_email, {
        email: p.user_email,
        name: p.user_name || p.user_email,
        points: 0,
        exact: 0,
        goodOutcome: 0,
        total: 0,
        streakMax: 0,
        ordered: [],
        byDate: new Map(),
      })
    }

    const row = stats.get(p.user_email)
    const exact = p.predicted_home === match.home_score && p.predicted_away === match.away_score
    const goodOutcome = isSameOutcome(p.predicted_home, p.predicted_away, match.home_score, match.away_score)
    const pts = exact ? 3 : goodOutcome ? 1 : 0

    row.points += pts
    row.total += 1
    if (exact) row.exact += 1
    if (goodOutcome) row.goodOutcome += 1

    const correct = exact || goodOutcome
    row.ordered.push({ kickoff: match.kickoff_at, correct })

    const day = String(match.kickoff_at).slice(0, 10)
    if (!row.byDate.has(day)) row.byDate.set(day, { total: 0, correct: 0 })
    const dayRow = row.byDate.get(day)
    dayRow.total += 1
    if (correct) dayRow.correct += 1
  }

  const list = Array.from(stats.values()).map((row) => {
    const ordered = [...row.ordered].sort((a, b) => String(a.kickoff).localeCompare(String(b.kickoff)))
    let streak = 0
    let streakMax = 0
    for (const item of ordered) {
      streak = item.correct ? streak + 1 : 0
      if (streak > streakMax) streakMax = streak
    }

    let perfectDays = 0
    for (const d of row.byDate.values()) {
      if (d.total > 0 && d.total === d.correct) perfectDays += 1
    }

    return {
      ...row,
      streakMax,
      perfectDays,
    }
  })

  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.exact !== a.exact) return b.exact - a.exact
    return a.name.localeCompare(b.name)
  })

  return list
})

const myLeaderboardRow = computed(() => {
  const email = currentUserEmail()
  if (!email) return null
  return leaderboard.value.find((r) => normalizedEmail(r.email) === email) || null
})

const myRank = computed(() => {
  if (!myLeaderboardRow.value) return null
  return leaderboard.value.findIndex((r) => r.email === myLeaderboardRow.value.email) + 1
})

const myPredictionCount = computed(() => {
  const email = currentUserEmail()
  if (!email) return 0
  return myPredictions.value.filter((p) => normalizedEmail(p.user_email) === email).length
})

const myTodayStats = computed(() => {
  const email = currentUserEmail()
  if (!email) {
    return { totalPredicted: 0, totalEvaluated: 0, exact: 0, good: 0, bad: 0, pending: 0 }
  }

  const todayKey = localDateKey(new Date())
  const predictionMap = new Map(
    myPredictions.value
      .filter((p) => normalizedEmail(p.user_email) === email)
      .map((p) => [p.match_id, p])
  )

  const todayMatches = matches.value.filter((match) => localDateKey(new Date(match.kickoff_at)) === todayKey)
  let totalPredicted = 0
  let totalEvaluated = 0
  let exact = 0
  let good = 0
  let bad = 0
  let pending = 0

  for (const match of todayMatches) {
    const prediction = predictionMap.get(match.id)
    if (!prediction || prediction.predicted_home == null || prediction.predicted_away == null) continue

    totalPredicted += 1

    if (match.status !== 'played' || match.home_score == null || match.away_score == null) {
      pending += 1
      continue
    }

    totalEvaluated += 1
    if (prediction.predicted_home === match.home_score && prediction.predicted_away === match.away_score) {
      exact += 1
    } else if (isSameOutcome(prediction.predicted_home, prediction.predicted_away, match.home_score, match.away_score)) {
      good += 1
    } else {
      bad += 1
    }
  }

  return { totalPredicted, totalEvaluated, exact, good, bad, pending }
})

const myBadges = computed(() => {
  const row = myLeaderboardRow.value
  if (!row) return []

  const rank = leaderboard.value.findIndex((r) => r.email === row.email) + 1
  const badges = []

  if (row.total > 0) badges.push({ code: 'first', title: t('wc_badge_first_title'), desc: t('wc_badge_first_desc') })
  if (row.exact >= 3) badges.push({ code: 'sniper', title: t('wc_badge_sniper_title'), desc: t('wc_badge_sniper_desc') })
  if (row.streakMax >= 5) badges.push({ code: 'oracle', title: t('wc_badge_oracle_title'), desc: t('wc_badge_oracle_desc') })
  if (row.perfectDays >= 1) badges.push({ code: 'perfect-day', title: t('wc_badge_perfect_day_title'), desc: t('wc_badge_perfect_day_desc') })
  if (rank > 0 && rank <= 3) badges.push({ code: 'top3', title: t('wc_badge_top3_title'), desc: t('wc_badge_top3_desc') })

  return badges
})

watch(selectedGroup, (value) => {
  if (value !== 'other') selectedFinalRound.value = 'all'
})

onMounted(async () => {
  await loadTeamsMeta()
  await tryAutoGrantAccess()
})

async function tryAutoGrantAccess() {
  const authEmail = getCurrentUserEmail()
  const authName = getCurrentUserDisplayName()

  if (authEmail) {
    accessEmailInput.value = authEmail
    profile.value.email = authEmail
    if (!profile.value.name && authName) profile.value.name = authName
  }

  const email = normalizedEmail(accessEmailInput.value)
  if (!email) return

  const ok = await verifyMemberEmail(email)
  if (!ok) return

  accessGranted.value = true
  localStorage.setItem('wc_access_email', email)

  await hydrateProfileForEmail(email)

  await loadPage()
}

async function grantAccess() {
  accessLoading.value = true
  accessError.value = ''

  const email = normalizedEmail(accessEmailInput.value)
  if (!email || !email.includes('@')) {
    accessError.value = t('wc_error_invalid_email')
    accessLoading.value = false
    return
  }

  const ok = await verifyMemberEmail(email)
  if (!ok) {
    accessError.value = t('wc_error_member_not_found')
    accessLoading.value = false
    return
  }

  localStorage.setItem('wc_access_email', email)
  accessGranted.value = true
  await hydrateProfileForEmail(email)

  await loadPage()
  accessLoading.value = false
}

async function hydrateProfileForEmail(email) {
  profile.value.email = email
  localStorage.setItem('wc_email', email)

  const localPseudo = localStorage.getItem(`wc_name_${email}`)
  if (localPseudo) profile.value.name = localPseudo

  const remotePseudo = await latestPseudoForEmail(email)
  if (remotePseudo) {
    profile.value.name = remotePseudo
    localStorage.setItem('wc_name', remotePseudo)
    localStorage.setItem(`wc_name_${email}`, remotePseudo)
  }
}

async function latestPseudoForEmail(email) {
  const { data, error } = await sb
    .from('wc_predictions')
    .select('user_name,updated_at,created_at')
    .eq('user_email', email)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data?.length) return ''
  return String(data[0].user_name || '').trim()
}

async function verifyMemberEmail(email) {
  const { data } = await sb.from('members').select('email').eq('email', email).maybeSingle()
  if (!data) return false

  const { data: { session } } = await sb.auth.getSession()
  if (!session) {
    const { error } = await sb.auth.signInAnonymously()
    if (error) return false
  }

  return true
}

async function loadTeamsMeta() {
  teamMetaMap.value = new Map()

  try {
    const res = await fetch('/meta.json', { cache: 'no-store' })
    if (!res.ok) return

    const data = await res.json()
    if (!Array.isArray(data)) return

    const map = new Map()
    for (const t of data) {
      if (t?.name) map.set(String(t.name).toLowerCase(), t)
      if (t?.name_normalised) map.set(String(t.name_normalised).toLowerCase(), t)
    }
    teamMetaMap.value = map
  } catch {
    // Ignore malformed or unavailable metadata to keep the page usable.
  }
}

async function loadPage() {
  errorMsg.value = ''
  loading.value = true

  const [matchesRes, allPredRes] = await Promise.all([
    sb.from('wc_matches').select('*').order('kickoff_at', { ascending: true }),
    sb.from('wc_predictions').select('*'),
  ])

  if (matchesRes.error) {
    errorMsg.value = matchesRes.error.message
    loading.value = false
    return
  }

  if (allPredRes.error) {
    errorMsg.value = allPredRes.error.message
    loading.value = false
    return
  }

  matches.value = matchesRes.data || []
  allPredictions.value = allPredRes.data || []

  await loadMyPredictions()
  loading.value = false
}

async function loadMyPredictions() {
  const email = currentUserEmail()
  if (!email) {
    myPredictions.value = []
    initDrafts()
    return
  }

  const { data, error } = await sb
    .from('wc_predictions')
    .select('*')
    .eq('user_email', email)

  if (error) {
    errorMsg.value = error.message
    return
  }

  myPredictions.value = data || []
  initDrafts()
}

function initDrafts() {
  const next = {}
  for (const m of matches.value) {
    const p = myPredictions.value.find((x) => x.match_id === m.id)
    next[m.id] = {
      home: p?.predicted_home ?? null,
      away: p?.predicted_away ?? null,
    }
  }
  drafts.value = next
}

function draftFor(matchId) {
  if (!drafts.value[matchId]) drafts.value[matchId] = { home: null, away: null }
  return drafts.value[matchId]
}

async function saveProfile() {
  const email = currentUserEmail()
  const pseudo = String(profile.value.name || '').trim()

  if (!email) {
    errorMsg.value = t('wc_error_invalid_session')
    return
  }
  if (!pseudo) {
    errorMsg.value = t('wc_error_missing_pseudo')
    return
  }

  profile.value.name = pseudo
  localStorage.setItem('wc_name', pseudo)
  localStorage.setItem(`wc_name_${email}`, pseudo)
  localStorage.setItem('wc_email', email)

  const { error } = await sb
    .from('wc_predictions')
    .update({ user_name: pseudo })
    .eq('user_email', email)

  if (error) {
    errorMsg.value = error.message
    return
  }

  errorMsg.value = ''
  await loadPage()
}

function isLocked(match) {
  const kickoffTs = Date.parse(match.kickoff_at)
  return match.status === 'played' || Number.isNaN(kickoffTs) || Date.now() >= kickoffTs
}

async function savePrediction(match) {
  const email = currentUserEmail()
  const userName = String(profile.value.name || '').trim()
  const draft = draftFor(match.id)

  if (!email || !userName) {
    errorMsg.value = t('wc_error_pseudo_before_predict')
    return
  }
  if (draft.home == null || draft.away == null || draft.home < 0 || draft.away < 0) {
    errorMsg.value = t('wc_error_invalid_score')
    return
  }
  if (isLocked(match)) {
    errorMsg.value = t('wc_error_prediction_locked')
    return
  }

  errorMsg.value = ''
  savingMatchId.value = match.id

  const payload = {
    match_id: match.id,
    user_email: email,
    user_name: userName,
    predicted_home: Number(draft.home),
    predicted_away: Number(draft.away),
  }

  const { error } = await sb
    .from('wc_predictions')
    .upsert(payload, { onConflict: 'match_id,user_email' })

  savingMatchId.value = null

  if (error) {
    errorMsg.value = error.message
    return
  }

  await loadPage()
}

function formatKickoff(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleString(localeForLang(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

function teamLabel(teamName) {
  const key = String(teamName || '').toLowerCase().trim()
  const meta = teamMetaMap.value.get(key)
  if (!meta) return teamName
  return `${meta.flag_icon || ''} ${teamName}`.trim()
}

function groupKeyForMatch(match) {
  const stage = String(match?.stage || '')
  const m = stage.match(/(?:group|groupe)\s*([a-z])/i)
  if (m?.[1]) return m[1].toUpperCase()

  const home = teamGroupFromMeta(match?.home_team)
  const away = teamGroupFromMeta(match?.away_team)
  if (home && away && home === away) return home
  return 'other'
}

function teamGroupFromMeta(teamName) {
  const key = String(teamName || '').toLowerCase().trim()
  const meta = teamMetaMap.value.get(key)
  if (!meta?.group) return ''
  return String(meta.group).trim().toUpperCase()
}

function finalRoundLabelForMatch(match) {
  return String(match?.stage || '').trim() || t('wc_phase_final')
}

function finalRoundRank(label) {
  const text = String(label || '').toLowerCase()
  if (/(play-?in|barrage)/.test(text)) return 0
  if (/(32|trent(e|-)?deux|seizieme|1\/16)/.test(text)) return 1
  if (/(16|huitieme|1\/8)/.test(text)) return 2
  if (/(quart|1\/4)/.test(text)) return 3
  if (/(demi|semi|1\/2)/.test(text)) return 4
  if (/petite finale|third|3e place|3rd/.test(text)) return 5
  if (/finale|final/.test(text)) return 6
  return 99
}

function ensureStandingRow(table, team) {
  if (table.has(team)) return
  table.set(team, {
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  })
}

function normalizedEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function statusLabel(status) {
  if (status === 'played') return t('wc_status_played')
  if (status === 'upcoming') return t('wc_status_upcoming')
  return String(status || '')
}

function localeForLang() {
  if (currentLang.value === 'fr') return 'fr-FR'
  if (currentLang.value === 'fi') return 'fi-FI'
  if (currentLang.value === 'sv') return 'sv-SE'
  return 'en-GB'
}

function currentUserEmail() {
  return normalizedEmail(profile.value.email || accessEmailInput.value)
}

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function pointsForPrediction(prediction, match) {
  if (!prediction || match.status !== 'played') return 0
  if (prediction.predicted_home === match.home_score && prediction.predicted_away === match.away_score) return 3
  return isSameOutcome(prediction.predicted_home, prediction.predicted_away, match.home_score, match.away_score) ? 1 : 0
}

function isSameOutcome(homeA, awayA, homeB, awayB) {
  return outcome(homeA, awayA) === outcome(homeB, awayB)
}

function outcome(home, away) {
  if (home > away) return 'H'
  if (home < away) return 'A'
  return 'D'
}
</script>

<style scoped>
.wc-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}
.wc-header h1 {
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.08em;
  color: var(--white);
  font-size: clamp(34px, 5vw, 56px);
}
.wc-header p {
  margin: 8px 0 18px;
  color: rgba(244,244,242,0.7);
  font-family: 'Barlow', sans-serif;
}
.wc-back {
  display: inline-block;
  color: var(--gold);
  text-decoration: none;
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.wc-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 18px;
  margin-top: 18px;
}
.wc-card h2 {
  margin: 0 0 12px;
  font-family: 'Barlow Condensed', sans-serif;
  color: var(--white);
  letter-spacing: 0.08em;
}
.wc-access {
  max-width: 520px;
  margin: 48px auto 0;
  display: grid;
  gap: 10px;
}
.wc-access-label {
  color: rgba(244,244,242,0.75);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
}
.wc-access-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 4px;
  color: var(--white);
  padding: 10px;
}
.wc-profile-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
}
.wc-profile-grid label {
  display: grid;
  gap: 6px;
  color: rgba(244,244,242,0.75);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 12px;
}
.wc-profile-grid input,
.wc-predict-row input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 4px;
  color: var(--white);
  padding: 9px 10px;
}
.wc-btn {
  border: 1px solid rgba(232,0,29,0.35);
  color: var(--white);
  background: rgba(232,0,29,0.22);
  border-radius: 4px;
  padding: 9px 12px;
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}
.wc-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.wc-btn-ghost {
  background: transparent;
  border-color: rgba(255,255,255,0.2);
}
.wc-note,
.wc-muted {
  margin: 10px 0 0;
  color: rgba(244,244,242,0.55);
  font-size: 13px;
  font-family: 'Barlow', sans-serif;
}
.wc-error {
  color: #ff6b6b;
  font-family: 'Barlow', sans-serif;
}
.wc-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
.wc-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.wc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wc-group-filter {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.18);
  color: var(--white);
  border-radius: 4px;
  padding: 8px 10px;
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.05em;
}
.wc-grouped {
  display: grid;
  gap: 14px;
}
.wc-group-card {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
  padding: 12px;
}
.wc-group-title {
  margin: 0 0 10px;
  color: var(--white);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.wc-group-table-wrap {
  overflow-x: auto;
  margin-bottom: 10px;
}
.wc-standings-switcher {
  display: grid;
  gap: 8px;
  margin-bottom: 10px;
}
.wc-standings-switcher-label {
  color: rgba(244,244,242,0.58);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 11px;
}
.wc-standings-switcher-controls {
  display: inline-flex;
  width: fit-content;
  padding: 4px;
  gap: 4px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.03);
}
.wc-standings-switcher-btn {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: transparent;
  color: rgba(244,244,242,0.72);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}
.wc-standings-switcher-btn.active {
  background: linear-gradient(135deg, rgba(232,0,29,0.26), rgba(232,0,29,0.42));
  color: var(--white);
  box-shadow: 0 0 0 1px rgba(232,0,29,0.28) inset;
}
.wc-standings-switcher-hint {
  margin: 0;
  color: rgba(244,244,242,0.6);
  font-size: 12px;
  font-family: 'Barlow', sans-serif;
}
.wc-group-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 520px;
}
.wc-group-table th,
.wc-group-table td {
  text-align: left;
  padding: 7px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  color: rgba(244,244,242,0.82);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
}
.wc-group-table th {
  color: rgba(244,244,242,0.62);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 11px;
}
.wc-muted-cell {
  color: rgba(244,244,242,0.55);
}
.wc-match-list {
  display: grid;
  gap: 10px;
}
.wc-match-item {
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 6px;
  padding: 12px;
  background: rgba(4,19,59,0.45);
}
.wc-match-top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.wc-teams {
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.05em;
  color: var(--white);
  font-size: 18px;
}
.wc-meta {
  color: rgba(244,244,242,0.55);
  font-size: 12px;
  font-family: 'Barlow', sans-serif;
}
.wc-status {
  height: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: 'Barlow Condensed', sans-serif;
}
.wc-status.played {
  background: rgba(34,197,94,0.2);
  color: #7ee39f;
}
.wc-status.upcoming {
  background: rgba(200,168,75,0.2);
  color: var(--gold);
}
.wc-predict-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.wc-predict-row input {
  width: 70px;
}
.wc-predict-row span {
  color: rgba(244,244,242,0.7);
}
.wc-final-score,
.wc-my-pred {
  margin-top: 8px;
  color: rgba(244,244,242,0.7);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
}
.wc-side {
  display: grid;
  gap: 16px;
  align-content: start;
}
.wc-leaderboard {
  margin: 0;
  padding-left: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}
.wc-leaderboard li {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  gap: 8px;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding-bottom: 8px;
}
.wc-leaderboard .rank { color: var(--gold); font-family: 'Bebas Neue', sans-serif; font-size: 20px; }
.wc-leaderboard .name { color: var(--white); font-family: 'Barlow', sans-serif; }
.wc-leaderboard .pts { color: rgba(244,244,242,0.72); font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.05em; }
.wc-badges {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}
.wc-badges li {
  display: grid;
  gap: 2px;
  border-left: 2px solid var(--gold);
  padding-left: 8px;
}
.wc-badges strong {
  color: var(--white);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.05em;
}
.wc-badges span {
  color: rgba(244,244,242,0.62);
  font-size: 13px;
  font-family: 'Barlow', sans-serif;
}
.wc-my-stats {
  display: grid;
  gap: 12px;
}
.wc-my-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.wc-stat-pill {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  padding: 10px 12px;
  display: grid;
  gap: 4px;
}
.wc-stat-pill span {
  color: rgba(244,244,242,0.6);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 11px;
}
.wc-stat-pill strong {
  color: var(--white);
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.06em;
  font-size: 22px;
}

@media (max-width: 960px) {
  .wc-layout { grid-template-columns: 1fr; }
  .wc-profile-grid { grid-template-columns: 1fr; }
  .wc-title-row {
    align-items: stretch;
    flex-direction: column;
  }
  .wc-actions {
    width: 100%;
    justify-content: space-between;
  }
  .wc-group-filter {
    width: 100%;
  }
  .wc-my-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
