<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section class="crowd-density-legend">
    <p class="crowd-legend-title">Crowd Density · Live</p>
    <div class="crowd-legend-items">
      <span v-for="item in items" :key="item.key" class="crowd-legend-item">
        <span class="crowd-legend-dot" :style="{ backgroundColor: item.color }"></span>
        <span>{{ item.label }}</span>
      </span>
    </div>
  </section>
</template>
