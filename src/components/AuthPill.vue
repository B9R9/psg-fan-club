<template>
  <div class="auth-pill">
    <RouterLink v-if="!isAuthenticated" class="auth-link" to="/login">Login</RouterLink>
    <template v-else>
      <span class="auth-user">{{ userLabel }}</span>
      <button class="auth-btn" :disabled="busy" @click="logout">
        {{ busy ? '...' : 'Logout' }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth, signOut } from '../lib/auth.js'

const router = useRouter()
const busy = ref(false)
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
.auth-pill {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 1200;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(1, 12, 37, 0.84);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  padding: 6px 10px;
  backdrop-filter: blur(8px);
}

.auth-link,
.auth-btn {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f4f4f2;
}

.auth-link {
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(232, 0, 29, 0.4);
}

.auth-link:hover {
  background: rgba(232, 0, 29, 0.2);
}

.auth-user {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: rgba(244, 244, 242, 0.9);
  padding-left: 4px;
}

.auth-btn {
  border: none;
  background: rgba(232, 0, 29, 0.2);
  border-radius: 999px;
  padding: 4px 10px;
  cursor: pointer;
}

.auth-btn:hover:enabled {
  background: rgba(232, 0, 29, 0.35);
}

@media (max-width: 700px) {
  .auth-user {
    max-width: 100px;
  }
}
</style>
