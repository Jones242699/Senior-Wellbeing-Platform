<script setup>
defineProps({
  facilityCounts: { type: Object, required: true },
  loadingFacilities: { type: Boolean, required: true },
  noBenchesFound: { type: Boolean, required: true },
  noToiletsFound: { type: Boolean, required: true },
  routeError: { type: String, default: '' },
  routeSummary: { type: String, default: '' },
})
</script>

<template>
  <p v-if="routeSummary" class="route-summary">Estimate: {{ routeSummary }}</p>

  <div
    v-if="routeSummary || loadingFacilities || facilityCounts.toilets || facilityCounts.benches"
    class="facility-summary"
  >
    <div class="facility-summary-item">
      <span class="facility-summary-icon toilet-summary-icon">🚻</span>
      <span>{{
        loadingFacilities ? 'Checking toilets...' : `${facilityCounts.toilets} toilets near route`
      }}</span>
    </div>
    <div class="facility-summary-item">
      <span class="facility-summary-icon bench-summary-icon">B</span>
      <span>{{
        loadingFacilities ? 'Checking benches...' : `${facilityCounts.benches} benches near route`
      }}</span>
    </div>
  </div>

  <p v-if="routeError" class="route-error">{{ routeError }}</p>

  <div v-if="noToiletsFound || noBenchesFound" class="route-alerts">
    <div v-if="noToiletsFound" class="alert-card warning">
      <span class="alert-icon" aria-hidden="true">⚠️</span>
      <div class="alert-content">
        <strong class="alert-title">Route notice: no public toilets</strong>
        <p class="alert-desc">No public toilets were found along this route. Please plan ahead.</p>
      </div>
    </div>
    <div v-if="noBenchesFound" class="alert-card warning">
      <span class="alert-icon" aria-hidden="true">⚠️</span>
      <div class="alert-content">
        <strong class="alert-title">Route notice: no rest benches</strong>
        <p class="alert-desc">No rest benches were found along this route.</p>
      </div>
    </div>
  </div>
</template>
