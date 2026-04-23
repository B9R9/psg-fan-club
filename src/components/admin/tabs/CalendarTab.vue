<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 :style="s.pageTitle">Calendar</h2>
      <button :style="{ ...s.btn, ...s.btnPrimary }" @click="editing = blank()">+ Add Match</button>
    </div>

    <div v-if="editing">
      <MatchForm :model="editing" :teams="teams" :competitions="competitions" :with-score="false" @save="upsert" @cancel="editing = null" />
    </div>

    <div v-if="!matches" style="padding:40px;color:rgba(200,200,192,0.4);font-family:'Barlow Condensed',sans-serif;letter-spacing:0.1em;text-transform:uppercase;font-size:13px;">Loading…</div>
    <div v-else :style="s.card">
      <table :style="s.table">
        <thead><tr>
          <th :style="s.th">Date</th>
          <th :style="s.th">Time</th>
          <th :style="s.th">Match</th>
          <th :style="s.th">Competition</th>
          <th :style="s.th">Venue</th>
          <th :style="s.th"></th>
        </tr></thead>
        <tbody>
          <tr v-for="m in sorted" :key="m.id">
            <td :style="s.td">{{ m.date }}</td>
            <td :style="s.td">{{ m.time }}</td>
            <td :style="{ ...s.td, fontWeight:600, color:'#f4f4f2' }">{{ m.home }} vs {{ m.away }}</td>
            <td :style="s.td">{{ m.competition }}</td>
            <td :style="s.td">
              <span :style="{ ...s.chip,
                background: m.venue==='home' ? 'rgba(232,0,29,0.15)' : m.venue==='away' ? 'rgba(200,168,75,0.15)' : 'rgba(255,255,255,0.08)',
                color: m.venue==='home' ? '#e8001d' : m.venue==='away' ? '#c8a84b' : '#c8c8c0'
              }">{{ m.venue }}</span>
            </td>
            <td :style="{ ...s.td, display:'flex', gap:8, flexWrap:'wrap' }">
              <template v-if="scoring?.id === m.id">
                <input :style="{ ...s.input, width:'48px', padding:'5px 8px' }" type="number" min="0" v-model.number="scoring.scoreHome" />
                <span :style="{ color:'rgba(255,255,255,0.3)', alignSelf:'center' }">–</span>
                <input :style="{ ...s.input, width:'48px', padding:'5px 8px' }" type="number" min="0" v-model.number="scoring.scoreAway" />
                <button :style="{ ...s.btn, ...s.btnPrimary, padding:'5px 12px' }" @click="saveScore(m)">✓</button>
                <button :style="{ ...s.btn, ...s.btnSecondary, padding:'5px 12px' }" @click="scoring = null">✕</button>
              </template>
              <template v-else>
                <button :style="{ ...s.btn, background:'rgba(34,197,94,0.15)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.3)', padding:'5px 12px', borderRadius:2, fontFamily:'Barlow Condensed,sans-serif', fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer' }" @click="scoring = { id: m.id, scoreHome: 0, scoreAway: 0 }">Score</button>
                <button :style="{ ...s.btn, ...s.btnSecondary, padding:'5px 12px' }" @click="editing = { ...m, homeInput: m.home, awayInput: m.away }">Edit</button>
                <button :style="{ ...s.btn, ...s.btnDanger, padding:'5px 12px' }" @click="del(m.id)">Delete</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { sb } from '../../../lib/supabase.js'
import { mapMatch, toDbMatch, MATCHES_SELECT } from '../../../lib/defaults.js'
import { s, toast } from '../adminStyles.js'
import MatchForm from '../MatchForm.vue'

const isPsg = name => !!name && /(psg|paris)/i.test(name)

const matches      = ref(null)
const editing      = ref(null)
const scoring      = ref(null)
const teams        = ref([])
const competitions = ref([])

const blank  = () => ({ id: null, homeInput: '', awayInput: '', homeTeamId: null, awayTeamId: null, venueName: '', neutral: false, competitionId: null, date: '', time: '21:00', status: 'upcoming' })
const sorted = computed(() => [...(matches.value || [])].sort((a, b) => a.date.localeCompare(b.date)))

async function findOrCreateTeam(name) {
  if (!name?.trim()) return null
  const existing = teams.value.find(t => t.name.toLowerCase() === name.trim().toLowerCase())
  if (existing) return existing.id
  const { data } = await sb.from('teams').insert({ name: name.trim() }).select('id, name, default_stadium').single()
  if (data) teams.value.push(data)
  return data?.id ?? null
}

onMounted(async () => {
  const [{ data: mData }, { data: tData }, { data: cData }] = await Promise.all([
    sb.from('matches').select(MATCHES_SELECT).eq('status', 'upcoming'),
    sb.from('teams').select('id, name, default_stadium').order('name'),
    sb.from('competitions').select('id, name').order('name'),
  ])
  matches.value      = mData ? mData.map(mapMatch) : []
  teams.value        = tData || []
  competitions.value = cData || []
})

async function del(id) {
  const { data: { session } } = await sb.auth.getSession()
  if (!session) { toast('Not authenticated'); return }
  const { error } = await sb.from('matches').delete().eq('id', id)
  if (error) { toast('Delete error: ' + error.message); return }
  matches.value = matches.value.filter(m => m.id !== id)
}

async function saveScore(m) {
  const { error } = await sb.from('matches').update({
    home_score: scoring.value.scoreHome,
    away_score: scoring.value.scoreAway,
    status: 'played',
  }).eq('id', m.id)
  if (error) { toast('Error: ' + error.message); return }
  matches.value = matches.value.filter(x => x.id !== m.id)
  scoring.value = null
  toast('Score saved — match moved to Results')
}

async function upsert() {
  const item = editing.value
  const [homeTeamId, awayTeamId] = await Promise.all([
    findOrCreateTeam(item.homeInput),
    findOrCreateTeam(item.awayInput),
  ])
  const dbItem = { ...item, homeTeamId, awayTeamId }
  const { data, error } = await sb.from('matches').upsert(toDbMatch(dbItem)).select('id').single()
  if (error) { toast('Error: ' + error.message); return }
  const id = data?.id ?? item.id

  // Associer le stade à l'équipe domicile si renseigné et pas neutral
  if (item.venueName?.trim() && !item.neutral && dbItem.homeTeamId) {
    const team = teams.value.find(t => t.id === dbItem.homeTeamId)
    if (team && !team.default_stadium) {
      await sb.from('teams').update({ default_stadium: item.venueName.trim() }).eq('id', dbItem.homeTeamId)
      team.default_stadium = item.venueName.trim()
    }
  }
  const homeName = item.homeInput || ''
  const mapped = {
    ...dbItem,
    id,
    home: homeName,
    away: item.awayInput || '',
    competition: competitions.value.find(c => c.id === dbItem.competitionId)?.name || '',
    venue: isPsg(homeName) ? 'home' : 'away',
    venueName: item.venueName || '',
  }
  const exists = matches.value.find(m => m.id === id)
  matches.value = exists
    ? matches.value.map(m => m.id === id ? mapped : m)
    : [...matches.value, mapped]
  editing.value = null
  toast('Match saved')
}
</script>
