import { useBaseMap } from '../../../shared/map/useBaseMap'
import { CITY_OF_MELBOURNE_BOUNDS, CITY_OF_MELBOURNE_MAP_BOUNDS, MELBOURNE } from '../constants'

export function useRouteMap({ mapContainerRef }) {
  return useBaseMap({
    mapContainerRef,
    mapOptions: {
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
    },
    directionsRendererOptions: {
      polylineOptions: {
        strokeColor: '#16a34a',
        strokeWeight: 5,
      },
    },
    userMarkerIcon: {
      scale: 12,
      fillColor: '#22c55e',
      strokeWeight: 3,
    },
  })
}
