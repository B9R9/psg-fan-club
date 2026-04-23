<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
      <h2 :style="s.pageTitle">Members</h2>
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:13px;color:rgba(200,200,192,0.4);letter-spacing:0.08em;">
        {{ members?.length ?? 0 }} member{{ members?.length !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Add member -->
    <div :style="{ ...s.card, border:'1px solid rgba(232,0,29,0.2)', marginBottom:28 }">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(200,200,192,0.5);margin-bottom:16px;">Add Approved Member</div>
      <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end;">
        <AdminField label="Email Address">
          <input :style="s.input" type="email" v-model="newEmail" @keydown.enter="add" placeholder="member@email.com" />
        </AdminField>
        <AdminField label="Name (optional)">
          <input :style="s.input" v-model="newName" placeholder="Mikael H." />
        </AdminField>
        <button :style="{ ...s.btn, ...s.btnPrimary, marginBottom: addErr ? '22px' : 0 }" @click="add">Add Member</button>
      </div>
      <div v-if="addErr" style="font-family:'Barlow Condensed',sans-serif;font-size:12px;color:#e8001d;margin-top:8px;letter-spacing:0.06em;">{{ addErr }}</div>
    </div>

    <div v-if="!members" style="padding:40px;color:rgba(200,200,192,0.4);font-family:'Barlow Condensed',sans-serif;letter-spacing:0.1em;text-transform:uppercase;font-size:13px;">Loading…</div>
    <div v-else-if="members.length === 0" style="text-align:center;padding:48px 0;font-family:'Barlow Condensed',sans-serif;font-size:14px;color:rgba(200,200,192,0.3);letter-spacing:0.1em;text-transform:uppercase;">
      No members yet — add emails above to give members access to submit content.
    </div>
    <div v-else :style="s.card">
      <table :style="s.table">
        <thead><tr>
          <th :style="s.th">Email</th>
          <th :style="s.th">Name</th>
          <th :style="s.th">Added</th>
          <th :style="s.th"></th>
        </tr></thead>
        <tbody>
          <tr v-for="m in members" :key="m.id">
            <td :style="{ ...s.td, color:'#f4f4f2', fontWeight:500 }">{{ m.email }}</td>
            <td :style="s.td">{{ m.name || '—' }}</td>
            <td :style="s.td">{{ m.addedAt }}</td>
            <td :style="s.td">
              <button :style="{ ...s.btn, ...s.btnDanger, padding:'5px 12px' }" @click="del(m.id)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="margin-top:28px;padding:20px;background:rgba(200,168,75,0.06);border:1px solid rgba(200,168,75,0.15);border-radius:4px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#c8a84b;margin-bottom:8px;">How it works</div>
      <div style="font-family:'Barlow',sans-serif;font-size:13px;color:rgba(200,200,192,0.55);line-height:1.7;">
        Members join via the QR code on the site. Once you add their email here, they can click <strong style="color:rgba(200,200,192,0.8)">Contribute</strong> on the site, enter their email, and submit content (memories, gallery photos, match comments, event suggestions).
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { sb } from '../../../lib/supabase.js'
import { mapMember } from '../../../lib/defaults.js'
import { s, toast } from '../adminStyles.js'
import AdminField from '../AdminField.vue'

const members = ref(null)
const newEmail = ref('')
const newName = ref('')
const addErr = ref('')

onMounted(async () => {
  const { data } = await sb.from('members').select('*')
  members.value = data ? data.map(mapMember) : []
})

async function add() {
  const e = newEmail.value.trim().toLowerCase()
  if (!e || !e.includes('@')) { addErr.value = 'Invalid email'; return }
  if (members.value.find(m => m.email === e)) { addErr.value = 'Already exists'; return }
  const newMember = { email: e, name: newName.value.trim(), added_at: new Date().toISOString() }
  const { data: inserted, error } = await sb.from('members').insert(newMember).select('*').single()
  if (error) { addErr.value = 'Error: ' + error.message; return }
  members.value = [...members.value, mapMember(inserted)]
  newEmail.value = ''
  newName.value = ''
  addErr.value = ''
  toast('Member added')
}

async function del(id) {
  await sb.from('members').delete().eq('id', id)
  members.value = members.value.filter(m => m.id !== id)
}
</script>
