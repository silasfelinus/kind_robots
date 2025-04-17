<!-- /components/content/story/splash-tutorial.vue -->
<template>
  <div
    class="flex flex-col h-full w-full overflow-hidden rounded-2xl bg-base-300 border border-accent shadow-lg z-10"
  >
    <!-- Nav Component: 35% height -->
    <component
      v-if="navComponent"
      :is="navComponent"
      class="w-full h-[35%] min-h-[120px]"
    />

    <!-- Image + Title Section -->
    <div
      class="w-full flex flex-col items-center justify-start"
      :class="navComponent ? 'h-[30%]' : 'h-[50%]'"
    >
      <!-- Image: fills half this section -->
      <div
        class="flex justify-center items-center w-full"
        :class="navComponent ? 'h-[50%]' : 'h-[70%]'"
      >
        <image-toggle />
      </div>

      <!-- Title, Description, Icon: fills remaining -->
      <div
        class="flex flex-col items-center justify-evenly w-full text-center px-4 h-[50%] space-y-2"
      >
        <h1
          v-if="title"
          class="text-2xl lg:text-4xl font-bold truncate bg-primary text-white rounded-xl p-2"
        >
          {{ title }}
        </h1>
        <h3
          v-if="description"
          class="text-sm md:text-lg lg:text-xl xl-text-2xl font-medium"
        >
          {{ description }}
        </h3>
        <div v-if="icon" class="opacity-30">
          <Icon
            :name="icon"
            class="w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16"
          />
        </div>
      </div>
    </div>

    <!-- Bot Tips Section: remaining space -->
    <div
      v-if="dottitip && amitip"
      class="flex flex-col justify-end w-full px-2 md:px-4 py-2 h-[35%] overflow-auto"
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
// /components/content/story/splash-tutorial.vue
import { usePageStore } from '@/stores/pageStore'

const { title, description, icon, dottitip, navComponent, amitip } =
  storeToRefs(usePageStore())
</script>
