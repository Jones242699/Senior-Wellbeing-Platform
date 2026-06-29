import { ref } from 'vue'
import { clearMarkers, createCircleMarker, createMapMarker } from '../../../shared/map/markerHelpers'
import { mapMarkerColorByCategory } from './useDiscoverPlaces'

export function useDiscoverMap({
  activeMapPlaceId,
  formatDistance,
  filteredPlaces,
  getInfoWindow,
  loadPlaceDetail,
  mapContainerRef,
  mapRenderablePlaces,
  nextTick,
  onDirections,
  onMoreInfo,
  refreshCrowdDensityOverlay,
  userLocation,
}) {
  const restaurantMapSampleIds = ref(new Set())

  let discoverMap = null
  let mapMarkers = []
  let placeMarkersById = new Map()
  let activeHighlightMarker = null
  let activePopupMarker = null
  let placeInfoWindow = null
  let placePopupRequestSeq = 0
  let popupActionsBound = false
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

  function adoptDiscoverMap({ api, map }) {
    if (!api || !map) return
    mapApi = api
    discoverMap = map
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
    activeHighlightMarker = createCircleMarker(mapApi, discoverMap, {
      position: { lat: place.lat, lng: place.lng },
      clickable: false,
      scale: 24,
      fillColor: ringColor,
      fillOpacity: 0.22,
      strokeColor: '#9d174d',
      strokeWeight: 3,
      zIndex: 25,
    })
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function buildPlacePopupHtml(place, { loading = false } = {}) {
    const distance =
      userLocation.value && typeof place.distanceMeters === 'number'
        ? `<p class="support-popup-line"><strong>Distance:</strong> ${escapeHtml(
            formatDistance(place.distanceMeters),
          )}</p>`
        : ''
    const description = place.description
      ? `<p class="support-popup-line place-popup-desc"><strong>Description:</strong> ${escapeHtml(
          place.description,
        )}</p>`
      : ''
    const richDetails = ['artistOrSubject', 'year', 'workTitle', 'material']
      .map((key) => {
        const labels = {
          artistOrSubject: 'Artist / Subject',
          year: 'Year',
          workTitle: 'Work title',
          material: 'Material',
        }
        return place[key]
          ? `<p class="support-popup-line"><strong>${labels[key]}:</strong> ${escapeHtml(place[key])}</p>`
          : ''
      })
      .join('')

    return `
      <div class="place-map-popup" data-place-popup-id="${escapeHtml(place.id)}">
        <div class="support-popup-header">
          <span class="place-popup-pin" style="background: ${escapeHtml(
            mapMarkerColorByCategory[place.categoryKey] || '#f97316',
          )};"></span>
          <div>
            <h3>${escapeHtml(place.name)}</h3>
            <p>${escapeHtml(place.categoryLabel || '')}</p>
          </div>
        </div>
        ${description}
        ${
          place.address
            ? `<p class="support-popup-line"><strong>Address:</strong> ${escapeHtml(place.address)}</p>`
            : ''
        }
        ${distance}
        ${richDetails}
        ${loading ? '<p class="place-popup-loading">Loading details...</p>' : ''}
        <div class="support-popup-actions">
          <button
            type="button"
            class="support-popup-more-btn"
            data-place-more-id="${escapeHtml(place.id)}"
          >
            More info
          </button>
          <button
            type="button"
            class="support-popup-direction-btn"
            data-place-direction-id="${escapeHtml(place.id)}"
          >
            Direction
          </button>
        </div>
      </div>
    `
  }

  function findPopupPlace(id) {
    return filteredPlaces.value.find((place) => String(place.id) === String(id))
  }

  function bindPopupActions() {
    if (popupActionsBound) return
    popupActionsBound = true
    document.addEventListener(
      'click',
      (event) => {
        const directionButton = event.target?.closest?.('[data-place-direction-id]')
        if (directionButton) {
          const place = findPopupPlace(directionButton.dataset.placeDirectionId)
          if (!place) return
          event.preventDefault()
          event.stopPropagation()
          onDirections?.(place)
          return
        }

        const moreButton = event.target?.closest?.('[data-place-more-id]')
        if (moreButton) {
          const place = findPopupPlace(moreButton.dataset.placeMoreId)
          if (!place) return
          event.preventDefault()
          event.stopPropagation()
          onMoreInfo?.(place)
        }
      },
      true,
    )
  }

  function closePlacePopup({ cancelRequest = true } = {}) {
    if (cancelRequest) placePopupRequestSeq += 1
    if (placeInfoWindow?.close) placeInfoWindow.close()
    if (activePopupMarker?.marker?.closePopup) activePopupMarker.marker.closePopup()
    activePopupMarker = null
  }

  function openPlacePopup(place, marker, options) {
    if (!discoverMap || !marker) return
    if (!placeInfoWindow) placeInfoWindow = getInfoWindow?.()
    if (!placeInfoWindow) return

    placeInfoWindow.setContent(buildPlacePopupHtml(place, options))
    placeInfoWindow.open(discoverMap, marker)
    activePopupMarker = marker
    bindPopupActions()
  }

  function upsertPlaceMarker(place) {
    if (!discoverMap || !mapApi?.Marker) return null
    if (!Number.isFinite(place?.lat) || !Number.isFinite(place?.lng)) return null

    const existing = placeMarkersById.get(place.id)
    if (existing) return existing

    const markerColor = mapMarkerColorByCategory[place.categoryKey] || '#f97316'
    const isActive = activeMapPlaceId.value === place.id
    const marker = createMapMarker(mapApi, discoverMap, {
      position: { lat: place.lat, lng: place.lng },
      title: place.name,
      icon: buildMarkerIcon(markerColor, isActive, place.categoryKey),
    })
    if (!marker) return null
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
    closePlacePopup()
    syncActiveMarkerVisual()
  }

  function panMapToAvoidPlaceCard(place) {
    if (!discoverMap || !Number.isFinite(place?.lat) || !Number.isFinite(place?.lng)) return
    discoverMap.panTo({ lat: place.lat, lng: place.lng })
  }

  async function showMapPlaceCard(place) {
    if (!place?.id) return
    const requestId = ++placePopupRequestSeq
    activeMapPlaceId.value = place.id
    const marker = upsertPlaceMarker(place)
    closePlacePopup()
    placePopupRequestSeq = requestId
    openPlacePopup(place, marker, { loading: true })
    await nextTick()
    if (requestId !== placePopupRequestSeq || activeMapPlaceId.value !== place.id) return
    panMapToAvoidPlaceCard(place)
    await loadPlaceDetail(place)
    await nextTick()
    if (requestId !== placePopupRequestSeq || activeMapPlaceId.value !== place.id) return
    const updatedPlace = filteredPlaces.value.find((item) => item.id === place.id) || place
    const updatedMarker = placeMarkersById.get(place.id) || upsertPlaceMarker(updatedPlace) || marker
    openPlacePopup(updatedPlace, updatedMarker, { loading: false })
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
    closePlacePopup({ cancelRequest: false })
    clearMarkers(mapMarkers)
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
      const userMarker = createCircleMarker(mapApi, discoverMap, {
        position: userPos,
        title: 'Your location',
        scale: 8,
        fillColor: '#ef4444',
        strokeColor: '#ffffff',
        strokeWeight: 2,
        zIndex: 10,
      })
      if (!userMarker) return
      mapMarkers.push(userMarker)
      mapBounds.extend(userPos)
      hasAnyPoint = true
    }

    mapRenderablePlaces.value.forEach((place) => {
      const markerColor = mapMarkerColorByCategory[place.categoryKey] || '#f97316'
      const marker = createMapMarker(mapApi, discoverMap, {
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
        icon: buildMarkerIcon(markerColor, false, place.categoryKey),
      })
      if (!marker) return
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
    adoptDiscoverMap,
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
