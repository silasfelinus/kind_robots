<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <div class="relative w-full h-full overflow-hidden rounded-2xl">
    <!-- Icon Top Right -->
    <div class="absolute top-2 right-2 z-30 max-w-[50%]">
      <Icon :name="icon" class="w-full max-w-[100px] h-auto text-primary" />
    </div>

    <!-- Title and Subtitle -->
    <div class="relative z-20 text-white text-center py-4 px-2 space-y-2">
      <h1
        v-if="title"
        class="text-3xl md:text-5xl font-bold bg-primary px-4 py-2 rounded-xl inline-block bg-opacity-80"
      >
        The {{ title }} Room
      </h1>
      <h3
        v-if="description"
        class="text-base md:text-lg lg:text-xl font-medium bg-base-100/60 px-3 py-1 rounded-md inline-block"
      >
        {{ description }}
      </h3>
    </div>

    <!-- Full Image -->
    <div class="relative z-10 h-full w-full">
      <image-toggle class="w-full h-full object-cover min-w-full" />
    </div>

    <!-- Chat Tips Overlay -->
    <div
      v-if="dottitip && amitip"
      class="absolute bottom-0 w-full px-4 pb-4 z-40 pointer-events-none"
    >
      <div class="flex flex-col space-y-2 max-w-xl mx-auto">
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
</script>
