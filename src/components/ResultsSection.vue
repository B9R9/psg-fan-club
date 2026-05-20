<template>
  <section class="section section-alt" id="results">
    <div class="section-header">
      <h2 class="section-title">Re<span>sults</span></h2>
      <div class="section-rule"></div>
    </div>
    <div class="comp-filters">
      <button
        v-for="comp in competitions"
        :key="comp"
        class="comp-chip"
        :class="{ active: activeComp === comp }"
        @click="selectComp(comp)"
      >{{ comp }}</button>
    </div>
    <div class="results-grid">
      <div
        v-for="r in paginated"
        :key="r.id"
        class="result-card"
        :class="outcome(r)"
        role="button"
        tabindex="0"
        @click="selectedMatch = r"
        @keydown.enter.space.prevent="selectedMatch = r"
      >
        <div class="result-card-top">
          <div class="result-card-comp">{{ r.competition }}</div>
          <div class="result-card-date">{{ formatResultDate(r.date) }}</div>
        </div>
        <div class="result-card-main">
          <div class="result-team result-team--home">{{ r.home }}</div>
          <div class="result-card-score">
            <span class="result-score" :class="{ highlight: isPsgHome(r) }">{{ r.scoreHome }}</span>
            <span class="result-score-divider">–</span>
            <span class="result-score" :class="{ highlight: !isPsgHome(r) }">{{ r.scoreAway }}</span>
          </div>
          <div class="result-team result-team--away">{{ r.away }}</div>
        </div>
        <div class="result-card-bottom">
          <span class="result-outcome-label">{{ outcomeLabel(r) }}</span>
          <span v-if="matchPhase(r)" class="result-phase">{{ matchPhase(r) }}</span>
        </div>
      </div>
    </div>

    <MatchCard :match="selectedMatch" @close="selectedMatch = null" />
    <div v-if="totalPages > 1" class="pagination">
      <button :disabled="page === 1" @click="page--">&larr;</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button :disabled="page === totalPages" @click="page++">&rarr;</button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { resultOutcome } from '../lib/utils.js'
import MatchCard from './MatchCard.vue'

const props = defineProps({ results: Array })

const PER_PAGE = 8
const page = ref(1)
const activeComp = ref('All')
const selectedMatch = ref(null)

const competitions = computed(() => {
  const comps = [...new Set((props.results || []).map(r => r.competition))].sort()
  return ['All', ...comps]
})

function selectComp(comp) {
  activeComp.value = comp
  page.value = 1
}

const sorted = computed(() =>
  [...(props.results || [])]
    .filter(r => activeComp.value === 'All' || r.competition === activeComp.value)
    .sort((a, b) => b.date.localeCompare(a.date))
)
const totalPages = computed(() => Math.ceil(sorted.value.length / PER_PAGE))
const paginated = computed(() => {
  const start = (page.value - 1) * PER_PAGE
  return sorted.value.slice(start, start + PER_PAGE)
})

function isPsgHome(r) { return r.home.toUpperCase().includes('PSG') }
function outcome(r) { return resultOutcome(r) }

function outcomeLabel(r) {
  const value = outcome(r)
  if (value === 'win') return 'Victoire'
  if (value === 'draw') return 'Nul'
  return 'Défaite'
}

function isLeagueCompetition(name) {
  const value = String(name || '').toLowerCase()
  return /league|ligue|championnat/.test(value) && !/champions/.test(value)
}

function isChampionsCompetition(name) {
  const value = String(name || '').toLowerCase()
  return /champions/.test(value)
}

function knockoutLabel(value) {
  if (value === -12) return 'Tour de barrage'
  if (value === -16) return 'Seizième de finale'
  if (value === -8) return 'Huitième de finale'
  if (value === -4) return 'Quart de finale'
  if (value === -2) return 'Demi-finale'
  if (value === -1) return 'Finale'
  return ''
}

function matchPhase(match) {
  if (!match?.matchday) return ''
  const value = Number(match.matchday)
  if (Number.isNaN(value)) return ''
  if (isLeagueCompetition(match.competition)) return `Journée ${value}`
  if (isChampionsCompetition(match.competition)) return value > 0 ? `Journée ${value}` : knockoutLabel(value)
  return value < 0 ? knockoutLabel(value) : `Tour ${value}`
}

function formatResultDate(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
  return dateStr
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}
.pagination button {
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  color: var(--white);
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;
}
.pagination button:hover:not(:disabled) { background: rgba(232,0,29,0.2); border-color: var(--red); }
.pagination button:disabled { opacity: 0.3; cursor: default; }
.pagination span { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.1em; color: var(--offwhite); opacity: 0.6; }

.result-card {
  padding: 16px 18px 14px;
  border-radius: 18px;
  border-left-width: 1px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 180px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.06), transparent 42%),
    linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
}

.result-card.win {
  border-color: rgba(34, 197, 94, 0.28);
}

.result-card.draw {
  border-color: rgba(212, 175, 55, 0.28);
}

.result-card.loss {
  border-color: rgba(232, 0, 29, 0.3);
}

.result-card-top,
.result-card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.result-card-comp,
.result-card-date,
.result-outcome-label,
.result-phase {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.result-card-comp {
  color: var(--gold);
  font-family: 'Barlow Condensed', sans-serif;
}

.result-card-date,
.result-phase {
  color: rgba(255, 255, 255, 0.48);
}

.result-outcome-label {
  color: rgba(255, 255, 255, 0.68);
  font-weight: 700;
}

.result-card-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  flex: 1;
}

.result-team {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--white);
  line-height: 1.05;
}

.result-team--home {
  text-align: right;
}

.result-team--away {
  text-align: left;
}

.result-card-score {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.result-score {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 40px;
  line-height: 1;
  color: var(--white);
}

.result-score.highlight {
  color: var(--red);
}

.result-score-divider {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 24px;
  color: rgba(255,255,255,0.24);
}

@media (max-width: 700px) {
  .result-card {
    min-height: 160px;
  }

  .result-card-main {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .result-team,
  .result-team--home,
  .result-team--away {
    text-align: center;
  }

  .result-card-score {
    justify-content: center;
  }
}

</style>
