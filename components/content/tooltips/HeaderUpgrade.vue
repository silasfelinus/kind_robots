<template>
  <div class="relative">
    <!-- Header -->
    <header
      class="bg-primary shadow-md z-20 flex flex-col md:flex-row items-center p-2"
    >
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
        <avatar-image
          :size="avatarSize"
          class="w-12 h-12 md:w-16 md:h-16 rounded-full"
        />
        <div class="flex flex-col text-left">
          <room-title class="text-sm font-semibold" />
          <h2 class="text-xs text-gray-500 italic">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-2 mt-2 md:mt-0">
        <smart-links class="text-sm" />
      </div>

      <!-- Right Section -->
      <div
        class="flex flex-col items-center md:items-end space-y-2 md:space-y-0"
      >
        <div class="hidden md:flex flex-col items-center space-y-2">
          <login-button />
          <NavToggle @toggle-nav="toggleNav" />
          <theme-toggle class="text-sm" />
          <butterfly-toggle class="text-sm" />
        </div>
        <div class="md:hidden flex items-center justify-center">
          <button @click="toggleAccordion" class="accordion-button">☰</button>
          <div v-if="accordionOpen" class="accordion-content">
            <login-button />
            <NavToggle @toggle-nav="toggleNav" />
            <theme-toggle class="text-sm" />
            <butterfly-toggle class="text-sm" />
          </div>
        </div>
      </div>

      <!-- Jellybean Counter -->
      <jellybean-count
        v-if="isLoggedIn"
        class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
      />
    </header>

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="fixed top-0 left-0 right-0 bottom-0 bg-secondary shadow-lg transition-transform duration-300"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

const showNav = ref(false)
const isLoggedIn = computed(() => useUserStore().isLoggedIn)
const accordionOpen = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}

const toggleAccordion = () => {
  accordionOpen.value = !accordionOpen.value
}
</script>

<style scoped>
.accordion-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.accordion-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  space-y-2;
  padding: 0.5rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
  .accordion-content {
    display: block;
  }
}
</style>
