<template>
  <header class="header">
    <!-- Header Content -->
    <div class="header-content">
      <!-- Left Section -->
      <div class="header-left">
        <avatar-image :size="avatarSize" class="avatar" />
        <div class="header-info">
          <room-title class="room-title" />
          <h2 class="subtitle">{{ page.subtitle || 'the kindest' }}</h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="header-center">
        <smart-links class="smart-links" />
      </div>

      <!-- Right Section -->
      <div class="header-right">
        <nav-toggle @toggle-nav="toggleNav" />
        <theme-toggle class="theme-toggle" />
        <butterfly-toggle class="butterfly-toggle" />
        <login-button class="login-button" />
      </div>
    </div>

    <!-- Jellybean Counter -->
    <jellybean-count v-if="isLoggedIn" class="jellybean-count" />

    <!-- Navigation Drawer -->
    <transition name="slide">
      <navigation-trimmed v-if="showNav" class="navigation-drawer" />
    </transition>
  </header>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

const showNav = ref(false)
const isLoggedIn = ref(false) // Update this based on your authentication logic

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
.header {
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 0 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  max-height: 100vh;
  overflow: hidden;
}

.header-content {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto auto;
  gap: 1rem;
  align-items: center;
  height: 100%;
}

.header-left,
.header-center,
.header-right {
  display: flex;
  align-items: center;
}

.header-left {
  grid-column: 1 / 2;
}

.header-center {
  grid-column: 2 / 3;
  justify-content: center;
}

.header-right {
  grid-column: 3 / 4;
  justify-content: flex-end;
}

.avatar {
  width: 2rem;
  height: 2rem;
}

.header-info {
  display: flex;
  flex-direction: column;
  margin-left: 0.5rem;
}

.room-title {
  font-size: 0.875rem;
  font-weight: 600;
}

.subtitle {
  font-size: 0.75rem;
  color: gray;
  font-style: italic;
}

.smart-links {
  font-size: 0.875rem;
}

.jellybean-count {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background-color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.navigation-drawer {
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: 0;
  background-color: white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 30;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-in-out;
}
.slide-enter,
.slide-leave-to {
  transform: translateY(100%);
}

@media (max-width: 600px) {
  .header {
    grid-template-rows: auto auto auto;
    grid-template-columns: 1fr;
  }
  .header-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
  .header-left,
  .header-center,
  .header-right {
    justify-content: center;
  }
  .header-right {
    grid-row: 3;
  }
}
</style>
