<template>
  <div class="member-modal-bg" :class="{ open: modelValue }" @click.self="close">
    <div class="member-modal">
      <button class="modal-close" @click="close">✕</button>

      <!-- Step 1: Email -->
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
          {{ loading ? '…' : t('modal_continue') }}
        </button>
      </template>

      <!-- Step 2: Content type -->
      <template v-else-if="step === 'type'">
        <div class="modal-steps">
          <div class="modal-step active"></div>
          <div class="modal-step active"></div>
          <div class="modal-step"></div>
        </div>
        <button class="modal-back" @click="step = 'email'">{{ t('modal_back') }}</button>
        <div class="modal-title">{{ t('modal_what') }}</div>
        <div class="modal-sub">{{ t('modal_what_sub') }}</div>
        <div class="type-grid">
          <div
            v-for="ct in contentTypes"
            :key="ct.id"
            class="type-option"
            :class="{ selected: selectedType === ct.id }"
            @click="selectedType = ct.id"
          >
            <span class="type-icon">{{ ct.icon }}</span>
            <div class="type-name">{{ ct.name }}</div>
            <div class="type-desc">{{ ct.desc }}</div>
          </div>
        </div>
        <button class="modal-btn" :disabled="!selectedType" @click="step = 'form'">
          {{ selectedType ? t('modal_continue') : t('modal_what') }}
        </button>
      </template>

      <!-- Step 3: Form -->
      <template v-else-if="step === 'form'">
        <div class="modal-steps">
          <div class="modal-step active"></div>
          <div class="modal-step active"></div>
          <div class="modal-step active"></div>
        </div>
        <button class="modal-back" @click="step = 'type'">← Back</button>
        <div class="modal-title">{{ currentTypeObj?.icon }} {{ currentTypeObj?.name }}</div>
        <div class="modal-sub">Submitting as <strong style="color:var(--gold)">{{ memberEmail }}</strong></div>
        <div v-if="error" class="modal-error">{{ error }}</div>

        <!-- History form -->
        <template v-if="selectedType === 'history'">
          <div class="modal-field"><label class="modal-label">Your Name</label><input class="modal-input" v-model="form.author" placeholder="Mikael H." /></div>
          <div class="modal-field"><label class="modal-label">Title</label><input class="modal-input" v-model="form.title" placeholder="My first match at the Parc…" /></div>
          <div class="modal-field"><label class="modal-label">Type</label>
            <select class="modal-select" v-model="form.type">
              <option value="text">Text</option>
              <option value="photo">Photo</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div class="modal-field" v-if="form.type === 'text'">
            <label class="modal-label">Your story</label>
            <textarea class="modal-textarea" v-model="form.text" placeholder="Tell us your memory…"></textarea>
          </div>
          <div class="modal-field" v-else-if="form.type === 'photo'">
            <label class="modal-label">Photo</label>
            <input type="file" accept="image/*" class="modal-file" @change="onFileChange" />
            <div v-if="form.mediaFile" class="modal-file-name">{{ form.mediaFile.name }}</div>
          </div>
          <div class="modal-field" v-if="form.type === 'photo'">
            <label class="modal-label">Caption <span style="opacity:0.4;font-weight:400;">(optional)</span></label>
            <input class="modal-input" v-model="form.text" placeholder="Describe the photo…" />
          </div>
          <div class="modal-field" v-else-if="form.type === 'video'">
            <label class="modal-label">Video</label>
            <div style="display:flex;gap:10px;margin-bottom:10px;">
              <button type="button" :style="{ ...videoTabStyle(form.videoSource === 'url') }" @click="form.videoSource = 'url'">YouTube URL</button>
              <button type="button" :style="{ ...videoTabStyle(form.videoSource === 'file') }" @click="form.videoSource = 'file'; form.mediaUrl = ''">Upload file</button>
            </div>
            <input v-if="form.videoSource === 'url'" class="modal-input" v-model="form.mediaUrl" placeholder="https://youtube.com/watch?v=…" />
            <div v-else>
              <input type="file" accept="video/*" class="modal-file" @change="onFileChange" />
              <div v-if="form.mediaFile" class="modal-file-name">{{ form.mediaFile.name }}</div>
              <div style="font-size:11px;color:rgba(200,200,192,0.35);margin-top:5px;font-family:'Barlow',sans-serif;">Max 50 MB — MP4, MOV, WebM</div>
            </div>
          </div>
          <div class="modal-field" v-if="form.type === 'video'">
            <label class="modal-label">Caption <span style="opacity:0.4;font-weight:400;">(optional)</span></label>
            <input class="modal-input" v-model="form.text" placeholder="Describe the video…" />
          </div>
        </template>

        <!-- Event form -->
        <template v-else-if="selectedType === 'event'">
          <div class="modal-field"><label class="modal-label">Event Name</label><input class="modal-input" v-model="form.title" placeholder="Watch Party — UCL Final" /></div>
          <div class="modal-field"><label class="modal-label">Proposed Date</label><input class="modal-input" type="date" v-model="form.date" /></div>
          <div class="modal-field"><label class="modal-label">Suggested Venue</label><input class="modal-input" v-model="form.venue" placeholder="Bar Loose, Helsinki" /></div>
          <div class="modal-field"><label class="modal-label">Details</label><textarea class="modal-textarea" v-model="form.text" placeholder="Why this event? Any details…"></textarea></div>
        </template>

        <button class="modal-btn" :disabled="loading" @click="submitForm">
          {{ loading ? '…' : t('modal_publish') }}
        </button>
      </template>

      <!-- Success -->
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
import { ref, computed, watch } from 'vue'
import { sb } from '../lib/supabase.js'
import { useI18n } from '../lib/i18n.js'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

