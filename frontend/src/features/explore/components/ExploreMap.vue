<script setup>
defineProps({
  activeMode: {
    type: Object,
    required: true,
  },
  mapReady: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['map-ready'])
</script>

<template>
  <section class="explore-map shared-map-surface" :class="`explore-map--${activeMode.tone}`">
    <div :ref="(el) => $emit('map-ready', el)" class="explore-map-canvas shared-map-canvas"></div>

    <div class="explore-map-mode">
      <span>{{ activeMode.eyebrow }}</span>
      <strong>{{ activeMode.title }}</strong>
    </div>

    <div v-if="!mapReady" class="explore-map-mask shared-map-loading-mask">Loading map...</div>
  </section>
</template>
