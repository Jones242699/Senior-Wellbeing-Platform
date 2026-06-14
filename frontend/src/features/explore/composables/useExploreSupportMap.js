import { ref } from 'vue'
import { resolveAddressInput } from '../../../shared/map/addressResolver'
import { toLatLngLiteral } from '../../../shared/map/locationRules'
import { clearMarkers, createCircleMarker } from '../../../shared/map/markerHelpers'
import {
  searchPlaceSuggestions,
  setupPlaceAutocomplete,
  toPlacePoint,
} from '../../../shared/map/placeHelpers'

export function useExploreSupportMap({
  clearDirectionsDisplay,
  clearEndpointMarkers,
  directionsRoute,
  ensureUserMarker,
  getGeocoder,
  getInfoWindow,
  getMap,
  getMapApi,
  getPlacesService,
  getTravelMode,
  panTo: panBaseMapTo,
  setDirectionsResult,
  setEndpointMarker,
}) {
  const routeSummary = ref('')
  const userPosition = ref(null)

  let filterCenterMarker
  let queryAutocomplete
  const roomMarkers = []
  let roomMarkersById = new Map()
  let roomInfoWindow = null
  let activeRoomPopupMarker = null

  function clearRoomMarkers() {
    closeRoomPopup()
    clearMarkers(roomMarkers)
    roomMarkersById = new Map()
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function buildRoomPopupHtml(room, originLabel) {
    const distance = room.distanceText
      ? `<p class="support-popup-line"><strong>Distance:</strong> ${escapeHtml(room.distanceText)}</p>`
      : ''
    const duration = room.durationText
      ? `<p class="support-popup-line"><strong>Travel time:</strong> ${escapeHtml(room.durationText)}</p>`
      : ''
    const origin = originLabel
      ? `<p class="support-popup-line"><strong>From:</strong> ${escapeHtml(originLabel)}</p>`
      : ''
    const address = room.address
      ? `<p class="support-popup-line"><strong>Address:</strong> ${escapeHtml(room.address)}</p>`
      : ''

    return `
      <div class="support-map-popup" data-support-popup-id="${escapeHtml(room.id)}">
        <div class="support-popup-header">
          <span class="support-popup-pin"></span>
          <div>
            <h3>${escapeHtml(room.name)}</h3>
            <p>Counseling room</p>
          </div>
        </div>
        ${distance}
        ${duration}
        ${origin}
        ${address}
        <button
          type="button"
          class="support-popup-direction-btn"
          data-support-direction-id="${escapeHtml(room.id)}"
        >
          Direction
        </button>
      </div>
    `
  }

  function attachRoomPopupActions(room, onDirections) {
    window.setTimeout(() => {
      const mapContainer = getMap()?.getDiv?.()
      const button = [...(mapContainer?.querySelectorAll('[data-support-direction-id]') || [])].find(
        (item) => item.dataset.supportDirectionId === String(room.id),
      )
      if (!button) return
      button.addEventListener(
        'click',
        (event) => {
          event.preventDefault()
          onDirections?.(room)
        },
        { once: true },
      )
    }, 0)
  }

  function closeRoomPopup() {
    if (roomInfoWindow?.close) roomInfoWindow.close()
    if (activeRoomPopupMarker?.marker?.closePopup) activeRoomPopupMarker.marker.closePopup()
    activeRoomPopupMarker = null
  }

  function showRoomPopup(room, originLabel, onDirections) {
    const map = getMap()
    const marker = roomMarkersById.get(room.id)
    if (!map || !marker) return

    if (getInfoWindow) {
      if (!roomInfoWindow) roomInfoWindow = getInfoWindow()
      roomInfoWindow.setContent(buildRoomPopupHtml(room, originLabel))
      roomInfoWindow.open(map, marker)
      activeRoomPopupMarker = marker
      attachRoomPopupActions(room, onDirections)
      return
    }

    if (marker.bindPopup) {
      marker.bindPopup(buildRoomPopupHtml(room, originLabel), { closeButton: true, autoPan: true }).openPopup()
      activeRoomPopupMarker = marker
      attachRoomPopupActions(room, onDirections)
    }
  }

  function renderRoomMarkers(rooms, onRoomClick) {
    const map = getMap()
    const mapApi = getMapApi()
    if (!map || !mapApi) return

    clearRoomMarkers()
    rooms.forEach((room) => {
      const marker = createCircleMarker(mapApi, map, {
        map,
        position: room.position,
        title: room.name,
        scale: 7,
        fillColor: '#ef4444',
        strokeWeight: 2,
        strokeColor: '#ffffff',
      })
      if (!marker) return

      marker.addListener('click', () => onRoomClick(room))
      roomMarkers.push(marker)
      roomMarkersById.set(room.id, marker)
    })
  }

  function setUserMarker(position) {
    userPosition.value = position
    ensureUserMarker(position)
  }

  function setFilterCenterMarker(position) {
    const map = getMap()
    const mapApi = getMapApi()
    if (!map || !mapApi) return

    if (filterCenterMarker) {
      filterCenterMarker.setPosition(position)
      filterCenterMarker.setMap(map)
      return
    }

    filterCenterMarker = createCircleMarker(mapApi, map, {
      map,
      position,
      title: 'Filtered address',
      scale: 8,
      fillColor: '#7c3aed',
      strokeWeight: 2,
      strokeColor: '#ffffff',
      zIndex: 910,
    })
  }

  function clearFilterCenterMarker() {
    if (filterCenterMarker) filterCenterMarker.setMap(null)
    filterCenterMarker = null
  }

  function panTo(position, minZoom) {
    panBaseMapTo(position, minZoom, minZoom ? { minZoom: true } : undefined)
  }

  async function resolveAddressFromPlaces(address) {
    const resolved = await resolveAddressInput({
      address,
      getGeocoder,
      mapApi: getMapApi(),
      placesService: getPlacesService(),
    })
    const point = toLatLngLiteral(resolved.location)
    if (!point) throw new Error('Address not found. Please pick one from the suggestions.')
    return {
      ...point,
      formattedAddress: resolved.formattedAddress || address,
      name: resolved.name || address,
    }
  }

  function searchAddressSuggestions(query) {
    return searchPlaceSuggestions({
      query,
      mapApi: getMapApi(),
      placesService: getPlacesService(),
      limit: 5,
    })
  }

  async function drawRoute(origin, destination, mode) {
    const travelMode = getTravelMode(mode)
    if (travelMode === undefined) return

    const request = {
      origin,
      destination,
      travelMode,
    }
    if (mode === 'TRANSIT') request.transitOptions = { departureTime: new Date() }

    const result = await directionsRoute(request)
    setDirectionsResult(result, 0)

    const leg = result?.routes?.[0]?.legs?.[0]
    if (leg) {
      routeSummary.value = `${leg.distance?.text || ''} | ${leg.duration?.text || ''}`
      setEndpointMarker('start', leg.start_location)
      setEndpointMarker('dest', leg.end_location)
    }
  }

  function clearSelectedRoute() {
    clearEndpointMarkers()
    clearDirectionsDisplay()
    routeSummary.value = ''
  }

  function setupQueryAutocomplete(input, onPlaceSelected) {
    queryAutocomplete = setupPlaceAutocomplete({
      input,
      mapApi: getMapApi(),
      onPlaceSelected: (place) => {
        onPlaceSelected(toPlacePoint(place, ''))
      },
    })
    return queryAutocomplete
  }

  return {
    routeSummary,
    userPosition,
    clearFilterCenterMarker,
    clearRoomMarkers,
    clearSelectedRoute,
    closeRoomPopup,
    drawRoute,
    panTo,
    renderRoomMarkers,
    resolveAddressFromPlaces,
    searchAddressSuggestions,
    setFilterCenterMarker,
    setUserMarker,
    showRoomPopup,
    setupQueryAutocomplete,
  }
}
