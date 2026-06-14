<script setup>
import { useRoute } from 'vue-router'
import echoLogo from '../assets/echo-logo.png'

const route = useRoute()

const navItems = [
  { name: 'Home', path: '/' },
  {
    name: 'Explore',
    path: '/explore',
    activePaths: ['/explore'],
  },
  { name: 'Events', path: '/nearby-events' },
  { name: 'Dashboard', path: '/dashboard' },
]

function isActive(item) {
  if (item.activePaths?.includes(route.path)) return true
  if (item.path === '/nearby-events') {
    return route.path === '/nearby-events' || route.path.startsWith('/events/')
  }
  return route.path === item.path
}
</script>

<template>
  <header class="navbar">
    <div class="navbar-container">
      <div class="logo">
        <img :src="echoLogo" alt="Echo logo" class="logo-image" />
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
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background-color: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
}

.navbar-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  height: 100%;
  text-decoration: none;
}

.logo-image {
  height: 42px;
  width: auto;
  display: block;
}

.nav-links {
  display: flex;
  gap: 32px;
}

.nav-link {
  text-decoration: none;
  color: #4b5563;
  font-size: 17px;
  font-weight: 600;
  transition:
    color 0.2s,
    background 0.2s,
    border-color 0.2s;
  padding: 6px 14px;
  border-radius: 10px;
  border: 2px solid transparent;
  box-sizing: border-box;
}

.nav-link:hover {
  color: #111827;
}

.nav-link.active {
  color: #14532d;
  background: #f0fdf4;
  border-color: #bbf7d0;
}
</style>
