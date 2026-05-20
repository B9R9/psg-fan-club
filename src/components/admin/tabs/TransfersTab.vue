<template>
  <div>
    <div :style="s.pageTitle">Transfers</div>

    <!-- ── Record a transfer ─────────────────────────── -->
    <div :style="s.card">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:rgba(200,200,192,0.55);margin-bottom:18px;">
        Record a transfer
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;">

        <!-- Type -->
        <label>
          <span :style="s.label">Type</span>
          <select :style="{ ...s.select, width:'100%' }" v-model="form.transfer_type">
            <option value="in">🟢 Transfer In</option>
            <option value="out">🔴 Transfer Out</option>
            <option value="loan_in">🟡 Loan In</option>
            <option value="loan_out">🟠 Loan Out</option>
            <option value="loan_return">↩ Loan Return</option>
          </select>
        </label>

        <!-- Player — select existing or free type -->
        <label>
          <span :style="s.label">Player</span>
          <select :style="{ ...s.select, width:'100%' }" v-model="form.player_id" @change="onPlayerSelect">
            <option value="">— New / unlisted player —</option>
            <option v-for="p in allPlayers" :key="p.id" :value="p.id">
              #{{ p.number ?? '?' }} {{ p.name }}
            </option>
          </select>
        </label>

        <!-- Free-type name if none selected -->
        <label v-if="!form.player_id">
          <span :style="s.label">Player name</span>
          <input :style="s.input" v-model="form.player_name" placeholder="e.g. Khvicha Kvaratskhelia" />
        </label>

        <!-- From club -->
        <label>
          <span :style="s.label">From club</span>
          <input :style="s.input" v-model="form.from_club" placeholder="e.g. Napoli" />
        </label>

        <!-- To club -->
        <label>
          <span :style="s.label">To club</span>
          <input :style="s.input" v-model="form.to_club" placeholder="e.g. PSG" />
        </label>

        <!-- Fee label -->
        <label>
          <span :style="s.label">Fee</span>
          <input :style="s.input" v-model="form.fee_label" placeholder="e.g. €70M, Free, Undisclosed" />
        </label>

        <!-- Date -->
        <label>
          <span :style="s.label">Date</span>
          <input :style="s.input" type="date" v-model="form.transfer_date" />
        </label>

        <!-- Season -->
        <label>
          <span :style="s.label">Season / Window</span>
          <input :style="s.input" v-model="form.season" placeholder="e.g. Summer 2025" />
        </label>

      </div>

      <!-- Position / number for new players (type=in or loan_in) -->
      <template v-if="!form.player_id && (form.transfer_type === 'in' || form.transfer_type === 'loan_in')">
        <div style="margin-top:14px;font-family:'Barlow Condensed',sans-serif;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(200,200,192,0.45);margin-bottom:10px;">
          New player info (will be added to squad)
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;">
          <label>
            <span :style="s.label">Shirt #</span>
            <input :style="s.input" type="number" min="1" max="99" v-model.number="form.new_number" placeholder="e.g. 10" />
          </label>
          <label>
            <span :style="s.label">Position</span>
            <select :style="{ ...s.select, width:'100%' }" v-model="form.new_position">
              <option value="GK">GK</option>
              <option value="DEF">DEF</option>
              <option value="MID">MID</option>
              <option value="FWD">FWD</option>
            </select>
          </label>
          <label>
            <span :style="s.label">Nationality</span>
            <input :style="s.input" v-model="form.new_nationality" placeholder="e.g. France" />
          </label>
        </div>
      </template>

      <!-- Notes -->
      <label style="display:block;margin-top:14px;">
        <span :style="s.label">Notes</span>
        <input :style="s.input" v-model="form.notes" placeholder="Optional note…" />
      </label>

      <div style="margin-top:18px;display:flex;align-items:center;gap:12px;">
        <button
          :style="{ ...s.btn, ...s.btnPrimary }"
          :disabled="saving"
          @click="saveTransfer"
        >
          {{ saving ? 'Saving…' : 'Save transfer' }}
        </button>
        <span v-if="errorMsg" style="color:#ff6b6b;font-family:'Barlow',sans-serif;font-size:13px;">{{ errorMsg }}</span>
      </div>
    </div>

    <!-- ── Transfer log ───────────────────────────────── -->
    <div :style="s.card">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:rgba(200,200,192,0.55);margin-bottom:18px;">
        Transfer log
      </div>
      <p v-if="loadingLog" style="color:rgba(200,200,192,0.5);font-family:'Barlow',sans-serif;font-size:13px;">Loading…</p>
      <p v-else-if="!transfers.length" style="color:rgba(200,200,192,0.5);font-family:'Barlow',sans-serif;font-size:13px;">No transfers recorded yet.</p>
      <table v-else :style="s.table">
        <thead>
          <tr>
            <th :style="s.th">Date</th>
            <th :style="s.th">Type</th>
            <th :style="s.th">Player</th>
            <th :style="s.th">From</th>
            <th :style="s.th">To</th>
            <th :style="s.th">Fee</th>
            <th :style="s.th">Season</th>
            <th :style="s.th"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in transfers" :key="t.id">
            <td :style="s.td">{{ t.transfer_date ? fmtDate(t.transfer_date) : '—' }}</td>
            <td :style="s.td">
              <span :style="{ ...s.chip, ...chipStyle(t.transfer_type) }">{{ typeLabel(t.transfer_type) }}</span>
            </td>
            <td :style="{ ...s.td, color:'#f4f4f2' }">{{ t.player_name }}</td>
            <td :style="s.td">{{ t.from_club || '—' }}</td>
            <td :style="s.td">{{ t.to_club || '—' }}</td>
            <td :style="s.td">{{ t.fee_label || '—' }}</td>
            <td :style="s.td">{{ t.season || '—' }}</td>
            <td :style="s.td">
              <button :style="{ ...s.btn, ...s.btnDanger, padding:'4px 10px', fontSize:11 }" @click="deleteTransfer(t)">✕</button>
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
import { s, toast } from '../adminStyles.js'

