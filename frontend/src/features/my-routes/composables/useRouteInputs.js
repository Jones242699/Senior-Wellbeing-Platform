import { ref } from 'vue'
import {
  LOCATION_ACCESS_ERROR,
  MELBOURNE_CBD,
  assertWithinSupportedArea,
} from '../../../shared/map/locationRules'
import { resolveAddressInput } from '../../../shared/map/addressResolver'
import { setupPlaceAutocomplete } from '../../../shared/map/placeHelpers'

export function useRouteInputs({
  ensureUserMarker,
  getGeocoder,
  getMap,
  getMapApi,
  getPlacesService,
}) {
  const startInputRef = ref(null)
  const destInputRef = ref(null)
  const startLocation = ref('Melbourne CBD')
  const destination = ref('')
  const originMode = ref('manual') // 'manual' | 'current'
  const userLatLng = ref(null)

  let startPlace = null
  let endPlace = null
  let _startAutocomplete = null
  let _endAutocomplete = null
  /** @type {number | null} */
  let geoWatchId = null

  function setStartInput(element) {
    startInputRef.value = element
  }

  function setDestInput(element) {
    destInputRef.value = element
  }

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

  function requestCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const pos = { lat: coords.latitude, lng: coords.longitude }
          userLatLng.value = pos
          ensureUserMarker(pos)
          resolve(pos)
        },
        (err) => {
          console.warn('Geolocation error:', err)
          reject(new Error(LOCATION_ACCESS_ERROR))
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      )
    })
  }

  function setupAutocomplete() {
    const startEl = startInputRef.value
    const endEl = destInputRef.value
    const mapApi = getMapApi()
    if (!startEl || !endEl || !mapApi?.places) return

    _startAutocomplete = setupPlaceAutocomplete({
      input: startEl,
      mapApi,
      onPlaceSelected: (p) => {
        startPlace = p?.geometry?.location ? p : null
        if (p?.formatted_address) startLocation.value = p.formatted_address
        originMode.value = 'manual'
      },
    })
    _endAutocomplete = setupPlaceAutocomplete({
      input: endEl,
      mapApi,
      onPlaceSelected: (p) => {
        endPlace = p?.geometry?.location ? p : null
        if (p?.formatted_address) destination.value = p.formatted_address
      },
    })
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

  function onStartInput() {
    startPlace = null
    originMode.value = 'manual'
  }

  function onDestInput() {
    endPlace = null
  }

  function useCurrentLocationStart() {
    originMode.value = 'current'
    startPlace = null
    startLocation.value = 'Current location'
  }

  function hasDestinationInput() {
    return Boolean(destination.value.trim() || endPlace)
  }

  function setDestinationFromQuery(value) {
    destination.value = value
    endPlace = null
  }

  function setResolvedDestination(location, formattedAddress, rawText) {
    endPlace = normalizePlaceFromResolvedLocation(location, formattedAddress, rawText)
  }

  return {
    destination,
    destInputRef,
    originMode,
    startInputRef,
    startLocation,
    userLatLng,
    assertWithinMelbourne,
    clearGeoWatch,
    hasDestinationInput,
    onDestInput,
    onStartInput,
    parseQueryLatLng,
    requestCurrentPosition,
    resolveDestination,
    resolveOrigin,
    setDestInput,
    setDestinationFromQuery,
    setResolvedDestination,
    setStartInput,
    setupAutocomplete,
    useCurrentLocationStart,
    watchPositionIfSupported,
  }
}
