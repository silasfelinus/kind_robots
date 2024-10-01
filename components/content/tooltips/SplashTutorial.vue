<template>
  <div
    class="relative flex flex-col h-full w-full overflow-hidden shadow-lg"
    :style="{ height: displayStore.mainVh + 'vh' }"
  >
    <!-- Floating Background Icon (now smaller and in the top-right corner) -->
    <div
      v-if="page && page.icon"
      class="absolute top-2 right-2 z-0 opacity-30 md:w-12 md:h-12 lg:w-16 lg:h-16"
    >
      <Icon :name="page.icon" class="object-cover w-full h-full" />
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
        class="rounded-2xl border border-base-300 shadow-md object-contain max-w-full max-h-[30vh] md:max-h-[45vh] lg:max-h-[60vh]"
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

    <!-- Bot Messages Section (centered chat bubbles with left/right indent) -->
    <div
      v-if="page && page.dottitip && page.amitip"
      class="flex flex-col space-y-4 w-full max-w-3xl px-4 py-1 lg:py-2 mx-auto"
    >
      <!-- DottiBot Message (Left-Aligned with indent) -->
      <div class="flex justify-start">
        <div
          class="flex items-center space-x-2 p-3 bg-primary border border-secondary text-base-200 rounded-tl-none rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-lg max-w-full lg:max-w-2/3 pr-4 lg:text-lg lg:px-6 ml-4"
        >
          <img
            src="/images/avatars/dottie1.webp"
            alt="DottiBot Avatar"
            class="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-xs font-semibold">DottiBot</span>
            <p class="text-xs md:text-lg lg:text-xl">{{ page.dottitip }}</p>
          </div>
        </div>
      </div>

      <!-- AMIbot Message (Right-Aligned with indent) -->
      <div class="flex justify-end">
        <div
          class="flex items-center space-x-2 p-3 bg-secondary border border-primary text-base-200 rounded-tl-2xl rounded-tr-none rounded-bl-2xl rounded-br-2xl shadow-lg max-w-full lg:max-w-2/3 pl-4 lg:text-lg lg:px-6 mr-4"
        >
          <div class="flex flex-col">
            <span class="text-xs font-semibold">AMIbot</span>
            <p class="text-xs md:text-md lg:text-lg text-white">
              {{ page.amitip }}
            </p>
          </div>
          <img
            src="/images/amibotsquare1.webp"
            alt="AMIbot Avatar"
            class="w-10 h-10 md:w-12 md:h-12 rounded-full shadow-md"
          />
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
