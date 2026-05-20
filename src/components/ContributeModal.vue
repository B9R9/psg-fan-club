<template>
  <div class="member-modal-bg" :class="{ open: modelValue }" @click.self="close">
    <div class="member-modal">
      <button class="modal-close" @click="close">✕</button>

      <template v-if="step === 'email'">
        <div class="modal-steps">
          <div class="modal-step active"></div>
          <div class="modal-step"></div>
          <div class="modal-step"></div>
        </div>
        <div class="modal-title">{{ t('modal_title') }}</div>
        <div class="modal-sub">{{ t('modal_sub') }}</div>
        <div v-if="error" class="modal-error">{{ error }}</div>
        <div class="modal-field">
          <label class="modal-label">{{ t('modal_email_label') }}</label>
          <input
            class="modal-input"
            :class="{ error: hasInputError }"
            type="email"
            v-model="emailInput"
            :placeholder="t('modal_email_placeholder')"
            @keydown.enter="submitEmail"
            autofocus
          />
        </div>
        <button class="modal-btn" :disabled="loading" @click="submitEmail">
          {{ loading ? '...' : t('modal_continue') }}
        </button>
      </template>

      <template v-else-if="step === 'form'">
        <div class="modal-steps">
          <div class="modal-step active"></div>
          <div class="modal-step active"></div>
          <div class="modal-step"></div>
        </div>

        <button v-if="!isMemberEmailLocked" class="modal-back" @click="step = 'email'">{{ t('modal_back') }}</button>
        <div class="modal-title">{{ t('type_history') }}</div>
        <div class="modal-sub">Submitting as <strong style="color:var(--gold)">{{ memberEmail }}</strong></div>
        <div v-if="error" class="modal-error">{{ error }}</div>

        <div class="modal-field">
          <label class="modal-label">Your Name</label>
          <input class="modal-input" v-model="form.author" placeholder="Mikael H." />
        </div>

        <div class="modal-field">
          <label class="modal-label">Title</label>
          <input class="modal-input" v-model="form.title" placeholder="My first match at the Parc..." />
        </div>

        <div class="modal-field">
          <label class="modal-label">Type</label>
          <select class="modal-select" v-model="form.type">
            <option value="text">Text</option>
            <option value="photo">Photo</option>
            <option value="video">Video</option>
          </select>
        </div>

        <div class="modal-field" v-if="form.type === 'text'">
          <label class="modal-label">Your story</label>
          <textarea class="modal-textarea" v-model="form.text" placeholder="Tell us your memory..."></textarea>
        </div>

        <div class="modal-field" v-else-if="form.type === 'photo'">
          <label class="modal-label">Photo</label>
          <input type="file" accept="image/*" class="modal-file" @change="onFileChange" />
          <div v-if="form.mediaFile" class="modal-file-name">{{ form.mediaFile.name }}</div>
        </div>

        <div class="modal-field" v-if="form.type === 'photo'">
          <label class="modal-label">Caption <span style="opacity:0.4;font-weight:400;">(optional)</span></label>
          <input class="modal-input" v-model="form.text" placeholder="Describe the photo..." />
        </div>

        <div class="modal-field" v-else-if="form.type === 'video'">
          <label class="modal-label">Video</label>
          <div style="display:flex;gap:10px;margin-bottom:10px;">
            <button type="button" :style="videoTabStyle(form.videoSource === 'url')" @click="form.videoSource = 'url'">YouTube URL</button>
            <button type="button" :style="videoTabStyle(form.videoSource === 'file')" @click="form.videoSource = 'file'; form.mediaUrl = ''">Upload file</button>
          </div>
          <input v-if="form.videoSource === 'url'" class="modal-input" v-model="form.mediaUrl" placeholder="https://youtube.com/watch?v=..." />
          <div v-else>
            <input type="file" accept="video/*" class="modal-file" @change="onFileChange" />
            <div v-if="form.mediaFile" class="modal-file-name">{{ form.mediaFile.name }}</div>
            <div style="font-size:11px;color:rgba(200,200,192,0.35);margin-top:5px;font-family:'Barlow',sans-serif;">Max 50 MB - MP4, MOV, WebM</div>
          </div>
        </div>

        <div class="modal-field" v-if="form.type === 'video'">
          <label class="modal-label">Caption <span style="opacity:0.4;font-weight:400;">(optional)</span></label>
          <input class="modal-input" v-model="form.text" placeholder="Describe the video..." />
        </div>

        <button class="modal-btn" :disabled="loading" @click="submitForm">
          {{ loading ? '...' : t('modal_publish') }}
        </button>
      </template>

      <template v-else-if="step === 'success'">
        <div class="modal-success">
          <div class="check">✓</div>
          <p>{{ t('modal_success') }}</p>
          <small>{{ t('modal_success_sub') }}</small>
          <button class="modal-btn" style="margin-top:24px;width:auto;padding:10px 32px;" @click="close">Close</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { sb } from '../lib/supabase.js'
import { useI18n } from '../lib/i18n.js'
import { getCurrentUserDisplayName, getCurrentUserEmail } from '../lib/auth.js'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

