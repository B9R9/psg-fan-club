<template>
  <section class="trophy-page">
    <header class="trophy-header">
      <div class="trophy-header-inner">
        <RouterLink class="trophy-back" to="/">← {{ t('nav_home') }}</RouterLink>
        <h1>{{ ui.title }}</h1>
        <p>{{ ui.subtitle }}</p>
      </div>
    </header>

    <div class="trophy-content">
      <div class="trophy-controls">
        <div class="trophy-tabs" role="tablist" aria-label="Trophy modes">
          <button class="trophy-tab" :class="{ 'is-active': mode === 'season' }" @click="mode = 'season'">{{ ui.bySeason }}</button>
          <button class="trophy-tab" :class="{ 'is-active': mode === 'allTime' }" @click="mode = 'allTime'">{{ ui.allTime }}</button>
        </div>

        <label v-if="mode === 'season'" class="season-select-wrap">
          <span>{{ ui.season }}</span>
          <select v-model="selectedSeason">
            <option value="all">{{ ui.allSeasons }}</option>
            <option v-for="season in seasonLabels" :key="season" :value="season">{{ season }}</option>
          </select>
        </label>
      </div>

      <template v-if="mode === 'season'">
        <section v-for="season in filteredSeasons" :key="season.season" class="season-block">
          <div class="season-head">
            <h2>{{ season.season }}</h2>
            <span class="season-count">{{ season.trophies.length }} {{ ui.trophiesCount }}</span>
          </div>

          <div class="trophy-grid">
            <article v-for="trophy in season.trophies" :key="`${season.season}-${trophy.name}`" class="trophy-card">
              <div class="trophy-logo-wrap">
                <img :src="getTrophyImage(trophy.image)" :alt="trophy.name" loading="lazy" @error="handleImageError" />
              </div>
              <div class="trophy-info">
                <h3>{{ trophy.name }}</h3>
              </div>
            </article>
          </div>
        </section>
      </template>

      <template v-else>
        <section class="all-time-grid">
          <article v-for="trophy in allTimeTrophies" :key="trophy.name" class="trophy-card trophy-card--all-time">
            <div class="trophy-logo-wrap">
              <img :src="getTrophyImage(trophy.image)" :alt="trophy.name" loading="lazy" @error="handleImageError" />
            </div>
            <div class="trophy-info">
              <h3>{{ trophy.name }}</h3>
              <div class="all-time-count">{{ trophy.count }}</div>
            </div>
          </article>
        </section>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from '../lib/i18n.js'
import { sb } from '../lib/supabase.js'

const { t: tComputed, currentLang } = useI18n()
const t = (key) => tComputed.value(key)

const UI_TEXT = {
  en: {
    title: 'Trophy Room',
    subtitle: 'Trophies won by season and all-time.',
    bySeason: 'By season',
    allTime: 'All time',
    season: 'Season',
    allSeasons: 'All seasons',
    trophiesCount: 'trophy(ies)'
  },
  fr: {
    title: 'Salle des trophées',
    subtitle: 'Les trophées gagnés par saison et en all time.',
    bySeason: 'Par saison',
    allTime: 'All time',
    season: 'Saison',
    allSeasons: 'Toutes les saisons',
    trophiesCount: 'trophée(s)'
  }
}

const ui = computed(() => UI_TEXT[currentLang.value] || UI_TEXT.en)

const mode = ref('season')
const selectedSeason = ref('all')
const dbTrophies = ref([])

const TROPHY_FALLBACK_IMAGE = 'https://commons.wikimedia.org/wiki/Special:FilePath/Trophy_font_awesome.svg?width=220'

const TROPHY_IMAGES = {
  ligue1: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ligue_1_Uber_Eats_logo.svg?width=256',
  ligue2: 'https://commons.wikimedia.org/wiki/Special:FilePath/Ligue_2_BKT_logo.svg?width=256',
  coupeDeFrance: 'https://commons.wikimedia.org/wiki/Special:FilePath/Coupe_de_France_logo.svg?width=256',
  coupeDeLaLigue: 'https://commons.wikimedia.org/wiki/Special:FilePath/Coupe_de_la_Ligue_logo.svg?width=256',
  tropheeDesChampions: 'https://commons.wikimedia.org/wiki/Special:FilePath/Troph%C3%A9e_des_Champions_logo.svg?width=256',
  championsLeague: 'https://commons.wikimedia.org/wiki/Special:FilePath/UEFA_Champions_League.svg?width=256',
  cupWinnersCup: 'https://commons.wikimedia.org/wiki/Special:FilePath/UEFA_Cup_Winners%27_Cup_logo.svg?width=256',
  intertoto: 'https://commons.wikimedia.org/wiki/Special:FilePath/UEFA_Intertoto_Cup_logo.svg?width=256',
  superCup: 'https://commons.wikimedia.org/wiki/Special:FilePath/UEFA_Super_Cup_logo.svg?width=256',
  intercontinental: 'https://commons.wikimedia.org/wiki/Special:FilePath/FIFA_Intercontinental_Cup_logo.svg?width=256'
}

