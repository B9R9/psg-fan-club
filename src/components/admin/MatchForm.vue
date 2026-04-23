<template>
  <div :style="{ ...s.card, border:'1px solid rgba(232,0,29,0.3)', marginBottom:'24px', padding:'15px 15px' }">
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:16px;letter-spacing:0.08em;color:#f4f4f2;margin-bottom:20px;">
      {{ model.id ? 'Edit' : 'New' }} {{ withScore ? 'Result' : 'Match' }}
    </div>

    <div :style="{ display:'grid', gridTemplateColumns: withScore ? '1fr 1fr 80px 80px 1fr 160px' : '1fr 1fr 1fr 120px 120px', gap:'12px', alignItems:'end' }">
      <AdminField label="Home Team">
        <div style="position:relative;">
          <input :style="s.input" v-model="model.homeInput" @input="onHomeChange" @focus="homeFocus=true" @blur="blurHome" placeholder="ex : PSG" autocomplete="off" />
          <div v-if="homeFocus && homesuggestions.length" :style="suggestStyle">
            <div v-for="t in homesuggestions" :key="t.id" :style="suggestItem" @mousedown.prevent="pickHome(t)">{{ t.name }}</div>
          </div>
        </div>
      </AdminField>
      <AdminField label="Away Team">
        <div style="position:relative;">
          <input :style="s.input" v-model="model.awayInput" @input="onAwayChange" @focus="awayFocus=true" @blur="blurAway" placeholder="ex : Marseille" autocomplete="off" />
          <div v-if="awayFocus && awaysuggestions.length" :style="suggestStyle">
            <div v-for="t in awaysuggestions" :key="t.id" :style="suggestItem" @mousedown.prevent="pickAway(t)">{{ t.name }}</div>
          </div>
        </div>
      </AdminField>

      <template v-if="withScore">
        <AdminField label="Home Score"><input :style="s.input" type="number" min="0" v-model.number="model.scoreHome" /></AdminField>
        <AdminField label="Away Score"><input :style="s.input" type="number" min="0" v-model.number="model.scoreAway" /></AdminField>
      </template>

      <AdminField label="Competition">
        <select :style="{ ...s.select, width:'100%' }" v-model.number="model.competitionId">
          <option :value="null">—</option>
          <option v-for="c in competitions" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </AdminField>
      <AdminField label="Date"><input :style="s.input" type="date" v-model="model.date" /></AdminField>

    <template v-if="!withScore">
      <AdminField label="Time (CET)"><input :style="s.input" type="time" v-model="model.time" /></AdminField>
    </template>
    </div>

    <AdminField label="Stadium" style="margin-top:12px;">
      <input :style="s.input" v-model="model.venueName" placeholder="ex : Parc des Princes" />
      <div v-if="stadiumHint" style="margin-top:5px;font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:0.08em;color:rgba(200,168,75,0.8);">{{ stadiumHint }}</div>
    </AdminField>
    <label style="display:flex;align-items:center;gap:8px;margin-top:10px;cursor:pointer;font-family:'Barlow Condensed',sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(200,200,192,0.5);">
      <input type="checkbox" v-model="model.neutral" style="accent-color:#e8001d;width:14px;height:14px;" />
      Neutral venue (ne pas associer ce stade à l'équipe)
    </label>

    <div style="display:flex;gap:10px;margin-top:16px;">
      <button :style="{ ...s.btn, ...s.btnPrimary }" @click="$emit('save')">Save</button>
      <button :style="{ ...s.btn, ...s.btnSecondary }" @click="$emit('cancel')">Cancel</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { s } from './adminStyles.js'
import AdminField from './AdminField.vue'

const props = defineProps({
  model:        { type: Object,  required: true },
  teams:        { type: Array,   default: () => [] },
  competitions: { type: Array,   default: () => [] },
  withScore:    { type: Boolean, default: false },
})
defineEmits(['save', 'cancel'])

const homeFocus = ref(false)
const awayFocus = ref(false)

const homesuggestions = computed(() => {
  const q = props.model.homeInput?.trim().toLowerCase()
  if (!q) return props.teams.slice(0, 8)
  return props.teams.filter(t => t.name.toLowerCase().includes(q)).slice(0, 8)
})
const awaysuggestions = computed(() => {
  const q = props.model.awayInput?.trim().toLowerCase()
  if (!q) return props.teams.slice(0, 8)
  return props.teams.filter(t => t.name.toLowerCase().includes(q)).slice(0, 8)
})

const suggestStyle = { position:'absolute', top:'100%', left:0, right:0, background:'#04133b', border:'1px solid rgba(255,255,255,0.12)', borderRadius:3, zIndex:100, maxHeight:'200px', overflowY:'auto', boxShadow:'0 4px 16px rgba(0,0,0,0.5)' }
const suggestItem  = { padding:'8px 12px', fontFamily:'Barlow,sans-serif', fontSize:13, color:'#f4f4f2', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)' }

const stadiumHint = computed(() => {
  const team = props.teams.find(t => t.id === props.model.homeTeamId)
  if (!team) return ''
  if (!team.default_stadium && !props.model.venueName) return `Aucun stade associé à ${team.name} — entre un nom pour l'enregistrer`
  if (!team.default_stadium && props.model.venueName && !props.model.neutral) return `Ce stade sera associé à ${team.name}`
  return ''
})

function blurHome() { setTimeout(() => { homeFocus.value = false }, 150) }
function blurAway() { setTimeout(() => { awayFocus.value = false }, 150) }

function onHomeChange() {
  const team = props.teams.find(t => t.name.toLowerCase() === props.model.homeInput?.trim().toLowerCase())
  props.model.homeTeamId = team?.id ?? null
  if (team?.default_stadium) props.model.venueName = team.default_stadium
}
function onAwayChange() {
  const team = props.teams.find(t => t.name.toLowerCase() === props.model.awayInput?.trim().toLowerCase())
  props.model.awayTeamId = team?.id ?? null
}
function pickHome(t) {
  props.model.homeInput = t.name
  props.model.homeTeamId = t.id
  if (t.default_stadium) props.model.venueName = t.default_stadium
  homeFocus.value = false
}
function pickAway(t) {
  props.model.awayInput = t.name
  props.model.awayTeamId = t.id
  awayFocus.value = false
}
</script>
