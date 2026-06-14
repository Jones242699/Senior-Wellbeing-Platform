<script setup>
import SupportFilters from '../../mental-support/components/SupportFilters.vue'
import SupportList from '../../mental-support/components/SupportList.vue'

defineProps({
  addressFilterError: { type: String, default: '' },
  applyingAddressFilter: { type: Boolean, required: true },
  currentLocationLabel: { type: String, default: '' },
  displayedRooms: { type: Array, required: true },
  formatWalkDuration: { type: Function, required: true },
  hasRoute: { type: Boolean, default: false },
  loadingSuggestions: { type: Boolean, default: false },
  loadingRooms: { type: Boolean, required: true },
  locationLabel: { type: String, required: true },
  query: { type: String, required: true },
  roomsFetchError: { type: String, default: '' },
  routeSummary: { type: String, default: '' },
  routing: { type: Boolean, required: true },
  selectedRoom: { type: Object, default: null },
  selectedRoomId: { type: [String, Number], default: null },
  suggestions: { type: Array, default: () => [] },
  travelMode: { type: String, required: true },
  travelModes: { type: Array, required: true },
})

defineEmits([
  'apply-address-filter',
  'clear-selected-room',
  'directions',
  'more-info',
  'query-input',
  'select-suggestion',
  'select-travel-mode',
  'update:query',
  'use-my-location',
])
</script>

<template>
  <aside class="explore-support-panel">
    <div class="explore-panel-heading">
      <p>Mental support</p>
      <h1>Mental Support</h1>
    </div>
    <p class="explore-location-status">Using {{ locationLabel }}</p>

    <SupportFilters
      :query="query"
      :address-filter-error="addressFilterError"
      :applying-address-filter="applyingAddressFilter"
      :loading-suggestions="loadingSuggestions"
      :suggestions="suggestions"
      @update:query="$emit('update:query', $event)"
      @apply-address-filter="$emit('apply-address-filter')"
      @query-input="$emit('query-input')"
      @select-suggestion="$emit('select-suggestion', $event)"
      @use-my-location="$emit('use-my-location')"
    />

    <SupportList
      :current-location-label="currentLocationLabel"
      :displayed-rooms="displayedRooms"
      :format-walk-duration="formatWalkDuration"
      :has-route="hasRoute"
      :loading-rooms="loadingRooms"
      :rooms-fetch-error="roomsFetchError"
      :route-summary="routeSummary"
      :routing="routing"
      :selected-room="selectedRoom"
      :selected-room-id="selectedRoomId"
      :travel-mode="travelMode"
      :travel-modes="travelModes"
      @clear-selected-room="$emit('clear-selected-room')"
      @more-info="$emit('more-info', $event)"
      @directions="$emit('directions', $event)"
      @select-travel-mode="$emit('select-travel-mode', $event)"
    />
  </aside>
</template>

<style scoped>
.explore-support-panel {
  margin-top: 16px;
}

.explore-support-panel :deep(.top-bar) {
  align-items: stretch;
  background: transparent;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 12px;
  padding: 0;
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

.explore-support-panel :deep(.back-link-top) {
  display: none;
}

.explore-support-panel :deep(.search-wrapper) {
  max-width: none;
  width: 100%;
}

.explore-support-panel :deep(.search-row) {
  align-items: stretch;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.explore-support-panel :deep(.search-action-btn),
.explore-support-panel :deep(.location-btn) {
  width: auto;
  white-space: nowrap;
}

.explore-support-panel :deep(.search-input) {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  padding: 11px 12px;
  font-size: 14px;
  outline: none;
}

.explore-support-panel :deep(.search-input:focus) {
  border-color: #059669;
  box-shadow: 0 0 0 3px #d1fae5;
}

.explore-support-panel :deep(.search-action-btn),
.explore-support-panel :deep(.location-btn),
.explore-support-panel :deep(.mode-chip) {
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  min-height: 42px;
  padding: 10px 12px;
}

.explore-support-panel :deep(.search-action-btn) {
  background: #0f766e;
  color: #ffffff;
}

.explore-support-panel :deep(.location-btn) {
  background: #16a34a;
  color: #ffffff;
}

.explore-support-panel :deep(.search-error) {
  color: #b91c1c;
  font-size: 12px;
  margin: 6px 0 0;
}

.explore-support-panel :deep(.list-panel) {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  margin-top: 16px;
  max-height: calc(100dvh - 410px);
  overflow-y: auto;
  padding: 12px;
}

.explore-support-panel :deep(.list-panel h2) {
  color: #1f2937;
  font-size: 17px;
  margin: 0;
}

.explore-support-panel :deep(.sub) {
  color: #64748b;
  font-size: 13px;
  margin: 4px 0 12px;
}

.explore-support-panel :deep(.state-tip) {
  border-radius: 8px;
  background: #eef2f7;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  padding: 10px;
}

.explore-support-panel :deep(.state-tip--error) {
  background: #fef2f2;
  color: #991b1b;
}

.explore-support-panel :deep(.room-card) {
  width: 100%;
  border: 1px solid #dbe4df;
  border-radius: 8px;
  background: #ffffff;
  color: #1f2937;
  margin-top: 10px;
  padding: 12px;
  text-align: left;
}

.explore-support-panel :deep(.room-card.active) {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.16);
}

.explore-support-panel :deep(.room-card h3) {
  font-size: 15px;
  margin: 0 0 6px;
}

.explore-support-panel :deep(.meta),
.explore-support-panel :deep(.origin-line) {
  color: #64748b;
  font-size: 12px;
  margin: 4px 0;
}

.explore-support-panel :deep(.support-card-actions) {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.explore-support-panel :deep(.support-card-btn) {
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 800;
  min-height: 34px;
  padding: 8px 11px;
}

.explore-support-panel :deep(.support-card-btn--secondary) {
  border: 1px solid #9ccaa9;
  background: #ffffff;
  color: #166534;
}

.explore-support-panel :deep(.support-card-btn--primary) {
  border: 1px solid #166534;
  background: #166534;
  color: #ffffff;
}

.explore-support-panel :deep(.route-builder) {
  border-top: 1px solid #e2e8f0;
  margin-top: 14px;
  padding-top: 14px;
}

.explore-support-panel :deep(.route-title) {
  font-size: 15px;
  margin: 0 0 10px;
}

.explore-support-panel :deep(.mode-row) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.explore-support-panel :deep(.mode-chip) {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #334155;
}

.explore-support-panel :deep(.mode-chip.active) {
  background: #0f766e;
  border-color: #0f766e;
  color: #ffffff;
}

.explore-support-panel :deep(.estimate-text) {
  color: #166534;
  font-size: 13px;
  font-weight: 800;
  margin: 10px 0 0;
}

@media (max-width: 900px) {
  .explore-support-panel :deep(.search-row),
  .explore-support-panel :deep(.mode-row) {
    grid-template-columns: 1fr;
  }

  .explore-support-panel :deep(.search-action-btn),
  .explore-support-panel :deep(.location-btn) {
    width: 100%;
  }

  .explore-support-panel :deep(.list-panel) {
    max-height: none;
  }
}
</style>
