<script setup>
defineProps({
  visible: { type: Boolean, required: true },
  panelState: { type: String, required: true },
  place: { type: Object, default: null },
  isRich: { type: Boolean, required: true },
  directionsError: { type: String, default: '' },
  formatDistance: { type: Function, required: true },
})

defineEmits(['close', 'open-directions'])
</script>

<template>
  <div
    v-if="visible"
    class="details-overlay"
    :class="{ visible: panelState === 'open' || panelState === 'opening' }"
    @click="$emit('close')"
  >
    <aside
      class="details-panel"
      :class="{ visible: panelState === 'open' || panelState === 'opening' }"
      role="dialog"
      aria-modal="true"
      aria-label="Place details panel"
      @click.stop
    >
      <header class="details-panel-header">
        <div class="details-header-title">
          <h2>{{ place?.name }}</h2>
          <p>{{ place?.categoryLabel }}</p>
        </div>
        <button type="button" class="details-close-btn" @click="$emit('close')">Close</button>
      </header>

      <div class="details-panel-body">
        <section class="details-grid">
          <div v-if="place?.description" class="details-item details-item-full">
            <span class="details-item-label">Description</span>
            <p class="details-item-value">{{ place.description }}</p>
          </div>
          <div class="details-item">
            <span class="details-item-label">Address</span>
            <p class="details-item-value">{{ place?.address }}</p>
          </div>
          <div v-if="place && typeof place.distanceMeters === 'number'" class="details-item">
            <span class="details-item-label">Distance</span>
            <p class="details-item-value">
              {{ formatDistance(place.distanceMeters) }}
            </p>
          </div>
          <template v-if="isRich && place">
            <div v-if="place.artistOrSubject" class="details-item">
              <span class="details-item-label">Artist / Subject</span>
              <p class="details-item-value">{{ place.artistOrSubject }}</p>
            </div>
            <div v-if="place.year" class="details-item">
              <span class="details-item-label">Year</span>
              <p class="details-item-value">{{ place.year }}</p>
            </div>
            <div v-if="place.workTitle" class="details-item">
              <span class="details-item-label">Work title</span>
              <p class="details-item-value">{{ place.workTitle }}</p>
            </div>
            <div v-if="place.material" class="details-item">
              <span class="details-item-label">Material</span>
              <p class="details-item-value">{{ place.material }}</p>
            </div>
          </template>
        </section>

        <div class="details-actions">
          <button type="button" class="details-directions-btn" @click="$emit('open-directions')">
            Directions
          </button>
        </div>
        <p v-if="directionsError" class="details-error">{{ directionsError }}</p>
      </div>
    </aside>
  </div>
</template>
