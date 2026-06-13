<script setup>
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

<style>
.discover-page {
  min-height: calc(100vh - 60px);
  background: #f4f6f5;
  padding: 18px;
  font-family:
    'Inter',
    system-ui,
    -apple-system,
    sans-serif;
  position: relative;
}

.discover-shell {
  max-width: min(98vw, 1680px);
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #dbe2de;
  border-radius: 16px;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 1px solid #e7ece8;
  padding-bottom: 14px;
  margin-bottom: 14px;
}

.back-link {
  border: none;
  background: transparent;
  color: #384046;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.page-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 600;
  line-height: 1.25;
  color: #0f172a;
}

.location-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 10px;
}

.location-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-group {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 0;
}

.address-input {
  box-sizing: border-box;
  width: 1%;
  flex: 1 1 auto;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 10px 0 0 10px;
  background: #ffffff;
  padding: 11px 12px;
  font-size: 14px;
  outline: none;
}

.address-input:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px #d1fae5;
}

.toolbar-btn {
  border: none;
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 0 14px;
  height: 44px;
  flex-shrink: 0;
  white-space: nowrap;
}

.toolbar-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.filter-btn {
  background: #0f766e;
}

.search-btn {
  border-radius: 0 10px 10px 0;
  min-width: 92px;
}

.location-btn {
  background: #16a34a;
}

.location-inline-btn {
  align-self: flex-start;
  border-radius: 999px;
  height: 40px;
  padding: 0 18px;
}

.address-error {
  margin: 6px 0 10px;
  color: #b91c1c;
  font-size: 12px;
}

.filters-area {
  margin-bottom: 10px;
}

.filters-content {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 14px;
}

.filters-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ideas-cta-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
}

.ideas-cta-btn {
  border: none;
  background: linear-gradient(135deg, #f97316, #ef4444);
  color: #ffffff;
  border-radius: 999px;
  min-height: 40px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.25);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.ideas-cta-btn:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.3);
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filters-label {
  margin: 0;
  width: 76px;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.chip-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border: 2px solid #93bca1;
  background: #ffffff;
  color: #14532d;
  border-radius: 999px;
  min-height: 34px;
  padding: 5px 14px;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1.1;
}

.chip.selected {
  background: #16a34a;
  color: #ffffff;
  border-width: 2px;
  border-color: #166534;
}

.radius-chip {
  min-width: 86px;
  justify-content: center;
  text-align: center;
  padding-left: 12px;
  padding-right: 12px;
}

.result-count {
  margin: 0 0 8px;
  font-size: 14px;
  color: #475569;
  text-align: right;
}

.discover-content {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 2.65fr) minmax(360px, 1.35fr);
  gap: 14px;
  align-items: start;
}

.map-panel {
  position: relative;
  position: sticky;
  top: 18px;
  border: 1px solid #e4eae7;
  border-radius: 14px;
  overflow: hidden;
  background: #f7faf8;
  min-height: 620px;
}

.map-canvas {
  width: 100%;
  height: 100%;
  min-height: 620px;
}

.map-filters-overlay {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.map-filter-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.map-chip,
.inline-ideas-btn {
  pointer-events: auto;
}

.map-chip {
  border: 1px solid #d1d5db;
  background: rgba(255, 255, 255, 0.95);
  color: #1f2937;
  border-radius: 999px;
  min-height: 38px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
}

.map-chip.selected {
  border-color: #166534;
  background: #16a34a;
  color: #ffffff;
}

.map-chip.selected .chip-count {
  background: #14532d;
  color: #dcfce7;
}

.chip-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.14);
}

.chip-count {
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #0f766e;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  padding: 0 6px;
}

.radius-row {
  justify-content: space-between;
}

.radius-chip-group,
.map-filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.inline-ideas-btn {
  min-height: 38px;
  padding: 6px 14px;
  font-size: 13px;
}

