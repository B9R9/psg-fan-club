<template>
  <nav>
    <RouterLink class="nav-brand" to="/">
      <span class="dot"></span>
      HELSINKI <span style="color:var(--red);margin-left:6px;">PSG</span>
    </RouterLink>

    <!-- Hamburger (mobile) -->
    <button class="nav-hamburger" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>

    <ul class="nav-links" :class="{ open: menuOpen }" @click="menuOpen = false">
      <li><a href="#next-event">{{ t('nav_next_event') }}</a></li>
      <li><a href="#results">{{ t('nav_results') }}</a></li>
      <li><a href="#calendar">{{ t('nav_calendar') }}</a></li>
      <li><a href="#history">{{ t('nav_history') }}</a></li>
      <li class="cta"><a href="#join">{{ t('nav_join') }}</a></li>
      <li>
        <a href="#" style="color:var(--gold)!important;" @click.prevent="$emit('open-modal'); menuOpen = false">
          {{ t('nav_contribute') }}
        </a>
      </li>
    </ul>

    <div class="lang-switcher">
      <button
        v-for="lang in LANG_KEYS"
        :key="lang"
        class="lang-btn"
        :class="{ active: currentLang === lang }"
        @click="setLang(lang)"
      >{{ lang.toUpperCase() }}</button>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../lib/i18n.js'
const { t: tComputed, currentLang, setLang, LANG_KEYS } = useI18n()
const t = (key) => tComputed.value(key)
defineEmits(['open-modal'])
const menuOpen = ref(false)
</script>
