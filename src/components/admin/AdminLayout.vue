<template>
  <div style="display:flex;height:100vh;">
    <!-- Sidebar -->
    <div style="width:220px;background:#04133b;border-right:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;flex-shrink:0;">
      <div style="padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:0.1em;color:#f4f4f2;">
          HELSINKI <span style="color:#e8001d">PSG</span>
        </div>
        <div style="display:inline-block;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;background:rgba(232,0,29,0.15);color:#e8001d;border-radius:2px;padding:2px 7px;margin-top:6px;">Admin</div>
      </div>
      <div style="flex:1;padding-top:12px;">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          :style="activeTab === tab.id ? { ...navBtn, ...navBtnActive } : navBtn"
          @click="$emit('set-tab', tab.id)"
        >{{ tab.label }}</button>
      </div>
      <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,0.07);display:flex;flex-direction:column;gap:8px;">
        <RouterLink to="/" target="_blank" :style="s.viewLink">↗ View Site</RouterLink>
        <button @click="$emit('logout')" style="background:none;border:none;font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(232,0,29,0.6);padding:8px 0;cursor:pointer;text-align:left;">Log Out</button>
      </div>
    </div>
    <!-- Main -->
    <div style="flex:1;overflow:auto;padding:40px 48px;">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { s } from './adminStyles.js'

defineProps({ activeTab: String })
defineEmits(['set-tab', 'logout'])

const TABS = [
  { id:'results',  label:'Results' },
  { id:'calendar', label:'Calendar' },
  { id:'events',   label:'Events' },
  { id:'history',  label:'History' },
  { id:'members',  label:'Members' },
  { id:'settings', label:'Settings' },
]

const navBtn = {
  display:'block', width:'100%', textAlign:'left', background:'none', border:'none',
  fontFamily:'Barlow Condensed,sans-serif', fontSize:13, fontWeight:600,
  letterSpacing:'0.1em', textTransform:'uppercase',
  color:'rgba(200,200,192,0.65)', padding:'11px 20px', cursor:'pointer',
  transition:'color 0.15s, background 0.15s',
}
const navBtnActive = {
  color:'#f4f4f2', background:'rgba(232,0,29,0.12)', borderLeft:'2px solid #e8001d', paddingLeft:'18px',
}
</script>
