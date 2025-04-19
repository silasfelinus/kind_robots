<template>
  <div class="relative w-full h-full overflow-hidden rounded-2xl z-10">
    <!-- Fullscreen Background Layer -->
    <div class="fixed inset-0 z-0 pointer-events-none">
      <image-background class="h-full w-auto object-cover" />
    </div>

    <!-- Foreground Content Clickable Layer -->
    <div
      class="relative z-10 container px-4 py-6 space-y-8 backdrop-blur-xl max-w-4xl mx-auto"
      @click="handleSidebarClose"
    >
      <!-- Title Block -->
      <div class="relative space-y-2 text-center">
        <div class="absolute top-0 right-0 max-w-[100px] z-30">
          <Icon :name="icon" class="w-full h-auto text-primary" />
        </div>

        <h1
          v-if="title"
          class="text-white text-3xl md:text-5xl font-bold animate-fade-in-up"
        >
          The {{ title }} Room
        </h1>

        <h2
          v-if="description"
          class="text-white text-base md:text-lg lg:text-xl font-medium animate-fade-in-up delay-200"
        >
          {{ description }}
        </h2>
      </div>

      <!-- Navigation Component (not clickable) -->
      <div @click.stop>
        <component :is="navComponentToUse" class="w-full pointer-events-auto" />
      </div>

      <!-- Bot Tips -->
      <div v-if="dottitip && amitip" class="space-y-6 max-w-2xl mx-auto">
        <div class="chat chat-start animate-fade-in-up delay-300">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-primary">
              <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
            </div>
          </div>
          <div class="chat-bubble text-white bg-primary/70">
            <span class="font-semibold">DottiBot:</span> {{ dottitip }}
          </div>
        </div>

        <div class="chat chat-end animate-fade-in-up delay-500">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-secondary">
              <img src="/images/amibotsquare1.webp" alt="AMIbot Avatar" />
            </div>
          </div>
          <div class="chat-bubble text-white bg-secondary/70">
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
import { computed } from 'vue'

const pageStore = usePageStore()
const displayStore = useDisplayStore()
const { title, description, icon, dottitip, amitip, navComponent } =
  storeToRefs(pageStore)

const handleSidebarClose = () => {
  displayStore.setSidebarRight(false)
}

const navComponentToUse = computed(() => {
  return navComponent.value || 'mode-row'
})
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
