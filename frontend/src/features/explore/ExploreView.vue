<script setup>
import './styles.css'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ExploreMap from './components/ExploreMap.vue'
import ExploreModeTabs from './components/ExploreModeTabs.vue'
import ExplorePlacesPanel from './components/ExplorePlacesPanel.vue'
import ExploreRoutesPanel from './components/ExploreRoutesPanel.vue'
import ExploreSidePanel from './components/ExploreSidePanel.vue'
import ExploreSupportPanel from './components/ExploreSupportPanel.vue'
import { EXPLORE_DEFAULT_MODE, EXPLORE_MODES } from './constants'
import { useExploreMap } from './composables/useExploreMap'
import { useExploreSupportMap } from './composables/useExploreSupportMap'
import IdeasModal from '../discover-places/components/IdeasModal.vue'
import PlaceDetailPanel from '../discover-places/components/PlaceDetailPanel.vue'
import {
  CATEGORY_OPTIONS,
  IDEAS_CATEGORY_CHOICES,
  MAX_MAP_MARKERS,
  PLACES_PER_PAGE,
  RADIUS_OPTIONS,
  RESTAURANT_MAP_RANDOM_PICK_LIMIT,
  buildDiscoverApiUrl,
  formatDistance,
  mapMarkerColorByCategory,
  normalizeApiPayload,
  useDiscoverPlaces,
} from '../discover-places/composables/useDiscoverPlaces'
import { useDiscoverLocation } from '../discover-places/composables/useDiscoverLocation'
import { useDiscoverMap } from '../discover-places/composables/useDiscoverMap'
import {
  CROWD_DENSITY_COLORS,
  CROWD_DENSITY_DEFAULT_LIMIT,
  CROWD_DENSITY_LEGEND,
  CROWD_DENSITY_MAX_ROUTE_GROUPS_PER_RENDER,
  CROWD_DENSITY_MIN_RADIUS,
  buildAddressDerivedRoadGroups,
  buildFallbackRoadOverlays,
  buildGroupedRoadOverlays,
  buildLocalFallbackPathForGroup,
  normalizeCrowdDensityRecord,
  parseCrowdDensityPayload,
} from '../discover-places/composables/useCrowdDensity'
import { usePlaceDetails } from '../discover-places/composables/usePlaceDetails'
import { useRouteFacilities } from '../my-routes/composables/useRouteFacilities'
import { useRouteInputs } from '../my-routes/composables/useRouteInputs'
import { useRoutePlanner } from '../my-routes/composables/useRoutePlanner'
import { TRAVEL_MODES as ROUTE_TRAVEL_MODES } from '../my-routes/constants'
import {
  formatWalkDuration,
  useSupportFacilities,
} from '../mental-support/composables/useSupportFacilities'
import { useSupportFilters } from '../mental-support/composables/useSupportFilters'
import { useSupportLocation } from '../mental-support/composables/useSupportLocation'
import { useSupportRouting } from '../mental-support/composables/useSupportRouting'
import { TRAVEL_MODES as SUPPORT_TRAVEL_MODES } from '../mental-support/constants'

const activeModeId = ref(EXPLORE_DEFAULT_MODE)
const mapContainerRef = ref(null)
const mapError = ref('')
const isCrowdDensityEnabled = ref(true)
const selectedRoomId = ref(null)

const activeMode = computed(
  () => EXPLORE_MODES.find((mode) => mode.id === activeModeId.value) || EXPLORE_MODES[0],
)

function setMapContainer(element) {
  mapContainerRef.value = element
}

const {
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
  initExploreMap,
  mapReady,
  panTo,
  resetMapView,
  resizeMap,
  setDirectionsResult,
  setEndpointMarker,
} = useExploreMap({
  mapContainerRef,
})

const {
  allPlaces,
  isLoadingPlaces,
  loadError,
  locationUnavailable,
  selectedCategories,
  selectedRadius,
  currentPage,
  userLocation,
  categoryMetaByKey,
  selectedCategorySet,
  filteredPlaces,
  categoryCounts,
  totalPlaces,
  totalPages,
  pagedPlaces,
  showSelectCategoryHint,
  showNoMatchHint,
  canExpandToExceed2Km,
  readSessionState,
  toggleCategory,
  selectRadius,
  goToPage,
  expandTo2Km,
  loadPlaces,
} = useDiscoverPlaces({
  isCrowdDensityEnabled,
  onPlacesLoaded: () => clearPlaceDetails(),
})

