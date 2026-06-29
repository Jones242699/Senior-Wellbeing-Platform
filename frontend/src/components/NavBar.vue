<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import connectWellLogo from '../assets/ConnectWell.png'

const route = useRoute()
const fontScale = ref('default')

const fontScaleOptions = [
  { label: 'A-', value: 'small', title: 'Decrease text size' },
  { label: 'A', value: 'default', title: 'Default text size' },
  { label: 'A+', value: 'large', title: 'Increase text size' },
]

const navItems = [
  { name: 'Home', path: '/' },
  {
    name: 'Explore',
    path: '/explore',
    activePaths: ['/explore'],
  },
  { name: 'Events', path: '/nearby-events' },
  { name: 'Insights', path: '/insights' },
]

function isActive(item) {
  if (item.activePaths?.includes(route.path)) return true
  if (item.path === '/nearby-events') {
    return route.path === '/nearby-events' || route.path.startsWith('/events/')
  }
  return route.path === item.path
}

function applyFontScale(value) {
  fontScale.value = value
  document.documentElement.dataset.fontScale = value
  localStorage.setItem('connectwell-font-scale', value)
}

onMounted(() => {
  const savedScale = localStorage.getItem('connectwell-font-scale')
  applyFontScale(savedScale || 'default')
})
</script>

<template>
  <header class="navbar">
    <div class="navbar-container">
      <div class="logo">
        <img :src="connectWellLogo" alt="ConnectWell logo" class="logo-image" />
      </div>
      <nav class="nav-links">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-link', { active: isActive(item) }]"
        >
          {{ item.name }}
        </router-link>
      </nav>
      <div class="font-size-controls" aria-label="Text size controls">
        <button
          v-for="option in fontScaleOptions"
          :key="option.value"
          type="button"
          :class="['font-size-btn', { active: fontScale === option.value }]"
          :aria-pressed="fontScale === option.value"
          :title="option.title"
          @click="applyFontScale(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 48px;
  height: 94px;
  display: flex;
  align-items: center;
}

.navbar-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto minmax(260px, 1fr);
  align-items: center;
  gap: 28px;
}

.logo {
  display: flex;
  align-items: center;
  height: 100%;
  text-decoration: none;
}

.logo-image {
  height: 66px;
  max-width: 320px;
  width: auto;
  display: block;
  object-fit: contain;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: 58px;
}

.nav-link {
  position: relative;
  text-decoration: none;
  color: #14233b;
  font-size: calc(17px * var(--font-scale, 1));
  font-weight: 800;
  transition:
    color 0.2s,
    background 0.2s,
    border-color 0.2s;
  padding: 8px 0;
  box-sizing: border-box;
}

.nav-link:hover {
  color: #111827;
}

.nav-link.active {
  color: #15834d;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -13px;
  height: 4px;
  border-radius: 999px;
  background: #1f9a5b;
}

.font-size-controls {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.font-size-btn {
  min-width: 56px;
  min-height: 54px;
  border-radius: 16px;
  border: 2px solid #d4e3db;
  background: #ffffff;
  color: #177747;
  padding: 10px 16px;
  font: inherit;
  font-size: calc(18px * var(--font-scale, 1));
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s,
    box-shadow 0.2s,
    color 0.2s;
}

.font-size-btn:hover {
  border-color: #9bcfb1;
  background: #f0f8f3;
}

.font-size-btn.active {
  border: 2px solid #1f9a5b;
  background: linear-gradient(135deg, #25a766, #16834d);
  color: #ffffff;
  box-shadow: 0 12px 20px rgba(31, 154, 91, 0.18);
}

@media (max-width: 980px) {
  .navbar {
    height: auto;
    padding: 14px 20px;
  }

  .navbar-container {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 14px;
  }

  .nav-links {
    gap: 24px;
  }

  .nav-link.active::after {
    bottom: -5px;
  }

  .font-size-controls {
    justify-content: center;
  }
}

@media (max-width: 560px) {
  .logo-image {
    height: 54px;
  }

  .nav-links {
    width: 100%;
    justify-content: space-between;
    gap: 12px;
  }

  .nav-link {
    font-size: calc(14px * var(--font-scale, 1));
  }

  .font-size-controls {
    width: 100%;
    gap: 10px;
  }

  .font-size-btn {
    flex: 1;
    min-width: 0;
    min-height: 46px;
    font-size: calc(15px * var(--font-scale, 1));
  }
}
</style>
