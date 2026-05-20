<template>
  <section class="squad-page">
    <header class="squad-header">
      <div class="squad-header-inner">
        <RouterLink class="squad-back" to="/">← {{ t('nav_home') }}</RouterLink>
        <h1>{{ t('squad_title') }}</h1>
      </div>
    </header>

    <div class="squad-content">
      <div class="squad-season-filter">
        <label for="squad-season-select">{{ t('squad_season_label') }}</label>
        <select id="squad-season-select" v-model="selectedSeason">
          <optgroup label="Current">
            <option value="__current__">{{ t('squad_season_current') }} ({{ currentSeasonLabel }})</option>
          </optgroup>
          <optgroup label="Previous Seasons" v-if="seasonOptions.length">
            <option v-for="season in seasonOptions" :key="season" :value="season">{{ season }}</option>
          </optgroup>
        </select>
      </div>

      <p class="squad-season-title">{{ seasonTitle }}</p>

      <div class="squad-tabs" role="tablist" aria-label="Squad sections">
        <button
          class="squad-tab-btn"
          :class="{ 'is-active': squadTab === 'effectif' }"
          @click="squadTab = 'effectif'"
        >Effectif</button>
        <button
          class="squad-tab-btn"
          :class="{ 'is-active': squadTab === 'stats' }"
          @click="squadTab = 'stats'"
        >Statistiques</button>
        <button
          class="squad-tab-btn"
          :class="{ 'is-active': squadTab === 'compo' }"
          @click="squadTab = 'compo'"
        >Compo</button>
      </div>

      <p v-if="loading" class="squad-muted">{{ t('squad_loading') }}</p>
      <p v-else-if="errorMsg" class="squad-error">{{ errorMsg }}</p>

      <template v-else>
        <template v-if="squadTab === 'effectif'">
          <section
            v-for="group in positionGroups"
            :key="group.key"
            class="squad-group"
          >
            <h2 class="squad-group-title">
              <span class="squad-group-badge">{{ group.count }}</span>
              {{ group.label }}
            </h2>

            <div class="squad-grid">
              <article
                v-for="player in group.players"
                :key="player.id"
                class="squad-card"
                role="button"
                tabindex="0"
                @click="openPlayer(player)"
                @keydown.enter.space.prevent="openPlayer(player)"
              >
                <div class="squad-card-photo">
                  <img
                    v-if="player.photo_url"
                    :src="player.photo_url"
                    :alt="player.name"
                    loading="lazy"
                  />
                  <div v-else class="squad-card-initials">
                    {{ initials(player.name) }}
                  </div>
                </div>
                <div class="squad-card-info">
                  <div class="squad-card-number">#{{ player.number ?? '—' }}</div>
                  <div class="squad-card-name">{{ player.name }}</div>
                  <div class="squad-card-role">{{ player.position_detail || player.position }}</div>
                  <div v-if="player.nationality" class="squad-card-nationality">
                    {{ player.nationality }}
                  </div>
                </div>
              </article>
            </div>
          </section>

          <p v-if="!players.length" class="squad-muted">{{ t('squad_empty') }}</p>
        </template>

        <section v-else-if="squadTab === 'stats'" class="squad-stats-wrap">
          <div class="squad-stats-grid">
            <article class="squad-stat-card">
              <span>Total joueurs</span>
              <strong>{{ players.length }}</strong>
            </article>
            <article class="squad-stat-card" v-for="item in positionStats" :key="item.key">
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </article>
          </div>

          <div class="squad-nations" v-if="nationalityStats.length">
            <h3>Nationalites</h3>
            <div class="squad-nations-list">
              <div class="squad-nation-item" v-for="n in nationalityStats" :key="n.key">
                <span>{{ n.key }}</span>
                <strong>{{ n.count }}</strong>
              </div>
            </div>
          </div>
        </section>

        <section v-else class="squad-compo-wrap">
          <div class="squad-compo-header">
            <h3>Compo type (4-3-3)</h3>
            <p>Basee sur les joueurs disponibles pour la saison selectionnee.</p>
          </div>
          <div class="squad-pitch">
            <div class="squad-pitch-row">
              <div class="squad-chip" v-for="p in compoRows.fwd" :key="p.id || p.name">{{ p.name }}</div>
            </div>
            <div class="squad-pitch-row">
              <div class="squad-chip" v-for="p in compoRows.mid" :key="p.id || p.name">{{ p.name }}</div>
            </div>
            <div class="squad-pitch-row">
              <div class="squad-chip" v-for="p in compoRows.def" :key="p.id || p.name">{{ p.name }}</div>
            </div>
            <div class="squad-pitch-row">
              <div class="squad-chip" v-for="p in compoRows.gk" :key="p.id || p.name">{{ p.name }}</div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Player modal -->
    <Teleport to="body">
      <Transition name="squad-modal">
        <div
          v-if="selectedPlayer"
          class="squad-modal-backdrop"
          @click.self="closeModal"
        >
          <div class="squad-modal" role="dialog" :aria-label="selectedPlayer.name">
            <button class="squad-modal-close" @click="closeModal" :aria-label="t('squad_close')">✕</button>

            <div class="squad-modal-hero">
              <div class="squad-modal-photo">
                <img
                  v-if="selectedPlayer.photo_url"
                  :src="selectedPlayer.photo_url"
                  :alt="selectedPlayer.name"
                />
                <div v-else class="squad-modal-initials">
                  {{ initials(selectedPlayer.name) }}
                </div>
              </div>
              <div class="squad-modal-identity">
                <div class="squad-modal-number">#{{ selectedPlayer.number ?? '—' }}</div>
                <h2 class="squad-modal-name">{{ selectedPlayer.name }}</h2>
                <div class="squad-modal-meta-row">
                  <span v-if="selectedPlayer.nationality" class="squad-modal-tag">
                    {{ selectedPlayer.nationality }}
                  </span>
                  <span class="squad-modal-tag squad-modal-tag--pos">
                    {{ selectedPlayer.position_detail || selectedPlayer.position }}
                  </span>
                  <span class="squad-modal-tag" v-if="selectedPlayer.club">
                    {{ selectedPlayer.club }}
                  </span>
                </div>

                <div class="squad-modal-stats-row">
                  <span class="squad-stat-pill">Apps {{ currentSeasonStats.appearances ?? '—' }}</span>
                  <span class="squad-stat-pill">Goals {{ currentSeasonStats.goals ?? '—' }}</span>
                  <span class="squad-stat-pill">Assists {{ currentSeasonStats.assists ?? '—' }}</span>
                  <span class="squad-stat-pill">CS {{ currentSeasonStats.clean_sheets ?? '—' }}</span>
                </div>

                <div class="squad-modal-stats-row squad-modal-stats-row--total" v-if="selectedPlayerTotalStats.hasAny">
                  <span class="squad-stat-pill squad-stat-pill--total">Total Apps {{ selectedPlayerTotalStats.appearances ?? '—' }}</span>
                  <span class="squad-stat-pill squad-stat-pill--total">Total Goals {{ selectedPlayerTotalStats.goals ?? '—' }}</span>
                  <span class="squad-stat-pill squad-stat-pill--total">Total Assists {{ selectedPlayerTotalStats.assists ?? '—' }}</span>
                </div>
              </div>
            </div>

            <div class="squad-modal-history">
              <h3 class="squad-modal-section-title">Player Profile</h3>

              <div class="squad-history-block" v-if="selectedPlayer.historic">
                <span class="squad-history-label">Historic</span>
                <div class="squad-historic-list" v-if="parsedSelectedHistoric.length">
                  <div class="squad-historic-item" v-for="(item, idx) in parsedSelectedHistoric" :key="idx">
                    <em>{{ item.season }}</em>
                    <strong>{{ item.club }}</strong>
                  </div>
                </div>
                <p v-else class="squad-modal-bio">{{ selectedPlayer.historic }}</p>
              </div>

              <div v-if="selectedPlayer.bio" class="squad-bio-block">
                <div class="squad-bio-head">
                  <span>Bio</span>
                  <button class="squad-bio-toggle" @click="bioExpanded = !bioExpanded">
                    {{ bioExpanded ? 'Reduce' : 'Expand' }}
                  </button>
                </div>
                <p class="squad-modal-bio" :class="{ 'is-collapsed': !bioExpanded }">{{ selectedPlayer.bio }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { sb } from '../lib/supabase.js'
import { useI18n } from '../lib/i18n.js'

const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

const loading = ref(true)
const errorMsg = ref('')
const players = ref([])
const seasonOptions = ref([])
const selectedSeason = ref('__current__')
const squadTab = ref('effectif')

const selectedPlayer = ref(null)
const bioExpanded = ref(false)

const POSITION_ORDER = ['GK', 'DEF', 'MID', 'FWD']
const SQUAD_CLUB = 'PSG'

const currentSeasonLabel = computed(() => buildCurrentSeasonLabel())
const currentSeasonStats = computed(() => {
  const player = selectedPlayer.value
  if (!player) {
    return { appearances: null, goals: null, assists: null, clean_sheets: null }
  }

  const target = selectedSeason.value === '__current__' ? currentSeasonLabel.value : selectedSeason.value
  const rows = getSeasonRowsFromPlayer(player)
  const exact = rows.find((r) => isSquadClub(r?.club) && seasonToken(String(r?.season || '')) === seasonToken(target))
  const fallback = rows.find((r) => isSquadClub(r?.club)) || {}
  const row = exact || fallback

  const total = {
    appearances: asNumberOrNull(player?.appearances_total),
    goals: asNumberOrNull(player?.goals_total),
    assists: asNumberOrNull(player?.assists_total),
  }

  return {
    appearances: asNumberOrNull(row?.appearances) ?? total.appearances,
    goals: asNumberOrNull(row?.goals) ?? total.goals,
    assists: asNumberOrNull(row?.assists) ?? total.assists,
    clean_sheets: asNumberOrNull(row?.clean_sheets),
  }
})
const selectedPlayerTotalStats = computed(() => {
  const player = selectedPlayer.value
  if (!player) {
    return { appearances: null, goals: null, assists: null, hasAny: false }
  }

  const appearances = asNumberOrNull(player?.appearances_total)
  const goals = asNumberOrNull(player?.goals_total)
  const assists = asNumberOrNull(player?.assists_total)

  return {
    appearances,
    goals,
    assists,
    hasAny: appearances !== null || goals !== null || assists !== null,
  }
})
const parsedSelectedHistoric = computed(() => parseHistoric(selectedPlayer.value?.historic))

const seasonTitle = computed(() => {
  return selectedSeason.value === '__current__'
    ? `${t('squad_season_current')} (${currentSeasonLabel.value})`
    : selectedSeason.value
})

const positionGroups = computed(() => {
  return POSITION_ORDER
    .map((pos) => {
      const group = players.value.filter((p) => p.position === pos)
      return {
        key: pos,
        label: t(`squad_pos_${pos.toLowerCase()}`),
        players: group,
        count: group.length,
      }
    })
    .filter((g) => g.players.length > 0)
})

const positionStats = computed(() => {
  return POSITION_ORDER.map((pos) => ({
    key: pos,
    label: t(`squad_pos_${pos.toLowerCase()}`),
    count: players.value.filter((p) => p.position === pos).length,
  }))
})

const nationalityStats = computed(() => {
  const map = {}
  for (const p of players.value) {
    const k = String(p.nationality || '').trim()
    if (!k) continue
    map[k] = (map[k] || 0) + 1
  }
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
})

const compoRows = computed(() => {
  const byPos = {
    gk: players.value.filter((p) => p.position === 'GK').slice(0, 1),
    def: players.value.filter((p) => p.position === 'DEF').slice(0, 4),
    mid: players.value.filter((p) => p.position === 'MID').slice(0, 3),
    fwd: players.value.filter((p) => p.position === 'FWD').slice(0, 3),
  }
  return {
    gk: padRow(byPos.gk, 1),
    def: padRow(byPos.def, 4),
    mid: padRow(byPos.mid, 3),
    fwd: padRow(byPos.fwd, 3),
  }
})

onMounted(async () => {
  await loadSeasonOptions()
  await loadPlayersForSeason()
})

watch(selectedSeason, async () => {
  await loadPlayersForSeason()
})

async function loadSeasonOptions() {
  const { data, error } = await sb
    .from('players')
    .select('*')

  if (error) {
    errorMsg.value = error.message
    seasonOptions.value = []
    return
  }

  const uniq = [...new Set(
    (data || [])
      .flatMap((p) => getSeasonRowsFromPlayer(p))
      .filter((r) => isSquadClub(r?.club))
      .map((r) => String(r?.season || '').trim())
      .filter(Boolean)
  )]
  seasonOptions.value = uniq.sort(compareSeasonLabelsDesc)
}

async function loadPlayersForSeason() {
  loading.value = true
  errorMsg.value = ''

  const { data, error } = await sb
    .from('players')
    .select('*')
    .order('position')
    .order('display_order')
    .order('name')

  if (error) {
    errorMsg.value = error.message
    players.value = []
    loading.value = false
    return
  }

  const basePlayers = data || []

  if (selectedSeason.value === '__current__') {
    players.value = basePlayers
      .map((p) => {
        const seasonRow = getSeasonRowsFromPlayer(p).find(
          (r) => seasonToken(String(r?.season || '')) === seasonToken(currentSeasonLabel.value) && isSquadClub(r?.club)
        )
        if (!seasonRow) return null
        return {
          ...p,
          number: seasonRow.shirt_number ?? p.number,
        }
      })
      .filter(Boolean)
    loading.value = false
    return
  }

  players.value = basePlayers
    .map((p) => {
      const seasonRow = getSeasonRowsFromPlayer(p).find(
        (r) => seasonToken(String(r?.season || '')) === seasonToken(selectedSeason.value) && isSquadClub(r?.club)
      )
      if (!seasonRow) return null
      return {
        ...p,
        number: seasonRow.shirt_number ?? p.number,
      }
    })
    .filter(Boolean)

  loading.value = false
}

function openPlayer(player) {
  selectedPlayer.value = player
  bioExpanded.value = false
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  selectedPlayer.value = null
  bioExpanded.value = false
  document.body.style.overflow = ''
}

function initials(name) {
  return String(name || '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function buildCurrentSeasonLabel() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const start = month >= 7 ? year : year - 1
  const end = String((start + 1) % 100).padStart(2, '0')
  return `${start}-${end}`
}

function isSquadClub(club) {
  const c = String(club || '').trim().toUpperCase()
  return c === SQUAD_CLUB || c === 'PARIS SAINT-GERMAIN' || c === 'PARIS SAINT GERMAIN'
}

function seasonToken(label) {
  const s = String(label || '').trim()
  const m = s.match(/(\d{2,4})\D+(\d{2,4})/)
  if (!m) return s.toLowerCase()
  const y1 = String(Number(m[1]) % 100).padStart(2, '0')
  const y2 = String(Number(m[2]) % 100).padStart(2, '0')
  return `${y1}/${y2}`
}

function seasonSortKey(label) {
  const s = String(label || '').trim()
  const m = s.match(/(\d{2,4})\D+(\d{2,4})/)
  if (!m) return Number.MIN_SAFE_INTEGER

  let start = Number(m[1])
  if (start < 100) start += start >= 70 ? 1900 : 2000
  return start
}

function compareSeasonLabelsDesc(a, b) {
  const byStart = seasonSortKey(b) - seasonSortKey(a)
  if (byStart !== 0) return byStart
  return String(b).localeCompare(String(a))
}

function asNumberOrNull(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function padRow(row, size) {
  const filled = [...row]
  while (filled.length < size) filled.push({ id: `empty-${size}-${filled.length}`, name: '—' })
  return filled
}

function parseHistoric(raw) {
  const text = String(raw || '').trim()
  if (!text) return []

  return text
    .split(',')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const sep = chunk.indexOf(':')
      if (sep < 0) return null
      const season = chunk.slice(0, sep).trim()
      const club = chunk.slice(sep + 1).trim()
      if (!season || !club) return null
      return { season, club }
    })
    .filter(Boolean)
}

function getSeasonRowsFromPlayer(player) {
  const seasons = Array.isArray(player?.seasons) ? player.seasons : []
  if (seasons.length) return seasons

  // Fallback for old data where seasons is empty and only historic is filled.
  return parseHistoric(player?.historic).map((r) => ({
    season: r.season,
    club: r.club,
  }))
}
</script>

<style scoped>
.squad-page {
  min-height: 100vh;
  background: var(--navy);
}

.squad-header {
  background: linear-gradient(135deg, rgba(232,0,29,0.12), rgba(4,19,59,0.9));
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 48px 20px 36px;
}

.squad-header-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.squad-back {
  display: inline-block;
  color: var(--gold);
  text-decoration: none;
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 13px;
  margin-bottom: 16px;
}

.squad-header h1 {
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.08em;
  color: var(--white);
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1;
}

.squad-header p {
  margin: 10px 0 0;
  color: rgba(244,244,242,0.65);
  font-family: 'Barlow', sans-serif;
  font-size: 15px;
}

.squad-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 60px;
  display: grid;
  gap: 40px;
}

