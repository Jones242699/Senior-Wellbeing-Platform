import { ref } from 'vue'
import { buildDiscoverApiUrl, normalizePlace, parsePlacesPayload } from './useDiscoverPlaces'

export function usePlaceDetails({ allPlaces, activeDetailPlace }) {
  const detailById = ref(new Map())
  const loadingDetailIds = ref(new Set())

  function clearPlaceDetails() {
    detailById.value = new Map()
  }

  async function loadPlaceDetail(place) {
    if (!place?.id || loadingDetailIds.value.has(place.id) || detailById.value.has(place.id)) return
    loadingDetailIds.value.add(place.id)
    try {
      const detailEndpoint =
        place.sourceType === 'venues'
          ? `/venues/${encodeURIComponent(place.sourceId)}`
          : `/places/${encodeURIComponent(place.sourceId)}`
      const detailUrl = buildDiscoverApiUrl(detailEndpoint).toString()
      const response = await fetch(detailUrl)
      if (!response.ok) throw new Error(`Failed to load place detail (${response.status})`)
      const detailPayload = parsePlacesPayload(await response.json())[0]
      const normalizedDetail = normalizePlace(detailPayload, 0, place.sourceType || 'places')
      if (!normalizedDetail) return

      detailById.value.set(place.id, normalizedDetail)
      allPlaces.value = allPlaces.value.map((item) =>
        item.id === place.id
          ? {
              ...item,
              ...normalizedDetail,
              // Keep list-query distance context stable; detail API distance can be unrelated
              // to the active radius band and may otherwise remove the card immediately.
              distanceMetersFromApi: item.distanceMetersFromApi,
              categoryKey: item.categoryKey,
              categoryLabel: item.categoryLabel,
              icon: item.icon,
            }
          : item,
      )
      if (activeDetailPlace.value?.id === place.id) {
        activeDetailPlace.value =
          allPlaces.value.find((item) => item.id === place.id) || activeDetailPlace.value
      }
    } catch (error) {
      console.error('[Discover Places] Failed to load place detail:', error)
    } finally {
      loadingDetailIds.value.delete(place.id)
    }
  }

  return {
    detailById,
    loadingDetailIds,
    clearPlaceDetails,
    loadPlaceDetail,
  }
}
