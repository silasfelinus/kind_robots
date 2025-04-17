<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden rounded-2xl">
    <!-- Full Image Background -->
    <image-toggle
      class="absolute inset-0 z-0 w-full h-full object-cover min-w-full"
    />

    <!-- Icon Top Right -->
    <div class="absolute top-4 right-4 z-30 max-w-[50%]">
      <Icon :name="icon" class="w-full max-w-[100px] h-auto text-primary" />
    </div>

    <!-- Title + Subtitle -->
    <div
      class="absolute top-0 w-full z-20 text-white text-center py-6 px-4 pointer-events-none"
    >
      <h1
        v-if="title"
        class="inline-block text-3xl md:text-5xl font-bold px-4 py-2 rounded-xl bg-primary/80"
      >
        The {{ title }} Room
      </h1>
      <h3
        v-if="description"
        class="mt-2 inline-block text-base md:text-lg lg:text-xl font-medium px-3 py-1 rounded-md bg-base-100/70"
      >
        {{ description }}
      </h3>
    </div>

    <!-- Mode Navigation -->
    <mode-nav
      v-if="displayStore.displayMode"
      class="absolute inset-x-0 top-1/3 z-30 w-full px-4 pointer-events-auto"
    />

    <!-- Chat Tips (bottom half) -->
    <div
      v-if="dottitip && amitip"
      class="absolute bottom-0 z-40 w-full h-1/2 flex items-end px-4 pb-4 pointer-events-none"
    >
      <div class="flex flex-col space-y-2 max-w-xl mx-auto w-full">
        <!-- DottiBot -->
        <div class="chat chat-start">
          <div class="chat-image avatar">
            <div class="w-10 h-10 rounded-full border-2 border-primary">
              <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
            </div>
          </div>
          <div class="chat-bubble chat-bubble-primary">
            <span class="font-semibold">DottiBot:</span> {{ dottitip }}
          </div>
        </div>

        <!-- AMIbot -->
        <div class="chat chat-end">
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