.squad-season-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.squad-season-filter label {
  color: rgba(244,244,242,0.72);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.squad-season-filter select {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.16);
  color: var(--white);
  border-radius: 6px;
  min-width: 220px;
  padding: 8px 10px;
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
}

.squad-season-title {
  margin: -24px 0 0;
  color: rgba(244,244,242,0.66);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 16px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.squad-tabs {
  display: flex;
  gap: 8px;
  margin-top: -20px;
}

.squad-tab-btn {
  background: rgba(255,255,255,0.05);
  color: rgba(244,244,242,0.72);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

.squad-tab-btn.is-active {
  background: rgba(232,0,29,0.22);
  border-color: rgba(232,0,29,0.45);
  color: #fff;
}

.squad-muted {
  color: rgba(244,244,242,0.55);
  font-family: 'Barlow', sans-serif;
}

.squad-error {
  color: #ff6b6b;
  font-family: 'Barlow', sans-serif;
}

.squad-group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 22px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--white);
}

.squad-group-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(232,0,29,0.3);
  border: 1px solid rgba(232,0,29,0.4);
  color: var(--white);
  font-size: 13px;
  font-family: 'Barlow', sans-serif;
  font-weight: 600;
}

.squad-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
}

.squad-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}

.squad-card:hover,
.squad-card:focus-visible {
  border-color: rgba(232,0,29,0.45);
  background: rgba(232,0,29,0.06);
  transform: translateY(-2px);
  outline: none;
}

