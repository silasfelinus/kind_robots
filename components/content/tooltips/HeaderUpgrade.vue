<template>
  <header
    class="header-container"
    :style="{ height: headerHeight, maxHeight: '100vh' }"
  >
    <!-- Header Content -->
    <div class="header-content">
      <!-- Left Section -->
      <div class="left-section">
        <avatar-image :size="avatarSize" class="rounded-full w-8 h-8" />
        <div class="text-content">
          <room-title class="text-sm font-semibold" />
          <h2 class="subtitle">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="center-section">
        <smart-links class="text-sm" />
      </div>

      <!-- Right Section -->
      <div class="right-section">
        <nav-toggle @toggle-nav="toggleNav" />
        <theme-toggle class="text-sm" />
        <butterfly-toggle class="text-sm" />
        <login-button />
      </div>
    </div>

    <!-- Jellybean Counter -->
    <jellybean-count v-if="isLoggedIn" class="jellybean-count" />

    <!-- Navigation -->
    <navigation-trimmed v-if="showNav" class="navigation-drawer" />
  </header>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

// Define responsive header height
const headerHeight = computed(() => `var(--header-height)`)

const showNav = ref(false)
const isLoggedIn = ref(false) // Update this based on your authentication logic

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
:root {
  --header-height: 3rem; /* Adjust height for a thinner header */
}

.header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping of child elements */
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  box-sizing: border-box;
  overflow: hidden; /* Hide any overflow */
}

.left-section,
.center-section,
.right-section {
  display: flex;
  align-items: center;
}

.left-section {
  flex-shrink: 1;
}

.text-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.subtitle {
  text-align: center;
  color: gray;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.center-section {
  flex: 1;
  justify-content: center;
}

.right-section {
  flex-shrink: 1;
}

.jellybean-count {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: white;
  padding: 0.5rem;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10; /* Lower priority */
}

.navigation-drawer {
  position: fixed;
  top: var(--header-height); /* Position below the header */
  left: 0;
  right: 0;
  bottom: 0; /* Full height from header to bottom */
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  transform: translateY(100%); /* Hide by default */
  z-index: 30; /* Ensure it's on top of other content */
}

.navigation-drawer.translate-y-0 {
  transform: translateY(0); /* Slide in */
}

@media (max-width: 600px) {
  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .left-section,
  .center-section,
  .right-section {
    width: 100%;
    justify-content: center;
  }

  .left-section {
    order: 1; /* Ensure the left section appears first */
  }

  .center-section {
    order: 2; /* Center section appears next */
  }

  .right-section {
    order: 3; /* Right section appears last */
  }
}
</style>
