<script setup>
import '../../discover-places/styles.css'
import AddressSuggestionInput from '../../../shared/map/components/AddressSuggestionInput.vue'
import DiscoverFilters from '../../discover-places/components/DiscoverFilters.vue'
import PlacesList from '../../discover-places/components/PlacesList.vue'

defineProps({
  addressQuery: { type: String, required: true },
  addressSuggestions: { type: Array, default: () => [] },
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
  loadingAddressSuggestions: { type: Boolean, default: false },
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
  'address-input',
  'select-address-suggestion',
  'apply-address-filter',
  'use-my-location',
  'open-ideas-modal',
  'expand-to-2km',
  'focus-place',
  'open-details',
  'directions',
  'go-to-page',
])

function onAddressInput() {
  emit('address-input')
}
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
        <div class="search-input-shell">
          <AddressSuggestionInput
            :model-value="addressQuery"
            :suggestions="addressSuggestions"
            :loading="loadingAddressSuggestions"
            placeholder="Enter an address within City of Melbourne"
            @update:model-value="emit('update:address-query', $event)"
            @input="onAddressInput"
            @select-suggestion="emit('select-address-suggestion', $event)"
            @submit="emit('apply-address-filter')"
          />
        </div>
        <button
          type="button"
          class="toolbar-btn location-btn location-inline-btn"
          @click="$emit('use-my-location')"
        >
          Use Current
        </button>
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

.explore-location-toolbar .search-input-shell {
  flex: 1 1 auto;
  min-width: 0;
  position: relative;
}

.explore-location-toolbar :deep(.address-suggestion-input) {
  width: auto;
}

.explore-location-toolbar .search-input-shell :deep(.address-suggestion-input) {
  width: 100%;
}

.explore-location-toolbar :deep(.search-input) {
  box-sizing: border-box;
  width: 100%;
  height: 46px;
  border: 1px solid #d1d5db;
  border-radius: 8px 0 0 8px;
  background: #ffffff;
  font-size: 14px;
  outline: none;
  padding: 11px 12px;
}

.explore-location-toolbar :deep(.search-input:focus) {
  border-color: #4f7c65;
  box-shadow: 0 0 0 3px rgba(79, 124, 101, 0.16);
}

.explore-location-toolbar .location-inline-btn {
  border: 1px solid #d1d5db;
  border-right: 0;
  border-radius: 0;
  background: #edf4ef;
  color: #4f7c65;
  font-size: 12px;
  height: 46px;
  min-width: 88px;
  padding: 0 10px;
}

.explore-location-toolbar .location-inline-btn:hover {
  background: #e2eee7;
  color: #3f6652;
}

.explore-location-toolbar .search-btn {
  border-radius: 0 8px 8px 0;
  background: #4f7c65;
  height: 46px;
  min-width: 86px;
}

.explore-location-toolbar .search-btn:hover:not(:disabled) {
  background: #3f6652;
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
  border-color: #dbe4df;
  background: #ffffff;
  color: #334155;
  box-shadow: none;
}

.explore-places-panel :deep(.map-chip:hover) {
  border-color: #9fb9aa;
  background: #f6faf7;
}

.explore-places-panel :deep(.map-chip.selected) {
  border-color: #9fb9aa;
  background: #edf4ef;
  color: #2f5a45;
}

.explore-places-panel :deep(.map-chip.selected:hover) {
  background: #e2eee7;
}

.explore-places-panel :deep(.chip-count) {
  background: #edf4ef;
  color: #3f6652;
}

.explore-places-panel :deep(.map-chip.selected .chip-count) {
  background: #d5e6db;
  color: #2f5a45;
}

.explore-places-panel :deep(.radius-chip) {
  border-color: #bde8c8;
  background: #f3fbf5;
  color: #237142;
}

.explore-places-panel :deep(.radius-chip:hover) {
  border-color: #7ed895;
  background: #e9f9ed;
}

.explore-places-panel :deep(.radius-chip.selected) {
  border-color: #22c55e;
  background: #22c55e;
  color: #ffffff;
}

.explore-places-panel :deep(.radius-chip.selected:hover) {
  background: #16a34a;
}

.explore-places-panel :deep(.crowd-density-toggle) {
  justify-content: space-between;
  min-height: 38px;
  padding-right: 8px;
  width: fit-content;
}

.explore-places-panel :deep(.crowd-density-toggle .switch-track) {
  align-items: center;
  background: #cbd5e1;
  border-radius: 999px;
  display: inline-flex;
  height: 22px;
  margin-left: 8px;
  padding: 2px;
  width: 40px;
}

.explore-places-panel :deep(.crowd-density-toggle .switch-thumb) {
  background: #ffffff;
  border-radius: 999px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.24);
  display: block;
  height: 18px;
  transform: translateX(0);
  transition: transform 0.18s ease;
  width: 18px;
}

.explore-places-panel :deep(.crowd-density-toggle.selected) {
  border-color: #9fb9aa;
  background: #edf4ef;
  color: #2f5a45;
}

.explore-places-panel :deep(.crowd-density-toggle.selected .switch-track) {
  background: #4f7c65;
}

.explore-places-panel :deep(.crowd-density-toggle.selected .switch-thumb) {
  transform: translateX(18px);
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
  min-width: 100px;
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
  .explore-location-toolbar .search-group {
    flex-wrap: wrap;
    gap: 8px;
  }

  .explore-location-toolbar .search-input-shell {
    flex-basis: 100%;
  }

  .explore-location-toolbar :deep(.search-input),
  .explore-location-toolbar .location-inline-btn,
  .explore-location-toolbar .search-btn {
    border: 1px solid #d1d5db;
    border-radius: 8px;
  }

  .explore-location-toolbar .location-inline-btn,
  .explore-location-toolbar .search-btn {
    flex: 1;
  }

  .explore-places-panel :deep(.cards-wrap) {
    max-height: none;
  }
}

@media (max-width: 640px) {
  .explore-places-panel {
    margin-top: 12px;
  }

  .explore-location-status {
    font-size: 12px;
    padding: 8px 10px;
  }

  .explore-places-panel :deep(.category-row),
  .explore-places-panel :deep(.radius-chip-group) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .explore-places-panel :deep(.map-chip) {
    min-height: 36px;
    padding: 7px 10px;
    font-size: 13px;
  }

  .explore-places-panel :deep(.crowd-density-toggle) {
    width: 100%;
  }

  .explore-places-panel :deep(.place-card) {
    gap: 10px;
  }

  .explore-places-panel :deep(.card-left) {
    width: 100%;
  }

  .explore-places-panel :deep(.card-actions) {
    align-items: stretch;
    flex-direction: row;
    width: 100%;
  }

  .explore-places-panel :deep(.more-info-btn),
  .explore-places-panel :deep(.direction-btn) {
    flex: 1;
    min-width: 0;
  }

  .explore-places-panel :deep(.place-icon) {
    height: 48px;
    width: 48px;
  }
}
</style>
