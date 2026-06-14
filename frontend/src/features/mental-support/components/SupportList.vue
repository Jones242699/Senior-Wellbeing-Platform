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
</script>

<template>
  <aside class="list-panel">
    <h2>Nearby Counseling Rooms</h2>
    <button v-if="selectedRoom" type="button" class="back-btn" @click="$emit('clear-selected-room')">
      Back to full list
    </button>

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
      <h3>{{ room.name }}</h3>
      <p class="meta">{{ room.distanceText || '--' }} | {{ formatWalkDuration(room.durationText) }}</p>
      <p class="origin-line">From: {{ currentLocationLabel }}</p>
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