const saving    = ref(false)
const errorMsg  = ref('')
const loadingLog = ref(true)
const transfers  = ref([])
const allPlayers = ref([])

const BLANK_FORM = () => ({
  transfer_type: 'in',
  player_id:     '',
  player_name:   '',
  from_club:     '',
  to_club:       '',
  fee_label:     '',
  transfer_date: '',
  season:        '',
  notes:         '',
  new_number:    null,
  new_position:  'MID',
  new_nationality: '',
})

const form = ref(BLANK_FORM())

onMounted(async () => {
  await Promise.all([loadPlayers(), loadTransfers()])
})

async function loadPlayers() {
  const { data } = await sb.from('players').select('id,name,number,is_active').order('name')
  allPlayers.value = data || []
}

async function loadTransfers() {
  loadingLog.value = true
  const { data } = await sb
    .from('player_transfers')
    .select('*')
    .order('transfer_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
  transfers.value = data || []
  loadingLog.value = false
}

function onPlayerSelect() {
  if (form.value.player_id) {
    const player = allPlayers.value.find(p => p.id === form.value.player_id)
    form.value.player_name = player?.name || ''
  } else {
    form.value.player_name = ''
  }
}

async function saveTransfer() {
  errorMsg.value = ''
  const f = form.value

  const playerName = f.player_id
    ? (allPlayers.value.find(p => p.id === f.player_id)?.name || f.player_name)
    : f.player_name.trim()

  if (!playerName) { errorMsg.value = 'Player name is required.'; return }

  saving.value = true
  let playerId = f.player_id || null

  // For incoming transfers of unlisted players → upsert into players (avoid duplicates on name)
  if (!playerId && (f.transfer_type === 'in' || f.transfer_type === 'loan_in')) {
    const { data: newPlayer, error: pErr } = await sb
      .from('players')
      .upsert({
        name:          playerName,
        number:        f.new_number || null,
        position:      f.new_position || 'MID',
        nationality:   f.new_nationality || null,
        is_active:     true,
        display_order: 99,
      }, { onConflict: 'name' })
      .select('id')
      .single()

    if (pErr) { errorMsg.value = pErr.message; saving.value = false; return }
    playerId = newPlayer.id
    await loadPlayers()
  }

  // Update is_active based on transfer direction
  if (playerId) {
    const isActive = f.transfer_type === 'in' || f.transfer_type === 'loan_in' || f.transfer_type === 'loan_return'
    if (f.transfer_type === 'out' || f.transfer_type === 'loan_out') {
      await sb.from('players').update({ is_active: false }).eq('id', playerId)
    } else if (f.transfer_type === 'in' || f.transfer_type === 'loan_return') {
      await sb.from('players').update({ is_active: true }).eq('id', playerId)
    }
  }

  // Insert transfer record
  const { error } = await sb.from('player_transfers').insert({
    player_id:     playerId,
    player_name:   playerName,
    transfer_type: f.transfer_type,
    from_club:     f.from_club.trim() || null,
    to_club:       f.to_club.trim() || null,
    fee_label:     f.fee_label.trim() || null,
    transfer_date: f.transfer_date || null,
    season:        f.season.trim() || null,
    notes:         f.notes.trim() || null,
  })

  saving.value = false

  if (error) { errorMsg.value = error.message; return }

  form.value = BLANK_FORM()
  toast('Transfer saved')
  await loadTransfers()
}

async function deleteTransfer(t) {
  if (!confirm(`Delete transfer: ${t.player_name}?`)) return
  await sb.from('player_transfers').delete().eq('id', t.id)
  toast('Deleted')
  await loadTransfers()
}

function typeLabel(type) {
  return { in: 'In', out: 'Out', loan_in: 'Loan In', loan_out: 'Loan Out', loan_return: 'Loan Return' }[type] ?? type
}

function chipStyle(type) {
  if (type === 'in')          return { background: 'rgba(34,197,94,0.15)',  color: '#4ade80', border:'1px solid rgba(34,197,94,0.3)' }
  if (type === 'out')         return { background: 'rgba(232,0,29,0.15)',   color: '#f87171', border:'1px solid rgba(232,0,29,0.3)' }
  if (type === 'loan_in')     return { background: 'rgba(234,179,8,0.15)',  color: '#fcd34d', border:'1px solid rgba(234,179,8,0.3)' }
  if (type === 'loan_out')    return { background: 'rgba(249,115,22,0.15)', color: '#fdba74', border:'1px solid rgba(249,115,22,0.3)' }
  if (type === 'loan_return') return { background: 'rgba(148,163,184,0.15)',color: '#cbd5e1', border:'1px solid rgba(148,163,184,0.3)' }
  return {}
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = String(d).slice(0, 10).split('-')
  return `${day}.${m}.${y}`
}
</script>
