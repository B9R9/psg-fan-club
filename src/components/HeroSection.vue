<template>
  <section class="hero" id="hero">
    <div class="hero-bg-stripes"></div>
    <div class="video-container">
      <iframe
        v-if="videoSrc"
        :src="videoSrc"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </div>
    <div class="hero-accent"></div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { buildVideoUrl } from '../lib/utils.js'

const props = defineProps({ videoUrl: String })

const playing = ref(false)
const videoSrc = computed(() => props.videoUrl ? buildVideoUrl(props.videoUrl) : null)

function youtubeId(url) {
  if (!url) return ''
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : ''
}

const thumbnailUrl = computed(() => {
  const id = youtubeId(props.videoUrl || '')
  return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null
})
</script>
