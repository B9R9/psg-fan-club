<template>
  <div>
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 :style="s.pageTitle">Players</h2>
      <button :style="{ ...s.btn, ...s.btnPrimary }" @click="startAdd">+ Add player</button>
    </div>

    <!-- Layout: table + side panel -->
    <div :style="{ display:'flex', gap:'20px', alignItems:'flex-start' }">

      <!-- Players table -->
      <div :style="{ flex:1, minWidth:0 }">
        <div v-if="!players" :style="s.card" style="text-align:center;padding:40px;color:rgba(200,200,192,0.4);font-family:'Barlow Condensed',sans-serif;font-size:13px;">Loading…</div>
        <div v-else-if="!players.length" :style="s.card" style="text-align:center;padding:48px;color:rgba(200,200,192,0.3);font-size:14px;">No players yet — click + Add player</div>
        <div v-else :style="s.card">
          <div style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;">
            <input :style="{ ...s.input, maxWidth:'220px' }" v-model="search" placeholder="Search name…" />
            <select :style="{ ...s.select, width:'110px' }" v-model="filterPos">
              <option value="">All positions</option>
              <option value="GK">GK</option>
              <option value="DEF">DEF</option>
              <option value="MID">MID</option>
              <option value="FWD">FWD</option>
            </select>
            <select :style="{ ...s.select, width:'130px' }" v-model="filterStatus">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Former</option>
            </select>
          </div>
          <div style="overflow-x:auto;">
            <table :style="{ ...s.table, minWidth:'980px' }">
              <thead>
                <tr>
                  <th :style="s.th">#</th>
                  <th :style="s.th">Name</th>
                  <th :style="s.th">Club</th>
                  <th :style="s.th">Pos</th>
                  <th :style="s.th">Detail</th>
                  <th :style="s.th">Nationality</th>
                  <th :style="s.th">Status</th>
                  <th :style="s.th">Seasons</th>
                  <th :style="s.th">Historic</th>
                  <th :style="s.th">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in filtered" :key="p.id" :style="editing && editing.id === p.id ? { background:'rgba(232,0,29,0.06)' } : {}">
                  <td :style="{ ...s.td, color:'var(--gold)', fontFamily:'Bebas Neue,sans-serif', fontSize:18 }">{{ p.number ?? '—' }}</td>
                  <td :style="{ ...s.td, color:'#f4f4f2', fontWeight:600 }">{{ p.name }}</td>
                  <td :style="s.td">{{ p.club || '—' }}</td>
                  <td :style="s.td"><span :style="{ ...s.chip, ...posChipStyle(p.position) }">{{ p.position }}</span></td>
                  <td :style="{ ...s.td, color:'rgba(200,200,192,0.6)', fontSize:12 }">{{ p.position_detail || '—' }}</td>
                  <td :style="s.td">{{ p.nationality || '—' }}</td>
                  <td :style="s.td"><span :style="p.is_active ? activeChip : inactiveChip">{{ p.is_active ? 'Active' : 'Former' }}</span></td>
                  <td :style="{ ...s.td, fontSize:12, color:'rgba(200,200,192,0.5)' }">{{ seasonCount(p) }}</td>
                  <td :style="{ ...s.td, maxWidth:'230px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }">{{ p.historic || '—' }}</td>
                  <td :style="s.td">
                    <div style="display:flex;gap:6px;">
                      <button :style="{ ...s.btn, ...(editing && editing.id === p.id ? s.btnPrimary : s.btnSecondary), padding:'5px 12px', fontSize:12 }" @click="editing && editing.id === p.id ? closePanel() : startEdit(p)">{{ editing && editing.id === p.id ? '✕ Close' : 'Edit' }}</button>
                      <button :style="{ ...s.btn, ...s.btnDanger, padding:'5px 12px', fontSize:12 }" @click="remove(p)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="players.length && !filtered.length" style="text-align:center;padding:20px;color:rgba(200,200,192,0.35);font-size:13px;">No players match filters.</div>
        </div>
      </div>

      <!-- Edit / Add panel -->
      <transition name="panel-slide">
        <div v-if="editing" :style="{ width:'360px', flexShrink:0 }">
          <div :style="{ ...s.card, border:'1px solid rgba(232,0,29,0.3)', position:'sticky', top:'24px' }">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
              <span style="font-family:'Barlow Condensed',sans-serif;font-size:16px;letter-spacing:0.08em;color:#f4f4f2;">{{ editing.id ? editing.name : 'New player' }}</span>
              <button @click="closePanel" style="background:none;border:none;color:rgba(200,200,192,0.5);cursor:pointer;font-size:18px;line-height:1;">✕</button>
            </div>

            <AdminField label="Name">
              <input :style="s.input" v-model="editing.name" placeholder="Full name" />
            </AdminField>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <AdminField label="Position">
                <select :style="{ ...s.select, width:'100%' }" v-model="editing.position">
                  <option value="GK">GK</option>
                  <option value="DEF">DEF</option>
                  <option value="MID">MID</option>
                  <option value="FWD">FWD</option>
                </select>
              </AdminField>
              <AdminField label="Detail">
                <input :style="s.input" v-model="editing.position_detail" placeholder="CDM, LW…" />
              </AdminField>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <AdminField label="Club">
                <input :style="s.input" v-model="editing.club" placeholder="PSG" />
              </AdminField>
              <AdminField label="Shirt #">
                <input :style="s.input" type="number" min="1" max="99" v-model.number="editing.number" />
              </AdminField>
            </div>
            <AdminField label="Order">
              <input :style="s.input" type="number" min="0" v-model.number="editing.display_order" />
            </AdminField>
            <AdminField label="Nationality">
              <input :style="s.input" v-model="editing.nationality" placeholder="France" />
            </AdminField>
            <AdminField label="Photo URL">
              <input :style="s.input" v-model="editing.photo_url" placeholder="https://…" />
            </AdminField>
            <AdminField label="Bio">
              <input :style="s.input" v-model="editing.bio" placeholder="Short bio" />
            </AdminField>
            <AdminField label="Historic (format: 24/25:OL, 23/24:OL)">
              <input :style="s.input" v-model="editing.historic" placeholder="24/25:OL, 23/24:OL" />
            </AdminField>
            <label style="display:flex;align-items:center;gap:8px;font-family:'Barlow',sans-serif;font-size:13px;color:#f4f4f2;margin-top:6px;">
              <input type="checkbox" v-model="editing.is_active" />
              Active in current squad
            </label>
            <p style="font-family:'Barlow',sans-serif;font-size:11px;color:rgba(200,200,192,0.45);margin:4px 0 0;">Uncheck for historical players (ex: Luis Fernandez).</p>
            <div style="display:flex;gap:8px;margin-top:14px;">
              <button :style="{ ...s.btn, ...s.btnPrimary, flex:1 }" @click="save">Save player</button>
              <button :style="{ ...s.btn, ...s.btnSecondary }" @click="closePanel">Cancel</button>
            </div>
            <div v-if="formErr" style="font-family:'Barlow Condensed',sans-serif;font-size:12px;color:#e8001d;margin-top:8px;">{{ formErr }}</div>

            <!-- PSG Seasons -->
            <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-family:'Barlow Condensed',sans-serif;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(200,200,192,0.55);">PSG Seasons</span>
                <button v-if="!seasonAdding" :style="{ ...s.btn, ...s.btnPrimary, padding:'3px 10px', fontSize:10 }" @click="startSeasonAdd">+ Add</button>
              </div>
              <p style="font-size:11px;color:rgba(200,200,192,0.45);margin:0 0 8px;">Stored directly in player record.</p>
              <div v-if="seasonAdding" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">
                <div style="display:grid;grid-template-columns:1fr 70px;gap:8px;">
                  <input :style="s.input" v-model="seasonForm.season" placeholder="1984-85" @keydown.enter="saveSeason" />
                  <input :style="s.input" type="number" min="1" max="99" v-model.number="seasonForm.shirt_number" placeholder="#" @keydown.enter="saveSeason" />
                </div>
                <input :style="s.input" v-model="seasonForm.note" placeholder="Note (Captain, Loan…)" @keydown.enter="saveSeason" />
                <div style="display:flex;gap:6px;">
                  <button :style="{ ...s.btn, ...s.btnPrimary, flex:1, padding:'5px' }" @click="saveSeason">Save</button>
                  <button :style="{ ...s.btn, ...s.btnSecondary, padding:'5px 10px' }" @click="cancelSeasonEdit">✕</button>
                </div>
                <div v-if="seasonErr" style="font-family:'Barlow Condensed',sans-serif;font-size:11px;color:#e8001d;">{{ seasonErr }}</div>
              </div>
              <p v-if="!seasonRows.length && !seasonAdding" style="font-size:12px;color:rgba(200,200,192,0.35);">No seasons yet.</p>
              <div v-for="row in seasonRows" :key="row.id">
                <div v-if="seasonEditId === row.id" style="display:flex;flex-direction:column;gap:6px;margin-bottom:6px;padding:8px;background:rgba(255,255,255,0.03);border-radius:4px;">
                  <div style="display:grid;grid-template-columns:1fr 70px;gap:6px;">
                    <input :style="s.input" v-model="seasonForm.season" @keydown.enter="saveSeason" />
                    <input :style="s.input" type="number" min="1" max="99" v-model.number="seasonForm.shirt_number" @keydown.enter="saveSeason" />
                  </div>
                  <input :style="s.input" v-model="seasonForm.note" placeholder="Note" @keydown.enter="saveSeason" />
                  <div style="display:flex;gap:6px;">
                    <button :style="{ ...s.btn, ...s.btnPrimary, flex:1, padding:'4px' }" @click="saveSeason">Save</button>
                    <button :style="{ ...s.btn, ...s.btnSecondary, padding:'4px 8px' }" @click="cancelSeasonEdit">✕</button>
                  </div>
                  <div v-if="seasonErr" style="font-size:11px;color:#e8001d;">{{ seasonErr }}</div>
                </div>
                <div v-else style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                  <div>
                    <span style="font-family:'Barlow Condensed',sans-serif;font-size:14px;color:#f4f4f2;">{{ row.season }}</span>
                    <span v-if="row.shirt_number" style="margin-left:8px;font-size:12px;color:var(--gold);">#{{ row.shirt_number }}</span>
                    <div v-if="row.note" style="font-size:11px;color:rgba(200,200,192,0.5);margin-top:1px;">{{ row.note }}</div>
                  </div>
                  <div style="display:flex;gap:4px;flex-shrink:0;">
                    <button :style="{ ...s.btn, ...s.btnSecondary, padding:'3px 8px', fontSize:10 }" @click="startSeasonEdit(row)">Edit</button>
                    <button :style="{ ...s.btn, ...s.btnDanger, padding:'3px 8px', fontSize:10 }" @click="removeSeason(row)">✕</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { sb } from '../../../lib/supabase.js'
