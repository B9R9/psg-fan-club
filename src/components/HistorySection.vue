<template>
  <section class="section section-alt" id="history">
    <div class="section-header">
      <h2 class="section-title">His<span>tory</span></h2>
      <div class="section-rule"></div>
    </div>
    <button class="add-memory-btn" @click="$emit('open-modal')">{{ t('history_add') }}</button>
    <div class="history-timeline">
      <div
        v-for="(m, i) in paginated"
        :key="m.id"
        :class="['memory-card']"
        @click="openMemory(m)"
        style="cursor:pointer;"
      >
        <div class="memory-media" :class="m.type === 'video' ? 'video-thumb' : m.type" :style="{ background: typeBg(m.type) }">
          <span class="memory-type-badge" :class="m.type">
            {{ m.type === 'video' ? '▶ Video' : m.type === 'photo' ? 'Photo' : 'Story' }}
          </span>
          <!-- YouTube: thumbnail only on card -->
          <template v-if="m.type === 'video' && isYoutube(m.media_url)">
            <img :src="youtubeThumbnail(m.media_url)" style="width:100%;height:100%;object-fit:cover;display:block;" />
            <div class="play-overlay" style="pointer-events:none;">
              <div class="play-btn"><div class="play-arrow"></div></div>
            </div>
          </template>
          <!-- Uploaded video file: poster frame -->
          <video v-else-if="m.type === 'video' && m.media_url" :src="m.media_url" style="width:100%;height:100%;object-fit:cover;display:block;" preload="metadata"></video>
          <!-- No video URL yet -->
          <div v-else-if="m.type === 'video'" class="play-overlay" style="cursor:default;">
            <div style="width:48px;height:48px;border-radius:50%;border:2px solid rgba(232,0,29,0.3);display:flex;align-items:center;justify-content:center;opacity:0.4;">
              <div style="width:0;height:0;border-top:10px solid transparent;border-bottom:10px solid transparent;border-left:16px solid rgba(232,0,29,0.7);margin-left:3px;"></div>
            </div>
          </div>
          <!-- Photo -->
          <img v-else-if="m.type === 'photo' && m.media_url" :src="m.media_url" style="width:100%;height:100%;object-fit:cover;display:block;" />
          <span v-else-if="m.type === 'photo'" style="font-family:monospace;font-size:11px;color:rgba(200,200,192,0.25);">photo</span>
          <!-- Text excerpt -->
          <div v-else style="padding:24px;font-family:Barlow,sans-serif;font-size:13px;color:rgba(200,200,192,0.4);font-style:italic;line-height:1.6;">
            "{{ (m.text || '').substring(0, 60) }}…"
          </div>
        </div>
        <div class="memory-body">
          <div class="memory-author">{{ m.author }}</div>
          <div class="memory-title">{{ m.title }}</div>
          <div class="memory-date">{{ fmtDate(m.date) }}</div>
        </div>
      </div>
    </div>
    <div v-if="totalPages > 1" class="history-pagination">
      <button @click="page--" :disabled="page === 1">←</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button @click="page++" :disabled="page === totalPages">→</button>
    </div>
  </section>

  <!-- Memory detail modal -->
  <Teleport to="body">
    <div v-if="selected" class="memory-modal-backdrop" @click.self="closeMemory()">
      <div class="memory-modal">
        <!-- Prev / Next arrows -->
        <button class="memory-modal-nav memory-modal-prev" @click="navigateModal(-1)" :disabled="selectedIndex <= 0">‹</button>
        <button class="memory-modal-nav memory-modal-next" @click="navigateModal(1)" :disabled="selectedIndex >= (props.memories?.length ?? 0) - 1">›</button>
        <div class="memory-modal-inner">
        <button class="memory-modal-close" @click="closeMemory()">✕</button>
        <!-- Media -->
        <div class="memory-modal-media" v-if="selected.media_url || selected.type === 'video'">
          <template v-if="selected.type === 'video' && isYoutube(selected.media_url)">
            <iframe
              :src="youtubeEmbed(selected.media_url)"
              style="width:100%;height:100%;border:none;"
              allow="autoplay; encrypted-media"
              allowfullscreen
            ></iframe>
          </template>
          <video v-else-if="selected.type === 'video' && selected.media_url" :src="selected.media_url" controls style="width:100%;max-height:340px;"></video>
          <img v-else-if="selected.type === 'photo' && selected.media_url" :src="selected.media_url" style="width:100%;max-height:400px;object-fit:contain;" />
        </div>
        <!-- Meta -->
        <div class="memory-modal-body">
          <div class="memory-modal-title">{{ selected.title }}</div>
          <div class="memory-modal-meta">
            <span class="memory-modal-author">{{ selected.author }}</span>
            <span class="memory-modal-date">{{ fmtDate(selected.date) }}</span>
            <span class="memory-modal-counter">{{ selectedIndex + 1 }} / {{ props.memories?.length }}</span>
          </div>
          <div v-if="selected.text" class="memory-modal-text">{{ selected.text }}</div>
        </div>
        </div><!-- end memory-modal-inner -->
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../lib/i18n.js'

const props = defineProps({ memories: Array })
defineEmits(['open-modal'])

const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

const PER_PAGE = 5
const page = ref(1)
const selected = ref(null)
const selectedIndex = computed(() => {
  if (!selected.value || !props.memories) return -1
  return props.memories.findIndex(m => m.id === selected.value.id)
})

// Comments — TODO

function openMemory(m) {
  selected.value = m
  document.body.style.overflow = 'hidden'
}
function closeMemory() {
  selected.value = null
  document.body.style.overflow = ''
}
function navigateModal(dir) {
  const idx = selectedIndex.value + dir
  if (idx >= 0 && idx < (props.memories?.length ?? 0)) {
    selected.value = props.memories[idx]
  }
}
const totalPages = computed(() => Math.ceil((props.memories?.length || 0) / PER_PAGE))
const paginated = computed(() => (props.memories || []).slice((page.value - 1) * PER_PAGE, page.value * PER_PAGE))

function typeBg(type) {
  return type === 'video' ? '#1a0808' : type === 'photo' ? '#0a1838' : '#06091a'
}

function fmtDate(d) {
  if (!d) return ''
  const parts = d.split('-')
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`
  if (parts.length === 2) return `${parts[1]}.${parts[0]}`
  return d
}

function isYoutube(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

function youtubeId(url) {
  if (!url) return ''
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : ''
}

function youtubeEmbed(url) {
  return `https://www.youtube.com/embed/${youtubeId(url)}?autoplay=1`
}

function youtubeThumbnail(url) {
  return `https://img.youtube.com/vi/${youtubeId(url)}/hqdefault.jpg`
}
</script>
