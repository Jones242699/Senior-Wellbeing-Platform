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
  <Transition name="support-detail">
    <section
      v-if="visible"
      class="place-detail-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Place details"
    >
      <header class="place-detail-header">
        <button type="button" class="place-detail-close" @click="$emit('close')">Close</button>
        <span>{{ place?.categoryLabel }}</span>
        <h2>{{ place?.name }}</h2>
      </header>

      <div class="place-detail-body">
        <section class="place-detail-section">
          <h3>Details</h3>
          <dl class="place-detail-list">
            <div v-if="place?.description">
              <dt>Description</dt>
              <dd>{{ place.description }}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{{ place?.address || 'Not available' }}</dd>
            </div>
            <div v-if="place && typeof place.distanceMeters === 'number'">
              <dt>Distance</dt>
              <dd>{{ formatDistance(place.distanceMeters) }}</dd>
            </div>
          </dl>
        </section>

        <section
          v-if="isRich && place && (place.artistOrSubject || place.year || place.workTitle || place.material)"
          class="place-detail-section"
        >
          <h3>Collection</h3>
          <dl class="place-detail-list">
            <div v-if="place.artistOrSubject">
              <dt>Artist / Subject</dt>
              <dd>{{ place.artistOrSubject }}</dd>
            </div>
            <div v-if="place.year">
              <dt>Year</dt>
              <dd>{{ place.year }}</dd>
            </div>
            <div v-if="place.workTitle">
              <dt>Work title</dt>
              <dd>{{ place.workTitle }}</dd>
            </div>
            <div v-if="place.material">
              <dt>Material</dt>
              <dd>{{ place.material }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <footer class="place-detail-actions">
        <button type="button" class="place-detail-direction" @click="$emit('open-directions')">
          Directions
        </button>
        <p v-if="directionsError" class="place-detail-error">{{ directionsError }}</p>
      </footer>
    </section>
  </Transition>
</template>
