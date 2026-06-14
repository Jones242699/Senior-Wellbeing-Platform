import { MELBOURNE_CENTER } from '../constants'

export function useSupportLocation({
  clearAddressFilterState,
  clearSelectedRoom,
  fetchRoomsNearby,
  getMapApi,
  panTo,
  renderRoomMarkers,
  rooms,
  selectRoomAndRoute,
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
      await loadRoomsForOrigin(MELBOURNE_CENTER)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const current = { lat: coords.latitude, lng: coords.longitude }
        setUserMarker(current)
        panTo(current)
        await loadRoomsForOrigin(current)
      },
      async () => {
        setUserMarker(MELBOURNE_CENTER)
        await loadRoomsForOrigin(MELBOURNE_CENTER)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return {
    locateUser,
  }
}
