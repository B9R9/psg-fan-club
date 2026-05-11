<template>
  <section class="section section-alt" id="world-cup-home">
    <div class="section-header">
      <h2 class="section-title">World Cup <span>Hub</span></h2>
      <div class="section-rule"></div>
    </div>

    <div class="wc-home-grid">
      <article class="wc-home-card">
        <h3>{{ t('wc_home_top3_title') }}</h3>
        <ol v-if="topPlayers?.length" class="wc-home-list">
          <li v-for="(p, idx) in topPlayers" :key="p.email || idx">
            <span class="rank">{{ idx + 1 }}</span>
            <span class="name">{{ p.name }}</span>
            <span class="pts">{{ p.points }} {{ t('wc_home_points') }}</span>
          </li>
        </ol>
        <p v-else class="wc-home-empty">{{ t('wc_home_empty_top3') }}</p>
      </article>

      <article class="wc-home-card">
        <h3>{{ t('wc_home_today_matches_title') }}</h3>
        <ul v-if="todayMatches?.length" class="wc-home-list wc-home-matches">
          <li v-for="m in todayMatches" :key="m.id">
            <div class="name">{{ m.home_team }} vs {{ m.away_team }}</div>
            <div class="meta">
              <span v-if="m.status === 'played'">{{ t('wc_final_score') }}: {{ m.home_score }} - {{ m.away_score }}</span>
              <span v-else>{{ t('wc_home_kickoff') }}: {{ formatKickoff(m.kickoff_at) }}</span>
              <span v-if="m.stage"> · {{ m.stage }}</span>
            </div>
          </li>
        </ul>
        <p v-else class="wc-home-empty">{{ t('wc_home_empty_today') }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { currentLang, useI18n } from '../lib/i18n.js'

defineProps({
  topPlayers: { type: Array, default: () => [] },
  todayMatches: { type: Array, default: () => [] },
})

const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

function formatKickoff(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleTimeString(localeForLang(), {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

function localeForLang() {
  if (currentLang.value === 'fr') return 'fr-FR'
  if (currentLang.value === 'fi') return 'fi-FI'
  if (currentLang.value === 'sv') return 'sv-SE'
  return 'en-GB'
}
</script>

<style scoped>
.wc-home-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.wc-home-card {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03);
  border-radius: 6px;
  padding: 14px;
}
.wc-home-card h3 {
  margin: 0 0 10px;
  color: var(--white);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 16px;
}
.wc-home-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}
.wc-home-list li {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  gap: 10px;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding-bottom: 8px;
}
.wc-home-matches li {
  grid-template-columns: 1fr;
  gap: 2px;
}
.rank {
  color: var(--gold);
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px;
}
.name {
  color: var(--white);
  font-family: 'Barlow', sans-serif;
}
.pts,
.meta,
.wc-home-empty {
  color: rgba(244,244,242,0.62);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
}

@media (max-width: 960px) {
  .wc-home-grid {
    grid-template-columns: 1fr;
  }
}
</style>
