<template>
  <div
    class="relative flex flex-col h-full w-full rounded-2xl overflow-hidden shadow-lg"
    :style="{ height: displayStore.mainVh + 'vh' }"
  >
    <!-- Floating Background Icons Above Bot Messages (Larger, Centered) -->
    <div
      v-if="page && page.icon"
      class="hidden md:flex justify-center items-center opacity-20"
    >
      <Icon
        :name="page.icon"
        class="absolute top-1/2 left-1/2 w-24 h-24 lg:w-32 lg:h-32 z-0"
      />
    </div>

    <!-- Under Construction Icon (only visible if page.underConstruction is true) -->
    <div
      v-if="page && page.underConstruction"
      class="absolute top-2 left-2 z-10 opacity-90 md:w-12 md:h-12 lg:w-16 lg:h-16"
    >
      <Icon
        name="construction"
        class="object-cover w-full h-full text-warning"
      />
    </div>

    <!-- Main Content Section (flexible, responsive space) -->
    <div
      class="flex-1 flex flex-col items-center justify-start space-y-2 overflow-hidden p-2"
    >
      <!-- Main Image with max height to prevent overflow -->
      <img
        v-if="page && page.image"
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-contain max-w-full max-h-[30vh] md:max-h-[40vh] lg:max-h-[50vh]"
      />

      <!-- Title, Description, and Subtitle Section -->
      <div class="text-center w-full space-y-1 lg:space-y-2 overflow-hidden">
        <h1
          v-if="page && page.title"
          class="text-2xl lg:text-4xl font-bold truncate"
        >
          {{ page.title }}
        </h1>

        <h2
          v-if="page && page.subtitle"
          class="text-xs md:text-md font-medium text-accent truncate"
        >
          {{ page.subtitle }}
        </h2>

        <h3
          v-if="page && page.description"
          class="text-sm lg:text-md font-medium px-2 md:px-4 truncate"
        >
          {{ page.description }}
        </h3>
      </div>
    </div>

    <!-- Bot Messages Section (using DaisyUI chat bubbles) -->
    <div
      v-if="page && page.dottitip && page.amitip"
      class="flex flex-col space-y-4 w-full max-w-3xl px-4 py-1 lg:py-2 mx-auto"
    >
      <!-- DottiBot Message (Left-Aligned with DaisyUI chat-bubble) -->
      <div class="chat chat-start">
        <div class="chat-image avatar">
          <div class="w-10 h-10 md:w-12 md:h-12 rounded-full">
            <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
          </div>
        </div>
        <div class="chat-bubble chat-bubble-primary">
          <span class="font-semibold">DottiBot:</span> {{ page.dottitip }}
        </div>
      </div>

      <!-- AMIbot Message (Right-Aligned with DaisyUI chat-bubble) -->
      <div class="chat chat-end">
        <div class="chat-image avatar">
          <div class="w-10 h-10 md:w-12 md:h-12 rounded-full">
            <img src="/images/amibotsquare1.webp" alt="AMIbot Avatar" />
          </div>
        </div>
        <div class="chat-bubble chat-bubble-secondary">
          <span class="font-semibold">AMIbot:</span> {{ page.amitip }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const { page } = useContent()
</script>
