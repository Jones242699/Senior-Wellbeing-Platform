<script setup>
defineProps({
  preferencesDirty: { type: Boolean, required: true },
  routing: { type: Boolean, required: true },
  shadeLevel: { type: String, required: true },
  socialDensity: { type: String, required: true },
})

defineEmits(['generate-route', 'set-shade-level', 'set-social-density'])
</script>

<template>
  <section class="prefs">
    <h2 class="prefs-title">Route Preferences</h2>

    <div class="pref-card">
      <div class="pref-left">
        <div class="pref-name">Socially Active</div>
        <div class="pref-desc">Show routes with higher pedestrian density</div>
      </div>
      <div class="pref-actions" role="group" aria-label="Socially Active preference">
        <button
          type="button"
          :class="['pref-icon', { active: socialDensity === 'busy' }]"
          aria-label="Busy route"
          title="Busy"
          @click="$emit('set-social-density', 'busy')"
        >
          busy
        </button>
        <button
          type="button"
          :class="['pref-mid', { active: socialDensity === 'normal' }]"
          aria-label="Normal route"
          title="Normal"
          @click="$emit('set-social-density', 'normal')"
        >
          medium
        </button>
        <button
          type="button"
          :class="['pref-icon', { active: socialDensity === 'quiet' }]"
          aria-label="Quiet route"
          title="Quiet"
          @click="$emit('set-social-density', 'quiet')"
        >
          quiet
        </button>
      </div>
    </div>

    <div class="pref-card">
      <div class="pref-left">
        <div class="pref-name">Nature & Shade</div>
        <div class="pref-desc">Show routes with more tree shade</div>
      </div>
      <div class="pref-actions" role="group" aria-label="Nature & Shade preference">
        <button
          type="button"
          :class="['pref-icon', { active: shadeLevel === 'more' }]"
          aria-label="More shade"
          title="More shade"
          @click="$emit('set-shade-level', 'more')"
        >
          high
        </button>
        <button
          type="button"
          :class="['pref-mid', { active: shadeLevel === 'normal' }]"
          aria-label="Normal shade"
          title="Normal"
          @click="$emit('set-shade-level', 'normal')"
        >
          medium
        </button>
        <button
          type="button"
          :class="['pref-icon', { active: shadeLevel === 'less' }]"
          aria-label="Less shade"
          title="Less shade"
          @click="$emit('set-shade-level', 'less')"
        >
          low
        </button>
      </div>
    </div>
    <button
      type="button"
      class="btn-generate btn-generate-prefs"
      :disabled="routing"
      @click="$emit('generate-route')"
    >
      {{
        routing
          ? 'Routing...'
          : preferencesDirty
            ? 'Generate Route — apply preferences'
            : 'Generate Route'
      }}
    </button>
  </section>
</template>