const step = ref('email')
const emailInput = ref('')
const memberEmail = ref('')
const selectedType = ref('')
const loading = ref(false)
const error = ref('')
const hasInputError = ref(false)
const form = ref({ author: '', title: '', text: '', type: 'text', date: '', caption: '', venue: '', mediaFile: null, mediaUrl: '', videoSource: 'url' })

const contentTypes = computed(() => [
  { id: 'history', icon: '📖', name: t('type_history'), desc: t('type_history_desc') },
  { id: 'event',   icon: '📅', name: t('type_event'),   desc: t('type_event_desc') },
])

const currentTypeObj = computed(() => contentTypes.value.find(ct => ct.id === selectedType.value))

watch(selectedType, (val) => {
  form.value.type = 'text'
  form.value.mediaFile = null
  form.value.mediaUrl = ''
  form.value.videoSource = 'url'
})

function videoTabStyle(active) {
  return {
    background: active ? 'rgba(232,0,29,0.15)' : 'transparent',
    border: active ? '1px solid rgba(232,0,29,0.5)' : '1px solid rgba(200,200,192,0.15)',
    color: active ? '#f4f4f2' : 'rgba(200,200,192,0.4)',
    padding: '5px 14px', borderRadius: '3px', cursor: 'pointer',
    fontFamily: "'Barlow Condensed',sans-serif", fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase',
  }
}

function onFileChange(e) {
  form.value.mediaFile = e.target.files[0] || null
}

async function uploadMedia() {
  const { data: { session } } = await sb.auth.getSession()
  console.log('Session before upload:', session?.user?.role, session?.access_token?.slice(0, 20))
  const file = form.value.mediaFile
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error: upErr } = await sb.storage.from('uploads').upload(path, file, { contentType: file.type })
  if (upErr) { console.error('Storage error:', upErr); throw new Error('Upload failed: ' + upErr.message) }
  const { data: { publicUrl } } = sb.storage.from('uploads').getPublicUrl(path)
  return publicUrl
}

function showError(msg) {
  error.value = msg
  hasInputError.value = true
  setTimeout(() => { error.value = ''; hasInputError.value = false }, 3000)
}

function close() {
  emit('update:modelValue', false)
  setTimeout(() => {
    step.value = 'email'
    emailInput.value = ''
    memberEmail.value = ''
    selectedType.value = ''
    error.value = ''
    form.value = { author: '', title: '', text: '', type: 'text', date: '', caption: '', venue: '', mediaFile: null, mediaUrl: '', videoSource: 'url' }
  }, 300)
}

async function submitEmail() {
  const val = emailInput.value.trim().toLowerCase()
  if (!val || !val.includes('@')) { showError('Please enter a valid email.'); return }
  loading.value = true
  const { data } = await sb.from('members').select('email').eq('email', val).maybeSingle()
  if (!data) { loading.value = false; showError(t('modal_not_found')); return }
  const { data: { session } } = await sb.auth.getSession()
  if (!session) await sb.auth.signInAnonymously()
  loading.value = false
  memberEmail.value = val
  step.value = 'type'
}

async function submitForm() {
  loading.value = true
  error.value = ''
  try {
    if (selectedType.value === 'history') {
      if (!form.value.title) { showError('Please fill in the Title.'); loading.value = false; return }
      if (form.value.type === 'text' && !form.value.text) { showError('Please write your story.'); loading.value = false; return }
      if (form.value.type === 'photo' && !form.value.mediaFile) { showError('Please select a photo.'); loading.value = false; return }
      if (form.value.type === 'video' && form.value.videoSource === 'url' && !form.value.mediaUrl) { showError('Please enter a video URL.'); loading.value = false; return }
      if (form.value.type === 'video' && form.value.videoSource === 'file' && !form.value.mediaFile) { showError('Please select a video file.'); loading.value = false; return }
      let mediaUrl = form.value.mediaUrl || null
      if (form.value.type === 'photo' || (form.value.type === 'video' && form.value.videoSource === 'file')) mediaUrl = await uploadMedia()
      await sb.from('history').insert({
        author: form.value.author || memberEmail.value,
        title: form.value.title, text: form.value.text,
        type: form.value.type || 'text', date: new Date().toISOString().slice(0, 10),
        media_url: mediaUrl,
      })
    } else if (selectedType.value === 'event') {
      // Use a fresh anon client call — no session required
      const { error: sgErr } = await sb.from('event_suggestions').insert({
        name: form.value.title || null, date: form.value.date || null,
        venue: form.value.venue || null, text: form.value.text || null, email: memberEmail.value,
      })
      if (sgErr) { showError('Submission failed: ' + sgErr.message); loading.value = false; return }
    }
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
