<script setup>
import CrowdDensityLegend from '../../discover-places/components/CrowdDensityLegend.vue'

defineProps({
  activeMode: {
    type: Object,
    required: true,
  },
  activeMapPlace: {
    type: Object,
    default: null,
  },
  crowdDensityLegend: {
    type: Array,
    default: () => [],
  },
  formatDistance: {
    type: Function,
    required: true,
  },
  isActiveMapPlaceLoading: {
    type: Boolean,
    default: false,
  },
  isActiveMapPlaceRich: {
    type: Boolean,
    default: false,
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
  userLocation: {
    type: Object,
    default: null,
  },
})

defineEmits(['directions', 'map-ready', 'close-map-place-card'])
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

    <article v-if="activeMapPlace" class="explore-map-place-card">
      <button
        type="button"
        class="explore-map-place-close"
        @click="$emit('close-map-place-card')"
      >
        ×
      </button>
      <div class="explore-map-place-head">
        <div
          class="explore-map-place-image"
          :style="{
            backgroundImage: activeMapPlace.imageUrl ? `url(${activeMapPlace.imageUrl})` : '',
          }"
        >
          <span v-if="!activeMapPlace.imageUrl">{{ activeMapPlace.icon }}</span>
        </div>
        <div class="explore-map-place-title">
          <div class="explore-map-place-title-row">
            <h3>{{ activeMapPlace.name }}</h3>
            <button
              type="button"
              class="explore-map-card-direction-btn"
              @click="$emit('directions', activeMapPlace)"
            >
              Direction
            </button>
          </div>
          <p>{{ activeMapPlace.categoryLabel }}</p>
        </div>
      </div>

      <p v-if="activeMapPlace.description" class="explore-map-place-desc">
        <span class="explore-map-place-label">Description:</span>
        <span class="explore-map-place-desc-text">{{ activeMapPlace.description }}</span>
      </p>
      <p class="explore-map-place-line"><strong>Address:</strong> {{ activeMapPlace.address }}</p>
      <p
        v-if="userLocation && typeof activeMapPlace.distanceMeters === 'number'"
        class="explore-map-place-line"
      >
        <strong>Distance:</strong> {{ formatDistance(activeMapPlace.distanceMeters) }}
      </p>
      <template v-if="isActiveMapPlaceRich">
        <p v-if="activeMapPlace.artistOrSubject" class="explore-map-place-line">
          <strong>Artist / Subject:</strong> {{ activeMapPlace.artistOrSubject }}
        </p>
        <p v-if="activeMapPlace.year" class="explore-map-place-line">
          <strong>Year:</strong> {{ activeMapPlace.year }}
        </p>
        <p v-if="activeMapPlace.workTitle" class="explore-map-place-line">
          <strong>Work title:</strong> {{ activeMapPlace.workTitle }}
        </p>
        <p v-if="activeMapPlace.material" class="explore-map-place-line">
          <strong>Material:</strong> {{ activeMapPlace.material }}
        </p>
      </template>
      <p v-if="isActiveMapPlaceLoading" class="explore-map-place-loading">Loading details...</p>
    </article>
  </section>
</template>
