<template>
  <section class="login-page">
    <div class="login-card">
      <RouterLink class="login-back" to="/">← Retour au site</RouterLink>
      <h1>Connexion</h1>
      <p class="login-sub">Un compte unique pour participer partout (Survivor, World Cup, etc.)</p>

      <div class="login-tabs">
        <button :class="{ active: mode === 'signin' }" @click="mode = 'signin'">Se connecter</button>
        <button :class="{ active: mode === 'signup' }" @click="mode = 'signup'">Creer un compte</button>
      </div>

      <form class="login-form" @submit.prevent="submit">
        <label>
          Email
          <input v-model="email" type="email" required autocomplete="email" />
        </label>

        <label>
          Mot de passe
          <input v-model="password" type="password" required minlength="6" autocomplete="current-password" />
        </label>

        <label v-if="mode === 'signup'">
          Nom (optionnel)
          <input v-model="fullName" type="text" autocomplete="name" />
        </label>

        <p v-if="errorMsg" class="login-error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="login-success">{{ successMsg }}</p>

        <button class="login-submit" type="submit" :disabled="loading">
          {{ loading ? '...' : (mode === 'signin' ? 'Connexion' : 'Creer mon compte') }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { signInWithPassword, signUpWithPassword } from '../lib/auth.js'

const route = useRoute()
const router = useRouter()

const mode = ref('signin')
const email = ref('')
const password = ref('')
const fullName = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function submit() {
  if (!email.value || !password.value) return

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  if (mode.value === 'signin') {
    const { error } = await signInWithPassword({
      email: String(email.value).trim(),
      password: password.value,
    })

    loading.value = false

    if (error) {
      errorMsg.value = 'Email ou mot de passe invalide.'
      return
    }

    router.push(String(route.query.redirect || '/'))
    return
  }

  const { error } = await signUpWithPassword({
    email: String(email.value).trim(),
    password: password.value,
    options: {
      data: {
        full_name: String(fullName.value || '').trim(),
      },
    },
  })

  loading.value = false

  if (error) {
    errorMsg.value = error.message || 'Impossible de creer le compte.'
    return
  }

  successMsg.value = 'Compte cree. Verifie ton email si une confirmation est requise, puis connecte-toi.'
  mode.value = 'signin'
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.login-card {
  width: min(460px, 100%);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  padding: 24px;
}

.login-back {
  color: var(--gold);
  text-decoration: none;
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 12px;
}

h1 {
  margin-top: 12px;
  font-family: 'Bebas Neue', sans-serif;
  letter-spacing: 0.08em;
  font-size: 42px;
}

.login-sub {
  margin: 8px 0 16px;
  color: rgba(244, 244, 242, 0.68);
}

.login-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.login-tabs button {
  flex: 1;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(244, 244, 242, 0.8);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
}

.login-tabs button.active {
  background: rgba(232, 0, 29, 0.18);
  border-color: rgba(232, 0, 29, 0.45);
  color: #fff;
}

.login-form {
  display: grid;
  gap: 10px;
}

.login-form label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: rgba(244, 244, 242, 0.8);
}

.login-form input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 6px;
  color: var(--white);
  padding: 10px 12px;
}

.login-error {
  color: #ff6b7c;
  font-size: 13px;
}

.login-success {
  color: #7fe2a2;
  font-size: 13px;
}

.login-submit {
  margin-top: 6px;
  border: none;
  border-radius: 8px;
  background: var(--red);
  color: #fff;
  font-weight: 600;
  padding: 10px 14px;
  cursor: pointer;
}

.login-submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
