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
  routeLegendVisible: {
    type: Boolean,
    default: false,
  },
  supportFilterCenter: {
    type: Object,
    default: null,
  },
  supportLegendVisible: {
    type: Boolean,
    default: false,
  },
  supportSelectedRoomId: {
    type: [String, Number],
    default: null,
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

    <div v-if="routeLegendVisible" class="explore-route-legend shared-map-legend">
      <h4 class="shared-map-legend-title">Legend</h4>
      <div class="shared-map-legend-item">
        <span class="explore-legend-facility explore-toilet-icon">🚻</span>
        <span>Public Toilet</span>
      </div>
      <div class="shared-map-legend-item">
        <span class="explore-legend-facility explore-bench-icon">B</span>
        <span>Rest Bench</span>
      </div>
      <div class="shared-map-legend-item">
        <span class="shared-map-dot explore-user-dot"></span>
        <span>My Location</span>
      </div>
      <div class="shared-map-legend-item">
        <span class="explore-route-color"></span>
        <span>Planned Route</span>
      </div>
      <div class="shared-map-legend-item">
        <span class="shared-map-pin explore-start-pin">S</span>
        <span>Start</span>
      </div>
      <div class="shared-map-legend-item">
        <span class="shared-map-pin explore-dest-pin">D</span>
        <span>Destination</span>
      </div>
    </div>

    <div v-if="supportLegendVisible" class="explore-support-legend shared-map-legend">
      <div class="shared-map-legend-title">Legend</div>
      <div class="shared-map-legend-item">
        <span class="shared-map-dot explore-user-dot"></span>
        <span>Search Origin</span>
      </div>
      <div class="shared-map-legend-item">
        <span class="shared-map-dot explore-room-dot"></span>
        <span>Counseling Rooms</span>
      </div>
      <div v-if="supportFilterCenter" class="shared-map-legend-item">
        <span class="shared-map-dot explore-filter-dot"></span>
        <span>Input Address</span>
      </div>
      <template v-if="supportSelectedRoomId">
        <div class="explore-legend-divider"></div>
        <div class="shared-map-legend-item">
          <span class="shared-map-pin explore-start-pin">S</span>
          <span>Start</span>
        </div>
        <div class="shared-map-legend-item">
          <span class="shared-map-pin explore-dest-pin">D</span>
          <span>Destination</span>
        </div>
      </template>
    </div>

    <CrowdDensityLegend v-if="showCrowdDensityLegend" :items="crowdDensityLegend" />

  </section>
</template>
