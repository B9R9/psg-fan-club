<template>
  <div class="admin-tab admin-survivor-tab">
    <div class="tab-section">
      <h2>Gestion des Survivors</h2>

      <!-- Create new survivor -->
      <div class="create-survivor card">
        <h3>Créer un nouveau Survivor</h3>
        <form @submit.prevent="createSurvivor">
          <input v-model="form.name" type="text" placeholder="Nom du survivor" required />
          <input v-model="form.description" type="text" placeholder="Description (optionnel)" />
          <select v-model="form.match_source" required>
            <option value="club">Matchs PSG</option>
            <option value="world_cup">Coupe du Monde</option>
          </select>
          <p class="field-note">Nombre de journées fixe: 38</p>
          <button type="submit" class="btn-primary">Créer</button>
        </form>
      </div>

      <!-- Active survivors -->
      <div class="active-survivors card">
        <h3>Survivors actifs</h3>
        <div class="survivors-list">
          <div v-for="survivor in activeSurvivors" :key="survivor.id" class="survivor-item">
            <div class="survivor-header">
              <div>
                <h4>{{ survivor.name }}</h4>
                <p class="desc">{{ survivor.description }}</p>
              </div>
              <div class="survivor-status" :class="survivor.status">{{ survivor.status }}</div>
            </div>
            <div class="survivor-meta">
              <span>Matchday: {{ survivor.current_matchday }} / {{ survivor.total_matchdays }}</span>
              <span>Type: {{ survivor.match_source === 'world_cup' ? 'Coupe du Monde' : 'PSG' }}</span>
              <span>{{ getParticipantCount(survivor.id) }} participants</span>
              <span>{{ getActiveCount(survivor.id) }} actifs</span>
            </div>
            <div class="survivor-actions">
              <button @click="editingSurvivor = survivor.id" class="btn-secondary">Éditer</button>
              <button @click="advanceMatchday(survivor.id)" class="btn-secondary">Matchday suivant</button>
              <button @click="completeSurvivor(survivor.id)" class="btn-danger">Terminer</button>
            </div>

            <!-- Edit form -->
            <div v-if="editingSurvivor === survivor.id" class="edit-form">
              <input v-model="editForm.name" type="text" />
              <input v-model="editForm.description" type="text" />
              <input v-model.number="editForm.current_matchday" type="number" min="1" />
              <div class="form-actions">
                <button @click="updateSurvivor(survivor.id)" class="btn-primary">Sauvegarder</button>
                <button @click="editingSurvivor = null" class="btn-secondary">Annuler</button>
              </div>
            </div>
          </div>
          <div v-if="activeSurvivors.length === 0" class="empty-state">
            Aucun survivor actif
          </div>
        </div>
      </div>

      <!-- Completed survivors -->
      <div class="completed-survivors card">
        <h3>Survivors terminés</h3>
        <div class="survivors-list">
          <div v-for="survivor in completedSurvivors" :key="survivor.id" class="survivor-item">
            <div class="survivor-header">
              <div>
                <h4>{{ survivor.name }}</h4>
                <p class="desc">{{ survivor.description }}</p>
              </div>
              <div class="survivor-status completed">Terminé</div>
            </div>
            <div class="survivor-meta">
              <span>{{ getParticipantCount(survivor.id) }} participants</span>
              <span>Terminé le {{ formatDate(survivor.ended_at) }}</span>
            </div>
            <div class="survivor-winner">
              <strong>Gagnant:</strong> {{ getWinner(survivor.id) || 'N/A' }}
            </div>
            <div class="survivor-actions">
              <button @click="deleteSurvivor(survivor.id)" class="btn-danger">Supprimer</button>
            </div>
          </div>
          <div v-if="completedSurvivors.length === 0" class="empty-state">
            Aucun survivor terminé
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { sb } from '../../../lib/supabase.js'

const survivors = ref([])
const participants = ref([])
const predictions = ref([])
const eliminations = ref([])

const DEFAULT_TOTAL_MATCHDAYS = 38
const form = ref({ name: '', description: '', match_source: 'club' })
const editForm = ref({ name: '', description: '', current_matchday: 1 })
const editingSurvivor = ref(null)

const activeSurvivors = computed(() =>
  survivors.value.filter(s => s.status === 'active')
)

const completedSurvivors = computed(() =>
  survivors.value.filter(s => s.status === 'completed')
)

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR')
}

function getParticipantCount(survivorId) {
  return participants.value.filter(p => p.survivor_id === survivorId).length
}

function getActiveCount(survivorId) {
  return participants.value.filter(p => p.survivor_id === survivorId && p.status === 'active').length
}

