<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 :style="s.pageTitle">Results</h2>
      <button :style="{ ...s.btn, ...s.btnPrimary }" @click="editing = blank()">+ Add Result</button>
    </div>

    <div v-if="editing" >
      <MatchForm :model="editing" :teams="teams" :competitions="competitions" :with-score="true" @save="upsert" @cancel="editing = null" />
    </div>

    <div v-if="!results" style="padding:40px;color:rgba(200,200,192,0.4);font-family:'Barlow Condensed',sans-serif;letter-spacing:0.1em;text-transform:uppercase;font-size:13px;">Loading…</div>
    <div v-else :style="s.card">
      <table :style="s.table">
        <thead><tr>
          <th :style="s.th">Date</th>
          <th :style="s.th">Match</th>
          <th :style="s.th">Score</th>
          <th :style="s.th">Competition</th>
          <th :style="s.th">Result</th>
          <th :style="s.th"></th>
        </tr></thead>
        <tbody>
          <tr v-for="r in sorted" :key="r.id">
            <td :style="s.td">{{ r.date }}</td>
            <td :style="{ ...s.td, fontWeight:600, color:'#f4f4f2' }">{{ r.home }} vs {{ r.away }}</td>
            <td :style="{ ...s.td, fontFamily:'Bebas Neue,sans-serif', fontSize:20 }">{{ r.scoreHome }} – {{ r.scoreAway }}</td>
            <td :style="s.td">{{ r.competition }}</td>
            <td :style="s.td">
              <span :style="{ ...s.chip, background:`${outcomeColor(outcome(r))}20`, color:outcomeColor(outcome(r)) }">{{ outcome(r) }}</span>
            </td>
            <td :style="{ ...s.td, display:'flex', gap:8 }">
              <button :style="{ ...s.btn, ...s.btnSecondary, padding:'5px 12px' }" @click="editing = { ...r, homeInput: r.home, awayInput: r.away }">Edit</button>
              <button :style="{ ...s.btn, ...s.btnDanger, padding:'5px 12px' }" @click="del(r.id)">Delete</button>
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
import { DEFAULT_RESULTS, mapMatch, toDbMatch, MATCHES_SELECT } from '../../../lib/defaults.js'
import { resultOutcome } from '../../../lib/utils.js'
import { s, toast } from '../adminStyles.js'
import AdminField from '../AdminField.vue'
import MatchForm from '../MatchForm.vue'

const results      = ref(null)
const editing      = ref(null)
const teams        = ref([])
const competitions = ref([])

const blank = () => ({ id: null, homeInput: '', awayInput: '', homeTeamId: null, awayTeamId: null, venueName: '', neutral: false, competitionId: null, scoreHome: 0, scoreAway: 0, date: '', status: 'played' })

const sorted = computed(() => [...(results.value || [])].sort((a, b) => b.date.localeCompare(a.date)))

function outcome(r) { return resultOutcome(r) }
function outcomeColor(o) { return o === 'win' ? '#22c55e' : o === 'loss' ? '#e8001d' : '#c8a84b' }

onMounted(async () => {
  const [{ data: mData }, { data: tData }, { data: cData }] = await Promise.all([
    sb.from('matches').select(MATCHES_SELECT).eq('status', 'played'),
    sb.from('teams').select('id, name').order('name'),
    sb.from('competitions').select('id, name').order('name'),
  ])
  results.value      = mData ? mData.map(mapMatch) : []
  teams.value        = tData || []
  competitions.value = cData || []
})

async function del(id) {
  await sb.from('matches').delete().eq('id', id)
  results.value = results.value.filter(r => r.id !== id)
}

async function upsert() {
  const item = editing.value
  const { data, error } = await sb.from('matches').upsert(toDbMatch(item)).select('id').single()
  if (error) { toast('Error: ' + error.message); return }
  const id = data?.id ?? item.id
  const mapped = {
    ...item,
    id,
    home: item.homeInput || teams.value.find(t => t.id === item.homeTeamId)?.name || '',
    away: item.awayInput || teams.value.find(t => t.id === item.awayTeamId)?.name || '',
    competition: competitions.value.find(c => c.id === item.competitionId)?.name || '',
  }
  const exists = results.value.find(r => r.id === id)
  results.value = exists
    ? results.value.map(r => r.id === id ? mapped : r)
    : [mapped, ...results.value]
  editing.value = null
  toast('Result saved')
}
</script>
