<template>
  <div :class="layoutClass">
    <nav v-if="isSimpleLayout" class="simple-nav">
      <a href="/" class="home-link">
        <icon name="mdi:home" class="home-icon" />
        Home
      </a>
    </nav>
    <div class="content">
      <!-- Your main content goes here -->
      <slot></slot>
    </div>
    <div class="toggle-layout">
      <button class="toggle-button" @click="toggleLayout">
        <icon :name="toggleIcon" class="toggle-icon" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLayoutStore } from '~/stores/layoutStore'

const layoutStore = useLayoutStore()

const isSimpleLayout = computed(() => layoutStore.currentLayout === 'simple')

const layoutClass = computed(() => ({
  'layout-simple': isSimpleLayout.value,
  'layout-default': !isSimpleLayout.value
}))

const toggleLayout = () => {
  layoutStore.setLayout(isSimpleLayout.value ? 'default' : 'simple')
}

const toggleIcon = computed(() => (isSimpleLayout.value ? 'mdi:view-grid' : 'mdi:fullscreen'))
</script>

<style scoped>
.layout-simple,
.layout-default {
  height: 100vh;
  position: relative;
  transition: background-color 0.3s ease-in-out;
}

.simple-nav {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-base-100);
}

.home-link {
  font-size: 2rem;
  color: var(--bg-primary);
  text-decoration: none;
  display: flex;
  align-items: center;
}

.home-icon {
  font-size: 3rem;
  margin-right: 1rem;
}

.toggle-layout {
  position: absolute;
  bottom: 2rem;
  right: 2rem;
}

.toggle-button {
  background-color: var(--bg-accent);
  border: none;
  border-radius: 50%;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease-in-out;
}

.toggle-button:hover {
  background-color: var(--bg-primary);
}

.toggle-icon {
  font-size: 2rem;
  color: var(--bg-base-100);
}
</style>
