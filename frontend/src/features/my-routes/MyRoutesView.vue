<script setup>
import './styles.css'
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