const activeDetailPlace = ref(null)
const activeMapPlaceId = ref('')
const detailPanelState = ref('closed')
const pendingDetailPlace = ref(null)
const directionsError = ref('')
const isIdeasModalOpen = ref(false)
const ideasStep = ref(1)
const ideasTransportMode = ref('')
const ideasCategoryAnswers = ref([])

const isDetailPanelVisible = computed(() => detailPanelState.value !== 'closed')
const activeMapPlace = computed(() => {
  if (!activeMapPlaceId.value) return null
  return filteredPlaces.value.find((place) => place.id === activeMapPlaceId.value) || null
})
const isDetailCategoryRich = computed(
  () =>
    !!activeDetailPlace.value &&
    ['artworks_fountains', 'memorials_sculptures'].includes(activeDetailPlace.value.categoryKey),
)
const isActiveMapPlaceRich = computed(
  () =>
    !!activeMapPlace.value &&
    ['artworks_fountains', 'memorials_sculptures'].includes(activeMapPlace.value.categoryKey),
)
const isActiveMapPlaceLoading = computed(
  () => !!activeMapPlace.value && loadingDetailIds.value.has(activeMapPlace.value.id),
)
const shouldShowCrowdDensityOverlay = computed(
  () =>
    activeModeId.value === 'places' &&
    isCrowdDensityEnabled.value &&
    selectedCategories.value.length > 0,
)

const { loadingDetailIds, clearPlaceDetails, loadPlaceDetail } = usePlaceDetails({
  allPlaces,
  activeDetailPlace,
})

async function loadExploreMapApi() {
  return getMapApi()
}

const {
  addressQuery,
  applyingAddressFilter,
  addressFilterError,
  locationMode,
  applyAddressFilter,
  clearGeoWatch,
  setAddressInput,
  setupAddressAutocomplete,
  useMyLocation,
} = useDiscoverLocation({
  currentPage,
  loadDiscoverMapApi: loadExploreMapApi,
  locationUnavailable,
  userLocation,
})

const mapRenderablePlaces = computed(() => {
  const placesWithCoords = filteredPlaces.value.filter(
    (place) => Number.isFinite(place.lat) && Number.isFinite(place.lng),
  )
  const nonRestaurants = placesWithCoords.filter(
    (place) => place.categoryKey !== 'cafes_restaurants',
  )
  const sampledRestaurants = placesWithCoords.filter(
    (place) =>
      place.categoryKey === 'cafes_restaurants' &&
      (restaurantMapSampleIds.value.has(place.id) || place.id === activeMapPlaceId.value),
  )
  const visibleNonRestaurants = nonRestaurants.slice(0, MAX_MAP_MARKERS)
  const remainingSlots = MAX_MAP_MARKERS - visibleNonRestaurants.length
  if (remainingSlots <= 0) return visibleNonRestaurants
  return [...visibleNonRestaurants, ...sampledRestaurants.slice(0, remainingSlots)]
})

function buildCrowdDensityApiUrl() {
  const endpoint = buildDiscoverApiUrl('/crowd-density')
  const queryRadius = selectedRadius.value || CROWD_DENSITY_MIN_RADIUS
  endpoint.searchParams.set('radius', String(Math.max(queryRadius, CROWD_DENSITY_MIN_RADIUS)))
  endpoint.searchParams.set('limit', String(CROWD_DENSITY_DEFAULT_LIMIT))
  if (userLocation.value) {
    endpoint.searchParams.set('lat', String(userLocation.value.lat))
    endpoint.searchParams.set('lng', String(userLocation.value.lng))
  }
  return endpoint.toString()
}

let crowdDensityPolylines = []
let crowdDensityRequestSeq = 0
let crowdDensityRenderSeq = 0
const crowdDensityRecords = ref([])

function clearCrowdDensityOverlay() {
  crowdDensityPolylines.forEach((polyline) => polyline.setMap(null))
  crowdDensityPolylines = []
}