.map-fallback {
  position: absolute;
  inset: 0;
  z-index: 1003;
  display: grid;
  place-items: center;
  background: rgba(248, 250, 249, 0.92);
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.crowd-density-legend {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 1001;
  min-width: 190px;
  border-radius: 12px;
  border: 1px solid #d4dbe5;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
  padding: 10px 12px;
}

.crowd-legend-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.crowd-legend-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.crowd-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.crowd-legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.map-place-card {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 1002;
  width: min(430px, calc(100% - 28px));
  height: 380px;
  border-radius: 16px;
  border: 1px solid #d9e1dd;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.22);
  padding: 12px 14px;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.map-place-close {
  position: absolute;
  top: 10px;
  right: 10px;
  border: none;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: #eef2ef;
  color: #334155;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.map-place-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 34px;
}

.map-place-image {
  width: 84px;
  height: 84px;
  border-radius: 12px;
  border: 1px solid #d1e3d5;
  background: #edf7ef;
  background-size: cover;
  background-position: center;
  display: grid;
  place-items: center;
  color: #166534;
  font-size: 30px;
  flex-shrink: 0;
}

.map-place-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.map-place-title h3 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #1f2937;
  flex: 1 1 auto;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.map-place-title p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #4b5563;
  font-weight: 600;
}

.map-place-desc {
  margin: 12px 0 10px;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
}

.map-place-label {
  display: block;
  margin-bottom: 2px;
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.map-place-desc-text {
  display: block;
  color: #6b7280;
  font-style: italic;
}

.map-place-line {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 1.45;
  color: #1f2937;
}

.map-place-line strong {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.map-place-loading {
  margin: 2px 0 0;
  color: #166534;
  font-size: 13px;
  font-weight: 600;
}

.map-card-direction-btn {
  border: none;
  border-radius: 999px;
  min-height: 34px;
  padding: 6px 10px;
  background: #166534;
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
}

.map-place-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.map-place-more-btn {
  border: none;
  border-radius: 999px;
  min-height: 42px;
  padding: 8px 20px;
  background: #198754;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.results-panel {
  min-width: 0;
  width: 100%;
}

.calm-banner {
  margin: 10px 0 12px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.5;
}

.cards-wrap {
  border: 1px solid #e4eae7;
  border-radius: 14px;
  background: #f7faf8;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.place-card {
  background: #ffffff;
  border: 1px solid #d9e1dd;
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.place-card.selected {
  border-color: #ec4899;
  background: #fdf2f8;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.28);
}

.card-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.card-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.place-icon {
  width: 74px;
  height: 74px;
  border-radius: 12px;
  background: #edf7ef;
  background-size: cover;
  background-position: center;
  border: 1px solid #d1e3d5;
  display: grid;
  place-items: center;
  color: #166534;
  font-size: 34px;
}

.place-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.category-tag {
  display: inline-block;
  width: fit-content;
  padding: 3px 9px;
  border-radius: 8px;
  background: #e8f5ea;
  color: #166534;
  font-size: 12px;
  font-weight: 700;
}

.place-main h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 700;
  color: #111827;
}

.distance-text {
  margin: 0;
  font-size: 13px;
  color: #374151;
}

.more-info-btn {
  border: 1.5px solid #9ccaa9;
  background: #ffffff;
  color: #138c47;
  border-radius: 9px;
  min-width: 112px;
  min-height: 42px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.direction-btn {
  border: none;
  border-radius: 999px;
  min-height: 40px;
  padding: 8px 16px;
  background: #166534;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.empty-state,
.loading-state {
  margin: 20px 0;
  border: 1px solid #d7e2dc;
  border-radius: 12px;
  background: #f8faf9;
  color: #334155;
  padding: 18px;
  font-size: 14px;
  line-height: 1.5;
}

.empty-state p {
  margin: 0;
}

.no-match-text {
  color: #dc2626;
}

.action-link {
  margin-top: 12px;
  border: 2px solid #4b8a62;
  background: #ffffff;
  color: #14532d;
  border-radius: 8px;
  min-height: 42px;
  font-size: 14px;
  font-weight: 700;
  padding: 6px 14px;
  cursor: pointer;
}

.pagination {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.page-btn {
  border: 1px solid #b8c6bf;
  background: #ffffff;
  color: #334155;
  border-radius: 8px;
  min-height: 38px;
  padding: 6px 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.page-info {
  font-size: 14px;
  color: #475569;
}

.details-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.26);
  display: flex;
  justify-content: flex-end;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1200;
}

.ideas-overlay {
  position: fixed;
  inset: 0;
  z-index: 1250;
  background: rgba(2, 6, 23, 0.45);
  display: grid;
  place-items: center;
  padding: 18px;
}

.ideas-modal {
  width: min(560px, 96vw);
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 25px 55px rgba(15, 23, 42, 0.22);
  overflow: hidden;
}

.ideas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb;
}

.ideas-header h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.ideas-close-btn {
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1f2937;
  border-radius: 10px;
  min-height: 36px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
}

.ideas-body {
  padding: 18px;
}

.ideas-step-enter-active,
.ideas-step-leave-active {
  transition:
    opacity 0.26s ease,
    transform 0.26s ease;
}

.ideas-step-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}

.ideas-step-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}

.ideas-question {
  margin: 0 0 14px;
  color: #1e293b;
  font-size: 16px;
  font-weight: 700;
}

.ideas-option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.ideas-option-group.column {
  flex-direction: column;
}

.ideas-option-btn {
  border: 2px solid #cbd5e1;
  background: #ffffff;
  color: #1f2937;
  border-radius: 12px;
  min-height: 42px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.ideas-option-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.ideas-option-btn.text-left {
  text-align: left;
  justify-content: flex-start;
}

.ideas-option-btn.selected {
  background: #16a34a;
  border-color: #166534;
  color: #ffffff;
}

.ideas-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.ideas-actions.split {
  justify-content: space-between;
}

.ideas-next-btn,
.ideas-secondary-btn {
  border: none;
  border-radius: 10px;
  min-height: 40px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.ideas-next-btn {
  background: #166534;
  color: #ffffff;
}

.ideas-next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ideas-secondary-btn {
  background: #e2e8f0;
  color: #1f2937;
}

.details-overlay.visible {
  opacity: 1;
}

.details-panel {
  width: min(50vw, 760px);
  min-width: 420px;
  height: 100vh;
  background: #ffffff;
  border-left: 1px solid #dbe2de;
  transform: translateX(100%);
  transition: transform 0.32s ease;
  display: flex;
  flex-direction: column;
}

.details-panel.visible {
  transform: translateX(0);
}

.details-panel-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.details-header-title h2 {
  margin: 0;
  font-size: 32px;
  line-height: 1.2;
  color: #0f172a;
}

.details-header-title p {
  margin: 6px 0 0;
  font-size: 18px;
  color: #334155;
}

.details-close-btn {
  min-width: 88px;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.details-panel-body {
  padding: 20px;
  overflow-y: auto;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.details-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
}

.details-item-full {
  grid-column: 1 / -1;
}

.details-item-label {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #14532d;
  margin-bottom: 8px;
}

.details-item-value {
  margin: 0;
  font-size: 18px;
  line-height: 1.55;
  color: #1f2937;
}

.details-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.details-directions-btn {
  min-height: 46px;
  padding: 8px 20px;
  border: none;
  border-radius: 10px;
  background: #16a34a;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.details-secondary-link {
  min-height: 44px;
  padding: 8px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: #ffffff;
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.details-error {
  margin: 12px 0 0;
  font-size: 18px;
  color: #b45309;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .page-header h1 {
    font-size: 22px;
  }

  .place-main h2 {
    font-size: 18px;
  }

  .place-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .location-toolbar {
    flex-wrap: nowrap;
  }

  .filters-content {
    flex-direction: column;
  }

  .discover-content {
    grid-template-columns: 1fr;
  }

  .map-panel {
    position: relative;
    top: 0;
    min-height: 420px;
  }

  .map-canvas {
    min-height: 420px;
  }

  .map-place-card {
    width: calc(100% - 16px);
    left: 8px;
    right: 8px;
    bottom: 8px;
    height: 330px;
    padding: 10px 12px;
  }

  .crowd-density-legend {
    right: 8px;
    bottom: 8px;
    min-width: 170px;
    padding: 8px 10px;
  }

  .map-place-image {
    width: 72px;
    height: 72px;
  }

  .map-place-title h3 {
    font-size: 20px;
  }

  .map-filters-overlay {
    position: static;
    margin: 8px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 8px;
    pointer-events: auto;
  }

  .ideas-cta-wrap {
    justify-content: flex-start;
    min-width: 0;
  }

  .details-panel {
    width: min(100vw, 680px);
    min-width: 320px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .details-header-title h2 {
    font-size: 24px;
  }
}
</style>
