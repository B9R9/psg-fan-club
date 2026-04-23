<template>
  <section
    class="join-section"
    id="join"
    :style="joinBg ? { backgroundImage: `url(${joinBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
  >
    <div v-if="joinBg" style="position:absolute;inset:0;background:rgba(4,19,59,0.72);pointer-events:none;"></div>
    <div class="join-content">
      <h2 class="join-title">
        {{ titleBefore }}<br/><span>{{ titleSpan }}</span>
      </h2>
      <p class="join-sub">{{ t('join_sub') }}</p>
      <div class="qr-wrapper">
        <canvas ref="qrCanvas"></canvas>
      </div>
      <br/>
      <p class="qr-label">{{ t('qr_label') }}</p>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import QRCode from 'qrcode'
import { useI18n } from '../lib/i18n.js'

const props = defineProps({ joinUrl: String, joinBg: String })
const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

const qrCanvas = ref(null)

const titleFull = computed(() => t('join_title'))
const titleSpan = computed(() => t('join_title_span'))
const titleBefore = computed(() => {
  const full = titleFull.value
  const span = titleSpan.value
  return full.replace(span, '').trim()
})

async function renderQR() {
  if (!qrCanvas.value) return
  await QRCode.toCanvas(qrCanvas.value, props.joinUrl || 'https://helsinkipsg.fi/join', {
    width: 200,
    color: { dark: '#04133b', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })
}

onMounted(renderQR)
watch(() => props.joinUrl, renderQR)
</script>
