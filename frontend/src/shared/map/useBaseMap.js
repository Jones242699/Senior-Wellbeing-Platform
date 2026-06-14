import { ref } from 'vue'
import { loadMapApi } from '../../utils/osmMaps'

const DEFAULT_ENDPOINT_ICON = {
  fillColor: '#dc2626',
  scale: 13,
  strokeColor: '#ffffff',
  strokeWeight: 3,
}

export function useBaseMap({
  directionsRendererOptions = {},
  endpointIcon = DEFAULT_ENDPOINT_ICON,
  mapContainerRef,
  mapOptions,
  userMarkerIcon = {},
}) {
  const mapReady = ref(false)

  let mapApi
  let map
  let geocoder
  let directionsService
  let directionsRenderer
  let placesService
  let infoWindow
  let userMarker
  let startMarker
  let destMarker

  function getMapApi() {
    return mapApi
  }

  function getMap() {
    return map
  }

  function getGeocoder() {
    return geocoder
  }

  function getPlacesService() {
    return placesService
  }

  function getInfoWindow() {
    return infoWindow
  }

  async function initMap() {
    mapApi = await loadMapApi()
    map = new mapApi.Map(mapContainerRef.value, mapOptions)

    geocoder = new mapApi.Geocoder()
    directionsService = new mapApi.DirectionsService()
    directionsRenderer = new mapApi.DirectionsRenderer({
      map,
      suppressMarkers: true,
      ...directionsRendererOptions,
    })
    placesService = new mapApi.places.PlacesService(map)
    infoWindow = new mapApi.InfoWindow()
  }

  function markMapReady() {
    mapReady.value = true
  }

  function resizeMap() {
    if (!mapApi || !map) return
    mapApi.event.trigger(map, 'resize')
  }

  function createLatLng(lat, lng) {
    return new mapApi.LatLng(lat, lng)
  }

  function ensureUserMarker(position, markerOptions = {}) {
    if (!map || !mapApi) return

    if (userMarker) {
      userMarker.setPosition(position)
      userMarker.setMap(map)
      return
    }

    userMarker = new mapApi.Marker({
      map,
      position,
      title: 'Your location',
      zIndex: 999,
      icon: {
        path: mapApi.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        ...userMarkerIcon,
        ...markerOptions.icon,
      },
      ...markerOptions,
    })
  }

  function setEndpointMarker(kind, position) {
    if (!map || !mapApi) return

    const isStart = kind === 'start'
    const label = isStart ? 'S' : 'D'
    const markerRef = isStart ? startMarker : destMarker

    if (markerRef) {
      markerRef.setPosition(position)
      markerRef.setMap(map)
      return
    }

    const marker = new mapApi.Marker({
      map,
      position,
      zIndex: 900,
      icon: {
        path: mapApi.SymbolPath.CIRCLE,
        fillOpacity: 1,
        ...endpointIcon,
      },
      label: {
        text: label,
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '800',
      },
    })

    if (isStart) startMarker = marker
    else destMarker = marker
  }

  function panTo(position, zoomOrMinZoom, options = {}) {
    if (!map) return
    map.panTo(position)
    if (!zoomOrMinZoom) return

    if (options.minZoom) {
      if (map.getZoom() < zoomOrMinZoom) map.setZoom(zoomOrMinZoom)
      return
    }

    map.setZoom(zoomOrMinZoom)
  }

  function canRoute() {
    return Boolean(directionsService && directionsRenderer)
  }

  function getTravelMode(modeId) {
    return mapApi?.TravelMode?.[modeId]
  }

  function directionsRoute(request) {
    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === mapApi.DirectionsStatus.OK && result) {
          resolve(result)
          return
        }

        const msg =
          status === mapApi.DirectionsStatus.ZERO_RESULTS
            ? 'No route found. Try another travel mode or adjust locations.'
            : `Route planning failed (${status}).`
        reject(new Error(msg))
      })
    })
  }

  function setDirectionsResult(result, routeIndex = 0) {
    directionsRenderer.setDirections(result)
    directionsRenderer.setRouteIndex(routeIndex)
  }

  /** Clear polyline from map; `setDirections(null)` throws InvalidValueError in Maps JS API. */
  function clearDirectionsDisplay() {
    if (!directionsRenderer) return
    directionsRenderer.setDirections({ routes: [] })
  }

  function clearEndpointMarkers() {
    if (startMarker) startMarker.setMap(null)
    startMarker = null
    if (destMarker) destMarker.setMap(null)
    destMarker = null
  }

  function cleanupMap() {
    if (userMarker) userMarker.setMap(null)
    userMarker = null
    clearEndpointMarkers()
    directionsRenderer?.setMap(null)
    directionsRenderer = null
  }

  return {
    mapReady,
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
    initMap,
    markMapReady,
    panTo,
    resizeMap,
    setDirectionsResult,
    setEndpointMarker,
  }
}
