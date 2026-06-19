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
  ensureUserMarker,
  getGeocoder,
  getInfoWindow,
  getMap,
  getMapApi,
  getPlacesService,
  panTo: panBaseMapTo,
}) {
  const userPosition = ref(null)

  let filterCenterMarker
  let queryAutocomplete
  const roomMarkers = []
  let roomMarkersById = new Map()
  let roomInfoWindow = null
  let activeRoomPopupMarker = null
  let activeRoomMarkerId = null

  function buildRoomMarkerIcon(isActive = false) {
    const mapApi = getMapApi()
    if (!mapApi?.SymbolPath) return undefined
    return {
      path: mapApi.SymbolPath.CIRCLE,
      scale: isActive ? 8 : 5,
      fillColor: '#ef4444',
      fillOpacity: 1,
      strokeColor: isActive ? '#111827' : '#ffffff',
      strokeWeight: isActive ? 3 : 2,
    }
  }

  function syncRoomMarkerVisuals(roomId = activeRoomMarkerId) {
    activeRoomMarkerId = roomId ?? null
    roomMarkersById.forEach((marker, id) => {
      if (marker?.setIcon) marker.setIcon(buildRoomMarkerIcon(String(id) === String(activeRoomMarkerId)))
      if (marker?.setZIndex) marker.setZIndex(String(id) === String(activeRoomMarkerId) ? 920 : 10)
    })
  }

  function clearRoomMarkers() {
    closeRoomPopup()
    clearMarkers(roomMarkers)
    roomMarkersById = new Map()
    activeRoomMarkerId = null
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function normalizeExternalUrl(url) {
    const text = String(url || '').trim()
    if (!text) return ''
    return /^https?:\/\//i.test(text) ? text : `https://${text}`
  }

  function getTodayOpenHours(openHours) {
    if (!openHours) return ''
    const dayKey = new Intl.DateTimeFormat('en-AU', { weekday: 'long' })
      .format(new Date())
      .toLowerCase()
    return openHours[dayKey] || ''
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
    const phone = room.phone
      ? `<p class="support-popup-line"><strong>Phone:</strong> ${escapeHtml(room.phone)}</p>`
      : ''
    const rating =
      room.rating !== null && room.rating !== undefined && room.rating !== ''
        ? `<p class="support-popup-line"><strong>Rating:</strong> ${escapeHtml(room.rating)} / 5</p>`
        : ''
    const todayHours = getTodayOpenHours(room.openHours)
    const hours = todayHours
      ? `<p class="support-popup-line"><strong>Today:</strong> ${escapeHtml(todayHours)}</p>`
      : ''
    const websiteUrl = normalizeExternalUrl(room.website)
    const website = websiteUrl
      ? `<a class="support-popup-link" href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer">Website</a>`
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
        ${phone}
        ${rating}
        ${hours}
        ${website}
        <div class="support-popup-actions">
          <button
            type="button"
            class="support-popup-more-btn"
            data-support-more-id="${escapeHtml(room.id)}"
          >
            More info
          </button>
          <button
            type="button"
            class="support-popup-direction-btn"
            data-support-direction-id="${escapeHtml(room.id)}"
          >
            Direction
          </button>
        </div>
      </div>
    `
  }

  function attachRoomPopupActions(room, onDirections, onMoreInfo) {
    window.setTimeout(() => {
      const directionButton = [...document.querySelectorAll('[data-support-direction-id]')].find(
        (item) => item.dataset.supportDirectionId === String(room.id),
      )
      const moreInfoButton = [...document.querySelectorAll('[data-support-more-id]')].find(
        (item) => item.dataset.supportMoreId === String(room.id),
      )
      directionButton?.addEventListener(
        'click',
        (event) => {
          event.preventDefault()
          event.stopPropagation()
          onDirections?.(room)
        },
        { once: true },
      )
      moreInfoButton?.addEventListener(
        'click',
        (event) => {
          event.preventDefault()
          event.stopPropagation()
          onMoreInfo?.(room)
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

  function showRoomPopup(room, originLabel, onDirections, onMoreInfo) {
    const map = getMap()
    const marker = roomMarkersById.get(room.id)
    if (!map || !marker) return

    syncRoomMarkerVisuals(room.id)
    panBaseMapTo(room.position, 15, { minZoom: true })

    if (getInfoWindow) {
      if (!roomInfoWindow) roomInfoWindow = getInfoWindow()
      roomInfoWindow.setContent(buildRoomPopupHtml(room, originLabel))
      roomInfoWindow.open(map, marker)
      activeRoomPopupMarker = marker
      attachRoomPopupActions(room, onDirections, onMoreInfo)
      return
    }

    if (marker.bindPopup) {
      marker.bindPopup(buildRoomPopupHtml(room, originLabel), { closeButton: true, autoPan: true }).openPopup()
      activeRoomPopupMarker = marker
      attachRoomPopupActions(room, onDirections, onMoreInfo)
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
        scale: 5,
        fillColor: '#ef4444',
        strokeWeight: 2,
        strokeColor: '#ffffff',
      })
      if (!marker) return

      marker.addListener('click', () => onRoomClick(room))
      roomMarkers.push(marker)
      roomMarkersById.set(room.id, marker)
    })
    syncRoomMarkerVisuals()
  }

  function setUserMarker(position) {
    userPosition.value = position
    if (!position) return
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
    userPosition,
    clearFilterCenterMarker,
    clearRoomMarkers,
    closeRoomPopup,
    panTo,
    renderRoomMarkers,
    resolveAddressFromPlaces,
    searchAddressSuggestions,
    setFilterCenterMarker,
    setUserMarker,
    showRoomPopup,
    syncRoomMarkerVisuals,
    setupQueryAutocomplete,
  }
}
