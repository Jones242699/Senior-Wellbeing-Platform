import { ref } from 'vue'
import {
  LOCATION_ACCESS_ERROR,
  buildOutsideSupportedAreaMessage,
  isWithinBounds,
} from '../../../shared/map/locationRules'
import { resolveSupportedAddressInput } from '../../../shared/map/addressResolver'
import { resolveCurrentLocation } from '../../../shared/map/currentLocation'
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

  async function requestBrowserLocation() {
    try {
      const { place, position } = await resolveCurrentLocation({
        getGeocoder,
        getMapApi: loadDiscoverMapApi,
      })
      userLocation.value = position
      selectedAddressPlace.value = place
      addressQuery.value = place.formattedAddress
      locationErrorMessage.value = ''
      locationUnavailable.value = false
      locationMode.value = 'device'
      return userLocation.value
    } catch (error) {
      locationErrorMessage.value = error?.message || LOCATION_ACCESS_ERROR
      locationUnavailable.value = true
      locationMode.value = 'none'
      userLocation.value = null
      return null
    }
  }

  function onAddressInput() {
    selectedAddressPlace.value = null
  }

  async function resolveAddressCoordinates() {
    const mapApi = await loadDiscoverMapApi()
    return resolveSupportedAddressInput({
      address: addressQuery.value,
      getGeocoder,
      mapApi,
      placesService: getPlacesService(),
      selectedPlace: selectedAddressPlace.value,
    })
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
