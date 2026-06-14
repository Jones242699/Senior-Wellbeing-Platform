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
  <div class="map-panel">
    <div :ref="(el) => emit('map-ready', el)" class="map-canvas"></div>
    <div v-if="!mapReady" class="map-mask">Loading map...</div>
    <div class="legend">
      <div class="legend-title">Legend</div>
      <div class="legend-item">
        <span class="dot user-dot"></span>
        <span>Your Location</span>
      </div>
      <div class="legend-item">
        <span class="dot room-dot"></span>
        <span>Counseling Rooms</span>
      </div>
      <div v-if="filterCenter" class="legend-item">
        <span class="dot filter-dot"></span>
        <span>Input Address</span>
      </div>
      <div v-if="selectedRoomId" class="legend-group">
        <div class="legend-item">
          <span class="pin start-pin">S</span>
          <span>Start</span>
        </div>
        <div class="legend-item">
          <span class="pin dest-pin">D</span>
          <span>Destination</span>
        </div>
      </div>
    </div>
  </div>
</template>
