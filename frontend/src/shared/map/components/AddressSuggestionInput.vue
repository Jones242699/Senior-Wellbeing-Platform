<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search for an address',
  },
  suggestions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['input', 'select-suggestion', 'update:modelValue'])

function onInput(event) {
  emit('update:modelValue', event.target.value)
  emit('input', event.target.value)
}
</script>

<template>
  <div class="address-suggestion-input">
    <input
      :value="modelValue"
      class="search-input"
      type="text"
      :placeholder="placeholder"
      autocomplete="off"
      @input="onInput"
    />
    <div
      v-if="suggestions.length || loading"
      class="address-suggestion-menu"
      role="listbox"
    >
      <p v-if="loading" class="address-suggestion-status">
        Searching...
      </p>
      <button
        v-for="suggestion in suggestions"
        :key="`${suggestion.lat}-${suggestion.lng}-${suggestion.formattedAddress}`"
        class="address-suggestion-option"
        type="button"
        role="option"
        @mousedown.prevent="emit('select-suggestion', suggestion)"
      >
        <span class="address-suggestion-name">
          {{ suggestion.name || suggestion.formattedAddress }}
        </span>
        <span
          v-if="suggestion.formattedAddress && suggestion.formattedAddress !== suggestion.name"
          class="address-suggestion-address"
        >
          {{ suggestion.formattedAddress }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.address-suggestion-input {
  min-width: 0;
  position: relative;
}

.address-suggestion-menu {
  position: absolute;
  z-index: 1200;
  top: calc(100% + 6px);
  right: 0;
  left: 0;
  overflow: hidden;
  border: 1px solid #dbe4df;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.16);
}

.address-suggestion-status {
  margin: 0;
  padding: 10px 12px;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.address-suggestion-option {
  display: block;
  width: 100%;
  border: 0;
  border-bottom: 1px solid #edf2f7;
  background: #ffffff;
  color: #1f2937;
  cursor: pointer;
  padding: 10px 12px;
  text-align: left;
}

.address-suggestion-option:last-child {
  border-bottom: 0;
}

.address-suggestion-option:hover,
.address-suggestion-option:focus-visible {
  background: #ecfdf5;
  outline: none;
}

.address-suggestion-name,
.address-suggestion-address {
  display: block;
}

.address-suggestion-name {
  font-size: 14px;
  font-weight: 800;
}

.address-suggestion-address {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.35;
}
</style>