async function renderCrowdDensityOverlay() {
  const map = getMap()
  const mapApi = getMapApi()
  if (!map || !mapApi?.Polyline) return

  clearCrowdDensityOverlay()
  const renderId = ++crowdDensityRenderSeq

  const roadLabelByRecordId = new Map()
  const roadGroups = buildGroupedRoadOverlays(crowdDensityRecords.value, roadLabelByRecordId)
  const groupedRecordIds = new Set(
    roadGroups.flatMap((group) => group.records.map((record) => record.id)),
  )
  const renderedRoadLabelSet = new Set(roadGroups.map((group) => group.roadLabel))
  const unmatchedRecords = crowdDensityRecords.value.filter(
    (record) => !groupedRecordIds.has(record.id),
  )
  const fallbackGroups = buildFallbackRoadOverlays(unmatchedRecords)
  const addressDerivedGroups =
    crowdDensityRecords.value.length > 0
      ? []
      : buildAddressDerivedRoadGroups(
          mapRenderablePlaces.value,
          renderedRoadLabelSet,
          crowdDensityRecords.value,
        )
  const resolvedGroups = [...roadGroups, ...fallbackGroups, ...addressDerivedGroups].slice(
    0,
    CROWD_DENSITY_MAX_ROUTE_GROUPS_PER_RENDER,
  )
  if (!resolvedGroups.length) {
    const globalFallback = buildFallbackRoadOverlays(crowdDensityRecords.value)
    if (!globalFallback.length) return
    resolvedGroups.push(...globalFallback)
  }

  if (renderId !== crowdDensityRenderSeq) return

  resolvedGroups.forEach((group) => {
    const path = buildLocalFallbackPathForGroup(group)
    if (path.length < 2) return
    const levelColor = CROWD_DENSITY_COLORS[group.level] || CROWD_DENSITY_COLORS.moderate
    const polyline = new mapApi.Polyline({
      map,
      path,
      geodesic: true,
      clickable: false,
      strokeColor: levelColor,
      strokeOpacity: 0.68,
      strokeWeight: 12,
      zIndex: 5,
    })
    crowdDensityPolylines.push(polyline)
  })
}

async function refreshCrowdDensityOverlay() {
  const requestId = ++crowdDensityRequestSeq
  const mapApi = getMapApi()
  if (!getMap() || !mapApi?.Polyline) return
  if (!shouldShowCrowdDensityOverlay.value) {
    crowdDensityRecords.value = []
    clearCrowdDensityOverlay()
    return
  }

  try {
    const response = await fetch(buildCrowdDensityApiUrl())
    if (!response.ok) throw new Error(`Failed to load crowd density (${response.status})`)
    const payload = normalizeApiPayload(await response.json())
    if (requestId !== crowdDensityRequestSeq) return
    const normalizedRecords = parseCrowdDensityPayload(payload)
      .map((item, index) => normalizeCrowdDensityRecord(item, index))
      .filter(Boolean)
    crowdDensityRecords.value = normalizedRecords
    await renderCrowdDensityOverlay()
  } catch (error) {
    if (requestId !== crowdDensityRequestSeq) return
    crowdDensityRecords.value = []
    clearCrowdDensityOverlay()
    console.error('[Explore Places] Failed to load crowd density:', error)
  }
}

const {
  restaurantMapSampleIds,
  adoptDiscoverMap,
  clearMapMarkers,
  closeMapPlaceCard,
  ensureRestaurantVisibleOnMap,
  focusMapOnPlace,
  syncActiveMarkerVisual,
  updateDiscoverMapMarkers,
} = useDiscoverMap({
  activeMapPlaceId,
  filteredPlaces,
  loadPlaceDetail,
  mapContainerRef,
  mapRenderablePlaces,
  nextTick,
  refreshCrowdDensityOverlay,
  userLocation,
})

