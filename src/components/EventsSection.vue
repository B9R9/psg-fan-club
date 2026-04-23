<template>
  <section class="section section-alt" id="next-event">
    <div class="section-header">
      <h2 class="section-title">{{ t('section_next_event').split(' ')[0] }} <span>{{ t('section_next_event').split(' ').slice(1).join(' ') }}</span></h2>
      <div class="section-rule"></div>
    </div>
    <div class="next-event-grid">
      <!-- Featured event -->
      <div class="event-featured" v-if="featured">
        <div class="event-badge">{{ t('event_badge') }}</div>
        <div class="event-name">{{ featured.name }}</div>
        <div class="event-meta">
          <strong>{{ fmtEventDate(featured.date) }} · {{ featured.time }}</strong><br/>
          {{ featured.venue }}
        </div>
        <a class="map-link" :href="featured.mapUrl" target="_blank">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {{ t('map_link') }}
        </a>
      </div>
      <!-- Remaining events -->
      <div class="events-list">
        <div class="event-item" v-for="ev in rest" :key="ev.id">
          <div class="event-date-box">
            <div class="day">{{ fmtDay(ev.date) }}</div>
            <div class="mon">{{ fmtMon(ev.date) }}</div>
          </div>
          <div class="event-info">
            <div class="title">{{ ev.name }}</div>
            <div class="venue">{{ ev.venue }}</div>
          </div>
          <a class="event-map-sm" :href="ev.mapUrl" target="_blank">{{ t('map_sm') }}</a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '../lib/i18n.js'
import { fmtEventDate, fmtDay, fmtMon } from '../lib/utils.js'

const props = defineProps({ events: Array })
const { t: tComputed } = useI18n()
const t = (key) => tComputed.value(key)

const sorted = computed(() => [...(props.events || [])].sort((a, b) => a.date.localeCompare(b.date)))
const featured = computed(() => sorted.value.find(e => e.featured) || sorted.value[0])
const rest = computed(() => sorted.value.filter(e => e.id !== featured.value?.id))
</script>
