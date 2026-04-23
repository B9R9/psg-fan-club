<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 :style="s.pageTitle">History & Memories</h2>
      <button :style="{ ...s.btn, ...s.btnPrimary }" @click="editing = blank()">+ Add Memory</button>
    </div>

    <div v-if="editing" :style="{ ...s.card, border:'1px solid rgba(232,0,29,0.3)', marginBottom:24 }">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:16px;letter-spacing:0.08em;color:#f4f4f2;margin-bottom:20px;">Memory</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 120px 120px;gap:12px;">
        <AdminField label="Author"><input :style="s.input" v-model="editing.author" /></AdminField>
        <AdminField label="Title"><input :style="s.input" v-model="editing.title" /></AdminField>
        <AdminField label="Type">
          <select :style="s.select" v-model="editing.type">
            <option value="text">Text</option>
            <option value="photo">Photo</option>
            <option value="video">Video</option>
          </select>
        </AdminField>
        <AdminField label="Date (e.g. 2024-05)"><input :style="s.input" v-model="editing.date" /></AdminField>
      </div>
      <AdminField label="Story / Caption">
        <textarea :style="{ ...s.input, minHeight:'90px', resize:'vertical' }" v-model="editing.text"></textarea>
      </AdminField>
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button :style="{ ...s.btn, ...s.btnPrimary }" @click="upsert">Save</button>
        <button :style="{ ...s.btn, ...s.btnSecondary }" @click="editing = null">Cancel</button>
      </div>
    </div>

    <div v-if="!memories" style="padding:40px;color:rgba(200,200,192,0.4);font-family:'Barlow Condensed',sans-serif;letter-spacing:0.1em;text-transform:uppercase;font-size:13px;">Loading…</div>
    <div v-else :style="s.card">
      <table :style="s.table">
        <thead><tr>
          <th :style="s.th">Type</th>
          <th :style="s.th">Author</th>
          <th :style="s.th">Title</th>
          <th :style="s.th">Date</th>
          <th :style="s.th"></th>
        </tr></thead>
        <tbody>
          <tr v-for="m in memories" :key="m.id">
            <td :style="s.td">
              <span :style="{ ...s.chip,
                background: m.type==='video' ? 'rgba(232,0,29,0.15)' : m.type==='photo' ? 'rgba(4,19,59,0.8)' : 'rgba(255,255,255,0.1)',
                color: m.type==='video' ? '#e8001d' : m.type==='photo' ? '#c8a84b' : '#c8c8c0'
              }">{{ m.type }}</span>
            </td>
            <td :style="s.td">{{ m.author }}</td>
            <td :style="{ ...s.td, fontWeight:600, color:'#f4f4f2' }">{{ m.title }}</td>
            <td :style="s.td">{{ m.date }}</td>
            <td :style="{ ...s.td, display:'flex', gap:8 }">
              <button :style="{ ...s.btn, ...s.btnSecondary, padding:'5px 12px' }" @click="editing = { ...m }">Edit</button>
              <button :style="{ ...s.btn, ...s.btnDanger, padding:'5px 12px' }" @click="del(m.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { sb } from '../../../lib/supabase.js'
import { DEFAULT_HISTORY } from '../../../lib/defaults.js'
import { s, toast } from '../adminStyles.js'
import AdminField from '../AdminField.vue'

const memories = ref(null)
const editing = ref(null)

const blank = () => ({ id: Date.now(), author: '', title: '', text: '', type: 'text', date: '' })

onMounted(async () => {
  const { data } = await sb.from('history').select('*')
  memories.value = data?.length ? data : DEFAULT_HISTORY
})

async function del(id) {
  await sb.from('history').delete().eq('id', id)
  memories.value = memories.value.filter(m => m.id !== id)
}

async function upsert() {
  const item = editing.value
  await sb.from('history').upsert(item)
  const exists = memories.value.find(m => m.id === item.id)
  memories.value = exists
    ? memories.value.map(m => m.id === item.id ? item : m)
    : [item, ...memories.value]
  editing.value = null
  toast('Memory saved')
}
</script>