const DEFAULT_COMPETITIONS = [
  {
    type: 'Domestic',
    name: 'Ligue 1',
    count: 14,
    image: TROPHY_IMAGES.ligue1,
    seasons: ['1985–86', '1993–94', '2012–13', '2013–14', '2014–15', '2015–16', '2017–18', '2018–19', '2019–20', '2021–22', '2022–23', '2023–24', '2024–25', '2025–26']
  },
  {
    type: 'Domestic',
    name: 'Ligue 2',
    count: 1,
    image: TROPHY_IMAGES.ligue2,
    seasons: ['1970–71']
  },
  {
    type: 'Domestic',
    name: 'Coupe de France',
    count: 16,
    image: TROPHY_IMAGES.coupeDeFrance,
    seasons: ['1981–82', '1982–83', '1992–93', '1994–95', '1997–98', '2003–04', '2005–06', '2009–10', '2014–15', '2015–16', '2016–17', '2017–18', '2019–20', '2020–21', '2023–24', '2024–25']
  },
  {
    type: 'Domestic',
    name: 'Coupe de la Ligue',
    count: 9,
    image: TROPHY_IMAGES.coupeDeLaLigue,
    seasons: ['1994–95', '1997–98', '2007–08', '2013–14', '2014–15', '2015–16', '2016–17', '2017–18', '2019–20']
  },
  {
    type: 'Domestic',
    name: 'Trophée des Champions',
    count: 14,
    image: TROPHY_IMAGES.tropheeDesChampions,
    seasons: ['1995/96', '1998/99', '2013/14', '2014/15', '2015/16', '2016/17', '2017/18', '2018/19', '2019/20', '2020/21', '2022/23', '2023/24', '2024/25', '2025/26']
  },
  {
    type: 'Continental',
    name: 'UEFA Champions League',
    count: 1,
    image: TROPHY_IMAGES.championsLeague,
    seasons: ['2024–25']
  },
  {
    type: 'Continental',
    name: "UEFA Cup Winners' Cup",
    count: 1,
    image: TROPHY_IMAGES.cupWinnersCup,
    seasons: ['1995–96']
  },
  {
    type: 'Continental',
    name: 'UEFA Intertoto Cup',
    count: 1,
    image: TROPHY_IMAGES.intertoto,
    seasons: ['2001/02']
  },
  {
    type: 'Continental',
    name: 'UEFA Super Cup',
    count: 1,
    image: TROPHY_IMAGES.superCup,
    seasons: ['2025/26']
  },
  {
    type: 'Worldwide',
    name: 'FIFA Intercontinental Cup',
    count: 1,
    image: TROPHY_IMAGES.intercontinental,
    seasons: ['2025/26']
  }
]

const competitionEntries = computed(() => {
  if (dbTrophies.value.length) {
    const grouped = new Map()
    for (const row of dbTrophies.value) {
      const key = normalizeName(row.competition_name)
      const seasonLabel = normalizeSeasonLabel(row.season_label)
      if (!key) continue
      if (!seasonLabel) continue
      if (!grouped.has(key)) {
        grouped.set(key, {
          type: row.competition_type || 'Domestic',
          name: row.competition_name,
          image: row.image_url || TROPHY_IMAGES.tropheeDesChampions,
          seasons: new Set()
        })
      }
      grouped.get(key).seasons.add(seasonLabel)
    }

    return [...grouped.values()].map((entry) => ({
      ...entry,
      seasons: [...entry.seasons].sort((a, b) => seasonSortValue(a) - seasonSortValue(b)),
      count: entry.seasons.size
    }))
  }

  return DEFAULT_COMPETITIONS
})

const allTimeTrophies = computed(() => {
  return [...competitionEntries.value].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.name.localeCompare(b.name)
  })
})

const seasons = computed(() => {
  const bySeason = new Map()

  for (const competition of competitionEntries.value) {
    for (const season of competition.seasons) {
      const seasonLabel = normalizeSeasonLabel(season)
      if (!seasonLabel) continue
      if (!bySeason.has(seasonLabel)) bySeason.set(seasonLabel, [])
      bySeason.get(seasonLabel).push({
        name: competition.name,
        image: competition.image,
        type: competition.type
      })
    }
  }

  return [...bySeason.entries()]
    .sort((a, b) => seasonSortValue(b[0]) - seasonSortValue(a[0]))
    .map(([season, trophies]) => ({
      season,
      trophies: dedupeTrophies(trophies)
    }))
})

