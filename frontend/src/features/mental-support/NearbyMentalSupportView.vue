<script setup>
import './styles.css'
import { nextTick, onMounted, ref } from 'vue'
import SupportFilters from './components/SupportFilters.vue'
import SupportList from './components/SupportList.vue'
import SupportMap from './components/SupportMap.vue'
import { formatWalkDuration, useSupportFacilities } from './composables/useSupportFacilities'
import { useSupportFilters } from './composables/useSupportFilters'
import { useSupportLocation } from './composables/useSupportLocation'
import { useSupportMap } from './composables/useSupportMap'
import { useSupportRouting } from './composables/useSupportRouting'
import { TRAVEL_MODES } from './constants'

const mapContainerRef = ref(null)
const queryInputRef = ref(null)
const selectedRoomId = ref(null)

function setMapContainer(element) {
  mapContainerRef.value = element
}

function setQueryInput(element) {
  queryInputRef.value = element
}

const {
  mapReady,
  routeSummary,
  userPosition,
  clearFilterCenterMarker,
  clearSelectedRoute,
  drawRoute,
  getMapApi,
  initMap,
  panTo,
  renderRoomMarkers,
  resizeMap,
  resolveAddressFromPlaces,
  setFilterCenterMarker,
  setUserMarker,
  setupQueryAutocomplete,
} = useSupportMap({ mapContainerRef })

function updateDistanceDurationFromMap(origin) {
  return updateDistanceDurationForAll(origin, getMapApi())
}

const {
  addressFilterError,
  applyingAddressFilter,
  filterCenter,
  query,
  applyAddressFilter,
  clearAddressFilterState,
  getCurrentLocationLabel,
  onQueryInput,
  setQueryPlaceFromAutocomplete,
} = useSupportFilters({
  clearFilterCenterMarker,
  getMapApi,
  panTo,
  resolveAddressFromPlaces,
  selectedRoomId,
  setFilterCenterMarker,
  updateDistanceDurationForAll: updateDistanceDurationFromMap,
})

const {
  displayedRooms,
  loadingRooms,
  rooms,
  roomsFetchError,
  selectedRoom,
  fetchRoomsNearby,
  updateDistanceDurationForAll,
} = useSupportFacilities({
  filterCenter,
  selectedRoomId,
})

const {
  routing,
  travelMode,
  clearSelectedRoom,
  selectRoomAndRoute,
  selectTravelMode,
} = useSupportRouting({
  clearSelectedRoute,
  drawRoute,
  filterCenter,
  rooms,
  selectedRoomId,
  userPosition,
})

const { locateUser } = useSupportLocation({
  clearAddressFilterState,
  clearSelectedRoom,
  fetchRoomsNearby,
  getMapApi,
  panTo,
  renderRoomMarkers,
  rooms,
  selectRoomAndRoute,
  setUserMarker,
  updateDistanceDurationForAll,
})

onMounted(async () => {
  await initMap()
  await nextTick()
  setupQueryAutocomplete(queryInputRef.value, setQueryPlaceFromAutocomplete)
  resizeMap()
  await locateUser()
})
</script>

<template>
  <main class="page">
    <SupportFilters
      v-model:query="query"
      :address-filter-error="addressFilterError"
      :applying-address-filter="applyingAddressFilter"
      @apply-address-filter="applyAddressFilter"
      @query-input="onQueryInput"
      @query-input-ready="setQueryInput"
      @use-my-location="locateUser"
    />

    <section class="layout">
      <SupportMap
        :filter-center="filterCenter"
        :map-ready="mapReady"
        :selected-room-id="selectedRoomId"
        @map-ready="setMapContainer"
      />

      <SupportList
        :current-location-label="getCurrentLocationLabel(userPosition)"
        :displayed-rooms="displayedRooms"
        :format-walk-duration="formatWalkDuration"
        :loading-rooms="loadingRooms"
        :rooms-fetch-error="roomsFetchError"
        :route-summary="routeSummary"
        :routing="routing"
        :selected-room="selectedRoom"
        :selected-room-id="selectedRoomId"
        :travel-mode="travelMode"
        :travel-modes="TRAVEL_MODES"
        @clear-selected-room="clearSelectedRoom"
        @select-room="selectRoomAndRoute"
        @select-travel-mode="selectTravelMode"
      />
    </section>
  </main>
</template>

