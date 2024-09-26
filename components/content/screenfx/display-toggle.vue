<template>
  <div :class="layoutClass">
    <nav v-if="isSimpleLayout" class="simple-nav">
      <a href="/" class="home-link">
        <Icon name="mdi:home" class="home-Icon" />
        Home
      </a>
    </nav>
    <div class="content">
      <!-- Your main content goes here -->
      <slot />
    </div>
    <div class="toggle-layout">
      <button class="toggle-button" @click="toggleLayout">
        <Icon :name="toggleIcon" class="toggle-Icon" />
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useLayoutStore, LayoutKey } from './../../../stores/layoutStore'

const layoutStore = useLayoutStore()

// Update the comparison to use the enum
const isSimpleLayout = computed(
  () => layoutStore.currentLayout === LayoutKey.Simple,
)

// Update the layoutClass based on the enum value
const layoutClass = computed(() => ({
  'layout-simple': isSimpleLayout.value,
  'layout-default': !isSimpleLayout.value,
}))

// Update the toggle logic to use the enum values
const toggleLayout = () => {
  layoutStore.setLayout(
    isSimpleLayout.value ? LayoutKey.Default : LayoutKey.Simple,
  )
}

// Icon based on the layout
const toggleIcon = computed(() =>
  isSimpleLayout.value ? 'mdi:view-grid' : 'mdi:fullscreen',
)
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
  background-color: var(--bg-base-300);
}

.home-link {
  font-size: 2rem;
  color: var(--bg-primary);
  text-decoration: none;
  display: flex;
  align-items: center;
}

.home-Icon {
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

.toggle-Icon {
  font-size: 2rem;
  color: var(--bg-base-300);
}
</style>
