export function createMapMarker(mapApi, map, options) {
  if (!mapApi || !map || !options?.position) return null

  return new mapApi.Marker({
    map,
    position: options.position,
    title: options.title,
    zIndex: options.zIndex,
    clickable: options.clickable,
    icon: options.icon,
    label: options.label,
  })
}

export function createCircleMarker(mapApi, map, options) {
  return createMapMarker(mapApi, map, {
    map,
    ...options,
    icon: {
      path: mapApi.SymbolPath.CIRCLE,
      scale: options.scale ?? 8,
      fillColor: options.fillColor ?? '#2563eb',
      fillOpacity: options.fillOpacity ?? 1,
      strokeColor: options.strokeColor ?? '#ffffff',
      strokeWeight: options.strokeWeight ?? 2,
    },
  })
}

export function clearMarkers(markers) {
  markers.forEach((marker) => marker?.setMap(null))
  markers.length = 0
}
