import { ref } from 'vue'
import { assertWithinSupportedArea } from '../../../shared/map/locationRules'

export function useSupportFilters({
  clearFilterCenterMarker,
  getMapApi,
  panTo,
  resolveAddressFromPlaces,
  selectedRoomId,
  setFilterCenterMarker,
  updateDistanceDurationForAll,
}) {
  const query = ref('')
  const queryPlace = ref(null)
  const filterCenter = ref(null)
  const applyingAddressFilter = ref(false)
  const addressFilterError = ref('')

  function clearAddressFilterState() {
    filterCenter.value = null
    queryPlace.value = null
    addressFilterError.value = ''
    clearFilterCenterMarker()
  }

  function onQueryInput() {
    // Clear the previously selected suggestion coordinates after manual input changes to avoid mismatches.
    queryPlace.value = null
  }

  function setQueryPlaceFromAutocomplete(place) {
    queryPlace.value = {
      ...place,
      formattedAddress: place.formattedAddress || query.value.trim(),
    }
    query.value = queryPlace.value.formattedAddress
  }

  function setAddressFilterError(message) {
    addressFilterError.value = message || ''
  }

  async function applyAddressFilter() {
    addressFilterError.value = ''
    const address = query.value.trim()
    if (!address) {
      addressFilterError.value = 'Please enter an address first.'
      return
    }

    applyingAddressFilter.value = true
    try {
      const target = queryPlace.value || (await resolveAddressFromPlaces(address))
      assertWithinSupportedArea(target, 'Address')
      filterCenter.value = target
      setFilterCenterMarker({ lat: target.lat, lng: target.lng })
      panTo({ lat: target.lat, lng: target.lng }, 13)
      await updateDistanceDurationForAll(target, getMapApi())
      selectedRoomId.value = null
    } catch (err) {
      addressFilterError.value = err?.message || 'Failed to apply address filter.'
    } finally {
      applyingAddressFilter.value = false
    }
  }

  function getCurrentLocationLabel(userPosition) {
    if (filterCenter.value?.formattedAddress) return filterCenter.value.formattedAddress
    return userPosition ? 'Current location' : 'Melbourne CBD'
  }

  return {
    addressFilterError,
    applyingAddressFilter,
    filterCenter,
    query,
    applyAddressFilter,
    clearAddressFilterState,
    getCurrentLocationLabel,
    onQueryInput,
    setAddressFilterError,
    setQueryPlaceFromAutocomplete,
  }
}