import { s, toast } from '../adminStyles.js'
import AdminField from '../AdminField.vue'

const players      = ref(null)
const editing      = ref(null)
const formErr      = ref('')
const search       = ref('')
const filterPos    = ref('')
const filterStatus = ref('')

const seasonRows     = ref([])
const seasonErr      = ref('')
const seasonAdding   = ref(false)
const seasonEditId   = ref(null)
const seasonForm     = ref(blankSeason())
let seasonDraftId = -1

const activeChip   = { ...s.chip, background:'rgba(34,197,94,0.15)',   color:'#4ade80', border:'1px solid rgba(34,197,94,0.3)' }
const inactiveChip = { ...s.chip, background:'rgba(148,163,184,0.15)', color:'#cbd5e1', border:'1px solid rgba(148,163,184,0.3)' }

function posChipStyle(pos) {
  if (pos === 'GK')  return { background:'rgba(200,168,75,0.15)',  color:'#c8a84b', border:'1px solid rgba(200,168,75,0.3)' }
  if (pos === 'DEF') return { background:'rgba(59,130,246,0.15)',  color:'#93c5fd', border:'1px solid rgba(59,130,246,0.3)' }
  if (pos === 'MID') return { background:'rgba(168,85,247,0.15)',  color:'#d8b4fe', border:'1px solid rgba(168,85,247,0.3)' }
  if (pos === 'FWD') return { background:'rgba(232,0,29,0.15)',    color:'#fca5a5', border:'1px solid rgba(232,0,29,0.3)' }
  return {}
}

