<script setup>
import './styles.css'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ExploreMap from './components/ExploreMap.vue'
import ExploreModeTabs from './components/ExploreModeTabs.vue'
import ExplorePlacesPanel from './components/ExplorePlacesPanel.vue'
import ExploreSidePanel from './components/ExploreSidePanel.vue'
import { EXPLORE_DEFAULT_MODE, EXPLORE_MODES } from './constants'
import { useExploreMap } from './composables/useExploreMap'
import {
  CATEGORY_OPTIONS,
  MAX_MAP_MARKERS,
  PLACES_PER_PAGE,
  RADIUS_OPTIONS,
  RESTAURANT_MAP_RANDOM_PICK_LIMIT,
  formatDistance,
  mapMarkerColorByCategory,
  useDiscoverPlaces,
} from '../discover-places/composables/useDiscoverPlaces'
import { useDiscoverLocation } from '../discover-places/composables/useDiscoverLocation'
import { useDiscoverMap } from '../discover-places/composables/useDiscoverMap'
import { usePlaceDetails } from '../discover-places/composables/usePlaceDetails'

const router = useRouter()
const activeModeId = ref(EXPLORE_DEFAULT_MODE)
const mapContainerRef = ref(null)
const mapError = ref('')
const isCrowdDensityEnabled = ref(true)

const activeMode = computed(
  () => EXPLORE_MODES.find((mode) => mode.id === activeModeId.value) || EXPLORE_MODES[0],
)

function setMapContainer(element) {
  mapContainerRef.value = element
}

const { cleanupMap, getMap, getMapApi, initExploreMap, mapReady, resetMapView, resizeMap } =
  useExploreMap({
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

const { clearPlaceDetails, loadPlaceDetail } = usePlaceDetails({
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
  requestBrowserLocation,
  setAddressInput,
  setupAddressAutocomplete,
  useMyLocation,
  watchDeviceLocation,
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

async function refreshCrowdDensityOverlay() {}

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
  router.push('/discover-nearby-places')
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

onMounted(async () => {
  try {
    readSessionState()
    await Promise.allSettled([loadPlaces(), requestBrowserLocation()])
    await nextTick()
    await initExploreMap()
    adoptDiscoverMap({ api: getMapApi(), map: getMap() })
    refreshRestaurantMapSample()
    updateDiscoverMapMarkers()
    setupAddressAutocomplete()
    if (locationMode.value === 'device') watchDeviceLocation()
  } catch (error) {
    console.error(error)
    mapError.value = error?.message || 'Failed to load map'
  }
})

onUnmounted(() => {
  clearMapMarkers()
  clearGeoWatch()
  cleanupMap()
})

watch(activeModeId, async () => {
  await nextTick()
  resizeMap()
  if (activeModeId.value === 'places') updateDiscoverMapMarkers()
  else {
    clearMapMarkers()
    closeMapPlaceCard()
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
</script>

<template>
  <main class="explore-page">
    <ExploreMap :active-mode="activeMode" :map-ready="mapReady" @map-ready="setMapContainer" />

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
        @go-to-page="goToPage"
      />
      <ExploreSidePanel v-else :mode="activeMode" />
      <p v-if="mapError" class="explore-map-error">{{ mapError }}</p>
    </section>
  </main>
</template>
