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
  async function loadRoomsForOrigin(origin) {
    await fetchRoomsNearby(origin)
    renderRoomMarkers(rooms.value, selectRoomAndRoute)
  }

  async function locateUser() {
    // Explicitly switch back to realtime location as the route/list origin.
    clearAddressFilterState()
    clearSelectedRoom()

    try {
      const { place, position } = await resolveCurrentLocation({
        getGeocoder: null,
        getMapApi,
        label: 'Current location',
      })
      setLocationError?.('')
      setCurrentLocationPlace?.(place)
      setUserMarker(position)
      panTo(position)
      await loadRoomsForOrigin(position)
    } catch (error) {
      setLocationError?.(error?.message || LOCATION_ACCESS_ERROR)
      setUserMarker(null)
    }
  }

  async function loadDefaultLocation() {
    clearAddressFilterState()
    clearSelectedRoom()
    setLocationError?.('')
    await loadRoomsForOrigin(MELBOURNE_CENTER)
  }

  return {
    loadDefaultLocation,
    locateUser,
  }
}
