<script setup>
import { onMounted, ref } from 'vue'
import CrowdDensityLegend from './CrowdDensityLegend.vue'
import DiscoverFilters from './DiscoverFilters.vue'

defineProps({
  categories: { type: Array, required: true },
  radiusOptions: { type: Array, required: true },
  selectedCategorySet: { type: Object, required: true },
  selectedRadius: { type: Number, required: true },
  categoryCounts: { type: Object, required: true },
  markerColors: { type: Object, required: true },
  isCrowdDensityEnabled: { type: Boolean, required: true },
  shouldShowCrowdDensityOverlay: { type: Boolean, required: true },
  crowdDensityLegend: { type: Array, required: true },
  activeMapPlace: { type: Object, default: null },
  userLocation: { type: Object, default: null },
  isActiveMapPlaceRich: { type: Boolean, required: true },
  isActiveMapPlaceLoading: { type: Boolean, required: true },
  mapError: { type: String, default: '' },
  formatDistance: { type: Function, required: true },
})

const emit = defineEmits([
  'container-ready',
  'toggle-category',
  'select-radius',
  'toggle-crowd-density',
  'close-map-place-card',
  'directions',
])

const mapContainerRef = ref(null)

onMounted(() => {
  emit('container-ready', mapContainerRef.value)
})
</script>

<template>
  <aside class="map-panel">
    <DiscoverFilters
      :categories="categories"
      :radius-options="radiusOptions"
      :selected-category-set="selectedCategorySet"
      :selected-radius="selectedRadius"
      :category-counts="categoryCounts"
      :marker-colors="markerColors"
      :is-crowd-density-enabled="isCrowdDensityEnabled"
      @toggle-category="$emit('toggle-category', $event)"
      @select-radius="$emit('select-radius', $event)"
      @toggle-crowd-density="$emit('toggle-crowd-density')"
    />
    <div ref="mapContainerRef" class="map-canvas"></div>
    <CrowdDensityLegend v-if="shouldShowCrowdDensityOverlay" :items="crowdDensityLegend" />
    <article v-if="activeMapPlace" class="map-place-card">
      <button type="button" class="map-place-close" @click="$emit('close-map-place-card')">
        ×
      </button>
      <div class="map-place-head">
        <div
          class="map-place-image"
          :style="{
            backgroundImage: activeMapPlace.imageUrl ? `url(${activeMapPlace.imageUrl})` : '',
          }"
        >
          <span v-if="!activeMapPlace.imageUrl">{{ activeMapPlace.icon }}</span>
        </div>
        <div class="map-place-title">
          <div class="map-place-title-row">
            <h3>{{ activeMapPlace.name }}</h3>
            <button
              type="button"
              class="map-card-direction-btn"
              @click="$emit('directions', activeMapPlace)"
            >
              Direction
            </button>
          </div>
          <p>{{ activeMapPlace.categoryLabel }}</p>
        </div>
      </div>

      <p v-if="activeMapPlace.description" class="map-place-desc">
        <span class="map-place-label">Description:</span>
        <span class="map-place-desc-text">{{ activeMapPlace.description }}</span>
      </p>
      <p class="map-place-line"><strong>Address:</strong> {{ activeMapPlace.address }}</p>
      <p
        v-if="userLocation && typeof activeMapPlace.distanceMeters === 'number'"
        class="map-place-line"
      >
        <strong>Distance:</strong> {{ formatDistance(activeMapPlace.distanceMeters) }}
      </p>
      <template v-if="isActiveMapPlaceRich">
        <p v-if="activeMapPlace.artistOrSubject" class="map-place-line">
          <strong>Artist / Subject:</strong> {{ activeMapPlace.artistOrSubject }}
        </p>
        <p v-if="activeMapPlace.year" class="map-place-line">
          <strong>Year:</strong> {{ activeMapPlace.year }}
        </p>
        <p v-if="activeMapPlace.workTitle" class="map-place-line">
          <strong>Work title:</strong> {{ activeMapPlace.workTitle }}
        </p>
        <p v-if="activeMapPlace.material" class="map-place-line">
          <strong>Material:</strong> {{ activeMapPlace.material }}
        </p>
      </template>
      <p v-if="isActiveMapPlaceLoading" class="map-place-loading">Loading details...</p>
    </article>
    <div v-if="mapError" class="map-fallback">{{ mapError }}</div>
  </aside>
</template>
