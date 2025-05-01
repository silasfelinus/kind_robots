<template>
  <div
    class="main-layout bg-base-200 h-screen w-screen relative overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <animation-loader class="fixed z-50" />
      <milestone-popup />
    </div>

    <!-- Header -->
    <header
      class="fixed z-40 border-6 border-secondary transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <kind-header class="h-full w-full rounded-xl" />
    </header>

    <!-- Main Content -->
    <main
      class="fixed z-30 border-6 border-secondary rounded-2xl p-1 overflow-auto box-border transition-all duration-600 ease-in-out"
      :style="displayStore.mainContentStyle"
    >
      <main-content />
    </main>

    <!-- resonance Button -->
    <nuxt-link
      v-if="showresonance"
      to="/resonance"
      class="fixed z-40 bottom-6 left-6 sm:bottom-8 sm:left-8 text-white rounded-full p-4 sm:p-6 flex items-center justify-center shadow-lg hover:bg-secondary transition-all duration-700 opacity-0 animate-fade-in"
    >
      <Icon name="kind-icon:resonance" class="w-6 h-6 sm:w-8 sm:h-8" />
    </nuxt-link>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { ref, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const showresonance = ref(false)

onMounted(() => {
  setTimeout(() => {
    showresonance.value = true
  }, 300) // slight delay for elegance
})
</script>

<style scoped>
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}
</style>
