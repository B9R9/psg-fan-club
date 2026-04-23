<template>
  <section class="logo-section" id="logo">
    <div class="logo-lockup">
      <img src="/uploads/PSG SUPPORTERS CLUB 2025.png" class="psg-crest" alt="Helsinki PSG Supporters Club Logo" />
      <div class="logo-text">
        <p class="club-city">{{ t('logo_subtitle') }}</p>
        <div class="divider"></div>
        <h1 class="club-name">Paris<br/><span>Saint‑Germain</span></h1>
        <p class="club-tagline">{{ t('logo_tagline') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '../lib/i18n.js'
const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)
</script>
