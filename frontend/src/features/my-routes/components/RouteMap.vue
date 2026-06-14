<script setup>
import RouteLegend from './RouteLegend.vue'

defineProps({
  mapReady: { type: Boolean, required: true },
})

defineEmits(['map-ready'])
</script>

<template>
  <main class="map-container shared-map-surface">
    <div :ref="(el) => $emit('map-ready', el)" class="map-view shared-map-canvas"></div>

    <div v-if="!mapReady" class="map-loading-mask shared-map-loading-mask">Loading map…</div>

    <RouteLegend />
  </main>
</template>
