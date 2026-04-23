<template>
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:24px;">
    <div style="text-align:center;margin-bottom:8px;">
      <div style="font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:0.08em;line-height:1.1;white-space:nowrap;">
        HELSINKI <span style="color:#e8001d">PSG</span>
      </div>
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(200,200,192,0.4);margin-top:14px;">Admin Access</div>
    </div>
    <div :style="{ background:'rgba(255,255,255,0.03)', border:`1px solid ${err ? '#e8001d' : 'rgba(255,255,255,0.08)'}`, borderRadius:4, padding:32, width:'320px', transition:'border-color 0.2s' }">
      <div style="margin-bottom:14px">
        <label :style="s.label">Email</label>
        <input
          :style="s.input"
          type="email"
          v-model="email"
          @keydown.enter="submit"
          placeholder="admin@example.com"
          autofocus
        />
      </div>
      <div style="margin-bottom:14px">
        <label :style="s.label">Password</label>
        <input
          :style="s.input"
          type="password"
          v-model="pw"
          @keydown.enter="submit"
          placeholder="••••••••"
        />
      </div>
      <div v-if="err" style="font-family:'Barlow Condensed',sans-serif;font-size:12px;color:#e8001d;letter-spacing:0.08em;margin-bottom:12px;">{{ err }}</div>
      <button :style="{ ...s.btn, ...s.btnPrimary, width:'100%', opacity: loading ? 0.6 : 1 }" :disabled="loading" @click="submit">
        {{ loading ? 'Signing in…' : 'Access Admin' }}
      </button>
    </div>
    <RouterLink to="/" :style="s.viewLink">← Back to site</RouterLink>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { sb } from '../../lib/supabase.js'
import { s } from './adminStyles.js'

const emit = defineEmits(['auth'])
const email   = ref('')
const pw      = ref('')
const err     = ref('')
const loading = ref(false)

async function submit() {
  if (!email.value || !pw.value) return
  loading.value = true
  err.value = ''
  const { error } = await sb.auth.signInWithPassword({ email: email.value, password: pw.value })
  loading.value = false
  if (error) {
    err.value = 'Invalid email or password'
  } else {
    emit('auth')
  }
}
</script>
