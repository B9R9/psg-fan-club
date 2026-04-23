<template>
  <div style="margin-bottom:14px">
    <label :style="s.label">{{ label }}</label>
    <slot />
  </div>
</template>

<script setup>
import { s } from './adminStyles.js'
defineProps({ label: String })
</script>
