<script setup>
defineProps({
  facilityCounts: { type: Object, required: true },
  loadingFacilities: { type: Boolean, required: true },
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
</template>
