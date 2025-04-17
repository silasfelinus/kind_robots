<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <div class="relative h-full w-full overflow-hidden rounded-2xl z-0">
    <!-- Full Background Image -->
    <div class="absolute inset-0 z-0">
      <image-toggle
        class="h-full w-auto min-w-full object-cover object-center"
      />
    </div>

    <!-- Foreground Content -->
    <div class="relative z-10 flex flex-col h-full w-full text-white">
      <!-- Title and Subtitle -->
      <div
        class="flex flex-col items-center text-center p-4 space-y-2 bg-base-300/70 backdrop-blur-md rounded-b-2xl"
        @click="toggle"
      >
        <h1
          v-if="title"
          class="text-3xl md:text-5xl font-bold bg-primary text-white px-4 py-2 rounded-xl bg-opacity-80"
        >
          The {{ title }} Room
        </h1>
        <h3
          v-if="description"
          class="text-base md:text-lg lg:text-xl font-medium bg-base-100/60 px-3 py-1 rounded-md"
        >
          {{ description }}
        </h3>
      </div>

      <!-- Optional Nav Component (excluded from toggle) -->
      <component
        v-if="navComponent"
        :is="navComponent"
        class="w-full p-2 backdrop-blur-md bg-base-200/60 rounded-xl pointer-events-auto"
      />

      <!-- Remaining tappable area for hide -->
      <div class="flex-grow relative" @click="toggle">
        <!-- Bot Chat -->
        <div
          v-if="dottitip && amitip"
          class="absolute bottom-0 w-full px-2 md:px-4 pb-4 z-20 space-y-2"
        >
          <div class="flex flex-col space-y-2 max-w-xl mx-auto">
            <!-- DottiBot -->
            <div class="chat chat-start">
              <div class="chat-image avatar">
                <div
                  class="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary"
                >
                  <img
                    src="/images/avatars/dottie1.webp"
                    alt="DottiBot Avatar"
                  />
                </div>
              </div>
              <div class="chat-bubble chat-bubble-primary">
                <span class="font-semibold">DottiBot:</span> {{ dottitip }}
              </div>
            </div>

            <!-- AMIbot -->
            <div class="chat chat-end">
              <div class="chat-image avatar">
                <div
                  class="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-secondary"
                >
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
    </div>
  </div>
</template>
<script setup lang="ts">
// /components/content/story/splash-tutorial.vue
import { usePageStore } from '@/stores/pageStore'
import { useDisplayStore } from '@/stores/displayStore'

const { title, description, icon, dottitip, navComponent, amitip } =
  storeToRefs(usePageStore())

const displayStore = useDisplayStore()

function toggle() {
  const isOpen = displayStore.sidebarRightState === 'open'
  displayStore.setSidebarRight(!isOpen)
}
</script>
