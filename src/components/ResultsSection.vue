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
      >
        <div class="team-name home">{{ r.home }}</div>
        <div class="score-block">
          <span class="score" :class="{ highlight: isPsgHome(r) }">{{ r.scoreHome }}</span>
          <span class="score-dash">–</span>
          <span class="score" :class="{ highlight: !isPsgHome(r) }">{{ r.scoreAway }}</span>
        </div>
        <div class="team-name away">{{ r.away }}</div>
        <div class="result-meta">
          <span class="result-comp">{{ r.competition }}</span>
          <span>{{ r.date }}</span>
        </div>
      </div>
    </div>
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

const props = defineProps({ results: Array })

const PER_PAGE = 8
const page = ref(1)
const activeComp = ref('All')

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
</style>
