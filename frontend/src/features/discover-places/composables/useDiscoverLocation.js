import { ref } from 'vue'
import {
  GEOLOCATION_PERMISSION_ERROR,
  LOCATION_ACCESS_ERROR,
  assertWithinSupportedArea,
  buildOutsideSupportedAreaMessage,
  getGeolocationErrorMessage,
  getGeolocationPermissionState,
  isWithinBounds,
  toLatLngLiteral,
} from '../../../shared/map/locationRules'
import {
  resolveAddressInput,
  reverseGeocodeLocation,
} from '../../../shared/map/addressResolver'
import { searchPlaceSuggestions } from '../../../shared/map/placeHelpers'

export function useDiscoverLocation({
  currentPage,
  getGeocoder,
  getPlacesService,
  loadDiscoverMapApi,
  locationUnavailable,
  userLocation,
}) {
  const addressQuery = ref('')
  const selectedAddressPlace = ref(null)
  const applyingAddressFilter = ref(false)
  const addressFilterError = ref('')
  const locationMode = ref('none') // none | device | address
  const locationErrorMessage = ref('')

  let geoWatchId = null

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
        const position = { lat: coords.latitude, lng: coords.longitude }
        if (!isWithinBounds(position)) {
          locationErrorMessage.value = buildOutsideSupportedAreaMessage('Current location')
          locationUnavailable.value = true
          userLocation.value = null
          locationMode.value = 'none'
          clearGeoWatch()
          return
        }
        userLocation.value = position
        locationUnavailable.value = false
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    )
  }

  async function reverseCurrentLocationAddress(position) {
    const mapApi = await loadDiscoverMapApi()
    return reverseGeocodeLocation({
      getGeocoder,
      mapApi,
      position,
    })
  }

  async function requestBrowserLocation() {
    if (!navigator.geolocation) {
      locationErrorMessage.value = LOCATION_ACCESS_ERROR
      locationUnavailable.value = true
      locationMode.value = 'none'
      return null
    }

    const permissionState = await getGeolocationPermissionState()
    if (permissionState === 'denied') {
      locationErrorMessage.value = GEOLOCATION_PERMISSION_ERROR
      locationUnavailable.value = true
      locationMode.value = 'none'
      return null
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const position = { lat: coords.latitude, lng: coords.longitude }
          if (!isWithinBounds(position)) {
            locationErrorMessage.value = buildOutsideSupportedAreaMessage('Current location')
            locationUnavailable.value = true
            locationMode.value = 'none'
            userLocation.value = null
            resolve(null)
            return
          }

          let resolvedAddress = null
          try {
            resolvedAddress = await reverseCurrentLocationAddress(position)
          } catch {
            resolvedAddress = null
          }
          if (!resolvedAddress?.formattedAddress) {
            locationErrorMessage.value =
              'Unable to convert your current location into an address. Please enter a City of Melbourne address manually.'
            locationUnavailable.value = true
            locationMode.value = 'none'
            userLocation.value = null
            resolve(null)
            return
          }

          userLocation.value = position
          selectedAddressPlace.value = {
            lat: position.lat,
            lng: position.lng,
            formattedAddress: resolvedAddress.formattedAddress,
            name: resolvedAddress.name || resolvedAddress.formattedAddress,
          }
          addressQuery.value = resolvedAddress.formattedAddress
          locationErrorMessage.value = ''
          locationUnavailable.value = false
          locationMode.value = 'device'
          resolve(userLocation.value)
        },
        (error) => {
          locationErrorMessage.value = getGeolocationErrorMessage(error)
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

  function assertWithinMelbourne(lat, lng, label = 'Address') {
    assertWithinSupportedArea({ lat, lng }, label)
  }

  function onAddressInput() {
    selectedAddressPlace.value = null
  }

  async function resolveAddressCoordinates() {
    const keyword = addressQuery.value.trim()
    if (!keyword) throw new Error('Please enter an address first.')

    const placePoint = selectedAddressPlace.value
    if (placePoint?.lat && placePoint?.lng) {
      assertWithinMelbourne(placePoint.lat, placePoint.lng, 'Address')
      return {
        lat: placePoint.lat,
        lng: placePoint.lng,
        formattedAddress: placePoint.formattedAddress || keyword,
      }
    }

    const mapApi = await loadDiscoverMapApi()
    const resolved = await resolveAddressInput({
      address: keyword,
      getGeocoder,
      mapApi,
      placesService: getPlacesService(),
    })
    const point = toLatLngLiteral(resolved.location)
    if (!point) throw new Error('Address not found. Please try a clearer address.')
    assertWithinMelbourne(point.lat, point.lng, 'Address')

    return {
      lat: point.lat,
      lng: point.lng,
      formattedAddress: resolved.formattedAddress || keyword,
    }
  }

  async function searchAddressSuggestions(query) {
    const mapApi = await loadDiscoverMapApi()
    return searchPlaceSuggestions({
      query,
      mapApi,
      placesService: getPlacesService(),
      limit: 5,
    })
  }

  function setAddressSuggestion(suggestion) {
    selectedAddressPlace.value = suggestion
    addressQuery.value = suggestion.formattedAddress || suggestion.name || addressQuery.value
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
      addressFilterError.value = locationErrorMessage.value || LOCATION_ACCESS_ERROR
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
    onAddressInput,
    requestBrowserLocation,
    searchAddressSuggestions,
    setAddressSuggestion,
    useMyLocation,
    watchDeviceLocation,
  }
}
