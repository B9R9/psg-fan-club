<template>
  <section class="section section-dark" id="gallery">
    <div class="section-header">
      <h2 class="section-title">Gal<span>lery</span></h2>
      <div class="section-rule"></div>
    </div>
    <div v-if="!items.length" style="text-align:center;padding:48px 0;font-family:'Barlow Condensed',sans-serif;font-size:14px;color:rgba(200,200,192,0.3);letter-spacing:0.1em;text-transform:uppercase;">No photos yet</div>
    <div class="gallery-grid" v-else>
      <div class="gallery-item" v-for="item in items" :key="item.id">
        <img v-if="item.media_url" :src="item.media_url" style="width:100%;height:100%;object-fit:cover;display:block;" />
        <div v-else class="gallery-placeholder"><span>{{ item.caption }}</span></div>
        <div class="gallery-overlay"><span>{{ item.caption }}</span></div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({ items: { type: Array, default: () => [] } })
</script>
