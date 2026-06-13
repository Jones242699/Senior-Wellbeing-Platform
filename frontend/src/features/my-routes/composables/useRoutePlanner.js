import { ref } from 'vue'

export function useRoutePlanner({
  canRoute,
  clearDirectionsDisplay,
  clearEndpointMarkers,
  clearToiletMarkers,
  directionsRoute,
  fetchFacilitiesForRoute,
  getTravelMode,
  hasDestinationInput,
  resetFacilityState,
  resolveDestination,
  resolveOrigin,
  setDirectionsResult,
  setEndpointMarker,
}) {
  const travelMode = ref(null)
  const routeError = ref('')
  const routeSummary = ref('')
  const routing = ref(false)
  const preferencesDirty = ref(false)

  const socialDensity = ref('normal') // 'busy' | 'normal' | 'quiet' (UI only)
  const shadeLevel = ref('normal') // 'more' | 'normal' | 'less' (UI only)

  function selectRouteIndex(routes) {
    let bestRouteIndex = 0

    if (
      routes.length > 1 &&
      (socialDensity.value !== 'normal' || shadeLevel.value !== 'normal')
    ) {
      const scores = routes.map((route, index) => ({
        index,
        shadeScore: route.shadeScore ?? 0,
        socialScore: route.socialScore ?? 0,
        overallScore: route.overallScore ?? 0,
      }))

      scores.sort((a, b) => {
        if (shadeLevel.value !== 'normal') {
          return shadeLevel.value === 'more'
            ? b.shadeScore - a.shadeScore
            : a.shadeScore - b.shadeScore
        }

        if (socialDensity.value === 'busy') {
          return b.socialScore - a.socialScore
        }

        if (socialDensity.value === 'quiet') {
          return a.socialScore - b.socialScore
        }

        return b.overallScore - a.overallScore
      })

      bestRouteIndex = scores[0].index
      const bestScore = scores[0]
      console.log(
        `[Route Selection] Preferences: Social=${socialDensity.value}, Shade=${shadeLevel.value}`,
      )
      console.log(
        `[Route Selection] Best Route Selected Index: ${bestRouteIndex} (Shade: ${bestScore.shadeScore}%, Social: ${bestScore.socialScore}%)`,
      )
    }

    return bestRouteIndex
  }

  function buildPreferenceLabel() {
    let preferenceLabel = ''
    if (shadeLevel.value !== 'normal') {
      preferenceLabel += ` · ${shadeLevel.value === 'more' ? '🌲 High' : '☀️ Low'} Shade`
    }
    if (socialDensity.value !== 'normal') {
      preferenceLabel += ` · ${socialDensity.value === 'quiet' ? 'Quiet' : 'Busy'}`
    }
    return preferenceLabel
  }

  async function generateRoute() {
    routeError.value = ''
    routeSummary.value = ''
    resetFacilityState()

    if (!canRoute()) return

    routing.value = true
    try {
      if (!travelMode.value) {
        throw new Error('Please select a travel mode first.')
      }

      const origin = await resolveOrigin()
      const dest = await resolveDestination()

      const mode = getTravelMode(travelMode.value)
      if (mode === undefined) {
        throw new Error('Unsupported travel mode')
      }

      const result = await directionsRoute({
        origin,
        destination: dest,
        travelMode: mode,
        region: 'au',
      })

      const bestRouteIndex = selectRouteIndex(result.routes)
      setDirectionsResult(result, bestRouteIndex)

      const route = result.routes?.[bestRouteIndex]
      const leg = route?.legs?.[0]
      if (leg) {
        const dist = leg.distance?.text ?? ''
        const dur = leg.duration?.text ?? ''
        const preferenceLabel = buildPreferenceLabel()

        routeSummary.value = dist && dur ? `${dist} · ${dur}${preferenceLabel}` : dist || dur

        setEndpointMarker('start', leg.start_location)
        setEndpointMarker('dest', leg.end_location)
      }

      void fetchFacilitiesForRoute(route)

      preferencesDirty.value = false
    } catch (e) {
      routeError.value = e?.message || 'Failed to generate route'
      clearDirectionsDisplay()
      clearToiletMarkers()
      clearEndpointMarkers()
    } finally {
      routing.value = false
    }
  }

  async function onTravelModeChange(modeId) {
    travelMode.value = modeId
    if (!hasDestinationInput()) return
    await generateRoute()
  }

  function setSocialDensity(value) {
    socialDensity.value = value
    preferencesDirty.value = true
  }

  function setShadeLevel(value) {
    shadeLevel.value = value
    preferencesDirty.value = true
  }

  return {
    preferencesDirty,
    routeError,
    routeSummary,
    routing,
    shadeLevel,
    socialDensity,
    travelMode,
    generateRoute,
    onTravelModeChange,
    setShadeLevel,
    setSocialDensity,
  }
}