const seasonLabels = computed(() => seasons.value.map((s) => s.season))

const filteredSeasons = computed(() => {
  if (selectedSeason.value === 'all') return seasons.value
  return seasons.value.filter((s) => s.season === selectedSeason.value)
})

function seasonSortValue(label) {
  const m = String(label || '').match(/(\d{4}|\d{2})/)
  if (!m) return 0
  let y = Number(m[1])
  if (y < 100) y += y >= 70 ? 1900 : 2000
  return y
}

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function dedupeTrophies(trophies) {
  const seen = new Set()
  const result = []
  for (const trophy of trophies) {
    const key = normalizeName(trophy.name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(trophy)
  }
  return result
}

function normalizeSeasonLabel(value) {
  const text = String(value || '')
    .trim()
    .replace(/[–—-]/g, '/')
    .replace(/\s+/g, '')

  const m = text.match(/^(\d{4})\/(\d{2})$/)
  if (!m) return null
  return `${m[1]}/${m[2]}`
}

function getTrophyImage(value) {
  return value || TROPHY_FALLBACK_IMAGE
}

function handleImageError(event) {
  if (!event?.target) return
  if (event.target.src === TROPHY_FALLBACK_IMAGE) return
  event.target.src = TROPHY_FALLBACK_IMAGE
}

onMounted(loadTrophies)

async function loadTrophies() {
  const { data, error } = await sb
    .from('trophies')
    .select('season_label, competition_name, competition_type, image_url')
    .order('season_label', { ascending: false })

  if (!error && Array.isArray(data) && data.length) {
    dbTrophies.value = data
  }
}
</script>

<style scoped>
.trophy-page {
  min-height: 100vh;
  background: var(--navy);
}

.trophy-header {
  background: linear-gradient(135deg, rgba(200,168,75,0.16), rgba(4,19,59,0.95));
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 48px 20px 34px;
}

.trophy-header-inner {
  max-width: 1200px;
  margin: 0 auto;
}

.trophy-back {
  display: inline-block;
  color: var(--gold);
  text-decoration: none;
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 13px;
  margin-bottom: 14px;
}

.trophy-header h1 {
  margin: 0;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.08em;
  color: var(--white);
  font-size: clamp(40px, 6vw, 64px);
  line-height: 1;
}

.trophy-header p {
  margin-top: 8px;
  color: rgba(244,244,242,0.72);
  font-family: 'Barlow', sans-serif;
  font-size: 15px;
}

.trophy-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px 56px;
  display: grid;
  gap: 22px;
}

.trophy-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.trophy-tabs {
  display: flex;
  gap: 8px;
}

.trophy-tab {
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

.trophy-tab.is-active {
  background: rgba(200,168,75,0.2);
  border-color: rgba(200,168,75,0.45);
  color: var(--white);
}

.season-select-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.season-select-wrap span {
  color: rgba(244,244,242,0.65);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.season-select-wrap select {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.16);
  color: var(--white);
  border-radius: 6px;
  padding: 8px 10px;
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
}

.season-block {
  display: grid;
  gap: 12px;
}

.season-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.season-head h2 {
  font-family: 'Barlow Condensed', sans-serif;
  color: var(--white);
  font-size: 24px;
  letter-spacing: 0.08em;
}

.season-count {
  color: rgba(244,244,242,0.65);
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.08em;
  font-size: 12px;
  text-transform: uppercase;
}

.trophy-grid,
.all-time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}

.trophy-card {
  display: grid;
  gap: 10px;
  align-items: center;
  background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.025));
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 14px;
}

.trophy-card--all-time {
  border-color: rgba(200,168,75,0.35);
  box-shadow: inset 0 1px 0 rgba(200,168,75,0.2);
}

.trophy-logo-wrap {
  width: 74px;
  height: 74px;
  border-radius: 50%;
  background: rgba(0,0,0,0.25);
  border: 1px solid rgba(255,255,255,0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}

.trophy-logo-wrap img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.trophy-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.trophy-info h3 {
  margin: 0;
  color: var(--white);
  font-family: 'Barlow', sans-serif;
  font-size: 15px;
  line-height: 1.25;
}

.all-time-count {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(200,168,75,0.2);
  border: 1px solid rgba(200,168,75,0.5);
  color: var(--gold);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 20px;
  letter-spacing: 0.06em;
}

@media (max-width: 700px) {
  .trophy-header {
    padding-top: 34px;
  }

  .trophy-grid,
  .all-time-grid {
    grid-template-columns: 1fr;
  }

  .trophy-card {
    grid-template-columns: auto 1fr;
  }

  .trophy-logo-wrap {
    width: 62px;
    height: 62px;
  }

  .trophy-logo-wrap img {
    width: 40px;
    height: 40px;
  }
}
</style>
