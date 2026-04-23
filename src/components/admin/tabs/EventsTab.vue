<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 :style="s.pageTitle">Fan Club Events</h2>
      <button :style="{ ...s.btn, ...s.btnPrimary }" @click="editing = blank()">+ Add Event</button>
    </div>

    <div v-if="editing" :style="{ ...s.card, border:'1px solid rgba(232,0,29,0.3)', marginBottom:24 }">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:16px;letter-spacing:0.08em;color:#f4f4f2;margin-bottom:20px;">Event</div>
      <AdminField label="Event Name"><input :style="s.input" v-model="editing.name" /></AdminField>
      <div style="display:grid;grid-template-columns:160px 120px 1fr;gap:12px;">
        <AdminField label="Date"><input :style="s.input" type="date" v-model="editing.date" /></AdminField>
        <AdminField label="Time"><input :style="s.input" type="time" v-model="editing.time" /></AdminField>
        <AdminField label="Venue (name + address)"><input :style="s.input" v-model="editing.venue" /></AdminField>
      </div>
      <AdminField label="Google Maps URL"><input :style="s.input" v-model="editing.mapUrl" placeholder="https://maps.google.com/..." /></AdminField>
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button :style="{ ...s.btn, ...s.btnPrimary }" @click="upsert">Save</button>
        <button :style="{ ...s.btn, ...s.btnSecondary }" @click="editing = null">Cancel</button>
      </div>
    </div>

    <!-- Pending suggestions -->
    <div style="margin-bottom:32px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;letter-spacing:0.1em;color:rgba(200,200,192,0.5);text-transform:uppercase;margin-bottom:14px;">
        Member Suggestions
        <span v-if="suggestions && suggestions.length" style="margin-left:8px;background:rgba(232,0,29,0.2);color:#e8001d;padding:2px 8px;border-radius:2px;font-size:11px;">{{ suggestions.length }}</span>
      </div>
      <div v-if="!suggestions" style="padding:20px;color:rgba(200,200,192,0.35);font-family:'Barlow Condensed',sans-serif;font-size:13px;letter-spacing:0.08em;">Loading…</div>
      <div v-else-if="suggestions.length === 0" style="padding:20px;color:rgba(200,200,192,0.25);font-family:'Barlow Condensed',sans-serif;font-size:13px;letter-spacing:0.08em;">No pending suggestions</div>
      <div v-else :style="s.card">
        <table :style="s.table">
          <thead><tr>
            <th :style="s.th">From</th>
            <th :style="s.th">Event</th>
            <th :style="s.th">Date</th>
            <th :style="s.th">Venue</th>
            <th :style="s.th">Details</th>
            <th :style="s.th"></th>
          </tr></thead>
          <tbody>
            <tr v-for="sg in suggestions" :key="sg.id">
              <td :style="{ ...s.td, fontSize:'11px', color:'rgba(200,168,75,0.8)' }">{{ sg.email }}</td>
              <td :style="{ ...s.td, fontWeight:600, color:'#f4f4f2' }">{{ sg.name }}</td>
              <td :style="s.td">{{ sg.date || '—' }}</td>
              <td :style="s.td">{{ sg.venue || '—' }}</td>
              <td :style="{ ...s.td, maxWidth:'200px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }">{{ sg.text || '—' }}</td>
              <td :style="{ ...s.td, display:'flex', gap:6, whiteSpace:'nowrap' }">
                <button :style="{ ...s.btn, ...s.btnPrimary, padding:'4px 10px', fontSize:10 }" @click="promote(sg)">Promote</button>
                <button :style="{ ...s.btn, ...s.btnDanger, padding:'4px 10px', fontSize:10 }" @click="dismiss(sg.id)">Dismiss</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


    <div v-if="!events" style="padding:40px;color:rgba(200,200,192,0.4);font-family:'Barlow Condensed',sans-serif;letter-spacing:0.1em;text-transform:uppercase;font-size:13px;">Loading…</div>
    <div v-else :style="s.card">
      <table :style="s.table">
        <thead><tr>
          <th :style="s.th">Date</th>
          <th :style="s.th">Event</th>
          <th :style="s.th">Venue</th>
          <th :style="s.th">Featured</th>
          <th :style="s.th"></th>
        </tr></thead>
        <tbody>
          <tr v-for="ev in sorted" :key="ev.id">
            <td :style="s.td">{{ ev.date }} {{ ev.time ? `· ${ev.time}` : '' }}</td>
            <td :style="{ ...s.td, fontWeight:600, color:'#f4f4f2' }">{{ ev.name }}</td>
            <td :style="s.td">{{ ev.venue }}</td>
            <td :style="s.td">
              <span v-if="ev.featured" :style="{ ...s.chip, background:'rgba(232,0,29,0.15)', color:'#e8001d' }">⚑ Featured</span>
              <button v-else :style="{ ...s.btn, ...s.btnSecondary, padding:'4px 10px', fontSize:10 }" @click="setFeatured(ev.id)">Set Featured</button>
            </td>
            <td :style="{ ...s.td, display:'flex', gap:8 }">
              <button :style="{ ...s.btn, ...s.btnSecondary, padding:'5px 12px' }" @click="editing = { ...ev }">Edit</button>
              <button :style="{ ...s.btn, ...s.btnDanger, padding:'5px 12px' }" @click="del(ev.id)">Delete</button>
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
import { mapEvent, toDbEvent } from '../../../lib/defaults.js'
import { s, toast } from '../adminStyles.js'
import AdminField from '../AdminField.vue'

const events = ref(null)
const editing = ref(null)

const blank = () => ({ id: null, name: '', date: '', time: '', venue: '', mapUrl: '', featured: false })
const sorted = computed(() => [...(events.value || [])].sort((a, b) => a.date.localeCompare(b.date)))

const suggestions = ref(null)

onMounted(async () => {
  const { data } = await sb.from('events').select('*')
  events.value = data ? data.map(mapEvent) : []
  const { data: sData } = await sb.from('event_suggestions').select('*').order('id', { ascending: false })
  suggestions.value = sData || []
})

async function del(id) {
  await sb.from('events').delete().eq('id', id)
  events.value = events.value.filter(e => e.id !== id)
}

async function setFeatured(id) {
  const updated = events.value.map(e => ({ ...e, featured: e.id === id }))
  await Promise.all(updated.map(e => sb.from('events').upsert(toDbEvent(e))))
  events.value = updated
}

async function dismiss(id) {
  await sb.from('event_suggestions').delete().eq('id', id)
  suggestions.value = suggestions.value.filter(s => s.id !== id)
}

async function promote(sg) {
  editing.value = { id: null, name: sg.name || '', date: sg.date || '', time: '', venue: sg.venue || '', mapUrl: '', featured: false }
  await dismiss(sg.id)
}

async function upsert() {
  const item = editing.value
  const { data } = await sb.from('events').upsert(toDbEvent(item)).select('*').single()
  if (data) {
    const saved = mapEvent(data)
    const exists = events.value.find(e => e.id === saved.id)
    events.value = exists
      ? events.value.map(e => e.id === saved.id ? saved : e)
      : [...events.value, saved]
  }
  editing.value = null
  toast('Event saved')
}
</script>
