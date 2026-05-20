<template>
  <div>
    <h2 :style="s.pageTitle">Trophies</h2>

    <div :style="s.card">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;letter-spacing:0.1em;color:rgba(200,200,192,0.5);text-transform:uppercase;margin-bottom:16px;">Add Trophy by Season</div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
        <AdminField label="Season label">
          <input :style="s.input" v-model="form.season_label" placeholder="2025/26" />
        </AdminField>

        <AdminField label="Competition name">
          <input :style="s.input" v-model="form.competition_name" placeholder="Ligue 1" />
        </AdminField>

        <AdminField label="Type">
          <select :style="s.select" v-model="form.competition_type">
            <option>Domestic</option>
            <option>Continental</option>
            <option>Worldwide</option>
          </select>
        </AdminField>

        <AdminField label="Image URL">
          <input :style="s.input" v-model="form.image_url" placeholder="https://..." />
        </AdminField>
      </div>

      <button :style="{ ...s.btn, ...s.btnPrimary, marginTop:'10px' }" @click="addTrophy">Add Trophy</button>
      <p v-if="loadError" style="margin-top:10px;color:#f87171;font-family:'Barlow',sans-serif;font-size:12px;">{{ loadError }}</p>
    </div>

    <div :style="s.card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;letter-spacing:0.1em;color:rgba(200,200,192,0.5);text-transform:uppercase;">Saved Trophies</div>
        <button :style="{ ...s.btn, ...s.btnSecondary, fontSize:'12px', padding:'6px 12px' }" @click="loadRows">Refresh</button>
      </div>

      <div v-if="!rows.length" style="color:rgba(200,200,192,0.45);font-size:13px;">No trophy rows yet.</div>

      <div v-else style="overflow:auto;">
        <table :style="s.table">
          <thead>
            <tr>
              <th :style="s.th">Season</th>
              <th :style="s.th">Competition</th>
              <th :style="s.th">Type</th>
              <th :style="s.th">Image</th>
              <th :style="s.th"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td :style="s.td">{{ row.season_label }}</td>
              <td :style="{ ...s.td, color:'#f4f4f2' }">{{ row.competition_name }}</td>
              <td :style="s.td">{{ row.competition_type }}</td>
              <td :style="s.td">
                <a v-if="row.image_url" :href="row.image_url" target="_blank" rel="noreferrer" :style="{ color:'var(--gold)' }">image</a>
                <span v-else>—</span>
              </td>
              <td :style="s.td">
                <button :style="{ ...s.btn, ...s.btnDanger, fontSize:'11px', padding:'5px 10px' }" @click="removeRow(row)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { sb } from '../../../lib/supabase.js'
import { s, toast } from '../adminStyles.js'
import AdminField from '../AdminField.vue'

const rows = ref([])
const loadError = ref('')

const form = ref({
  season_label: '',
  competition_name: '',
  competition_type: 'Domestic',
  image_url: ''
})

onMounted(loadRows)

async function loadRows() {
  loadError.value = ''
  const { data, error } = await sb
    .from('trophies')
    .select('*')
    .order('season_label', { ascending: false })
    .order('competition_name', { ascending: true })

  if (error) {
    rows.value = []
    loadError.value = 'Table trophies manquante. Applique la migration puis recharge.'
    return
  }

  rows.value = data || []
}

async function addTrophy() {
  const normalizedSeason = normalizeSeasonLabel(form.value.season_label)

  const payload = {
    season_label: normalizedSeason,
    competition_name: form.value.competition_name.trim(),
    competition_type: form.value.competition_type,
    image_url: form.value.image_url.trim() || null
  }

  if (!payload.competition_name) {
    toast('Season et competition sont obligatoires')
    return
  }

  if (!payload.season_label) {
    toast('Format saison invalide. Utilise YYYY/YY (ex: 2023/24)')
    return
  }

  const { error } = await sb.from('trophies').insert(payload)
  if (error) {
    if (String(error.message || '').toLowerCase().includes('duplicate')) {
      toast('Ce trophée existe déjà pour cette saison')
      return
    }
    toast('Save failed: ' + error.message)
    return
  }

  form.value.season_label = ''
  form.value.competition_name = ''
  form.value.image_url = ''
  await loadRows()
  toast('Trophy ajouté')
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

async function removeRow(row) {
  if (!confirm(`Delete ${row.competition_name} (${row.season_label}) ?`)) return
  const { error } = await sb.from('trophies').delete().eq('id', row.id)
  if (error) {
    toast('Delete failed: ' + error.message)
    return
  }
  await loadRows()
  toast('Deleted')
}
</script>
