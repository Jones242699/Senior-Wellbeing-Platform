<script setup>
import './styles.css'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { loadMapApi } from '../../utils/osmMaps'
import DiscoverMap from './components/DiscoverMap.vue'
import IdeasModal from './components/IdeasModal.vue'
import PlaceDetailPanel from './components/PlaceDetailPanel.vue'
import PlacesList from './components/PlacesList.vue'
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
} from './composables/useDiscoverPlaces'
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
} from './composables/useCrowdDensity'
import { useDiscoverLocation } from './composables/useDiscoverLocation'
import { useDiscoverMap } from './composables/useDiscoverMap'
import { usePlaceDetails } from './composables/usePlaceDetails'

const router = useRouter()

let mapApi = null

async function loadDiscoverMapApi() {
  if (!mapApi) mapApi = await loadMapApi()
  return mapApi
}

const isCrowdDensityEnabled = ref(true)

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
  buildQueryOptions,
  toggleCategory,
  selectRadius,
  goToPage,
  expandTo2Km,
  loadPlaces,
} = useDiscoverPlaces({
  isCrowdDensityEnabled,
  onPlacesLoaded: () => clearPlaceDetails(),
})

const mapContainerRef = ref(null)
const mapError = ref('')
const activeDetailPlace = ref(null)
const detailPanelState = ref('closed') // closed | opening | open | closing
const pendingDetailPlace = ref(null)
const directionsError = ref('')
const isIdeasModalOpen = ref(false)
const ideasStep = ref(1)
const ideasTransportMode = ref('')
const ideasCategoryAnswers = ref([])

const { loadingDetailIds, clearPlaceDetails, loadPlaceDetail } = usePlaceDetails({
  allPlaces,
  activeDetailPlace,
})

const {
  addressQuery,
  applyingAddressFilter,
  addressFilterError,
  locationMode,
  applyAddressFilter,
  clearGeoWatch,
  requestBrowserLocation,
  setAddressInput,
  setupAddressAutocomplete,
  useMyLocation,
  watchDeviceLocation,
} = useDiscoverLocation({
  currentPage,
  loadDiscoverMapApi,
  locationUnavailable,
  userLocation,
})

function setMapContainer(element) {
  mapContainerRef.value = element
}

function buildCrowdDensityApiUrl() {
  const endpoint = buildDiscoverApiUrl('/crowd-density')
  const { queryRadius } = buildQueryOptions()
  endpoint.searchParams.set('radius', String(Math.max(queryRadius, CROWD_DENSITY_MIN_RADIUS)))
  endpoint.searchParams.set('limit', String(CROWD_DENSITY_DEFAULT_LIMIT))
  if (userLocation.value) {
    endpoint.searchParams.set('lat', String(userLocation.value.lat))
    endpoint.searchParams.set('lng', String(userLocation.value.lng))
  }
  return endpoint.toString()
}

