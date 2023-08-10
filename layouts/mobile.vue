<template>
  <div
    :class="isMobile ? 'flex flex-col h-screen' : 'flex flex-row h-screen'"
    class="text-gray-800 space-y-4 md:space-y-0 md:space-x-4 relative"
  >
    <!-- Toggle Button -->
    <button
      class="absolute top-4 right-4 md:rounded-bl-xl bg-gradient-to-r from-bg-base-200 via-base-400 to-bg-base-600 p-2"
      @click="toggleLayout"
    >
      Toggle View
    </button>

    <!-- Bot Selector -->
    <bot-selector class="absolute top-4 left-4 md:rounded-br-xl" />

    <!-- Avatar Image -->
    <avatar-image />

    <!-- Title Image -->
    <img
      src="/images/fulltitle.png"
      :class="getTitleImageClass"
      class="transition-all duration-300 w-32 h-32"
      alt="Title"
    />

    <!-- Main Content -->
    <main
      class="md:w-3/5 h-full flex flex-col bg-base shadow-inner rounded-l-xl transition-all duration-500 relative p-4 space-y-4"
    >
      <transition name="fade" mode="out-in">
        <div>
          <slot />
        </div>
      </transition>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const isMobile = ref(true) // Default to mobile view

const toggleLayout = () => {
  isMobile.value = !isMobile.value
}

const getTitleImageClass = computed(() => {
  if (isMobile.value) {
    return 'absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  }
  return 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
})
</script>

<style>
/* Fade animation for layout transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Flip animation for the title image and bot-carousel transition */
.flip-enter-active,
.flip-leave-active {
  transition: transform 0.6s;
}
.flip-enter,
.flip-leave-to {
  transform: rotateY(90deg);
}
</style>
