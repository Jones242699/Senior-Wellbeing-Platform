import { ref } from 'vue'
import { loadMapApi } from '../../../utils/osmMaps'
import { CITY_OF_MELBOURNE_BOUNDS, CITY_OF_MELBOURNE_MAP_BOUNDS, MELBOURNE } from '../constants'

export function useRouteMap({ mapContainerRef }) {
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
    map = new mapApi.Map(mapContainerRef.value, {
      center: MELBOURNE,
      zoom: 14,
      minZoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      restriction: {
        latLngBounds: CITY_OF_MELBOURNE_MAP_BOUNDS,
        maskBounds: CITY_OF_MELBOURNE_BOUNDS,
      },
    })

    geocoder = new mapApi.Geocoder()
    directionsService = new mapApi.DirectionsService()
    directionsRenderer = new mapApi.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#16a34a',
        strokeWeight: 5,
      },
    })
    placesService = new mapApi.places.PlacesService(map)
    infoWindow = new mapApi.InfoWindow()
  }

  function markMapReady() {
    mapReady.value = true
  }

  function createLatLng(lat, lng) {
    return new mapApi.LatLng(lat, lng)
  }

  function ensureUserMarker(position) {
    if (!map || !mapApi) return

    if (userMarker) {
      userMarker.setPosition(position)
      userMarker.setMap(map)
    } else {
      userMarker = new mapApi.Marker({
        map,
        position,
        title: 'Your location',
        zIndex: 999,
        icon: {
          path: mapApi.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      })
    }
  }

  function setEndpointMarker(kind, position) {
    if (!map || !mapApi) return

    const isStart = kind === 'start'
    const label = isStart ? 'S' : 'D'
    const markerRef = isStart ? startMarker : destMarker

    const icon = {
      path: mapApi.SymbolPath.CIRCLE,
      scale: 13,
      fillColor: '#dc2626',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    }

    if (markerRef) {
      markerRef.setPosition(position)
      markerRef.setMap(map)
      return
    }

    const marker = new mapApi.Marker({
      map,
      position,
      zIndex: 900,
      icon,
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

  function panTo(position, zoom) {
    if (!map) return
    map.panTo(position)
    if (zoom) map.setZoom(zoom)
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
        } else {
          const msg =
            status === mapApi.DirectionsStatus.ZERO_RESULTS
              ? 'No route found. Try another travel mode or adjust locations.'
              : `Route planning failed (${status}).`
          reject(new Error(msg))
        }
      })
    })
  }

  function setDirectionsResult(result, routeIndex) {
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
    setDirectionsResult,
    setEndpointMarker,
  }
}
