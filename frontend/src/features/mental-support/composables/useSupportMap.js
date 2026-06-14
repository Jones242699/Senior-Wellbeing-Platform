import { ref } from 'vue'
import { clearMarkers, createCircleMarker } from '../../../shared/map/markerHelpers'
import {
  resolvePlaceFromQuery,
  setupPlaceAutocomplete,
  toPlacePoint,
} from '../../../shared/map/placeHelpers'
import { useBaseMap } from '../../../shared/map/useBaseMap'
import { MELBOURNE_CENTER } from '../constants'

export function useSupportMap({ mapContainerRef }) {
  const routeSummary = ref('')
  const userPosition = ref(null)

  let filterCenterMarker
  let _queryAutocomplete
  const roomMarkers = []

  const {
    mapReady,
    clearDirectionsDisplay,
    clearEndpointMarkers,
    directionsRoute,
    ensureUserMarker,
    getMap,
    getMapApi,
    getPlacesService,
    getTravelMode,
    initMap: initBaseMap,
    markMapReady,
    panTo: panBaseMapTo,
    resizeMap,
    setDirectionsResult,
    setEndpointMarker,
  } = useBaseMap({
    mapContainerRef,
    mapOptions: {
      center: MELBOURNE_CENTER,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    },
    directionsRendererOptions: {
      polylineOptions: { strokeColor: '#059669', strokeWeight: 5 },
    },
  })

  async function initMap() {
    await initBaseMap()
    markMapReady()
  }

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
  }

  function panTo(position, minZoom) {
    panBaseMapTo(position, minZoom, minZoom ? { minZoom: true } : undefined)
  }

  async function resolveAddressFromPlaces(address) {
    return resolvePlaceFromQuery({
      address,
      mapApi: getMapApi(),
      placesService: getPlacesService(),
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
    _queryAutocomplete = setupPlaceAutocomplete({
      input,
      mapApi: getMapApi(),
      onPlaceSelected: (place) => {
        onPlaceSelected(toPlacePoint(place, ''))
      },
    })
  }

  return {
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
  }
}
