<script setup>
import '../../my-routes/styles.css'
import RouteFormPanel from '../../my-routes/components/RouteFormPanel.vue'
import RoutePreferences from '../../my-routes/components/RoutePreferences.vue'
import RouteSummary from '../../my-routes/components/RouteSummary.vue'

defineProps({
  destination: { type: String, required: true },
  destinationSuggestions: { type: Array, default: () => [] },
  facilityCounts: { type: Object, required: true },
  loadingDestinationSuggestions: { type: Boolean, default: false },
  loadingFacilities: { type: Boolean, required: true },
  loadingStartSuggestions: { type: Boolean, default: false },
  locationLabel: { type: String, required: true },
  routeError: { type: String, default: '' },
  routeSummary: { type: String, default: '' },
  routing: { type: Boolean, required: true },
  shadeLevel: { type: String, required: true },
  socialDensity: { type: String, required: true },
  startLocation: { type: String, required: true },
  startSuggestions: { type: Array, default: () => [] },
  travelMode: { type: String, default: null },
  travelModes: { type: Array, required: true },
})

defineEmits([
  'dest-input',
  'generate-route',
  'select-destination-suggestion',
  'select-start-suggestion',
  'set-shade-level',
  'set-social-density',
  'start-input',
  'travel-mode-change',
  'update:destination',
  'update:start-location',
  'use-my-location',
])
</script>

<template>
  <aside class="explore-routes-panel">
    <div class="explore-panel-heading">
      <p>Route planning</p>
      <h1>Plan a Route</h1>
    </div>
    <p class="explore-location-status">Using {{ locationLabel }}</p>

    <RouteFormPanel
      :start-location="startLocation"
      :destination="destination"
      :start-suggestions="startSuggestions"
      :destination-suggestions="destinationSuggestions"
      :loading-start-suggestions="loadingStartSuggestions"
      :loading-destination-suggestions="loadingDestinationSuggestions"
      :travel-modes="travelModes"
      :travel-mode="travelMode"
      :routing="routing"
      @update:start-location="$emit('update:start-location', $event)"
      @update:destination="$emit('update:destination', $event)"
      @start-input="$emit('start-input')"
      @dest-input="$emit('dest-input')"
      @select-start-suggestion="$emit('select-start-suggestion', $event)"
      @select-destination-suggestion="$emit('select-destination-suggestion', $event)"
      @use-my-location="$emit('use-my-location')"
      @travel-mode-change="$emit('travel-mode-change', $event)"
      @generate-route="$emit('generate-route')"
    />

    <RouteSummary
      :route-summary="routeSummary"
      :loading-facilities="loadingFacilities"
      :facility-counts="facilityCounts"
      :route-error="routeError"
    />

    <RoutePreferences
      :social-density="socialDensity"
      :shade-level="shadeLevel"
      @set-social-density="$emit('set-social-density', $event)"
      @set-shade-level="$emit('set-shade-level', $event)"
    />
  </aside>
</template>

<style scoped>
.explore-routes-panel {
  margin-top: 16px;
}

.explore-routes-panel :deep(.form-group) {
  margin-top: 13px;
}

.explore-routes-panel :deep(.form-label-row) {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
  margin-bottom: 8px;
}

.explore-routes-panel :deep(.form-label-row .form-label) {
  margin-bottom: 0;
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

.explore-routes-panel :deep(.input-row) {
  align-items: stretch;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.explore-routes-panel :deep(.address-suggestion-input) {
  width: 100%;
}

.explore-routes-panel :deep(.search-input) {
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #ffffff;
  font-size: 14px;
  outline: none;
  padding: 11px 12px;
}

.explore-routes-panel :deep(.search-input:focus) {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px #dcfce7;
}

.explore-routes-panel :deep(.btn-location-inline) {
  border: 1px solid #86c99b;
  border-radius: 999px;
  background: #f0fdf4;
  color: #15803d;
  font-size: 12px;
  font-weight: 800;
  min-height: 32px;
  padding: 7px 12px;
  white-space: nowrap;
}

.explore-routes-panel :deep(.btn-location-inline:hover) {
  background: #dcfce7;
  color: #166534;
}

.explore-routes-panel :deep(.mode-row) {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.explore-routes-panel :deep(.route-plan-button) {
  align-items: center;
  border-radius: 8px;
  display: flex;
  font-size: 14px;
  justify-content: center;
  margin: 10px 0 0;
  max-width: none;
  min-height: 42px;
  padding: 10px 12px;
  width: 100%;
}

.explore-routes-panel :deep(.prefs) {
  margin-top: 16px;
}

.explore-routes-panel :deep(.pref-card) {
  border-radius: 8px;
}

@media (max-width: 900px) {
  .explore-routes-panel :deep(.mode-row) {
    grid-template-columns: 1fr;
  }
}
</style>
