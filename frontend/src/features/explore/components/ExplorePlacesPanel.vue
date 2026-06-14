<script setup>
import '../../discover-places/styles.css'
import { onMounted, ref } from 'vue'
import DiscoverFilters from '../../discover-places/components/DiscoverFilters.vue'
import PlacesList from '../../discover-places/components/PlacesList.vue'

defineProps({
  addressQuery: { type: String, required: true },
  applyingAddressFilter: { type: Boolean, required: true },
  addressFilterError: { type: String, default: '' },
  categories: { type: Array, required: true },
  radiusOptions: { type: Array, required: true },
  selectedCategorySet: { type: Object, required: true },
  selectedRadius: { type: Number, required: true },
  categoryCounts: { type: Object, required: true },
  markerColors: { type: Object, required: true },
  isCrowdDensityEnabled: { type: Boolean, required: true },
  locationLabel: { type: String, required: true },
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
  'toggle-category',
  'select-radius',
  'toggle-crowd-density',
  'input-ready',
  'apply-address-filter',
  'use-my-location',
  'open-ideas-modal',
  'expand-to-2km',
  'focus-place',
  'open-details',
  'directions',
  'go-to-page',
])

const addressInputRef = ref(null)

onMounted(() => {
  emit('input-ready', addressInputRef.value)
})
</script>

<template>
  <aside class="explore-places-panel">
    <div class="explore-panel-heading">
      <p>Nearby places</p>
      <h1>Discover Places</h1>
    </div>
    <p class="explore-location-status">Using {{ locationLabel }}</p>

    <section class="explore-location-toolbar">
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

    <PlacesList
      :address-query="addressQuery"
      :applying-address-filter="applyingAddressFilter"
      :address-filter-error="addressFilterError"
      :show-select-category-hint="showSelectCategoryHint"
      :is-loading-places="isLoadingPlaces"
      :total-places="totalPlaces"
      :location-unavailable="locationUnavailable"
      :load-error="loadError"
      :show-no-match-hint="showNoMatchHint"
      :can-expand-to-exceed2-km="canExpandToExceed2Km"
      :paged-places="pagedPlaces"
      :active-map-place-id="activeMapPlaceId"
      :category-meta-by-key="categoryMetaByKey"
      :user-location="userLocation"
      :current-page="currentPage"
      :total-pages="totalPages"
      :places-per-page="placesPerPage"
      :format-distance="formatDistance"
      show-details-action
      :show-location-toolbar="false"
      @update:address-query="$emit('update:address-query', $event)"
      @apply-address-filter="$emit('apply-address-filter')"
      @use-my-location="$emit('use-my-location')"
      @open-ideas-modal="$emit('open-ideas-modal')"
      @expand-to-2km="$emit('expand-to-2km')"
      @focus-place="$emit('focus-place', $event)"
      @open-details="$emit('open-details', $event)"
      @directions="$emit('directions', $event)"
      @go-to-page="$emit('go-to-page', $event)"
    />
  </aside>
</template>

<style scoped>
.explore-places-panel {
  margin-top: 16px;
}

.explore-places-panel :deep(.map-filters-overlay) {
  position: static;
  margin-top: 12px;
  pointer-events: auto;
}

.explore-location-status {
  margin: 10px 0 0;
  border: 1px solid #dbe4df;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  padding: 9px 11px;
  font-size: 13px;
  font-weight: 700;
}

.explore-location-toolbar {
  margin-top: 12px;
}

.explore-location-toolbar .search-group {
  display: flex;
  align-items: stretch;
  gap: 0;
  width: 100%;
}

.explore-location-toolbar .address-input {
  flex: 1 1 auto;
  min-width: 0;
  width: auto;
  height: 44px;
}

.explore-location-toolbar .search-btn {
  height: 44px;
}

.explore-places-panel :deep(.category-row) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.explore-places-panel :deep(.category-chip) {
  justify-content: flex-start;
  width: 100%;
}

.explore-places-panel :deep(.radius-row) {
  align-items: stretch;
  flex-direction: column;
}

.explore-places-panel :deep(.radius-chip-group) {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.explore-places-panel :deep(.radius-chip),
.explore-places-panel :deep(.crowd-density-toggle) {
  justify-content: center;
}

.explore-places-panel :deep(.radius-chip) {
  padding-left: 10px;
  padding-right: 10px;
}

.explore-places-panel :deep(.map-chip) {
  box-shadow: none;
}

.explore-location-toolbar .location-actions-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  margin-top: 8px;
}

.explore-places-panel :deep(.cards-wrap) {
  max-height: calc(100dvh - 444px);
  overflow-y: auto;
}

.explore-places-panel :deep(.place-card) {
  align-items: flex-start;
  border-radius: 8px;
  padding: 12px;
}

.explore-places-panel :deep(.card-actions) {
  align-items: flex-end;
  flex-direction: column;
  gap: 8px;
}

.explore-places-panel :deep(.more-info-btn),
.explore-places-panel :deep(.direction-btn) {
  min-width: 104px;
}

.explore-places-panel :deep(.place-icon) {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  font-size: 26px;
}

.explore-places-panel :deep(.place-main h2) {
  font-size: 15px;
}

@media (max-width: 900px) {
  .explore-places-panel :deep(.cards-wrap) {
    max-height: none;
  }
}
</style>
