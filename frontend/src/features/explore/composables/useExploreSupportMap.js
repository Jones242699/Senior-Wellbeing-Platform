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

  function clearRoomMarkers() {
    clearMarkers(roomMarkers)
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
    drawRoute,
    panTo,
    renderRoomMarkers,
    resolveAddressFromPlaces,
    searchAddressSuggestions,
    setFilterCenterMarker,
    setUserMarker,
    setupQueryAutocomplete,
  }
}
