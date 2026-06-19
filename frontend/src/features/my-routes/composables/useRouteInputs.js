import { ref } from 'vue'
import {
  MELBOURNE_CBD,
  assertWithinSupportedArea,
} from '../../../shared/map/locationRules'
import { resolveAddressInput } from '../../../shared/map/addressResolver'
import {
  resolveCurrentLocation,
  resolveCurrentLocationAddress,
} from '../../../shared/map/currentLocation'
import {
  resolvePlaceSuggestionLocation,
  searchPlaceSuggestions,
} from '../../../shared/map/placeHelpers'

export function useRouteInputs({
  ensureUserMarker,
  getGeocoder,
  getMap,
  getMapApi,
  getPlacesService,
}) {
  const startLocation = ref('Melbourne CBD')
  const destination = ref('')
  const originMode = ref('manual') // 'manual' | 'current'
  const userLatLng = ref(null)

  let startPlace = null
  let endPlace = null
  /** @type {number | null} */
  let geoWatchId = null

  function assertWithinMelbourne(point, label) {
    return assertWithinSupportedArea(point, label)
  }

  function watchPositionIfSupported() {
    if (!navigator.geolocation?.watchPosition) return

    if (geoWatchId !== null) {
      navigator.geolocation.clearWatch(geoWatchId)
      geoWatchId = null
    }

    geoWatchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude }
        userLatLng.value = pos
        ensureUserMarker(pos)
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
  }

  function clearGeoWatch() {
    if (geoWatchId !== null && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(geoWatchId)
      geoWatchId = null
    }
  }

  async function requestCurrentPosition() {
    const { position } = await resolveCurrentLocation({
      getGeocoder,
      getMapApi,
      label: 'Current location',
    })
    userLatLng.value = position
    ensureUserMarker(position)
    return position
  }

  async function geocodeToLatLng(address) {
    return resolveAddressInput({
      address,
      getGeocoder,
      mapApi: getMapApi(),
      placesService: getPlacesService(),
    })
  }

  function parseQueryLatLng(rawLat, rawLng) {
    const lat = Number(rawLat)
    const lng = Number(rawLng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  }

  function normalizePlaceFromResolvedLocation(location, formattedAddress, rawText) {
    return {
      geometry: { location },
      formatted_address: formattedAddress || rawText,
      name: rawText,
    }
  }

  function normalizePlaceFromSuggestion(suggestion) {
    const location = suggestion?.place?.geometry?.location || {
      lat: suggestion?.lat,
      lng: suggestion?.lng,
    }
    return normalizePlaceFromResolvedLocation(
      location,
      suggestion?.formattedAddress || suggestion?.name || '',
      suggestion?.name || suggestion?.formattedAddress || '',
    )
  }

  function searchAddressSuggestions(query) {
    return searchPlaceSuggestions({
      query,
      mapApi: getMapApi(),
      placesService: getPlacesService(),
      limit: 5,
    })
  }

  function resolveSuggestionLocation(suggestion) {
    return resolvePlaceSuggestionLocation({
      suggestion,
      mapApi: getMapApi(),
      placesService: getPlacesService(),
    })
  }

  async function resolveOrigin() {
    const text = startLocation.value.trim()

    if (originMode.value === 'current' || /^current\s*location$/i.test(text)) {
      if (userLatLng.value) return assertWithinMelbourne(userLatLng.value, 'Start location')

      const pos = await requestCurrentPosition()
      assertWithinMelbourne(pos, 'Start location')
      const map = getMap()
      map.panTo(pos)
      map.setZoom(16)
      watchPositionIfSupported()
      return pos
    }

    if (startPlace?.geometry?.location) {
      return assertWithinMelbourne(startPlace.geometry.location, 'Start location')
    }

    if (!text) {
      return MELBOURNE_CBD
    }

    if (/^melbourne\s+cbd$/i.test(text)) {
      return MELBOURNE_CBD
    }

    const resolved = await geocodeToLatLng(text)
    return assertWithinMelbourne(resolved.location, 'Start location')
  }

  async function resolveDestination() {
    if (endPlace?.geometry?.location) {
      return assertWithinMelbourne(endPlace.geometry.location, 'Destination')
    }

    const text = destination.value.trim()
    if (!text) {
      throw new Error('Please enter a destination.')
    }

    const resolved = await geocodeToLatLng(text)
    if (!endPlace?.geometry?.location) {
      endPlace = normalizePlaceFromResolvedLocation(
        resolved.location,
        resolved.formattedAddress,
        resolved.name || text,
      )
      destination.value = resolved.formattedAddress || text
    }
    return assertWithinMelbourne(resolved.location, 'Destination')
  }

  async function validateStartLocationInput() {
    const text = startLocation.value.trim()
    if (!text || /^melbourne\s+cbd$/i.test(text) || /^current\s*location$/i.test(text)) {
      return
    }

    if (startPlace?.geometry?.location) {
      assertWithinMelbourne(startPlace.geometry.location, 'Start location')
      return
    }

    const resolved = await geocodeToLatLng(text)
    assertWithinMelbourne(resolved.location, 'Start location')
  }

  function onStartInput() {
    startPlace = null
    originMode.value = 'manual'
  }

  function onDestInput() {
    endPlace = null
  }

  async function useCurrentLocationStart(position = userLatLng.value) {
    if (!position) {
      const current = await resolveCurrentLocation({
        getGeocoder,
        getMapApi,
        label: 'Current location',
      })
      userLatLng.value = current.position
      ensureUserMarker(current.position)
      originMode.value = 'current'
      startPlace = normalizePlaceFromResolvedLocation(
        current.position,
        current.place.formattedAddress,
        current.place.name || 'Current location',
      )
      startLocation.value = current.place.formattedAddress
      return current.position
    }

    const current = await resolveCurrentLocationAddress({
      getGeocoder,
      getMapApi,
      label: 'Current location',
      position,
    })

    originMode.value = 'current'
    startPlace = normalizePlaceFromResolvedLocation(
      current.position,
      current.place.formattedAddress,
      current.place.name || 'Current location',
    )
    startLocation.value = current.place.formattedAddress
    return current.position
  }

  function setDestinationFromQuery(value) {
    destination.value = value
    endPlace = null
  }

  function setResolvedOriginFromSuggestion(suggestion) {
    startPlace = normalizePlaceFromSuggestion(suggestion)
    startLocation.value = startPlace.formatted_address || startPlace.name || ''
    originMode.value = 'manual'
  }

  function setResolvedDestinationFromSuggestion(suggestion) {
    endPlace = normalizePlaceFromSuggestion(suggestion)
    destination.value = endPlace.formatted_address || endPlace.name || ''
  }

  function setResolvedOrigin(location, formattedAddress, rawText) {
    startPlace = normalizePlaceFromResolvedLocation(location, formattedAddress, rawText)
    startLocation.value = startPlace.formatted_address || startPlace.name || ''
    originMode.value = 'manual'
  }

  function setResolvedDestination(location, formattedAddress, rawText) {
    endPlace = normalizePlaceFromResolvedLocation(location, formattedAddress, rawText)
  }

  return {
    destination,
    originMode,
    startLocation,
    userLatLng,
    assertWithinMelbourne,
    clearGeoWatch,
    onDestInput,
    onStartInput,
    parseQueryLatLng,
    requestCurrentPosition,
    resolveDestination,
    resolveOrigin,
    resolveSuggestionLocation,
    searchAddressSuggestions,
    setDestinationFromQuery,
    setResolvedDestination,
    setResolvedDestinationFromSuggestion,
    setResolvedOrigin,
    setResolvedOriginFromSuggestion,
    useCurrentLocationStart,
    validateStartLocationInput,
    watchPositionIfSupported,
  }
}
