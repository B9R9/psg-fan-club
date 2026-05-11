<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 :style="s.pageTitle">World Cup</h2>
      <button :style="{ ...s.btn, ...s.btnSecondary }" @click="load">Refresh</button>
    </div>

    <div v-if="!matches" style="padding:40px;color:rgba(200,200,192,0.4);font-family:'Barlow Condensed',sans-serif;letter-spacing:0.1em;text-transform:uppercase;font-size:13px;">Loading…</div>

    <div v-else :style="s.card">
      <table :style="s.table">
        <thead>
          <tr>
            <th :style="s.th">Kickoff</th>
            <th :style="s.th">Match</th>
            <th :style="s.th">Stage</th>
            <th :style="{ ...s.th, textAlign:'center' }">Status</th>
            <th :style="{ ...s.th, textAlign:'center' }">Final Score</th>
            <th :style="{ ...s.th, width:'300px' }"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in sorted" :key="m.id">
            <td :style="s.td">{{ formatKickoff(m.kickoff_at) }}</td>
            <td :style="{ ...s.td, fontWeight:600, color:'#f4f4f2' }">{{ m.home_team }} vs {{ m.away_team }}</td>
            <td :style="s.td">{{ m.stage || '—' }}</td>
            <td :style="{ ...s.td, textAlign:'center' }">
              <span :style="statusChipStyle(m.status)">{{ m.status || 'upcoming' }}</span>
            </td>
            <td :style="{ ...s.td, textAlign:'center', fontFamily:'Bebas Neue,sans-serif', fontSize:20 }">
              {{ scoreLabel(m) }}
            </td>
            <td :style="{ ...s.td, display:'flex', gap:8, flexWrap:'nowrap', alignItems:'center', justifyContent:'flex-end' }">
              <template v-if="editing?.id === m.id">
                <input :style="{ ...s.input, width:'54px', padding:'5px 8px' }" type="number" min="0" v-model.number="editing.home_score" />
                <span :style="{ color:'rgba(255,255,255,0.3)', alignSelf:'center' }">–</span>
                <input :style="{ ...s.input, width:'54px', padding:'5px 8px' }" type="number" min="0" v-model.number="editing.away_score" />
                <select :style="{ ...s.select, padding:'5px 8px', height:'32px' }" v-model="editing.status">
                  <option value="upcoming">upcoming</option>
                  <option value="played">played</option>
                </select>
                <button :style="{ ...s.btn, ...s.btnPrimary, padding:'5px 12px' }" @click="saveEdit">Save</button>
                <button :style="{ ...s.btn, ...s.btnSecondary, padding:'5px 12px' }" @click="editing = null">Cancel</button>
              </template>
              <template v-else>
                <button :style="{ ...s.btn, ...s.btnSecondary, padding:'5px 12px' }" @click="startEdit(m)">Edit</button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { sb } from '../../../lib/supabase.js'
import { s, toast } from '../adminStyles.js'

const matches = ref(null)
const editing = ref(null)

const sorted = computed(() => {
  return [...(matches.value || [])].sort((a, b) => String(a.kickoff_at || '').localeCompare(String(b.kickoff_at || '')))
})

onMounted(load)

async function load() {
  const { data, error } = await sb.from('wc_matches').select('*').order('kickoff_at', { ascending: true })
  if (error) {
    toast('Error: ' + error.message)
    matches.value = []
    return
  }
  matches.value = data || []
}

function startEdit(match) {
  editing.value = {
    id: match.id,
    home_score: match.home_score ?? 0,
    away_score: match.away_score ?? 0,
    status: match.status || 'upcoming',
  }
}

async function saveEdit() {
  const item = editing.value
  if (!item) return

  if (item.home_score == null || item.away_score == null || item.home_score < 0 || item.away_score < 0) {
    toast('Invalid score')
    return
  }

  const { error } = await sb
    .from('wc_matches')
    .update({
      home_score: Number(item.home_score),
      away_score: Number(item.away_score),
      status: item.status || 'played',
    })
    .eq('id', item.id)

  if (error) {
    toast('Error: ' + error.message)
    return
  }

  matches.value = matches.value.map((m) => (m.id === item.id
    ? { ...m, home_score: Number(item.home_score), away_score: Number(item.away_score), status: item.status || 'played' }
    : m))

  editing.value = null
  toast('World Cup match updated')
}

function scoreLabel(match) {
  if (match.home_score == null || match.away_score == null) return '—'
  return `${match.home_score} – ${match.away_score}`
}

function formatKickoff(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('fr-FR', {
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

function statusChipStyle(status) {
  const played = status === 'played'
  return {
    ...s.chip,
    background: played ? 'rgba(34,197,94,0.2)' : 'rgba(200,168,75,0.2)',
    color: played ? '#22c55e' : '#c8a84b',
  }
}
</script>
