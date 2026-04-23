<template>
  <div>
    <h2 :style="s.pageTitle">Settings</h2>

    <div :style="s.card">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;letter-spacing:0.1em;color:rgba(200,200,192,0.5);text-transform:uppercase;margin-bottom:20px;">Join Us</div>
      <AdminField label="QR Code URL (link for Join Us page)">
        <input :style="s.input" v-model="settings.joinUrl" placeholder="https://..." />
      </AdminField>
      <AdminField label="Background Photo">
        <div style="display:flex;flex-direction:column;gap:10px;">
          <img v-if="settings.joinBg" :src="settings.joinBg" style="width:100%;max-height:160px;object-fit:cover;border-radius:4px;border:1px solid rgba(255,255,255,0.1);" />
          <input type="file" accept="image/*" :style="s.input" @change="onJoinBgFile" />
          <button v-if="settings.joinBg" :style="{ ...s.btn, color:'var(--red)', borderColor:'rgba(232,0,29,0.3)', background:'transparent', fontSize:'12px', padding:'6px 14px' }" @click="settings.joinBg = null; saveJoinBg()">Remove photo</button>
        </div>
      </AdminField>
    </div>

    <div :style="s.card">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:14px;letter-spacing:0.1em;color:rgba(200,200,192,0.5);text-transform:uppercase;margin-bottom:20px;">Hero Video</div>
      <AdminField label="YouTube Embed URL (leave blank for placeholder)">
        <input :style="s.input" v-model="settings.videoUrl" placeholder="https://www.youtube.com/embed/VIDEO_ID?autoplay=1&mute=1&loop=1" />
      </AdminField>
    </div>

    <button :style="{ ...s.btn, ...s.btnPrimary }" @click="saveAll">Save Settings</button>

    <div style="margin-top:32px;padding:20px;background:rgba(200,168,75,0.06);border:1px solid rgba(200,168,75,0.2);border-radius:4px;">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#c8a84b;margin-bottom:8px;">Admin Password</div>
      <div style="font-family:'Barlow',sans-serif;font-size:13px;color:rgba(200,200,192,0.55);line-height:1.6;">
        Current password is set in the source code as <code style="background:rgba(255,255,255,0.08);padding:1px 6px;border-radius:2px;">psg2025</code>. To change it, update <code style="background:rgba(255,255,255,0.08);padding:1px 6px;border-radius:2px;">ADMIN_PASSWORD</code> in AdminLogin.vue.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { sb } from '../../../lib/supabase.js'
import { DEFAULT_SETTINGS, mapSettings } from '../../../lib/defaults.js'
import { s, toast } from '../adminStyles.js'
import AdminField from '../AdminField.vue'

const settings = ref({ ...DEFAULT_SETTINGS })

onMounted(async () => {
  const { data } = await sb.from('settings').select('*').eq('id', 1).single()
  if (data) settings.value = mapSettings(data)
})

async function saveAll() {
  const { error } = await sb.from('settings').update({
    join_url: settings.value.joinUrl,
    video_url: settings.value.videoUrl,
    hero_title: settings.value.heroTitle,
    join_bg: settings.value.joinBg,
  }).eq('id', 1)
  if (error) { toast('Save failed: ' + error.message); return }
  toast('Settings saved')
}

async function onJoinBgFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const ext = file.name.split('.').pop()
  const path = `join-bg/bg-${Date.now()}.${ext}`
  const { data: upData, error: upError } = await sb.storage.from('uploads').upload(path, file, { contentType: file.type })
  if (upError) { toast('Upload failed: ' + upError.message); return }
  const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/uploads/${path}`
  settings.value.joinBg = publicUrl
  await saveJoinBg()
  toast('Photo uploaded & saved')
}

async function saveJoinBg() {
  const { error } = await sb.from('settings').update({ join_bg: settings.value.joinBg }).eq('id', 1)
  if (error) toast('Save failed: ' + error.message)
}
</script>
