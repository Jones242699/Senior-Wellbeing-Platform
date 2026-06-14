import { ref } from 'vue'
import { setupPlaceAutocomplete, toPlacePoint } from '../../../shared/map/placeHelpers'
import { MELBOURNE_METRO_BOUNDS } from './useDiscoverPlaces'

export function useDiscoverLocation({ currentPage, loadDiscoverMapApi, locationUnavailable, userLocation }) {
  const addressQuery = ref('')
  const addressInputRef = ref(null)
  const applyingAddressFilter = ref(false)
  const addressFilterError = ref('')
  const locationMode = ref('none') // none | device | address

  let geocoder = null
  let addressAutocomplete = null
  let geoWatchId = null

  function setAddressInput(element) {
    addressInputRef.value = element
  }

  function clearGeoWatch() {
    if (geoWatchId !== null && navigator.geolocation?.clearWatch) {
      navigator.geolocation.clearWatch(geoWatchId)
      geoWatchId = null
    }
  }

  function watchDeviceLocation() {
    if (!navigator.geolocation?.watchPosition) return
    clearGeoWatch()
    geoWatchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (locationMode.value !== 'device') return
        userLocation.value = { lat: coords.latitude, lng: coords.longitude }
        locationUnavailable.value = false
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    )
  }

  async function requestBrowserLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        locationUnavailable.value = true
        locationMode.value = 'none'
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          userLocation.value = { lat: coords.latitude, lng: coords.longitude }
          locationUnavailable.value = false
          locationMode.value = 'device'
          resolve(userLocation.value)
        },
        () => {
          locationUnavailable.value = true
          if (locationMode.value === 'device' || locationMode.value === 'none') {
            userLocation.value = null
            locationMode.value = 'none'
          }
          resolve(null)
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
      )
    })
  }

  function isWithinMelbourneMetro(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
    return (
      lat >= MELBOURNE_METRO_BOUNDS.minLat &&
      lat <= MELBOURNE_METRO_BOUNDS.maxLat &&
      lng >= MELBOURNE_METRO_BOUNDS.minLng &&
      lng <= MELBOURNE_METRO_BOUNDS.maxLng
    )
  }

  function assertWithinMelbourne(lat, lng, label = 'Address') {
    if (!isWithinMelbourneMetro(lat, lng)) {
      throw new Error(
        `${label} is outside Melbourne. Please enter an address within metropolitan Melbourne.`,
      )
    }
  }

  async function ensureGeocoder() {
    const mapApi = await loadDiscoverMapApi()
    if (!geocoder && mapApi?.Geocoder) geocoder = new mapApi.Geocoder()
    return mapApi
  }

  async function setupAddressAutocomplete() {
    const input = addressInputRef.value
    const mapApi = await loadDiscoverMapApi()
    if (!input || !mapApi?.places) return

    addressAutocomplete = setupPlaceAutocomplete({
      input,
      mapApi,
      fields: ['geometry', 'formatted_address'],
      onPlaceSelected: () => {},
    })
  }

  async function resolveAddressCoordinates() {
    const keyword = addressQuery.value.trim()
    if (!keyword) throw new Error('Please enter an address first.')

    const place = addressAutocomplete?.getPlace?.()
    const placePoint = toPlacePoint(place, keyword)
    if (placePoint) {
      assertWithinMelbourne(placePoint.lat, placePoint.lng, 'Address')
      return {
        lat: placePoint.lat,
        lng: placePoint.lng,
        formattedAddress: placePoint.formattedAddress || keyword,
      }
    }

    await ensureGeocoder()
    if (!geocoder) throw new Error('Address lookup is unavailable right now.')

    const result = await geocoder.geocode({ address: keyword, region: 'au' })
    const first = result?.results?.[0]
    if (!first?.geometry?.location)
      throw new Error('Address not found. Please try a clearer address.')

    const geocodedPoint = toPlacePoint(first, keyword)
    if (!geocodedPoint) throw new Error('Address not found. Please try a clearer address.')
    assertWithinMelbourne(geocodedPoint.lat, geocodedPoint.lng, 'Address')

    return {
      lat: geocodedPoint.lat,
      lng: geocodedPoint.lng,
      formattedAddress: geocodedPoint.formattedAddress || keyword,
    }
  }

  async function applyAddressFilter() {
    addressFilterError.value = ''
    applyingAddressFilter.value = true
    try {
      const target = await resolveAddressCoordinates()
      userLocation.value = { lat: target.lat, lng: target.lng }
      addressQuery.value = target.formattedAddress
      locationMode.value = 'address'
      locationUnavailable.value = false
      currentPage.value = 1
      clearGeoWatch()
    } catch (error) {
      addressFilterError.value = error?.message || 'Failed to apply address filter.'
    } finally {
      applyingAddressFilter.value = false
    }
  }

  async function useMyLocation() {
    addressFilterError.value = ''
    const position = await requestBrowserLocation()
    if (!position) {
      addressFilterError.value =
        'Unable to get your location. Please allow location access in browser settings.'
      return
    }
    currentPage.value = 1
    watchDeviceLocation()
  }

  return {
    addressQuery,
    applyingAddressFilter,
    addressFilterError,
    locationMode,
    applyAddressFilter,
    clearGeoWatch,
    requestBrowserLocation,
    setAddressInput,
    setupAddressAutocomplete,
    useMyLocation,
    watchDeviceLocation,
  }
}
