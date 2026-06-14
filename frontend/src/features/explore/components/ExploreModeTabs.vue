<script setup>
defineProps({
  modes: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <nav class="explore-mode-tabs" aria-label="Explore tools">
    <router-link
      v-for="mode in modes"
      :key="mode.id"
      :to="mode.path"
      :class="['explore-mode-tab', `explore-mode-tab--${mode.tone}`]"
    >
      <span class="explore-mode-title">{{ mode.title }}</span>
      <span class="explore-mode-subtitle">{{ mode.subtitle }}</span>
      <span class="explore-mode-action">{{ mode.actionLabel }}</span>
    </router-link>
  </nav>
</template>
