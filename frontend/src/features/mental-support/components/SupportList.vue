<script setup>
defineProps({
  currentLocationLabel: {
    type: String,
    default: '',
  },
  displayedRooms: {
    type: Array,
    default: () => [],
  },
  hasRoute: {
    type: Boolean,
    default: false,
  },
  formatWalkDuration: {
    type: Function,
    required: true,
  },
  loadingRooms: {
    type: Boolean,
    default: false,
  },
  roomsFetchError: {
    type: String,
    default: '',
  },
  routeSummary: {
    type: String,
    default: '',
  },
  routing: {
    type: Boolean,
    default: false,
  },
  selectedRoom: {
    type: Object,
    default: null,
  },
  selectedRoomId: {
    type: [String, Number],
    default: null,
  },
  travelMode: {
    type: String,
    default: '',
  },
  travelModes: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['clear-selected-room', 'directions', 'more-info', 'select-travel-mode'])

function formatRoomDistance(room) {
  return room.distanceText ? `${room.distanceText} away` : 'Distance unavailable'
}
</script>

<template>
  <aside class="list-panel">
    <div class="support-list-header">
      <h2>Nearby Counseling Rooms</h2>
      <button
        v-if="selectedRoom"
        type="button"
        class="back-btn"
        @click="$emit('clear-selected-room')"
      >
        Back to full list
      </button>
    </div>

    <div v-if="loadingRooms" class="state-tip">Loading nearby rooms...</div>
    <div v-else-if="roomsFetchError" class="state-tip state-tip--error">
      {{ roomsFetchError }}
    </div>
    <div v-else-if="displayedRooms.length === 0" class="state-tip">No counseling rooms found.</div>

    <article
      v-for="room in displayedRooms"
      :key="room.id"
      :class="['room-card', { active: selectedRoomId === room.id }]"
    >
      <div class="support-card-left">
        <div class="support-icon">S</div>
        <div class="support-main">
          <span class="support-category-tag">Counseling room</span>
          <h3>{{ room.name }}</h3>
          <p class="support-distance-text">{{ formatRoomDistance(room) }}</p>
          <p v-if="room.durationText" class="support-origin-line">
            {{ formatWalkDuration(room.durationText) }} from {{ currentLocationLabel }}
          </p>
        </div>
      </div>
      <div class="support-card-actions">
        <button type="button" class="support-card-btn support-card-btn--secondary" @click="$emit('more-info', room)">
          More info
        </button>
        <button type="button" class="support-card-btn support-card-btn--primary" @click="$emit('directions', room)">
          Direction
        </button>
      </div>
    </article>

    <section v-if="selectedRoom && hasRoute" class="route-builder">
      <h3 class="route-title">Travel Mode</h3>
      <div class="mode-row">
        <button
          v-for="mode in travelModes"
          :key="mode.id"
          type="button"
          :class="['mode-chip', { active: travelMode === mode.id }]"
          :disabled="routing"
          @click="$emit('select-travel-mode', mode.id)"
        >
          {{ mode.label }}
        </button>
      </div>
      <p v-if="routeSummary" class="estimate-text">Estimate: {{ routeSummary }}</p>
    </section>
  </aside>
</template>