const {
  destination: routeDestination,
  startLocation,
  userLatLng,
  clearGeoWatch: clearRouteGeoWatch,
  hasDestinationInput,
  onDestInput,
  onStartInput,
  requestCurrentPosition,
  resolveDestination,
  resolveOrigin,
  setDestInput,
  setResolvedDestination,
  setStartInput,
  setupAutocomplete: setupRouteAutocomplete,
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

const {
  routeSummary: supportRouteSummary,
  userPosition: supportUserPosition,
  clearFilterCenterMarker,
  clearRoomMarkers,
  clearSelectedRoute: clearSelectedSupportRoute,
  drawRoute: drawSupportRoute,
  panTo: panSupportTo,
  renderRoomMarkers,
  resolveAddressFromPlaces: resolveSupportAddressFromPlaces,
  setFilterCenterMarker,
  setUserMarker: setSupportUserMarker,
  setupQueryAutocomplete,
} = useExploreSupportMap({
  clearDirectionsDisplay,
  clearEndpointMarkers,
  directionsRoute,
  ensureUserMarker,
  getMap,
  getMapApi,
  getPlacesService,
  getTravelMode,
  panTo,
  setDirectionsResult,
  setEndpointMarker,
})

function updateSupportDistanceDurationFromMap(origin) {
  return updateDistanceDurationForAll(origin, getMapApi())
}

const {
  addressFilterError: supportAddressFilterError,
  applyingAddressFilter: applyingSupportAddressFilter,
  filterCenter,
  query: supportQuery,
  applyAddressFilter: applySupportAddressFilter,
  clearAddressFilterState,
  getCurrentLocationLabel,
  onQueryInput: onSupportQueryInput,
  setAddressFilterError: setSupportAddressFilterError,
  setQueryPlaceFromAutocomplete,
} = useSupportFilters({
  clearFilterCenterMarker,
  getMapApi,
  panTo: panSupportTo,
  resolveAddressFromPlaces: resolveSupportAddressFromPlaces,
  selectedRoomId,
  setFilterCenterMarker,
  updateDistanceDurationForAll: updateSupportDistanceDurationFromMap,
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
  routing: supportRouting,
  travelMode: supportTravelMode,
  clearSelectedRoom,
  selectRoomAndRoute,
  selectTravelMode,
} = useSupportRouting({
  clearSelectedRoute: clearSelectedSupportRoute,
  drawRoute: drawSupportRoute,
  filterCenter,
  rooms,
  selectedRoomId,
  userPosition: supportUserPosition,
})

const { loadDefaultLocation: loadDefaultSupportLocation, locateUser: locateSupportUser } =
  useSupportLocation({
  clearAddressFilterState,
  clearSelectedRoom,
  fetchRoomsNearby,
  getMapApi,
  panTo: panSupportTo,
  renderRoomMarkers,
  rooms,
  selectRoomAndRoute,
  setLocationError: setSupportAddressFilterError,
  setUserMarker: setSupportUserMarker,
  updateDistanceDurationForAll,
})

const placesLocationLabel = computed(() => {
  if (locationMode.value === 'device') return 'Current location'
  if (locationMode.value === 'address') return addressQuery.value || 'Input address'
  return 'Melbourne CBD'
})

const routeLocationLabel = computed(() => {
  const label = startLocation.value.trim()
  if (!label) return 'Melbourne CBD'
  return label
})

const supportLocationLabel = computed(() => getCurrentLocationLabel(supportUserPosition.value))

function shufflePlaces(places) {
  const arr = [...places]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function refreshRestaurantMapSample() {
  const restaurantPlaces = filteredPlaces.value.filter(
    (place) =>
      place.categoryKey === 'cafes_restaurants' &&
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lng),
  )
  const sampled = shufflePlaces(restaurantPlaces).slice(0, RESTAURANT_MAP_RANDOM_PICK_LIMIT)
  const sampleIds = new Set(sampled.map((place) => place.id))
  if (
    activeMapPlaceId.value &&
    restaurantPlaces.some((place) => place.id === activeMapPlaceId.value)
  ) {
    sampleIds.add(activeMapPlaceId.value)
  }
  restaurantMapSampleIds.value = sampleIds
}

function toggleCrowdDensityOverlay() {
  isCrowdDensityEnabled.value = !isCrowdDensityEnabled.value
}

function openIdeasModal() {
  isIdeasModalOpen.value = true
  ideasStep.value = 1
  ideasTransportMode.value = ''
  ideasCategoryAnswers.value = []
}

function closeIdeasModal() {
  isIdeasModalOpen.value = false
}

function goToIdeasStep(step) {
  ideasStep.value = step
}

function toggleIdeasCategory(choiceKey) {
  if (ideasCategoryAnswers.value.includes(choiceKey)) {
    ideasCategoryAnswers.value = ideasCategoryAnswers.value.filter((item) => item !== choiceKey)
    return
  }
  ideasCategoryAnswers.value = [...ideasCategoryAnswers.value, choiceKey]
}

async function applyIdeasAnswers() {
  if (!ideasCategoryAnswers.value.length || !ideasTransportMode.value) return

  if (addressQuery.value.trim()) {
    await applyAddressFilter()
    if (addressFilterError.value) return
  }

  const resolvedCategories = IDEAS_CATEGORY_CHOICES.filter((item) =>
    ideasCategoryAnswers.value.includes(item.key),
  ).map((item) => item.categoryKey)
  const uniqueCategoryKeys = [...new Set(resolvedCategories)]
  if (!uniqueCategoryKeys.length) return

  selectedCategories.value = uniqueCategoryKeys
  selectRadius(ideasTransportMode.value === 'walking' ? 500 : 3000)
  currentPage.value = 1
  closeIdeasModal()
}

function goToDirectionsForPlace(place) {
  routeDestination.value = place.address || place.name
  if (Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
    setResolvedDestination(
      createLatLng(place.lat, place.lng),
      place.address || place.name,
      place.name || 'Selected destination',
    )
  }
  activeModeId.value = 'routes'
}

let detailTransitionTimeoutId = null

function clearDetailTransitionTimeout() {
  if (detailTransitionTimeoutId !== null) {
    window.clearTimeout(detailTransitionTimeoutId)
    detailTransitionTimeoutId = null
  }
}

function openDetailPanel(place) {
  clearDetailTransitionTimeout()
  directionsError.value = ''
  activeDetailPlace.value = place
  detailPanelState.value = 'opening'
  requestAnimationFrame(() => {
    detailPanelState.value = 'open'
  })
}

function closeDetailPanel() {
  if (detailPanelState.value === 'closed' || detailPanelState.value === 'closing') return

  clearDetailTransitionTimeout()
  detailPanelState.value = 'closing'
  detailTransitionTimeoutId = window.setTimeout(() => {
    detailPanelState.value = 'closed'
    activeDetailPlace.value = null
    directionsError.value = ''
    if (pendingDetailPlace.value) {
      const next = pendingDetailPlace.value
      pendingDetailPlace.value = null
      openDetailPanel(next)
    }
  }, 320)
}

async function openPlaceDetails(place) {
  if (!place) return
  await loadPlaceDetail(place)
  openDetailPanel(place)
}

function openDirections() {
  if (!activeDetailPlace.value) return
  directionsError.value = ''
  goToDirectionsForPlace(activeDetailPlace.value)
  closeDetailPanel()
}

function onGlobalKeydown(event) {
  if (event.key !== 'Escape') return
  if (isIdeasModalOpen.value) {
    closeIdeasModal()
    return
  }
  closeDetailPanel()
}

function clearRouteLayer() {
  clearDirectionsDisplay()
  clearEndpointMarkers()
  clearToiletMarkers()
  clearBenchMarkers()
  routeSummary.value = ''
  routeError.value = ''
}

function clearSupportLayer() {
  clearSelectedRoom()
  clearRoomMarkers()
  clearFilterCenterMarker()
  supportRouteSummary.value = ''
}

function setupSupportAutocomplete(element) {
  setupQueryAutocomplete(element, setQueryPlaceFromAutocomplete)
}

function useRouteMyLocation() {
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
      await continueRouting()
    })
    .catch((error) => {
      onStartInput()
      routeError.value =
        error?.message ||
        'Unable to get your location. Please allow location access in the browser or enter the start manually.'
    })
}

