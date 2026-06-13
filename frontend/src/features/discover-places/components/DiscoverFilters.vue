<script setup>
defineProps({
  categories: {
    type: Array,
    required: true,
  },
  radiusOptions: {
    type: Array,
    required: true,
  },
  selectedCategorySet: {
    type: Object,
    required: true,
  },
  selectedRadius: {
    type: Number,
    required: true,
  },
  categoryCounts: {
    type: Object,
    required: true,
  },
  markerColors: {
    type: Object,
    required: true,
  },
  isCrowdDensityEnabled: {
    type: Boolean,
    required: true,
  },
})

defineEmits(['toggle-category', 'select-radius', 'toggle-crowd-density'])
</script>

<template>
  <div class="map-filters-overlay">
    <div class="map-filter-row category-row">
      <button
        v-for="category in categories"
        :key="category.key"
        type="button"
        class="map-chip category-chip"
        :class="{ selected: selectedCategorySet.has(category.key) }"
        :aria-pressed="selectedCategorySet.has(category.key)"
        @click="$emit('toggle-category', category.key)"
      >
        <span
          class="chip-dot"
          :style="{ backgroundColor: markerColors[category.key] || '#f97316' }"
        ></span>
        <span>{{ category.label }}</span>
        <span class="chip-count">{{ categoryCounts[category.key] || 0 }}</span>
      </button>
    </div>

    <div class="map-filter-row radius-row">
      <div class="radius-chip-group">
        <button
          v-for="radius in radiusOptions"
          :key="radius.meters"
          type="button"
          class="map-chip radius-chip"
          :class="{ selected: selectedRadius === radius.meters }"
          :aria-pressed="selectedRadius === radius.meters"
          @click="$emit('select-radius', radius.meters)"
        >
          {{ radius.label }}
        </button>
      </div>

      <div class="map-filter-actions">
        <button
          type="button"
          class="map-chip crowd-density-toggle"
          :class="{ selected: isCrowdDensityEnabled }"
          :aria-pressed="isCrowdDensityEnabled"
          @click="$emit('toggle-crowd-density')"
        >
          {{ isCrowdDensityEnabled ? 'Crowd density: On' : 'Crowd density: Off' }}
        </button>
      </div>
    </div>
  </div>
</template>
