<template>
  <div class="page-container">
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
    </header>

    <!-- Navigation -->
    <navigation-trimmed v-if="showNav" class="navigation-drawer" />

    <!-- Page Content -->
    <main class="page-content">
      <!-- Your main content here -->
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'
const userStore = useUserStore()

// Define responsive header height
const headerHeight = computed(() => `var(--header-height)`)

const showNav = ref(false)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
:root {
  --header-height: 3rem;
}

.page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ensure the container takes up full viewport height */
}

.header-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 20; /* Ensure header is on top */
}

.header-content {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  box-sizing: border-box;
}

.left-section,
.center-section,
.right-section {
  display: flex;
  align-items: center;
}

.center-section {
  flex: 1;
  justify-content: center;
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
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out;
  transform: translateY(100%);
  z-index: 30; /* Ensure it's above content but below header */
}

.navigation-drawer.translate-y-0 {
  transform: translateY(0);
}

.page-content {
  flex: 1;
  padding: 1rem;
  margin-top: var(--header-height); /* Ensure content starts below the header */
  box-sizing: border-box;
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
}
</style>
