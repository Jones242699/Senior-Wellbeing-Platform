import { ref } from 'vue'
import { mapMarkerColorByCategory } from './useDiscoverPlaces'

export function useDiscoverMap({
  activeMapPlaceId,
  filteredPlaces,
  loadPlaceDetail,
  mapContainerRef,
  mapRenderablePlaces,
  nextTick,
  refreshCrowdDensityOverlay,
  userLocation,
}) {
  const restaurantMapSampleIds = ref(new Set())

  let discoverMap = null
  let mapMarkers = []
  let placeMarkersById = new Map()
  let activeHighlightMarker = null
  let mapApi = null

  function setMapApi(api) {
    mapApi = api
  }

  function getMapApi() {
    return mapApi
  }

  function getDiscoverMap() {
    return discoverMap
  }

  function buildMarkerIcon(color, isActive = false, categoryKey = '') {
    if (!mapApi?.SymbolPath) return undefined
    const isRestaurant = categoryKey === 'cafes_restaurants'
    return {
      path: mapApi.SymbolPath.CIRCLE,
      scale: isActive ? (isRestaurant ? 16 : 12) : isRestaurant ? 9 : 8,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: isActive ? (isRestaurant ? '#9d174d' : '#111827') : '#ffffff',
      strokeWeight: isActive ? (isRestaurant ? 4 : 3) : 2,
    }
  }

  function clearActiveHighlightMarker() {
    if (activeHighlightMarker) {
      activeHighlightMarker.setMap(null)
      activeHighlightMarker = null
    }
  }

  function updateActiveHighlightMarker(place) {
    clearActiveHighlightMarker()
    if (!place || !discoverMap || !mapApi?.Marker) return
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return

    const ringColor = mapMarkerColorByCategory[place.categoryKey] || '#ec4899'
    activeHighlightMarker = new mapApi.Marker({
      map: discoverMap,
      position: { lat: place.lat, lng: place.lng },
      clickable: false,
      icon: {
        path: mapApi.SymbolPath.CIRCLE,
        scale: 24,
        fillColor: ringColor,
        fillOpacity: 0.22,
        strokeColor: '#9d174d',
        strokeWeight: 3,
      },
      zIndex: 25,
    })
  }

  function upsertPlaceMarker(place) {
    if (!discoverMap || !mapApi?.Marker) return null
    if (!Number.isFinite(place?.lat) || !Number.isFinite(place?.lng)) return null

    const existing = placeMarkersById.get(place.id)
    if (existing) return existing

    const markerColor = mapMarkerColorByCategory[place.categoryKey] || '#f97316'
    const isActive = activeMapPlaceId.value === place.id
    const marker = new mapApi.Marker({
      map: discoverMap,
      position: { lat: place.lat, lng: place.lng },
      title: place.name,
      icon: buildMarkerIcon(markerColor, isActive, place.categoryKey),
    })
    marker.addListener('click', () => {
      void showMapPlaceCard(place, 'map')
    })
    mapMarkers.push(marker)
    placeMarkersById.set(place.id, marker)
    return marker
  }

  function ensureRestaurantVisibleOnMap(place) {
    if (!place || place.categoryKey !== 'cafes_restaurants') return
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return

    if (!restaurantMapSampleIds.value.has(place.id)) {
      restaurantMapSampleIds.value = new Set([...restaurantMapSampleIds.value, place.id])
    }
    upsertPlaceMarker(place)
  }

  function syncActiveMarkerVisual() {
    placeMarkersById.forEach((marker, placeId) => {
      const place = filteredPlaces.value.find((item) => item.id === placeId)
      const markerColor = mapMarkerColorByCategory[place?.categoryKey] || '#f97316'
      const isActive = activeMapPlaceId.value === placeId
      marker.setIcon(buildMarkerIcon(markerColor, isActive, place?.categoryKey))
      marker.setZIndex(isActive ? 30 : 1)
      marker.setAnimation(isActive ? mapApi?.Animation?.BOUNCE || null : null)
      if (isActive) {
        window.setTimeout(() => {
          if (activeMapPlaceId.value === placeId) marker.setAnimation(null)
        }, 900)
      }
    })

    const activePlace = filteredPlaces.value.find((item) => item.id === activeMapPlaceId.value)
    if (activePlace) updateActiveHighlightMarker(activePlace)
    else clearActiveHighlightMarker()
  }

  function closeMapPlaceCard() {
    activeMapPlaceId.value = ''
    clearActiveHighlightMarker()
    syncActiveMarkerVisual()
  }

  function panMapToAvoidPlaceCard(place, source = 'list') {
    if (!discoverMap || !Number.isFinite(place?.lat) || !Number.isFinite(place?.lng)) return
    const mapContainer = discoverMap.getDiv?.()
    if (!mapContainer) return

    const mapWidth = mapContainer.clientWidth || 0
    const mapHeight = mapContainer.clientHeight || 0
    const placeCard = mapContainer.closest('.map-panel')?.querySelector('.map-place-card')
    const cardWidth = placeCard?.clientWidth || Math.min(430, Math.max(0, mapWidth - 28))
    const cardHeight = placeCard?.clientHeight || Math.min(380, Math.max(0, mapHeight - 28))
    const horizontalPadding = 20
    const verticalPadding = 8
    const horizontalFactor = source === 'map' ? 0.34 : 0.42
    const minOffsetX = source === 'map' ? 100 : 130
    const maxOffsetX = source === 'map' ? 200 : 250
    const offsetX = Math.max(
      minOffsetX,
      Math.min(maxOffsetX, Math.round(cardWidth * horizontalFactor + horizontalPadding)),
    )
    const offsetY = Math.max(20, Math.min(90, Math.round(cardHeight * 0.14 + verticalPadding)))

    discoverMap.panTo({ lat: place.lat, lng: place.lng })
    window.setTimeout(() => {
      if (!discoverMap || activeMapPlaceId.value !== place.id) return
      // Move selected point away from bottom-left info card footprint.
      discoverMap.panBy(-offsetX, offsetY)
    }, 80)
  }

  async function showMapPlaceCard(place, source = 'list') {
    if (!place?.id) return
    activeMapPlaceId.value = place.id
    await nextTick()
    panMapToAvoidPlaceCard(place, source)
    await loadPlaceDetail(place)
    await nextTick()
    panMapToAvoidPlaceCard(place, source)
  }

  async function focusMapOnPlace(place) {
    if (!place) return
    ensureRestaurantVisibleOnMap(place)
    if (discoverMap) {
      const zoom = discoverMap.getZoom()
      const targetZoom = place.categoryKey === 'cafes_restaurants' ? 17 : 16
      if (typeof zoom !== 'number' || zoom < targetZoom) discoverMap.setZoom(targetZoom)
    }
    await showMapPlaceCard(place)
    syncActiveMarkerVisual()
  }

  function clearMapMarkers() {
    mapMarkers.forEach((marker) => marker.setMap(null))
    mapMarkers = []
    placeMarkersById = new Map()
    clearActiveHighlightMarker()
  }

  function initDiscoverMap() {
    if (discoverMap || !mapContainerRef.value || !mapApi?.Map) return
    discoverMap = new mapApi.Map(mapContainerRef.value, {
      center: { lat: -37.8136, lng: 144.9631 },
      zoom: 14,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
  }

  function updateDiscoverMapMarkers() {
    if (!discoverMap || !mapApi?.Marker) return
    clearMapMarkers()

    const mapBounds = new mapApi.LatLngBounds()
    let hasAnyPoint = false

    if (
      userLocation.value &&
      Number.isFinite(userLocation.value.lat) &&
      Number.isFinite(userLocation.value.lng)
    ) {
      const userPos = { lat: userLocation.value.lat, lng: userLocation.value.lng }
      const userMarker = new mapApi.Marker({
        map: discoverMap,
        position: userPos,
        title: 'Your location',
        icon: {
          path: mapApi.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        zIndex: 10,
      })
      mapMarkers.push(userMarker)
      mapBounds.extend(userPos)
      hasAnyPoint = true
    }

    mapRenderablePlaces.value.forEach((place) => {
      const markerColor = mapMarkerColorByCategory[place.categoryKey] || '#f97316'
      const marker = new mapApi.Marker({
        map: discoverMap,
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
        icon: buildMarkerIcon(markerColor, false, place.categoryKey),
      })
      marker.addListener('click', () => {
        void showMapPlaceCard(place, 'map')
      })
      mapMarkers.push(marker)
      placeMarkersById.set(place.id, marker)
      mapBounds.extend(marker.getPosition())
      hasAnyPoint = true
    })

    if (hasAnyPoint) {
      discoverMap.fitBounds(mapBounds, 56)
      const zoom = discoverMap.getZoom()
      if (typeof zoom === 'number' && zoom > 16) discoverMap.setZoom(16)
    } else if (userLocation.value) {
      discoverMap.setCenter(userLocation.value)
      discoverMap.setZoom(14)
    }
    syncActiveMarkerVisual()
    void refreshCrowdDensityOverlay()
  }

  return {
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
  }
}
