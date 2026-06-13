<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import RouteFormPanel from './components/RouteFormPanel.vue'
import RouteMap from './components/RouteMap.vue'
import RoutePreferences from './components/RoutePreferences.vue'
import RouteSummary from './components/RouteSummary.vue'
import { useRouteFacilities } from './composables/useRouteFacilities'
import { useRouteInputs } from './composables/useRouteInputs'
import { useRouteMap } from './composables/useRouteMap'
import { useRoutePlanner } from './composables/useRoutePlanner'
import { TRAVEL_MODES } from './constants'

const route = useRoute()

const mapContainerRef = ref(null)

function setMapContainer(element) {
  mapContainerRef.value = element
}

const {
  mapReady,
  canRoute,
  cleanupMap,
  clearDirectionsDisplay,
  clearEndpointMarkers,
  createLatLng,
  directionsRoute,
  ensureUserMarker,
  getGeocoder,
  getInfoWindow,
  getMap,
  getMapApi,
  getPlacesService,
  getTravelMode,
  initMap,
  markMapReady,
  panTo,
  setDirectionsResult,
  setEndpointMarker,
} = useRouteMap({ mapContainerRef })

const {
  destination,
  startLocation,
  userLatLng,
  clearGeoWatch,
  hasDestinationInput,
  onDestInput,
  onStartInput,
  parseQueryLatLng,
  requestCurrentPosition,
  resolveDestination,
  resolveOrigin,
  setDestInput,
  setDestinationFromQuery,
  setResolvedDestination,
  setStartInput,
  setupAutocomplete,
  useCurrentLocationStart,
  watchPositionIfSupported,
} = useRouteInputs({
  ensureUserMarker,
  getGeocoder,
  getMap,
  getMapApi,
  getPlacesService,
})

const {
  facilityCounts,
  loadingFacilities,
  noBenchesFound,
  noToiletsFound,
  clearBenchMarkers,
  clearToiletMarkers,
  fetchFacilitiesForRoute,
  resetFacilityState,
} = useRouteFacilities({
  getInfoWindow,
  getMap,
  getMapApi,
})

const {
  preferencesDirty,
  routeError,
  routeSummary,
  routing,
  shadeLevel,
  socialDensity,
  travelMode,
  generateRoute,
  onTravelModeChange,
  setShadeLevel,
  setSocialDensity,
} = useRoutePlanner({
  canRoute,
  clearDirectionsDisplay,
  clearEndpointMarkers,
  clearToiletMarkers,
  directionsRoute,
  fetchFacilitiesForRoute,
  getTravelMode,
  hasDestinationInput,
  resetFacilityState,
  resolveDestination,
  resolveOrigin,
  setDirectionsResult,
  setEndpointMarker,
})

function useMyLocation() {
  routeError.value = ''
  useCurrentLocationStart()

  const continueRouting = async () => {
    if (travelMode.value && hasDestinationInput()) {
      await generateRoute()
    }
  }

  if (userLatLng.value) {
    panTo(userLatLng.value, 16)
    watchPositionIfSupported()
    continueRouting()
    return
  }

  requestCurrentPosition()
    .then(async (pos) => {
      panTo(pos, 16)
      watchPositionIfSupported()
      continueRouting()
    })
    .catch((e) => {
      onStartInput()
      routeError.value =
        e?.message ||
        'Unable to get your location. Please allow location access in the browser or enter the start manually.'
    })
}

onMounted(async () => {
  const destinationPointFromQuery = parseQueryLatLng(
    route.query.destinationLat,
    route.query.destinationLng,
  )
  const destinationFromQuery = String(
    route.query.destinationAddress || route.query.destination || '',
  ).trim()
  if (destinationFromQuery) {
    setDestinationFromQuery(destinationFromQuery)
  }

  try {
    await initMap()
    await nextTick()
    setupAutocomplete()
    if (destinationPointFromQuery) {
      const presetLocation = createLatLng(destinationPointFromQuery.lat, destinationPointFromQuery.lng)
      setResolvedDestination(
        presetLocation,
        destinationFromQuery,
        destinationFromQuery || 'Selected destination',
      )
    }
    markMapReady()
  } catch (err) {
    console.error(err)
    routeError.value = err?.message || 'Failed to load map'
  }
})

onUnmounted(() => {
  clearGeoWatch()
  clearToiletMarkers()
  clearBenchMarkers()
  cleanupMap()
})
</script>

<template>
  <div class="my-routes-page">
    <aside class="sidebar">
      <header class="sidebar-header">
        <router-link to="/" class="back-link" title="Back to Home">
          <span class="back-icon">←</span>
        </router-link>
        <h1 class="page-title">Plan Your Route</h1>
      </header>

      <RouteFormPanel
        v-model:start-location="startLocation"
        v-model:destination="destination"
        :travel-modes="TRAVEL_MODES"
        :travel-mode="travelMode"
        :routing="routing"
        @start-input-ready="setStartInput"
        @dest-input-ready="setDestInput"
        @start-input="onStartInput"
        @dest-input="onDestInput"
        @use-my-location="useMyLocation"
        @travel-mode-change="onTravelModeChange"
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
        @set-social-density="setSocialDensity"
        @set-shade-level="setShadeLevel"
        @generate-route="generateRoute"
      />
    </aside>

    <RouteMap :map-ready="mapReady" @map-ready="setMapContainer" />
  </div>
</template>

