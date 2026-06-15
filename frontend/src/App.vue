<script setup>
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div class="app-shell">
    <NavBar />
    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f5f6f7;
}
</style>

<style>
:root {
  font-size: 16px;
}

:root[data-font-scale='small'] {
  font-size: 15px;
}

:root[data-font-scale='large'] {
  font-size: 18px;
}

body {
  margin: 0;
}
</style>
