<template>
  <section class="section section-dark" id="calendar">
    <div class="section-header">
      <h2 class="section-title">Calen<span>dar</span></h2>
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
    <div class="calendar-list">
      <div class="calendar-match" v-for="m in paginated" :key="m.id">
        <div class="cal-date">
          <strong>{{ fmt(m.date).day }} {{ fmt(m.date).month }}</strong>
          {{ fmt(m.date).weekday }}
        </div>
        <div class="cal-match-info">
          <div>
            <div class="cal-vs">
              {{ m.home }}
              <span style="color:rgba(255,255,255,0.3);font-size:16px"> vs </span>
              {{ m.away }}
            </div>
            <div class="cal-comp">{{ m.competition }}</div>
            <div v-if="m.venueName" class="cal-comp" style="opacity:0.5;font-size:12px;">{{ m.venueName }}</div>
          </div>
        </div>
        <div class="cal-time">
          {{ toHelsinkiTime(m.date, m.time) }} Helsinki
          <div v-if="m.venue === 'home'" class="cal-home-badge">{{ t('cal_home') }}</div>
          <div v-else-if="m.venue === 'away'" class="cal-away-badge">{{ t('cal_away') }}</div>
          <div v-else class="cal-away-badge">{{ t('cal_neutral') }}</div>
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
import { useI18n } from '../lib/i18n.js'
import { fmtDate, toHelsinkiTime } from '../lib/utils.js'

const props = defineProps({ matches: Array })
const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

const PER_PAGE = 5
const page = ref(1)
const activeComp = ref('All')

const competitions = computed(() => {
  const comps = [...new Set((props.matches || []).map(m => m.competition))].sort()
  return ['All', ...comps]
})

function selectComp(comp) {
  activeComp.value = comp
  page.value = 1
}

const sorted = computed(() =>
  [...(props.matches || [])]
    .filter(m => activeComp.value === 'All' || m.competition === activeComp.value)
    .sort((a, b) => a.date.localeCompare(b.date))
)
const totalPages = computed(() => Math.ceil(sorted.value.length / PER_PAGE))
const paginated = computed(() => {
  const start = (page.value - 1) * PER_PAGE
  return sorted.value.slice(start, start + PER_PAGE)
})
const fmt = (dateStr) => fmtDate(dateStr)
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
