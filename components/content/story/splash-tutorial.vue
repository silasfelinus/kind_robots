<template>
  <div
    class="flex flex-col h-full w-full overflow-y-auto shadow-lg border-1 border-accent rounded-2xl box-border bg-base-300 z-10"
  >


    <!-- Main Content Section -->
    <div
      class="flex-1 flex flex-col items-center justify-between p-1 overflow-auto no-scrollbar"
    >
      <!-- Main Image -->
    <image-toggle />

      <!-- Title, Description -->
      <div class="text-center w-full space-y-4">
        <h1
          v-if="title"
          class="text-2xl lg:text-4xl font-bold truncate bg-primary text-white rounded-xl p-2"
        >
          {{ title }}
        </h1>

        <h3
          v-if="description"
          class="text-sm md:text-lg lg:text-xl xl-text-2xl font-medium px-4"
        >
          {{ description }}
        </h3>
      </div>

      <!-- Floating Background Icon -->
      <div v-if="icon" class="flex justify-center items-center opacity-30">
        <Icon :name="icon" class="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div
      v-if="dottitip && amitip"
      class="flex flex-col w-full max-w-3xl px-2 md:px-4 py-0 md:py-1 lg:py-2 mx-auto"
    >
      <!-- DottiBot -->
      <div class="chat chat-start">
        <div class="chat-image avatar">
          <div
            class="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-primary"
          >
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
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const { title, description, image, icon, dottitip, amitip } =
  storeToRefs(usePageStore())
</script>
