<template>
  <div class="relative w-full h-full overflow-hidden rounded-2xl z-10">
    <!-- Immersive Fullscreen Background Layer -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <image-toggle class="w-full h-full object-cover" />
    </div>

    <!-- Foreground Content Card (with local backdrop and blur) -->
    <div
      class="relative z-10 container mx-auto px-4 py-6 space-y-6 backdrop-blur-xl"
    >
      <!-- Title Block -->
      <div class="relative space-y-4">
        <div class="absolute top-0 right-0 max-w-[100px] z-30">
          <Icon :name="icon" class="w-full h-auto text-primary" />
        </div>

        <div
          v-if="title"
          class="bg-primary/80 text-white text-3xl md:text-5xl font-bold px-4 py-2 rounded-xl inline-block animate-fade-in-up"
        >
          The {{ title }} Room
        </div>

        <div
          v-if="description"
          class="bg-base-100/70 text-white text-base md:text-lg lg:text-xl font-medium px-3 py-1 rounded-md inline-block animate-fade-in-up delay-200"
        >
          {{ description }}
        </div>
      </div>

      <!-- Mode Nav -->
      <mode-nav
        v-if="displayStore.displayMode"
        class="w-full pointer-events-auto"
      />

      <!-- Bot Tips -->
      <div v-if="dottitip && amitip" class="max-w-xl mx-auto space-y-4">
        <div class="chat chat-start animate-fade-in-up delay-300">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-primary">
              <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
            </div>
          </div>
          <div class="chat-bubble chat-bubble-primary">
            <span class="font-semibold">DottiBot:</span> {{ dottitip }}
          </div>
        </div>

        <div class="chat chat-end animate-fade-in-up delay-500">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-secondary">
              <img src="/images/amibotsquare1.webp" alt="AMIbot Avatar" />
            </div>
          </div>
          <div class="chat-bubble chat-bubble-secondary">
            <span class="font-semibold">AMIbot:</span> {{ amitip }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/splash-tutorial.vue
import { storeToRefs } from 'pinia'
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'

const { title, description, icon, dottitip, amitip } =
  storeToRefs(usePageStore())
const displayStore = useDisplayStore()
</script>

<style scoped>
@keyframes fade-in-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}
.delay-200 {
  animation-delay: 0.2s;
}
.delay-300 {
  animation-delay: 0.3s;
}
.delay-500 {
  animation-delay: 0.5s;
}
</style>
