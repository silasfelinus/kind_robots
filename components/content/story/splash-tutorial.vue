<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <div class="relative h-full w-full overflow-hidden rounded-2xl z-0">
    <!-- Full Background Image -->
    <div class="absolute inset-0 z-0">
      <image-toggle class="h-full w-full object-cover object-center" />
    </div>

    <!-- Top-right Icon -->
    <div v-if="icon" class="absolute top-2 right-2 z-20">
      <Icon
        :name="icon"
        class="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 opacity-80"
      />
    </div>

    <!-- Foreground Content -->
    <div
      class="relative z-10 flex flex-col h-full w-full text-white px-4 pt-2 space-y-4"
    >
      <!-- Optional Nav -->
      <component
        v-if="navComponent"
        :is="navComponent"
        class="w-full h-[35%] min-h-[120px] backdrop-blur-md bg-base-300/60 rounded-xl p-2"
      />

      <!-- Title + Description -->
      <div
        class="flex flex-col items-center justify-center text-center px-4"
        :class="navComponent ? 'h-[30%]' : 'h-[50%]'"
      >
        <h1
          v-if="title"
          class="text-2xl lg:text-4xl font-bold bg-primary text-white px-4 py-2 rounded-xl bg-opacity-70"
        >
          The {{ title }} Room
        </h1>

        <h3
          v-if="description"
          class="text-sm md:text-lg lg:text-xl xl-text-2xl font-medium mt-2 bg-base-300/60 px-3 py-1 rounded-md"
        >
          {{ description }}
        </h3>
      </div>

      <!-- Bot Chat -->
      <div
        v-if="dottitip && amitip"
        class="flex flex-col justify-end w-full px-2 md:px-4 py-2 h-[35%] overflow-y-auto space-y-2"
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
  </div>
</template>

<script setup lang="ts">
// /components/content/story/splash-tutorial.vue
import { usePageStore } from '@/stores/pageStore'

const { title, description, icon, dottitip, navComponent, amitip } =
  storeToRefs(usePageStore())
</script>