onMounted(async () => {
  try {
    readSessionState()
    await loadPlaces()
    await nextTick()
    await initExploreMap()
    adoptDiscoverMap({ api: getMapApi(), map: getMap() })
    refreshRestaurantMapSample()
    updateDiscoverMapMarkers()
    await refreshCrowdDensityOverlay()
    setupAddressAutocomplete()
    setupRouteAutocomplete()
    window.addEventListener('keydown', onGlobalKeydown)
  } catch (error) {
    console.error(error)
    mapError.value = error?.message || 'Failed to load map'
  }
})

onUnmounted(() => {
  clearMapMarkers()
  clearCrowdDensityOverlay()
  clearGeoWatch()
  clearRouteGeoWatch()
  clearDetailTransitionTimeout()
  clearToiletMarkers()
  clearBenchMarkers()
  clearRoomMarkers()
  clearFilterCenterMarker()
  window.removeEventListener('keydown', onGlobalKeydown)
  cleanupMap()
})

watch(activeModeId, async () => {
  await nextTick()
  resizeMap()
  if (activeModeId.value === 'places') {
    clearRouteLayer()
    clearSupportLayer()
    updateDiscoverMapMarkers()
    await refreshCrowdDensityOverlay()
  } else if (activeModeId.value === 'routes') {
    clearMapMarkers()
    clearCrowdDensityOverlay()
    closeMapPlaceCard()
    closeIdeasModal()
    closeDetailPanel()
    clearSupportLayer()
    setupRouteAutocomplete()
  } else if (activeModeId.value === 'support') {
    clearMapMarkers()
    clearCrowdDensityOverlay()
    closeMapPlaceCard()
    closeIdeasModal()
    closeDetailPanel()
    clearRouteLayer()
    if (!rooms.value.length && !loadingRooms.value) {
      void loadDefaultSupportLocation()
    } else {
      renderRoomMarkers(rooms.value, selectRoomAndRoute)
    }
  } else {
    clearMapMarkers()
    clearCrowdDensityOverlay()
    closeMapPlaceCard()
    closeIdeasModal()
    closeDetailPanel()
    clearRouteLayer()
    clearSupportLayer()
    resetMapView()
  }
})

