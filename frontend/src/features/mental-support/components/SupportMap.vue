<script setup>
defineProps({
  filterCenter: {
    type: Object,
    default: null,
  },
  mapReady: {
    type: Boolean,
    default: false,
  },
  selectedRoomId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['map-ready'])
</script>

<template>
  <div class="map-panel shared-map-surface">
    <div :ref="(el) => emit('map-ready', el)" class="map-canvas shared-map-canvas"></div>
    <div v-if="!mapReady" class="map-mask shared-map-loading-mask">Loading map...</div>
    <div class="legend shared-map-legend">
      <div class="legend-title shared-map-legend-title">Legend</div>
      <div class="legend-item shared-map-legend-item">
        <span class="dot shared-map-dot user-dot"></span>
        <span>Your Location</span>
      </div>
      <div class="legend-item shared-map-legend-item">
        <span class="dot shared-map-dot room-dot"></span>
        <span>Counseling Rooms</span>
      </div>
      <div v-if="filterCenter" class="legend-item shared-map-legend-item">
        <span class="dot shared-map-dot filter-dot"></span>
        <span>Input Address</span>
      </div>
      <div v-if="selectedRoomId" class="legend-group">
        <div class="legend-item shared-map-legend-item">
          <span class="pin shared-map-pin start-pin">S</span>
          <span>Start</span>
        </div>
        <div class="legend-item shared-map-legend-item">
          <span class="pin shared-map-pin dest-pin">D</span>
          <span>Destination</span>
        </div>
      </div>
    </div>
  </div>
</template>