const step = ref('email')
const emailInput = ref('')
const memberEmail = ref('')
const isMemberEmailLocked = ref(false)
const loading = ref(false)
const error = ref('')
const hasInputError = ref(false)
const form = ref({
  author: '',
  title: '',
  text: '',
  type: 'text',
  mediaFile: null,
  mediaUrl: '',
  videoSource: 'url',
})

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return

    const authEmail = getCurrentUserEmail()
    const authName = getCurrentUserDisplayName()
    if (authName) form.value.author = authName

    if (!authEmail) {
      step.value = 'email'
      isMemberEmailLocked.value = false
      return
    }

    emailInput.value = authEmail
    const ok = await verifyMemberEmail(authEmail)
    if (!ok) {
      step.value = 'email'
      isMemberEmailLocked.value = false
      return
    }

    memberEmail.value = authEmail
    isMemberEmailLocked.value = true
    step.value = 'form'
  }
)

function videoTabStyle(active) {
  return {
    background: active ? 'rgba(232,0,29,0.15)' : 'transparent',
    border: active ? '1px solid rgba(232,0,29,0.5)' : '1px solid rgba(200,200,192,0.15)',
    color: active ? '#f4f4f2' : 'rgba(200,200,192,0.4)',
    padding: '5px 14px',
    borderRadius: '3px',
    cursor: 'pointer',
    fontFamily: "'Barlow Condensed',sans-serif",
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  }
}

function onFileChange(e) {
  form.value.mediaFile = e.target.files[0] || null
}

async function uploadMedia() {
  const file = form.value.mediaFile
  const ext = String(file.name || '').split('.').pop() || 'bin'
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error: upErr } = await sb.storage.from('uploads').upload(path, file, { contentType: file.type })
  if (upErr) throw new Error('Upload failed: ' + upErr.message)
  const { data: { publicUrl } } = sb.storage.from('uploads').getPublicUrl(path)
  return publicUrl
}

function showError(msg) {
  error.value = msg
  hasInputError.value = true
  setTimeout(() => {
    error.value = ''
    hasInputError.value = false
  }, 3000)
}

function close() {
  emit('update:modelValue', false)
  setTimeout(() => {
    step.value = 'email'
    emailInput.value = ''
    memberEmail.value = ''
    isMemberEmailLocked.value = false
    error.value = ''
    form.value = { author: '', title: '', text: '', type: 'text', mediaFile: null, mediaUrl: '', videoSource: 'url' }
  }, 300)
}

async function verifyMemberEmail(email) {
  const { data } = await sb.from('members').select('email').eq('email', email).maybeSingle()
  if (!data) return false

  const { data: { session } } = await sb.auth.getSession()
  if (!session) {
    const { error: anonError } = await sb.auth.signInAnonymously()
    if (anonError) return false
  }
  return true
}

async function submitEmail() {
  const val = String(emailInput.value || '').trim().toLowerCase()
  if (!val || !val.includes('@')) {
    showError('Please enter a valid email.')
    return
  }

  loading.value = true
  const ok = await verifyMemberEmail(val)
  loading.value = false

  if (!ok) {
    showError(t('modal_not_found'))
    return
  }

  memberEmail.value = val
  isMemberEmailLocked.value = false
  step.value = 'form'
}

async function submitForm() {
  loading.value = true
  error.value = ''
  try {
    if (!form.value.title) {
      showError('Please fill in the Title.')
      loading.value = false
      return
    }
    if (form.value.type === 'text' && !form.value.text) {
      showError('Please write your story.')
      loading.value = false
      return
    }
    if (form.value.type === 'photo' && !form.value.mediaFile) {
      showError('Please select a photo.')
      loading.value = false
      return
    }
    if (form.value.type === 'video' && form.value.videoSource === 'url' && !form.value.mediaUrl) {
      showError('Please enter a video URL.')
      loading.value = false
      return
    }
    if (form.value.type === 'video' && form.value.videoSource === 'file' && !form.value.mediaFile) {
      showError('Please select a video file.')
      loading.value = false
      return
    }

    let mediaUrl = form.value.mediaUrl || null
    if (form.value.type === 'photo' || (form.value.type === 'video' && form.value.videoSource === 'file')) {
      mediaUrl = await uploadMedia()
    }

    await sb.from('history').insert({
      author: form.value.author || memberEmail.value,
      title: form.value.title,
      text: form.value.text,
      type: form.value.type || 'text',
      date: new Date().toISOString().slice(0, 10),
      media_url: mediaUrl,
    })

    step.value = 'success'
  } catch {
    showError('Submission failed. Please try again.')
  }
  loading.value = false
}
</script>

<style scoped>
.modal-file {
  display: block;
  width: 100%;
  padding: 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(200,200,192,0.2);
  border-radius: 4px;
  color: rgba(200,200,192,0.7);
  font-family: 'Barlow', sans-serif;
  font-size: 13px;
  cursor: pointer;
}

.modal-file::-webkit-file-upload-button {
  background: rgba(232,0,29,0.15);
  border: 1px solid rgba(232,0,29,0.4);
  color: #f4f4f2;
  padding: 5px 14px;
  border-radius: 3px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  margin-right: 10px;
}

.modal-file-name {
  margin-top: 6px;
  font-family: 'Barlow', sans-serif;
  font-size: 12px;
  color: rgba(200,168,75,0.8);
  letter-spacing: 0.04em;
}
</style>
