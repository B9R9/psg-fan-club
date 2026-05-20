import { computed, ref } from 'vue'
import { sb } from './supabase.js'

const session = ref(null)
const user = ref(null)
const loading = ref(true)

let initialized = false
let authListener = null

function applySession(nextSession) {
  session.value = nextSession || null
  user.value = nextSession?.user || null
}

export async function initAuth() {
  if (initialized) return

  const { data } = await sb.auth.getSession()
  applySession(data?.session)
  loading.value = false

  const { data: listenerData } = sb.auth.onAuthStateChange((_event, nextSession) => {
    applySession(nextSession)
  })

  authListener = listenerData?.subscription || null
  initialized = true
}

export function useAuth() {
  return {
    session,
    user,
    loading,
    isAuthenticated: computed(() => Boolean(user.value)),
  }
}

export async function signInWithPassword({ email, password }) {
  return sb.auth.signInWithPassword({ email, password })
}

export async function signUpWithPassword({ email, password, options }) {
  return sb.auth.signUp({ email, password, options })
}

export async function signOut() {
  return sb.auth.signOut()
}

export function getCurrentUserEmail() {
  return String(user.value?.email || '').trim().toLowerCase()
}

export function getCurrentUserDisplayName() {
  const meta = user.value?.user_metadata || {}
  return String(meta.full_name || meta.name || '').trim()
}

export function cleanupAuthListener() {
  authListener?.unsubscribe?.()
  authListener = null
  initialized = false
}