const sorted = computed(() => {
  if (!players.value) return []
  const posOrder = ['GK','DEF','MID','FWD']
  return [...players.value].sort((a, b) => {
    const pi = posOrder.indexOf(a.position), pj = posOrder.indexOf(b.position)
    if (pi !== pj) return pi - pj
    const byOrder = Number(a.display_order ?? 0) - Number(b.display_order ?? 0)
    if (byOrder !== 0) return byOrder
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
})

const filtered = computed(() => sorted.value.filter(p => {
  const q = search.value.toLowerCase()
  if (q && !(String(p.name || '').toLowerCase().includes(q) || String(p.club || '').toLowerCase().includes(q))) return false
  if (filterPos.value && p.position !== filterPos.value) return false
  if (filterStatus.value === 'active'   && !p.is_active) return false
  if (filterStatus.value === 'inactive' &&  p.is_active) return false
  return true
}))

function blankPlayer() {
  return { id:null, name:'', club:'', number:null, position:'MID', position_detail:'', nationality:'', photo_url:'', bio:'', historic:'', is_active:true, display_order:0 }
}
function blankSeason() { return { season:'', club:'', shirt_number:null, note:'' } }

function normalizeSeasons(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(r => r && r.season)
    .map((r, idx) => ({
      id: r.id ?? -(idx + 1),
      season: String(r.season).trim(),
      shirt_number: r.shirt_number ?? null,
      note: r.note ?? null,
    }))
    .sort((a, b) => String(b.season).localeCompare(String(a.season)))
}

function seasonCount(player) {
  return normalizeSeasons(player?.seasons).length || '—'
}

function parseHistoricInput(raw) {
  const text = String(raw || '').trim()
  if (!text) return { items: [], error: '' }

  const tokens = text.split(',').map(x => x.trim()).filter(Boolean)
  const items = []
  for (const token of tokens) {
    const sep = token.indexOf(':')
    if (sep <= 0 || sep === token.length - 1) {
      return { items: [], error: `Invalid historic entry "${token}". Use format season:club.` }
    }
    const season = token.slice(0, sep).trim()
    const club = token.slice(sep + 1).trim()
    if (!season || !club) {
      return { items: [], error: `Invalid historic entry "${token}". Use format season:club.` }
    }
    items.push({ season, club })
  }
  return { items, error: '' }
}

onMounted(load)

async function load() {
  const { data: pData, error } = await sb.from('players').select('*')
  if (error) {
    formErr.value = error.message
    players.value = []
    return
  }
  players.value = pData || []
}

function resetSeasonState() {
  seasonRows.value = []; seasonAdding.value = false
  seasonEditId.value = null; seasonErr.value = ''; seasonForm.value = blankSeason()
}

function startAdd() { formErr.value = ''; resetSeasonState(); editing.value = blankPlayer() }
function closePanel() { editing.value = null; formErr.value = ''; resetSeasonState() }

async function startEdit(player) {
  formErr.value = ''; resetSeasonState()
  editing.value = { ...player, historic: player.historic || '' }
  loadSeasons(player)
}

async function save() {
  formErr.value = ''
  const p = editing.value
  if (!p?.name?.trim()) { formErr.value = 'Name is required'; return }

  const { error: historyError } = parseHistoricInput(p.historic)
  if (historyError) { formErr.value = historyError; return }

  const payload = {
    name: p.name.trim(), club: p.club?.trim() || null, number: p.number || null, position: p.position,
    position_detail: p.position_detail?.trim() || null, nationality: p.nationality?.trim() || null,
    photo_url: p.photo_url?.trim() || null, bio: p.bio?.trim() || null,
    historic: p.historic?.trim() || null,
    seasons: seasonRows.value.map((row) => ({
      season: row.season,
      shirt_number: row.shirt_number ?? null,
      note: row.note ?? null,
    })),
    is_active: !!p.is_active, display_order: Number(p.display_order ?? 0),
  }
  let data = null
  let error = null
  if (p.id) {
    ;({ data, error } = await sb
      .from('players')
      .update(payload)
      .eq('id', p.id)
      .select('*')
      .single())
  } else {
    ;({ data, error } = await sb
      .from('players')
      .insert(payload)
      .select('*')
      .single())
  }
  if (error) {
    const msg = String(error.message || '')
    const missingColMatch = msg.match(/Could not find the '([^']+)' column/i)
    if (missingColMatch) {
      formErr.value = `Database schema outdated: missing column "${missingColMatch[1]}" on players. Run sql/schema/squad_setup.sql in Supabase SQL Editor, then retry.`
    } else {
      formErr.value = msg
    }
    return
  }

  const idx = (players.value || []).findIndex(x => x.id === data.id)
  if (idx >= 0) players.value.splice(idx, 1, data)
  else players.value = [data, ...(players.value || [])]
  editing.value = { ...data }
  loadSeasons(data)
  toast('Player saved')
}

async function remove(player) {
  if (!confirm('Delete ' + player.name + '?')) return
  const { error } = await sb.from('players').delete().eq('id', player.id)
  if (error) { toast('Delete failed: ' + error.message); return }
  players.value = players.value.filter(p => p.id !== player.id)
  if (editing.value && editing.value.id === player.id) closePanel()
  toast('Player deleted')
}

function loadSeasons(player) {
  seasonErr.value = ''
  seasonRows.value = normalizeSeasons(player?.seasons)
}

function startSeasonAdd() { seasonErr.value = ''; seasonEditId.value = null; seasonAdding.value = true; seasonForm.value = blankSeason() }
function startSeasonEdit(row) { seasonErr.value = ''; seasonAdding.value = false; seasonEditId.value = row.id; seasonForm.value = { season: row.season, shirt_number: row.shirt_number ?? null, note: row.note || '' } }
function cancelSeasonEdit() { seasonAdding.value = false; seasonEditId.value = null; seasonErr.value = ''; seasonForm.value = blankSeason() }

async function saveSeason() {
  seasonErr.value = ''
  const label = seasonForm.value.season?.trim()
  if (!label) { seasonErr.value = 'Season is required'; return }

  const duplicate = seasonRows.value.some(row => row.season === label && row.id !== seasonEditId.value)
  if (duplicate) { seasonErr.value = 'Season already exists.'; return }

  const payload = { season: label, shirt_number: seasonForm.value.shirt_number || null, note: seasonForm.value.note?.trim() || null }

  if (seasonEditId.value) {
    const idx = seasonRows.value.findIndex(r => r.id === seasonEditId.value)
    if (idx >= 0) seasonRows.value.splice(idx, 1, { ...seasonRows.value[idx], ...payload })
  } else {
    seasonRows.value.unshift({ id: seasonDraftId--, ...payload })
  }

  const wasEdit = !!seasonEditId.value
  seasonRows.value.sort((a, b) => String(b.season).localeCompare(String(a.season)))
  cancelSeasonEdit()
  toast(wasEdit ? 'Season updated' : 'Season added')
}

async function removeSeason(row) {
  if (!confirm('Delete season ' + row.season + '?')) return
  seasonRows.value = seasonRows.value.filter(r => r.id !== row.id)
  if (seasonEditId.value === row.id) cancelSeasonEdit()
  toast('Season deleted')
}
</script>

<style scoped>
.panel-slide-enter-active, .panel-slide-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.panel-slide-enter-from, .panel-slide-leave-to { opacity: 0; transform: translateX(16px); }
</style>
