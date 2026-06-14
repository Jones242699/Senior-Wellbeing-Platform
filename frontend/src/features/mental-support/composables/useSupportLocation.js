import { MELBOURNE_CENTER } from '../constants'
import {
  LOCATION_ACCESS_ERROR,
  buildOutsideSupportedAreaMessage,
  isWithinBounds,
} from '../../../shared/map/locationRules'

export function useSupportLocation({
  clearAddressFilterState,
  clearSelectedRoom,
  fetchRoomsNearby,
  getMapApi,
  panTo,
  renderRoomMarkers,
  rooms,
  selectRoomAndRoute,
  setLocationError,
  setUserMarker,
  updateDistanceDurationForAll,
}) {
  async function loadRoomsForOrigin(origin) {
    await fetchRoomsNearby(origin)
    await updateDistanceDurationForAll(origin, getMapApi())
    renderRoomMarkers(rooms.value, selectRoomAndRoute)
  }

  async function locateUser() {
    // Explicitly switch back to realtime location as the route/list origin.
    clearAddressFilterState()
    clearSelectedRoom()

    if (!navigator.geolocation) {
      setLocationError?.(LOCATION_ACCESS_ERROR)
      await loadRoomsForOrigin(MELBOURNE_CENTER)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const current = { lat: coords.latitude, lng: coords.longitude }
        if (!isWithinBounds(current)) {
          setLocationError?.(buildOutsideSupportedAreaMessage('Current location'))
          await loadRoomsForOrigin(MELBOURNE_CENTER)
          return
        }

        setLocationError?.('')
        setUserMarker(current)
        panTo(current)
        await loadRoomsForOrigin(current)
      },
      async () => {
        setLocationError?.(LOCATION_ACCESS_ERROR)
        setUserMarker(MELBOURNE_CENTER)
        await loadRoomsForOrigin(MELBOURNE_CENTER)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
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
