<script setup>
defineProps({
  mode: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <aside class="explore-side-panel">
    <div class="explore-panel-heading">
      <p>{{ mode.eyebrow }}</p>
      <h1>{{ mode.title }}</h1>
    </div>

    <div class="explore-panel-section">
      <div v-for="item in mode.panelItems" :key="item" class="explore-panel-row">
        <span>{{ item }}</span>
      </div>
    </div>

    <router-link class="explore-panel-link" :to="mode.path">Open full tool</router-link>
  </aside>
</template>
