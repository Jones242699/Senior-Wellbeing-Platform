<script setup>
import '../../discover-places/styles.css'
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

defineEmits([
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
</script>

<template>
  <aside class="explore-places-panel">
    <div class="explore-panel-heading">
      <p>Nearby places</p>
      <h1>Discover Places</h1>
    </div>

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
      @update:address-query="$emit('update:address-query', $event)"
      @input-ready="$emit('input-ready', $event)"
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
  margin-top: 18px;
}

.explore-places-panel :deep(.map-filters-overlay) {
  position: static;
  margin-top: 14px;
  pointer-events: auto;
}

.explore-places-panel :deep(.map-chip) {
  box-shadow: none;
}

.explore-places-panel :deep(.location-toolbar) {
  margin-top: 14px;
}

.explore-places-panel :deep(.cards-wrap) {
  max-height: calc(100vh - 430px);
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
  min-width: 96px;
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
</style>
