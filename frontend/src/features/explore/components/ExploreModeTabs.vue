<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  modes: {
    type: Array,
    required: true,
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="explore-mode-tabs" role="tablist" aria-label="Explore tools">
    <button
      v-for="mode in modes"
      :key="mode.id"
      type="button"
      role="tab"
      :aria-selected="modelValue === mode.id"
      :class="[
        'explore-mode-tab',
        `explore-mode-tab--${mode.tone}`,
        { 'is-active': modelValue === mode.id },
      ]"
      @click="$emit('update:modelValue', mode.id)"
    >
      {{ mode.label }}
    </button>
  </div>
</template>