function getWinner(survivorId) {
  const surv = survivors.value.find(s => s.id === survivorId)
  if (!surv) return null

  const partics = participants.value.filter(p => p.survivor_id === survivorId && p.status === 'active')
  if (partics.length === 0) return null

  const preds = predictions.value.filter(p => p.survivor_id === survivorId)
  const scores = partics.map(p => ({
    name: p.participant_name,
    correct: preds.filter(pred => pred.participant_id === p.id && pred.is_correct).length
  }))

  return scores.sort((a, b) => b.correct - a.correct)[0]?.name || 'N/A'
}

async function createSurvivor() {
  try {
    const { error } = await sb.from('survivors').insert({
      name: form.value.name,
      description: form.value.description,
      match_source: form.value.match_source,
      status: 'active',
      total_matchdays: DEFAULT_TOTAL_MATCHDAYS,
      current_matchday: 1,
      started_at: new Date().toISOString()
    })

    if (error) throw error

    form.value = { name: '', description: '', match_source: 'club' }
    await loadSurvivors()
  } catch (err) {
    console.error('Error creating survivor:', err)
  }
}

async function updateSurvivor(survivorId) {
  try {
    const { error } = await sb
      .from('survivors')
      .update({
        name: editForm.value.name,
        description: editForm.value.description,
        current_matchday: editForm.value.current_matchday
      })
      .eq('id', survivorId)

    if (error) throw error

    editingSurvivor.value = null
    await loadSurvivors()
  } catch (err) {
    console.error('Error updating survivor:', err)
  }
}

async function advanceMatchday(survivorId) {
  try {
    const survivor = survivors.value.find(s => s.id === survivorId)
    if (!survivor) return

    const newMatchday = survivor.current_matchday + 1

    if (newMatchday > survivor.total_matchdays) {
      await completeSurvivor(survivorId)
      return
    }

    const { error } = await sb
      .from('survivors')
      .update({ current_matchday: newMatchday })
      .eq('id', survivorId)

    if (error) throw error

    await loadSurvivors()
  } catch (err) {
    console.error('Error advancing matchday:', err)
  }
}

async function completeSurvivor(survivorId) {
  try {
    const { error } = await sb
      .from('survivors')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString()
      })
      .eq('id', survivorId)

    if (error) throw error

    await loadSurvivors()
  } catch (err) {
    console.error('Error completing survivor:', err)
  }
}

async function deleteSurvivor(survivorId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce survivor?')) return

  try {
    const { error } = await sb.from('survivors').delete().eq('id', survivorId)

    if (error) throw error

    await loadSurvivors()
  } catch (err) {
    console.error('Error deleting survivor:', err)
  }
}

async function loadSurvivors() {
  const { data, error } = await sb.from('survivors').select('*')
  if (!error) survivors.value = data || []
}

async function loadParticipants() {
  const { data, error } = await sb.from('survivor_participants').select('*')
  if (!error) participants.value = data || []
}

async function loadPredictions() {
  const { data, error } = await sb.from('survivor_predictions').select('*')
  if (!error) predictions.value = data || []
}

async function loadEliminations() {
  const { data, error } = await sb.from('survivor_eliminations').select('*')
  if (!error) eliminations.value = data || []
}

onMounted(async () => {
  await loadSurvivors()
  await loadParticipants()
  await loadPredictions()
  await loadEliminations()
})
</script>

<style scoped>
.admin-survivor-tab {
  padding: 20px;
}

.tab-section {
  display: grid;
  gap: 24px;
}

.tab-section h2 {
  font-size: 22px;
  color: var(--white);
  margin: 0;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
}

.card h3 {
  font-size: 16px;
  color: var(--white);
  margin: 0 0 14px;
}

.create-survivor form {
  display: grid;
  gap: 10px;
}

.create-survivor input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--white);
  font-size: 13px;
}

.create-survivor input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.create-survivor select {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  padding: 10px 12px;
  color: var(--white);
  font-size: 13px;
  cursor: pointer;
}

.create-survivor select option {
  background: #1a1a1a;
  color: var(--white);
}

.field-note {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.survivors-list {
  display: grid;
  gap: 12px;
}

.survivor-item {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 14px;
}

.survivor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.survivor-header h4 {
  font-size: 14px;
  color: var(--white);
  margin: 0;
}

.survivor-header .desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 4px 0 0;
}

.survivor-status {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(232, 0, 29, 0.2);
  color: #e8001d;
}

.survivor-status.completed {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.survivor-meta {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
  margin-bottom: 10px;
}

.survivor-winner {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 10px;
}

.survivor-actions {
  display: flex;
  gap: 8px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 8px 12px;
  font-size: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s;
}

.btn-primary {
  background: #e8001d;
  color: white;
}

.btn-primary:hover {
  background: rgba(232, 0, 29, 0.8);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-danger {
  background: rgba(232, 0, 29, 0.2);
  color: #e8001d;
  border: 1px solid rgba(232, 0, 29, 0.3);
}

.btn-danger:hover {
  background: rgba(232, 0, 29, 0.3);
}

.edit-form {
  display: grid;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.edit-form input {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  padding: 8px 10px;
  color: var(--white);
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}
</style>