watch(
  filteredPlaces,
  () => {
    refreshRestaurantMapSample()
    if (currentPage.value > totalPages.value) currentPage.value = 1
    if (
      activeMapPlaceId.value &&
      !filteredPlaces.value.some((place) => place.id === activeMapPlaceId.value)
    ) {
      activeMapPlaceId.value = ''
    }
    if (activeModeId.value === 'places') updateDiscoverMapMarkers()
  },
  { immediate: true },
)

watch(
  [userLocation, selectedRadius],
  () => {
    if (isLoadingPlaces.value) return
    loadPlaces()
  },
  { deep: true },
)

watch(
  () => selectedCategories.value.includes('cafes_restaurants'),
  (hasCafeCategory, previousHasCafeCategory) => {
    if (!hasCafeCategory || hasCafeCategory === previousHasCafeCategory) return
    if (isLoadingPlaces.value) return
    loadPlaces()
  },
)

watch(activeMapPlaceId, (placeId) => {
  const place = filteredPlaces.value.find((item) => item.id === placeId)
  if (place?.categoryKey === 'cafes_restaurants') ensureRestaurantVisibleOnMap(place)
  syncActiveMarkerVisual()
})

watch(
  shouldShowCrowdDensityOverlay,
  async (show, previousShow) => {
    if (show === previousShow) return
    await nextTick()
    await refreshCrowdDensityOverlay()
  },
)
</script>

