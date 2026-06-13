<script setup>
import RouteLegend from './RouteLegend.vue'

defineProps({
  mapReady: { type: Boolean, required: true },
})

defineEmits(['map-ready'])
</script>

<template>
  <main class="map-container">
    <div :ref="(el) => $emit('map-ready', el)" class="map-view"></div>

    <div v-if="!mapReady" class="map-loading-mask">Loading map…</div>

    <RouteLegend />
  </main>
</template>
