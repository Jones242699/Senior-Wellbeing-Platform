<script setup>
import '../../my-routes/styles.css'
import RouteFormPanel from '../../my-routes/components/RouteFormPanel.vue'
import RoutePreferences from '../../my-routes/components/RoutePreferences.vue'
import RouteSummary from '../../my-routes/components/RouteSummary.vue'

defineProps({
  destination: { type: String, required: true },
  facilityCounts: { type: Object, required: true },
  loadingFacilities: { type: Boolean, required: true },
  noBenchesFound: { type: Boolean, required: true },
  noToiletsFound: { type: Boolean, required: true },
  preferencesDirty: { type: Boolean, required: true },
  routeError: { type: String, default: '' },
  routeSummary: { type: String, default: '' },
  routing: { type: Boolean, required: true },
  shadeLevel: { type: String, required: true },
  socialDensity: { type: String, required: true },
  startLocation: { type: String, required: true },
  travelMode: { type: String, default: null },
  travelModes: { type: Array, required: true },
})

defineEmits([
  'dest-input',
  'dest-input-ready',
  'generate-route',
  'set-shade-level',
  'set-social-density',
  'start-input',
  'start-input-ready',
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

    <RouteFormPanel
      :start-location="startLocation"
      :destination="destination"
      :travel-modes="travelModes"
      :travel-mode="travelMode"
      :routing="routing"
      @update:start-location="$emit('update:start-location', $event)"
      @update:destination="$emit('update:destination', $event)"
      @start-input-ready="$emit('start-input-ready', $event)"
      @dest-input-ready="$emit('dest-input-ready', $event)"
      @start-input="$emit('start-input')"
      @dest-input="$emit('dest-input')"
      @use-my-location="$emit('use-my-location')"
      @travel-mode-change="$emit('travel-mode-change', $event)"
    />

    <RouteSummary
      :route-summary="routeSummary"
      :loading-facilities="loadingFacilities"
      :facility-counts="facilityCounts"
      :route-error="routeError"
      :no-toilets-found="noToiletsFound"
      :no-benches-found="noBenchesFound"
    />

    <RoutePreferences
      :social-density="socialDensity"
      :shade-level="shadeLevel"
      :preferences-dirty="preferencesDirty"
      :routing="routing"
      @set-social-density="$emit('set-social-density', $event)"
      @set-shade-level="$emit('set-shade-level', $event)"
      @generate-route="$emit('generate-route')"
    />
  </aside>
</template>

<style scoped>
.explore-routes-panel {
  margin-top: 18px;
}

.explore-routes-panel :deep(.form-group) {
  margin-top: 14px;
}

.explore-routes-panel :deep(.input-row) {
  align-items: stretch;
  flex-direction: column;
}

.explore-routes-panel :deep(.btn-sm) {
  width: 100%;
  justify-content: center;
}

.explore-routes-panel :deep(.mode-row) {
  display: grid;
  grid-template-columns: 1fr;
}

.explore-routes-panel :deep(.prefs) {
  margin-top: 18px;
}

.explore-routes-panel :deep(.pref-card) {
  border-radius: 8px;
}
</style>
