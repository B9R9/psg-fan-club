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
      <li><RouterLink to="/squad">{{ t('nav_squad') }}</RouterLink></li>
      <li><RouterLink to="/trophies">{{ t('nav_trophies') }}</RouterLink></li>
      <li v-if="isAuthenticated"><RouterLink to="/survivor">{{ t('nav_survivor') }}</RouterLink></li>
      <li v-if="isAuthenticated"><RouterLink to="/world-cup">World Cup</RouterLink></li>
      <li><a href="#results">{{ t('nav_results') }}</a></li>
      <li><a href="#calendar">{{ t('nav_calendar') }}</a></li>
      <li><a href="#memories">{{ t('nav_history') }}</a></li>
      <li class="cta"><a href="#join">{{ t('nav_join') }}</a></li>
      <li v-if="isAuthenticated">
        <a href="#" style="color:var(--gold)!important;" @click.prevent="$emit('open-modal'); menuOpen = false">
          {{ t('nav_contribute') }}
        </a>
      </li>
    </ul>

      <div class="nav-auth">
        <RouterLink v-if="!isAuthenticated" class="nav-login-btn" to="/login">Login</RouterLink>
        <template v-else>
          <span class="nav-user-label">{{ userLabel }}</span>
          <button class="nav-logout-btn" :disabled="busy" @click="logout">{{ busy ? '...' : 'Logout' }}</button>
        </template>
      </div>

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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../lib/i18n.js'
import { useAuth, signOut } from '../lib/auth.js'
const { t: tComputed, currentLang, setLang, LANG_KEYS } = useI18n()
const t = (key) => tComputed.value(key)
defineEmits(['open-modal'])
const menuOpen = ref(false)
const busy = ref(false)
const router = useRouter()
const { user, isAuthenticated } = useAuth()

const userLabel = computed(() => {
  const meta = user.value?.user_metadata || {}
  const name = String(meta.full_name || meta.name || '').trim()
  return name || user.value?.email || 'Compte'
})

async function logout() {
  busy.value = true
  await signOut()
  busy.value = false
  router.push('/')
}
</script>

<style scoped>
.nav-auth {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
  border-left: 1px solid rgba(255,255,255,0.1);
  padding-left: 12px;
}
.nav-login-btn,
.nav-logout-btn,
.nav-user-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(200,200,192,0.7);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.nav-login-btn { color: var(--gold); }
.nav-logout-btn:hover { color: var(--white); }
</style>
