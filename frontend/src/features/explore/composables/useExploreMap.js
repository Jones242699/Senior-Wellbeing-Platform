import { useBaseMap } from '../../../shared/map/useBaseMap'
import {
  CITY_OF_MELBOURNE_BOUNDS,
  CITY_OF_MELBOURNE_MAP_BOUNDS,
  MELBOURNE,
} from '../../my-routes/constants'

export function useExploreMap({ mapContainerRef }) {
  const {
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
    initMap: initBaseMap,
    mapReady,
    markMapReady,
    panTo,
    resizeMap,
    setDirectionsResult,
    setEndpointMarker,
  } = useBaseMap({
    mapContainerRef,
    mapOptions: {
      center: MELBOURNE,
      zoom: 14,
      minZoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      restriction: {
        latLngBounds: CITY_OF_MELBOURNE_MAP_BOUNDS,
        maskBounds: CITY_OF_MELBOURNE_BOUNDS,
      },
    },
    directionsRendererOptions: {
      polylineOptions: {
        strokeColor: '#16a34a',
        strokeWeight: 5,
      },
    },
  })

  async function initExploreMap() {
    await initBaseMap()
    markMapReady()
    resizeMap()
  }

  function resetMapView() {
    const map = getMap()
    if (!map) return
    map.setCenter(MELBOURNE)
    if (map.getZoom() < 13) map.setZoom(14)
  }

  return {
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
    initExploreMap,
    mapReady,
    panTo,
    resetMapView,
    resizeMap,
    setDirectionsResult,
    setEndpointMarker,
  }
}
