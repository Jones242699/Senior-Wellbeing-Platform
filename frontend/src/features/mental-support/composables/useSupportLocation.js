import { MELBOURNE_CENTER } from '../constants'
import {
  LOCATION_ACCESS_ERROR,
} from '../../../shared/map/locationRules'
import { resolveCurrentLocation } from '../../../shared/map/currentLocation'

export function useSupportLocation({
  clearAddressFilterState,
  clearSelectedRoom,
  fetchRoomsNearby,
  getMapApi,
  panTo,
  renderRoomMarkers,
  rooms,
  selectRoomAndRoute,
  setCurrentLocationPlace,
  setLocationError,
  setUserMarker,
}) {
  let locationRequestSeq = 0

  function cancelPendingLocation() {
    locationRequestSeq += 1
  }

  function isCurrentLocationRequest(requestSeq) {
    return requestSeq === locationRequestSeq
  }

  async function loadRoomsForOrigin(origin) {
    await fetchRoomsNearby(origin)
    renderRoomMarkers(rooms.value, selectRoomAndRoute)
  }

  async function locateUser() {
    const requestSeq = locationRequestSeq + 1
    locationRequestSeq = requestSeq
    // Explicitly switch back to realtime location as the route/list origin.
    clearAddressFilterState()
    clearSelectedRoom()

    try {
      const { place, position } = await resolveCurrentLocation({
        getGeocoder: null,
        getMapApi,
        label: 'Current location',
      })
      if (!isCurrentLocationRequest(requestSeq)) return
      setLocationError?.('')
      setCurrentLocationPlace?.(place)
      setUserMarker(position)
      panTo(position)
      await loadRoomsForOrigin(position)
      if (!isCurrentLocationRequest(requestSeq)) return
    } catch (error) {
      if (!isCurrentLocationRequest(requestSeq)) return
      setLocationError?.(error?.message || LOCATION_ACCESS_ERROR)
      setUserMarker(null)
    }
  }

  async function loadDefaultLocation() {
    cancelPendingLocation()
    clearAddressFilterState()
    clearSelectedRoom()
    setLocationError?.('')
    await loadRoomsForOrigin(MELBOURNE_CENTER)
  }

  return {
    cancelPendingLocation,
    loadDefaultLocation,
    locateUser,
  }
}