const isDetailPanelVisible = computed(() => detailPanelState.value !== 'closed')
const isDetailCategoryRich = computed(
  () =>
    !!activeDetailPlace.value &&
    ['artworks_fountains', 'memorials_sculptures'].includes(activeDetailPlace.value.categoryKey),
)
const activeMapPlaceId = ref('')
const activeMapPlace = computed(() => {
  if (!activeMapPlaceId.value) return null
  return filteredPlaces.value.find((place) => place.id === activeMapPlaceId.value) || null
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

const {
  restaurantMapSampleIds,
  clearMapMarkers,
  closeMapPlaceCard,
  ensureRestaurantVisibleOnMap,
  focusMapOnPlace,
  getDiscoverMap,
  getMapApi,
  initDiscoverMap,
  setMapApi,
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

const isActiveMapPlaceRich = computed(
  () =>
    !!activeMapPlace.value &&
    ['artworks_fountains', 'memorials_sculptures'].includes(activeMapPlace.value.categoryKey),
)
const isActiveMapPlaceLoading = computed(
  () => !!activeMapPlace.value && loadingDetailIds.value.has(activeMapPlace.value.id),
)
const shouldShowCrowdDensityOverlay = computed(
  () => isCrowdDensityEnabled.value && selectedCategories.value.length > 0,
)

function toggleCrowdDensityOverlay() {
  isCrowdDensityEnabled.value = !isCrowdDensityEnabled.value
}
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

function buildDirectionsUrl(place) {
  const resolved = router.resolve({
    path: '/my-routes',
    query: {
      destination: place.name,
      destinationAddress: place.address || place.name,
      destinationLat: Number.isFinite(place.lat) ? String(place.lat) : undefined,
      destinationLng: Number.isFinite(place.lng) ? String(place.lng) : undefined,
    },
  })
  return `${window.location.origin}${resolved.href}`
}

function goToDirectionsForPlace(place) {
  router.push({
    path: '/my-routes',
    query: {
      destination: place.name,
      destinationAddress: place.address || place.name,
      destinationLat: Number.isFinite(place.lat) ? String(place.lat) : undefined,
      destinationLng: Number.isFinite(place.lng) ? String(place.lng) : undefined,
    },
  })
}

function openDirections() {
  if (!activeDetailPlace.value) return
  directionsError.value = ''
  const popup = window.open(buildDirectionsUrl(activeDetailPlace.value), '_blank')
  if (!popup) {
    directionsError.value = "We couldn't open directions right now. Please try again."
    return
  }
  popup.opener = null
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

let crowdDensityPolylines = []
let crowdDensityRequestSeq = 0
let crowdDensityRenderSeq = 0
const crowdDensityRecords = ref([])

function clearCrowdDensityOverlay() {
  crowdDensityPolylines.forEach((polyline) => polyline.setMap(null))
  crowdDensityPolylines = []
}

async function renderCrowdDensityOverlay() {
  if (!getDiscoverMap() || !getMapApi()?.Polyline) return
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
    // As a final fallback, use all points to avoid a blank map.
    const globalFallback = buildFallbackRoadOverlays(crowdDensityRecords.value)
    if (!globalFallback.length) return
    resolvedGroups.push(...globalFallback)
  }

  if (renderId !== crowdDensityRenderSeq) return

  resolvedGroups.forEach((group) => {
    const path = buildLocalFallbackPathForGroup(group)
    if (path.length < 2) return
    const levelColor = CROWD_DENSITY_COLORS[group.level] || CROWD_DENSITY_COLORS.moderate
    const polyline = new getMapApi().Polyline({
      map: getDiscoverMap(),
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
  if (!getDiscoverMap() || !getMapApi()?.Polyline) return
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
    console.error('[Discover Places] Failed to load crowd density:', error)
  }
}

onMounted(async () => {
  readSessionState()
  await Promise.allSettled([loadPlaces(), requestBrowserLocation(), loadDiscoverMapApi()])
  await nextTick()
  if (mapApi?.Map) {
    setMapApi(mapApi)
    initDiscoverMap()
    updateDiscoverMapMarkers()
  } else {
    mapError.value = 'Map is temporarily unavailable.'
  }
  setupAddressAutocomplete()
  if (locationMode.value === 'device') watchDeviceLocation()
  window.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  clearMapMarkers()
  clearCrowdDensityOverlay()
  clearDetailTransitionTimeout()
  clearGeoWatch()
  window.removeEventListener('keydown', onGlobalKeydown)
})

watch([filteredPlaces, userLocation], () => {
  updateDiscoverMapMarkers()
})

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
  <main class="discover-page">
    <section class="discover-shell">
      <header class="page-header">
        <button type="button" class="back-link" @click="router.push('/')">← Back</button>
        <h1>Discover places near you</h1>
      </header>

      <section class="discover-content">
        <DiscoverMap
          :categories="CATEGORY_OPTIONS"
          :radius-options="RADIUS_OPTIONS"
          :selected-category-set="selectedCategorySet"
          :selected-radius="selectedRadius"
          :category-counts="categoryCounts"
          :marker-colors="mapMarkerColorByCategory"
          :is-crowd-density-enabled="isCrowdDensityEnabled"
          :should-show-crowd-density-overlay="shouldShowCrowdDensityOverlay"
          :crowd-density-legend="CROWD_DENSITY_LEGEND"
          :active-map-place="activeMapPlace"
          :user-location="userLocation"
          :is-active-map-place-rich="isActiveMapPlaceRich"
          :is-active-map-place-loading="isActiveMapPlaceLoading"
          :map-error="mapError"
          :format-distance="formatDistance"
          @container-ready="setMapContainer"
          @toggle-category="toggleCategory"
          @select-radius="selectRadius"
          @toggle-crowd-density="toggleCrowdDensityOverlay"
          @close-map-place-card="closeMapPlaceCard"
          @directions="goToDirectionsForPlace"
        />

        <PlacesList
          v-model:address-query="addressQuery"
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
          :places-per-page="PLACES_PER_PAGE"
          :format-distance="formatDistance"
          @input-ready="setAddressInput"
          @apply-address-filter="applyAddressFilter"
          @use-my-location="useMyLocation"
          @open-ideas-modal="openIdeasModal"
          @expand-to-2km="expandTo2Km"
          @focus-place="focusMapOnPlace"
          @directions="goToDirectionsForPlace"
          @go-to-page="goToPage"
        />
      </section>
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

