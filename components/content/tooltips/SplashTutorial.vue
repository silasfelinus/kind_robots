<template>
  <div
    class="relative flex flex-col h-full w-full overflow-hidden shadow-lg"
    :style="{ height: displayStore.mainVh + 'vh' }"
  >
    <!-- Floating Background Icon (now smaller and in the top-right corner) -->
    <div
      class="absolute top-2 right-2 z-0 opacity-30 md: w-12 md:h-12 lg:w-16 lg:h-16"
    >
      <Icon :name="page.icon" class="object-cover w-full h-full" />
    </div>

    <!-- Main Content Section -->
    <div
      class="flex-1 flex flex-col items-center justify-start space-y-2 overflow-y-auto p-2"
    >
      <!-- Main Image -->
      <img
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-base-300 shadow-md object-contain max-w-full max-h-[40vh] lg:max-h-[50vh]"
      />

      <!-- Title, Description, and Subtitle Section -->
      <div class="text-center w-full space-y-2">
        <h1 class="text-2xl lg:text-4xl font-bold text-secondary">
          {{ page.title }}
        </h1>

        <h2
          v-if="page.subtitle"
          class="text-sm md:text-md font-medium text-accent"
        >
          {{ page.subtitle }}
        </h2>

        <h3 class="text-2xl md:text-base font-medium text-secondary px-4">
          {{ page.description }}
        </h3>
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div
      class="flex flex-col space-y-4 w-full max-w-3xl px-4 py-2 overflow-y-auto"
    >
      <!-- DottiBot Message -->
      <div class="flex justify-start">
        <div
          class="flex items-start space-x-2 p-3 bg-primary border border-secondary text-base-200 rounded-tl-none rounded-tr-2xl rounded-bl-2xl rounded-br-2xl shadow-lg max-w-full lg:max-w-2/3"
        >
          <img
            src="/images/avatars/dottie1.webp"
            alt="DottiBot Avatar"
            class="w-8 h-8 lg:w-10 lg:h-10 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-xs font-semibold">DottiBot</span>
            <p class="text-xs md:text-lg lg:text-xl">{{ page.dottitip }}</p>
          </div>
        </div>
      </div>

      <!-- AMIbot Message -->
      <div class="flex justify-end">
        <div
          class="flex items-start space-x-2 p-3 bg-secondary border border-primary text-base-200 rounded-tl-2xl rounded-tr-none rounded-bl-2xl rounded-br-2xl shadow-lg max-w-full lg:max-w-2/3"
        >
          <img
            src="/images/amibotsquare1.webp"
            alt="AMIbot Avatar"
            class="w-8 h-8 lg:w-10 lg:h-10 rounded-full shadow-md"
          />
          <div class="flex flex-col">
            <span class="text-xs font-semibold">AMIbot</span>
            <p class="text-xs md:text-lg lg:text-xl text-white">{{ page.amitip }}</p>
          </div>
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
