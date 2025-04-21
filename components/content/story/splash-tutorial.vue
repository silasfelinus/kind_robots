<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <div
    class="relative w-full h-full overflow-hidden rounded-2xl border-2 border-secondary z-20"
  >
    <!-- Background Image -->
    <img
      v-if="image"
      :src="`/images/${image}`"
      class="absolute inset-0 h-full w-auto object-cover z-0"
      alt="Ambient Background"
    />

    <!-- Foreground Content Grid -->
    <div
      class="relative z-20 grid grid-rows-[auto_auto_1fr_auto] h-full max-w-4xl mx-auto px-4 py-6 space-y-0"
    >
      <!-- Title + Description Block -->
      <div
        class="text-center space-y-2 cursor-pointer"
        @click="handleSidebarClose"
      >
        <div class="absolute top-0 right-0 max-w-[100px] z-30">
          <Icon :name="icon" class="w-full h-auto text-primary" />
        </div>

        <h1
          v-if="title"
          class="text-xl md:text-2xl lg:text-4xl xl:text-5xl font-bold bg-secondary/70 rounded-2xl px-4 py-2 inline-block animate-fade-in-up"
        >
          The {{ title }} Room
        </h1>

        <h2
          v-if="description"
          class="text-base md:text-lg lg:text-xl xl:text-2xl font-medium bg-secondary/70 rounded-2xl px-3 py-1 inline-block animate-fade-in-up delay-200"
        >
          {{ description }}
        </h2>
      </div>

      <!-- navComponent + mode-row grouped in middle -->
      <div class="flex flex-col items-center justify-center gap-4 py-4">
        <component
          v-if="navComponent"
          :is="navComponent"
          class="w-full pointer-events-auto"
        />
        <mode-row class="w-full min-h-[2.5rem] pointer-events-auto" />
      </div>

      <!-- Spacer to push chat to bottom -->
      <div></div>

      <!-- Bot Tips (pinned to bottom) -->
      <div
        v-if="dottitip && amitip"
        class="space-y-6 max-w-2xl mx-auto cursor-pointer pb-2"
        @click="handleSidebarClose"
      >
        <div class="chat chat-start animate-fade-in-up delay-300">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-primary">
              <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
            </div>
          </div>
          <div class="chat-bubble text-white bg-primary">
            <span class="font-semibold text-sm md:text-md lg:text-lg xl:text-xl">DottiBot:</span> {{ dottitip }}
          </div>
        </div>

        <div class="chat chat-end animate-fade-in-up delay-500">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-secondary">
              <img src="/images/amibotsquare1.webp" alt="AMIbot Avatar" />
            </div>
          </div>
          <div class="chat-bubble text-white bg-secondary">
            <span class="font-semibold text-sm md:text-md lg:text-lg xl:text-xl">AMIbot:</span> {{ amitip }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const { title, description, icon, dottitip, amitip, navComponent, image } =
  storeToRefs(usePageStore())

const handleSidebarClose = () => {
  console.log('Sidebar closing triggered')
  displayStore.setSidebarRight(false)
}
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
