<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  addressQuery: { type: String, required: true },
  applyingAddressFilter: { type: Boolean, required: true },
  addressFilterError: { type: String, default: '' },
  showSelectCategoryHint: { type: Boolean, required: true },
  isLoadingPlaces: { type: Boolean, required: true },
  totalPlaces: { type: Number, required: true },
  locationUnavailable: { type: Boolean, required: true },
  loadError: { type: String, default: '' },
  showNoMatchHint: { type: Boolean, required: true },
  canExpandToExceed2Km: { type: Boolean, required: true },
  pagedPlaces: { type: Array, required: true },
  activeMapPlaceId: { type: String, default: '' },
  categoryMetaByKey: { type: Object, required: true },
  userLocation: { type: Object, default: null },
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  placesPerPage: { type: Number, required: true },
  formatDistance: { type: Function, required: true },
})

const emit = defineEmits([
  'update:address-query',
  'input-ready',
  'apply-address-filter',
  'use-my-location',
  'open-ideas-modal',
  'expand-to-2km',
  'focus-place',
  'directions',
  'go-to-page',
])

const addressInputRef = ref(null)

onMounted(() => {
  emit('input-ready', addressInputRef.value)
})
</script>

<template>
  <section class="results-panel">
    <section class="location-toolbar">
      <div class="search-group">
        <input
          ref="addressInputRef"
          :value="addressQuery"
          class="address-input"
          type="text"
          placeholder="E.g. Carlton"
          @input="$emit('update:address-query', $event.target.value)"
          @keydown.enter.prevent="$emit('apply-address-filter')"
        />
        <button
          type="button"
          class="toolbar-btn filter-btn search-btn"
          :disabled="applyingAddressFilter"
          @click="$emit('apply-address-filter')"
        >
          {{ applyingAddressFilter ? 'Filtering...' : 'Search' }}
        </button>
      </div>
      <div class="location-actions-row">
        <button
          type="button"
          class="toolbar-btn location-btn location-inline-btn"
          @click="$emit('use-my-location')"
        >
          Use My Location
        </button>
        <button type="button" class="ideas-cta-btn inline-ideas-btn" @click="$emit('open-ideas-modal')">
          No ideas?
        </button>
      </div>
    </section>
    <p v-if="addressFilterError" class="address-error">{{ addressFilterError }}</p>

    <p class="result-count" v-if="!showSelectCategoryHint && !isLoadingPlaces">
      Showing {{ totalPlaces }} places
    </p>

    <div v-if="locationUnavailable" class="calm-banner">
      Location is currently off. Turn on device location for nearby-distance sorting.
    </div>

    <div v-if="showSelectCategoryHint" class="empty-state">
      Please select at least one category to see places.
    </div>

    <div v-else-if="loadError" class="empty-state">
      {{ loadError }}
    </div>

    <div v-else-if="showNoMatchHint" class="empty-state">
      <p class="no-match-text">
        No places match these filters. Try a wider distance or more categories.
      </p>
      <button
        v-if="canExpandToExceed2Km"
        type="button"
        class="action-link"
        @click="$emit('expand-to-2km')"
      >
        Expand to exceed 2 km
      </button>
    </div>

    <div v-else-if="isLoadingPlaces" class="loading-state">Loading places...</div>

    <section v-else class="cards-wrap">
      <article
        v-for="place in pagedPlaces"
        :key="place.id"
        class="place-card"
        :class="{ selected: activeMapPlaceId === place.id }"
        @click="$emit('focus-place', place)"
      >
        <div class="card-left">
          <div
            class="place-icon"
            :style="{ backgroundImage: place.imageUrl ? `url(${place.imageUrl})` : '' }"
          >
            <span v-if="!place.imageUrl">{{ place.icon }}</span>
          </div>
          <div class="place-main">
            <span class="category-tag">{{ categoryMetaByKey[place.categoryKey].tagLabel }}</span>
            <h2>{{ place.name }}</h2>
            <p v-if="userLocation && typeof place.distanceMeters === 'number'" class="distance-text">
              {{ formatDistance(place.distanceMeters) }}
            </p>
          </div>
        </div>
        <div class="card-actions">
          <button type="button" class="direction-btn" @click.stop="$emit('directions', place)">
            Direction
          </button>
        </div>
      </article>
    </section>

    <nav v-if="!showSelectCategoryHint && totalPlaces > placesPerPage" class="pagination">
      <button
        type="button"
        class="page-btn"
        :disabled="currentPage === 1"
        @click="$emit('go-to-page', currentPage - 1)"
      >
        Prev
      </button>
      <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        type="button"
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="$emit('go-to-page', currentPage + 1)"
      >
        Next
      </button>
    </nav>
  </section>
</template>
