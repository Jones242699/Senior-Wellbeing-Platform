<script setup>
defineProps({
  displayedRooms: {
    type: Array,
    default: () => [],
  },
  loadingRooms: {
    type: Boolean,
    default: false,
  },
  roomsFetchError: {
    type: String,
    default: '',
  },
  selectedRoomId: {
    type: [String, Number],
    default: null,
  },
})

defineEmits(['directions', 'more-info', 'select-room'])

function formatRoomDistance(room) {
  return room.distanceText ? `${room.distanceText} away` : 'Distance unavailable'
}
</script>

<template>
  <aside class="list-panel">
    <div v-if="loadingRooms" class="state-tip">Loading nearby rooms...</div>
    <div v-else-if="roomsFetchError" class="state-tip state-tip--error">
      {{ roomsFetchError }}
    </div>
    <div v-else-if="displayedRooms.length === 0" class="state-tip">No counseling rooms found.</div>

    <article
      v-for="room in displayedRooms"
      :key="room.id"
      :class="['room-card', { active: selectedRoomId === room.id }]"
      tabindex="0"
      @click="$emit('select-room', room)"
      @keydown.enter.prevent="$emit('select-room', room)"
      @keydown.space.prevent="$emit('select-room', room)"
    >
      <div class="support-card-left">
        <div class="support-icon">S</div>
        <div class="support-main">
          <span class="support-category-tag">Counseling room</span>
          <h3>{{ room.name }}</h3>
          <p class="support-distance-text">{{ formatRoomDistance(room) }}</p>
        </div>
      </div>
      <div class="support-card-actions">
        <button type="button" class="support-card-btn support-card-btn--secondary" @click.stop="$emit('more-info', room)">
          More info
        </button>
        <button type="button" class="support-card-btn support-card-btn--primary" @click.stop="$emit('directions', room)">
          Direction
        </button>
      </div>
    </article>

  </aside>
</template>