<style>
.my-routes-page {
  display: flex;
  min-height: calc(100vh - 64px);
  background: #f8fafc;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
}

.sidebar {
  width: 420px;
  background: #f8fafc;
  padding: 32px;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  order: 2;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.back-link:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateX(-2px);
}

.back-icon {
  font-size: 20px;
  font-weight: 700;
}

.page-title {
  font-size: 26px;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}
.label-green {
  color: #16a34a;
}
.label-mode {
  color: #334155;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-icon-wrapper {
  position: relative;
  flex: 1;
}

.input-icon-wrapper input {
  box-sizing: border-box;
  width: 100%;
  padding: 12px 14px 12px 36px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  background: #fff;
  transition: all 0.2s;
}

.input-icon-wrapper input:focus {
  border-color: #16a34a;
  box-shadow: 0 0 0 3px #dcfce7;
}

.icon-magnify {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #94a3b8;
}

.btn-sm {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-green {
  background: #16a34a;
  color: white;
}
.btn-green:hover {
  background: #15803d;
}

.mode-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.mode-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.mode-chip {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.mode-chip.active {
  background: #16a34a;
  border-color: #16a34a;
  color: #fff;
}

.mode-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #e5e7eb;
  border-top-color: #16a34a;
  border-radius: 50%;
  animation: mode-spin 0.65s linear infinite;
  flex-shrink: 0;
}

@keyframes mode-spin {
  to {
    transform: rotate(360deg);
  }
}

.btn-generate {
  width: 100%;
  max-width: 220px;
  padding: 14px;
  background: #16a34a;
  color: white;
  font-weight: 700;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 16px;
  transition: background 0.2s;
}

.btn-generate-prefs {
  max-width: none;
  width: 100%;
  margin-top: 14px;
  margin-bottom: 0;
  white-space: nowrap;
  font-size: 13px;
  padding: 12px 16px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.btn-generate:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-generate:hover:not(:disabled) {
  background: #15803d;
}

.route-summary {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #166534;
  line-height: 1.4;
}

.facility-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid #d9e5d8;
  border-radius: 10px;
  background: #ffffff;
}

.facility-summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.facility-summary-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
}

.toilet-summary-icon {
  color: #1f2937;
  background: #eef2f7;
}

.bench-summary-icon {
  color: #ffffff;
  background: #d99a2b;
}

.route-error {
  margin: 0 0 8px;
  font-size: 13px;
  color: #b91c1c;
}

.prefs {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.prefs-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
}

.pref-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #c9dbc7;
  border-radius: 12px;
  padding: 14px 12px;
  margin-bottom: 12px;
  color: #1f3b2f;
}

.pref-left {
  min-width: 0;
}

.pref-name {
  font-weight: 800;
  font-size: 15px;
  line-height: 1.2;
}

.pref-desc {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.95;
  line-height: 1.3;
}

.pref-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.pref-icon,
.pref-mid {
  border: 1px solid #9bb79c;
  background: #dbe8d8;
  color: #1f3b2f;
  border-radius: 10px;
  cursor: pointer;
  min-width: 56px;
  height: 38px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  display: grid;
  place-items: center;
  text-transform: lowercase;
}

.pref-icon {
  min-width: 56px;
}

.pref-mid {
  min-width: 66px;
}

.pref-icon.active,
.pref-mid.active {
  background: #7fa287;
  color: #ffffff;
  border-color: #6e9377;
  box-shadow: 0 0 0 2px rgba(241, 248, 240, 0.95);
}

.map-container {
  flex: 1;
  position: relative;
  margin: 16px 0 16px 16px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #cbd5e1;
  background: #eef3eb;
  order: 1;
}

.map-view {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.map-loading-mask {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #475569;
  z-index: 5;
}

.legend-box {
  position: absolute;
  left: 24px;
  bottom: 24px;
  background: white;
  padding: 14px 18px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 13px;
  color: #475569;
  z-index: 1000;
  border: 1px solid #e2e8f0;
  pointer-events: auto;
}

.legend-box h4 {
  margin: 0 0 10px 0;
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.legend-facility {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
}

.toilet-icon {
  background: transparent;
  color: #1f2937;
  font-size: 16px;
}

.bench-icon {
  background: #d99a2b;
  border-radius: 50%;
}

.legend-pin {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: #fff;
}

.start-pin,
.end-pin {
  background: #dc2626;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-left: 5px;
  margin-right: 17px;
  flex-shrink: 0;
}

.user-dot {
  background: #22c55e;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #cbd5e1;
}

.legend-color {
  display: inline-block;
  width: 18px;
  height: 5px;
  border-radius: 2px;
  margin-left: 3px;
  margin-right: 15px;
  flex-shrink: 0;
}

.route-color {
  background: #16a34a;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.legend-item:last-child {
  margin-bottom: 0;
}

.legend-item span:last-child {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.route-alerts {
  margin-top: 12px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card.warning {
  background: #fffbeb;
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.alert-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  display: block;
  font-size: 16px;
  font-weight: 800;
  color: #92400e;
  margin-bottom: 4px;
}

.alert-desc {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #b45309;
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .my-routes-page {
    flex-direction: column;
    min-height: auto;
  }
  .sidebar {
    width: 100%;
    border-left: none;
    border-bottom: 1px solid #e2e8f0;
    padding: 24px;
  }
  .map-container {
    height: 65vh;
    margin: 16px;
  }
}
</style>
