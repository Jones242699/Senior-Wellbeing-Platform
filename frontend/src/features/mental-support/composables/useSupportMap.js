import { ref } from 'vue'
import { loadMapApi } from '../../../utils/osmMaps'
import { MELBOURNE_CENTER } from '../constants'

export function useSupportMap({ mapContainerRef }) {
  const mapReady = ref(false)
  const routeSummary = ref('')
  const userPosition = ref(null)

  let mapApi
  let map
  let userMarker
  let filterCenterMarker
  let directionsService
  let directionsRenderer
  let placesService
  let queryAutocomplete
  const roomMarkers = []
  let startMarker = null
  let destMarker = null

  function getMapApi() {
    return mapApi
  }

  async function initMap() {
    mapApi = await loadMapApi()

    map = new mapApi.Map(mapContainerRef.value, {
      center: MELBOURNE_CENTER,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })

    directionsService = new mapApi.DirectionsService()
    placesService = new mapApi.places.PlacesService(map)
    directionsRenderer = new mapApi.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#059669', strokeWeight: 5 },
    })

    mapReady.value = true
  }

  function resizeMap() {
    if (!mapApi || !map) return
    mapApi.event.trigger(map, 'resize')
  }

  function clearRoomMarkers() {
    roomMarkers.forEach((marker) => marker.setMap(null))
    roomMarkers.length = 0
  }

  function renderRoomMarkers(rooms, onRoomClick) {
    if (!map || !mapApi) return

    clearRoomMarkers()
    rooms.forEach((room) => {
      const marker = new mapApi.Marker({
        map,
        position: room.position,
        title: room.name,
        icon: {
          path: mapApi.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
      })

      marker.addListener('click', () => onRoomClick(room))
      roomMarkers.push(marker)
    })
  }

  function setUserMarker(position) {
    if (!map || !mapApi) return

    userPosition.value = position
    if (userMarker) {
      userMarker.setPosition(position)
    } else {
      userMarker = new mapApi.Marker({
        map,
        position,
        title: 'Your location',
        icon: {
          path: mapApi.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
        },
      })
    }
  }

  function setFilterCenterMarker(position) {
    if (!map || !mapApi) return

    if (filterCenterMarker) {
      filterCenterMarker.setPosition(position)
      filterCenterMarker.setMap(map)
      return
    }

    filterCenterMarker = new mapApi.Marker({
      map,
      position,
      title: 'Filtered address',
      icon: {
        path: mapApi.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#7c3aed',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
      },
      zIndex: 910,
    })
  }

  function clearFilterCenterMarker() {
    if (filterCenterMarker) filterCenterMarker.setMap(null)
  }

  function setEndpointMarker(kind, position) {
    if (!map || !mapApi) return

    const isStart = kind === 'start'
    const labelText = isStart ? 'S' : 'D'

    const icon = {
      path: mapApi.SymbolPath.CIRCLE,
      scale: 13,
      fillColor: '#dc2626',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
    }

    if (isStart && startMarker) {
      startMarker.setPosition(position)
      startMarker.setMap(map)
      return
    }
    if (!isStart && destMarker) {
      destMarker.setPosition(position)
      destMarker.setMap(map)
      return
    }

    const marker = new mapApi.Marker({
      map,
      position,
      zIndex: 900,
      icon,
      label: {
        text: labelText,
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '800',
      },
    })

    if (isStart) startMarker = marker
    else destMarker = marker
  }

  function panTo(position, minZoom) {
    if (!map) return
    map.panTo(position)
    if (minZoom && map.getZoom() < minZoom) map.setZoom(minZoom)
  }

  async function resolveAddressFromPlaces(address) {
    if (!placesService) throw new Error('Map is not ready yet.')
    return new Promise((resolve, reject) => {
      placesService.findPlaceFromQuery(
        {
          query: address,
          fields: ['geometry', 'formatted_address', 'name'],
        },
        (results, status) => {
          if (
            status === mapApi.places.PlacesServiceStatus.OK &&
            results?.[0]?.geometry?.location
          ) {
            const location = results[0].geometry.location
            const fallbackLabel = results[0].name || address
            const formattedAddress = results[0].formatted_address || fallbackLabel
            resolve({
              lat: location.lat(),
              lng: location.lng(),
              formattedAddress,
            })
            return
          }
          reject(new Error('Address not found. Please pick one from the suggestions.'))
        },
      )
    })
  }

  async function drawRoute(origin, destination, mode) {
    if (!directionsService || !directionsRenderer || !mapApi) return

    const request = {
      origin,
      destination,
      travelMode: mapApi.TravelMode[mode],
    }
    if (mode === 'TRANSIT') request.transitOptions = { departureTime: new Date() }

    const result = await directionsService.route(request)

    directionsRenderer.setDirections(result)
    const leg = result?.routes?.[0]?.legs?.[0]
    if (leg) {
      routeSummary.value = `${leg.distance?.text || ''} | ${leg.duration?.text || ''}`
      setEndpointMarker('start', leg.start_location)
      setEndpointMarker('dest', leg.end_location)
    }
  }

  function clearSelectedRoute() {
    if (startMarker) startMarker.setMap(null)
    if (destMarker) destMarker.setMap(null)
    directionsRenderer?.setDirections({ routes: [] })
    routeSummary.value = ''
  }

  function setupQueryAutocomplete(input, onPlaceSelected) {
    if (!input || !mapApi?.places) return

    queryAutocomplete = new mapApi.places.Autocomplete(input, {
      fields: ['geometry', 'formatted_address', 'name'],
      componentRestrictions: { country: 'au' },
    })

    queryAutocomplete.addListener('place_changed', () => {
      const place = queryAutocomplete.getPlace()
      if (!place?.geometry?.location) return
      onPlaceSelected({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        formattedAddress: place.formatted_address || place.name || '',
      })
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