.squad-card-photo {
  aspect-ratio: 3 / 4;
  background: linear-gradient(160deg, rgba(232,0,29,0.1), rgba(4,19,59,0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.squad-card-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.squad-card-initials {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 42px;
  color: rgba(232,0,29,0.6);
  letter-spacing: 0.04em;
  user-select: none;
}

.squad-card-info {
  padding: 10px 12px 12px;
}

.squad-card-number {
  color: var(--gold);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.1em;
  margin-bottom: 3px;
}

.squad-card-name {
  color: var(--white);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 16px;
  letter-spacing: 0.04em;
  line-height: 1.2;
}

.squad-card-nationality {
  margin-top: 4px;
  color: rgba(244,244,242,0.55);
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
}

.squad-card-role {
  margin-top: 2px;
  color: rgba(244,244,242,0.72);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

/* ── Modal ───────────────────────────────────────────────── */
.squad-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(4,19,59,0.82);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  overflow-y: auto;
}

.squad-modal {
  position: relative;
  background: #0c1d4e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  width: 100%;
  max-width: 640px;
  overflow: hidden;
}

.squad-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(244,244,242,0.8);
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  z-index: 1;
}

.squad-modal-close:hover {
  background: rgba(232,0,29,0.25);
  color: var(--white);
}

.squad-modal-hero {
  display: grid;
  grid-template-columns: 160px 1fr;
  background: linear-gradient(135deg, rgba(232,0,29,0.14), rgba(4,19,59,0.5));
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.squad-modal-photo {
  aspect-ratio: 3 / 4;
  background: linear-gradient(160deg, rgba(232,0,29,0.12), rgba(4,19,59,0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.squad-modal-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top center;
}

.squad-modal-initials {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 56px;
  color: rgba(232,0,29,0.55);
}

.squad-modal-identity {
  padding: 24px 24px 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.squad-modal-number {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 18px;
  color: var(--gold);
  letter-spacing: 0.1em;
}

.squad-modal-name {
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(24px, 5vw, 36px);
  line-height: 1;
  color: var(--white);
  letter-spacing: 0.04em;
}

.squad-modal-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.squad-modal-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255,255,255,0.07);
  color: rgba(244,244,242,0.82);
  border: 1px solid rgba(255,255,255,0.12);
}

.squad-modal-tag--pos {
  background: rgba(232,0,29,0.18);
  border-color: rgba(232,0,29,0.3);
  color: #ffb3b3;
}

.squad-modal-bio {
  margin: 8px 0 0;
  color: rgba(244,244,242,0.68);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  line-height: 1.55;
}

.squad-modal-bio.is-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.squad-modal-stats-row {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.squad-modal-stats-row--total {
  margin-top: 6px;
}

.squad-stat-pill {
  padding: 3px 9px;
  border-radius: 999px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  letter-spacing: 0.06em;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  color: rgba(244,244,242,0.9);
}

.squad-stat-pill--total {
  background: rgba(232,0,29,0.18);
  border-color: rgba(232,0,29,0.35);
  color: #ffe3e3;
}

.squad-modal-history {
  padding: 22px 24px 28px;
}

.squad-modal-section-title {
  margin: 0 0 18px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 14px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(244,244,242,0.55);
}

.squad-bio-block {
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  background: rgba(255,255,255,0.03);
}

.squad-bio-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.squad-bio-head span {
  color: rgba(244,244,242,0.55);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.squad-bio-toggle {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.14);
  color: rgba(244,244,242,0.9);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.squad-history-block {
  display: grid;
  gap: 8px;
}

.squad-history-label {
  color: rgba(244,244,242,0.55);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.squad-historic-list {
  display: grid;
  gap: 6px;
}

.squad-historic-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 6px;
  border-radius: 6px;
  background: rgba(255,255,255,0.04);
}

.squad-historic-item em {
  color: var(--gold);
  font-style: normal;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.squad-stats-wrap {
  display: grid;
  gap: 16px;
}

.squad-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.squad-stat-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 12px;
  display: grid;
  gap: 6px;
}

.squad-stat-card span {
  color: rgba(244,244,242,0.58);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.squad-stat-card strong {
  color: var(--white);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 28px;
  letter-spacing: 0.05em;
}

.squad-nations h3,
.squad-compo-header h3 {
  margin: 0 0 8px;
  color: var(--white);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.squad-nations-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

.squad-nation-item {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  color: var(--white);
  font-family: 'Barlow', sans-serif;
}

.squad-compo-wrap {
  display: grid;
  gap: 14px;
}

.squad-compo-header p {
  margin: 0;
  color: rgba(244,244,242,0.6);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
}

.squad-pitch {
  background: linear-gradient(180deg, rgba(25,117,44,0.35), rgba(19,89,34,0.42));
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  padding: 20px 16px;
  display: grid;
  gap: 18px;
}

.squad-pitch-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.squad-chip {
  min-width: 110px;
  text-align: center;
  background: rgba(4,19,59,0.68);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 999px;
  color: var(--white);
  padding: 6px 10px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.04em;
}

/* ── Transition ─────────────────────────────────────────── */
.squad-modal-enter-active,
.squad-modal-leave-active {
  transition: opacity 0.2s ease;
}
.squad-modal-enter-active .squad-modal,
.squad-modal-leave-active .squad-modal {
  transition: transform 0.22s ease, opacity 0.2s ease;
}
.squad-modal-enter-from,
.squad-modal-leave-to {
  opacity: 0;
}
.squad-modal-enter-from .squad-modal {
  transform: translateY(20px);
}

@media (max-width: 640px) {
  .squad-grid {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
  .squad-modal-hero {
    grid-template-columns: 120px 1fr;
  }
  .squad-modal-backdrop {
    padding: 16px 8px;
  }
}
</style>