<template>
  <main class="explore-page">
    <ExploreMap
      :active-mode="activeMode"
      :active-map-place="activeMapPlace"
      :crowd-density-legend="CROWD_DENSITY_LEGEND"
      :format-distance="formatDistance"
      :is-active-map-place-loading="isActiveMapPlaceLoading"
      :is-active-map-place-rich="isActiveMapPlaceRich"
      :map-ready="mapReady"
      :route-legend-visible="activeModeId === 'routes'"
      :show-crowd-density-legend="shouldShowCrowdDensityOverlay"
      :support-filter-center="filterCenter"
      :support-legend-visible="activeModeId === 'support'"
      :support-selected-room-id="selectedRoomId"
      :user-location="userLocation"
      @close-map-place-card="closeMapPlaceCard"
      @directions="goToDirectionsForPlace"
      @map-ready="setMapContainer"
    />

    <section class="explore-workspace-panel">
      <header class="explore-panel-topbar">
        <router-link class="explore-home-link" to="/">Back Home</router-link>
      </header>

      <ExploreModeTabs v-model="activeModeId" :modes="EXPLORE_MODES" />
      <ExplorePlacesPanel
        v-if="activeModeId === 'places'"
        v-model:address-query="addressQuery"
        :applying-address-filter="applyingAddressFilter"
        :address-filter-error="addressFilterError"
        :categories="CATEGORY_OPTIONS"
        :radius-options="RADIUS_OPTIONS"
        :selected-category-set="selectedCategorySet"
        :selected-radius="selectedRadius"
        :category-counts="categoryCounts"
        :marker-colors="mapMarkerColorByCategory"
        :is-crowd-density-enabled="isCrowdDensityEnabled"
        :location-label="placesLocationLabel"
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
        :places-per-page="PLACES_PER_PAGE"
        :format-distance="formatDistance"
        @toggle-category="toggleCategory"
        @select-radius="selectRadius"
        @toggle-crowd-density="toggleCrowdDensityOverlay"
        @input-ready="setAddressInput"
        @apply-address-filter="applyAddressFilter"
        @use-my-location="useMyLocation"
        @open-ideas-modal="openIdeasModal"
        @expand-to-2km="expandTo2Km"
        @focus-place="focusMapOnPlace"
        @directions="goToDirectionsForPlace"
        @open-details="openPlaceDetails"
        @go-to-page="goToPage"
      />
      <ExploreRoutesPanel
        v-else-if="activeModeId === 'routes'"
        v-model:start-location="startLocation"
        v-model:destination="routeDestination"
        :travel-modes="ROUTE_TRAVEL_MODES"
        :travel-mode="travelMode"
        :routing="routing"
        :route-summary="routeSummary"
        :loading-facilities="loadingFacilities"
        :location-label="routeLocationLabel"
        :facility-counts="facilityCounts"
        :route-error="routeError"
        :no-toilets-found="noToiletsFound"
        :no-benches-found="noBenchesFound"
        :social-density="socialDensity"
        :shade-level="shadeLevel"
        :preferences-dirty="preferencesDirty"
        @start-input-ready="setStartInput"
        @dest-input-ready="setDestInput"
        @start-input="onStartInput"
        @dest-input="onDestInput"
        @use-my-location="useRouteMyLocation"
        @travel-mode-change="onTravelModeChange"
        @set-social-density="setSocialDensity"
        @set-shade-level="setShadeLevel"
        @generate-route="generateRoute"
      />
      <ExploreSupportPanel
        v-else-if="activeModeId === 'support'"
        v-model:query="supportQuery"
        :address-filter-error="supportAddressFilterError"
        :applying-address-filter="applyingSupportAddressFilter"
        :current-location-label="getCurrentLocationLabel(supportUserPosition)"
        :displayed-rooms="displayedRooms"
        :format-walk-duration="formatWalkDuration"
        :loading-rooms="loadingRooms"
        :location-label="supportLocationLabel"
        :rooms-fetch-error="roomsFetchError"
        :route-summary="supportRouteSummary"
        :routing="supportRouting"
        :selected-room="selectedRoom"
        :selected-room-id="selectedRoomId"
        :travel-mode="supportTravelMode"
        :travel-modes="SUPPORT_TRAVEL_MODES"
        @apply-address-filter="applySupportAddressFilter"
        @clear-selected-room="clearSelectedRoom"
        @query-input="onSupportQueryInput"
        @query-input-ready="setupSupportAutocomplete"
        @select-room="selectRoomAndRoute"
        @select-travel-mode="selectTravelMode"
        @use-my-location="locateSupportUser"
      />
      <ExploreSidePanel v-else :mode="activeMode" />
      <p v-if="mapError" class="explore-map-error">{{ mapError }}</p>
    </section>

    <IdeasModal
      v-if="isIdeasModalOpen"
      v-model:ideas-transport-mode="ideasTransportMode"
      :ideas-step="ideasStep"
      :ideas-category-answers="ideasCategoryAnswers"
      :choices="IDEAS_CATEGORY_CHOICES"
      @close="closeIdeasModal"
      @go-to-step="goToIdeasStep"
      @toggle-category="toggleIdeasCategory"
      @apply="applyIdeasAnswers"
    />

    <PlaceDetailPanel
      :visible="isDetailPanelVisible"
      :panel-state="detailPanelState"
      :place="activeDetailPlace"
      :is-rich="isDetailCategoryRich"
      :directions-error="directionsError"
      :format-distance="formatDistance"
      @close="closeDetailPanel"
      @open-directions="openDirections"
    />
  </main>
</template>
