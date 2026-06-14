export function toPlacePoint(place, fallbackText = '') {
  if (!place?.geometry?.location) return null

  return {
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
    formattedAddress: place.formatted_address || place.name || fallbackText,
    name: place.name || fallbackText,
    place,
  }
}

export function resolvePlaceFromQuery({ address, mapApi, placesService, rejectMessage }) {
  if (!placesService) throw new Error('Map is not ready yet.')

  return new Promise((resolve, reject) => {
    placesService.findPlaceFromQuery(
      {
        query: address,
        fields: ['geometry', 'formatted_address', 'name'],
      },
      (results, status) => {
        if (status === mapApi.places.PlacesServiceStatus.OK && results?.[0]?.geometry?.location) {
          resolve(toPlacePoint(results[0], address))
          return
        }
        reject(
          new Error(
            typeof rejectMessage === 'function'
              ? rejectMessage(status)
              : rejectMessage || 'Address not found. Please pick one from the suggestions.',
          ),
        )
      },
    )
  })
}

export function searchPlaceSuggestions({ query, mapApi, placesService, limit = 5 }) {
  const searchText = String(query || '').trim()
  if (!searchText || !placesService) return Promise.resolve([])

  return new Promise((resolve) => {
    placesService.textSearch({ query: searchText }, (results, status) => {
      if (status !== mapApi?.places?.PlacesServiceStatus?.OK || !Array.isArray(results)) {
        resolve([])
        return
      }
      resolve(results.map((place) => toPlacePoint(place, searchText)).filter(Boolean).slice(0, limit))
    })
  })
}

export function setupPlaceAutocomplete({
  componentRestrictions = { country: 'au' },
  fields = ['geometry', 'formatted_address', 'name'],
  input,
  mapApi,
  onPlaceSelected,
}) {
  if (!input || !mapApi?.places) return null

  const autocomplete = new mapApi.places.Autocomplete(input, {
    fields,
    componentRestrictions,
  })

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace()
    if (!place?.geometry?.location) return
    onPlaceSelected(place)
  })

  return autocomplete
}
