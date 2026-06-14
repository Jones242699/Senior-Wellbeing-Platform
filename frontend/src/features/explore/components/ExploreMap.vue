<script setup>
import CrowdDensityLegend from '../../discover-places/components/CrowdDensityLegend.vue'

defineProps({
  activeMode: {
    type: Object,
    required: true,
  },
  crowdDensityLegend: {
    type: Array,
    default: () => [],
  },
  mapReady: {
    type: Boolean,
    required: true,
  },
  showCrowdDensityLegend: {
    type: Boolean,
    default: false,
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

    <CrowdDensityLegend v-if="showCrowdDensityLegend" :items="crowdDensityLegend" />
  </section>
</template>
