<template>
  <div
    class="relative flex flex-col h-full w-full overflow-hidden shadow-lg border-4 rounded-2xl box-border bg-base-300"
  >
    <!-- Under Construction Icon -->
    <div
      v-if="page && page.underConstruction"
      class="absolute top-2 left-2 z-20 opacity-90 md:w-12 md:h-12 lg:w-16 lg:h-16"
    >
      <Icon
        name="emojione:construction"
        class="object-cover w-full h-full text-warning"
      />
    </div>

    <!-- Main Content Section -->
    <div
      class="flex-1 flex flex-col items-center justify-between p-1 box-border overflow-hidden"
      :style="{ height: mainHeight }"
    >
      <!-- Main Image -->
      <img
        v-if="page && page.image"
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-accent shadow-md object-contain max-w-full max-h-[25vh] md:max-h-[30vh] lg:max-h-[35vh] flex-shrink-0"
      />

      <!-- Title, Description, and Subtitle -->
      <div class="text-center w-full space-y-1 lg:space-y-2 flex-shrink-0">
        <h1
          v-if="page && page.title"
          class="text-2xl lg:text-4xl font-bold truncate bg-primary text-white rounded-xl p-1 box-border"
        >
          {{ page.title }}
        </h1>

        <h3
          v-if="page && page.description"
          class="text-sm lg:text-md font-medium px-2"
        >
          {{ page.description }}
        </h3>
      </div>

      <!-- Floating Background Icon -->
      <div
        v-if="page && page.icon"
        class="flex justify-center items-center opacity-30 z-10 flex-shrink-0"
      >
        <Icon
          :name="page.icon"
          class="w-10 h-10 md:w-12 md:h-12 lg:w-15 lg:h-15"
        />
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div
      v-if="page && page.dottitip && page.amitip"
      class="flex flex-col w-full max-w-3xl px-4 py-1 mx-auto flex-shrink-0"
      :style="{ height: displayStore.mainVh + 'vh' }"
    >
      <!-- DottiBot Message -->
      <div class="chat chat-start">
        <div class="chat-image avatar">
          <div
            class="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-primary"
          >
            <img src="/images/avatars/dottie1.webp" alt="DottiBot Avatar" />
          </div>
        </div>
        <div class="chat-bubble chat-bubble-primary">
          <span class="font-semibold">DottiBot:</span> {{ page.dottitip }}
        </div>
      </div>

      <!-- AMIbot Message -->
      <div class="chat chat-end">
        <div class="chat-image avatar">
          <div
            class="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-secondary"
          >
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

// Access the page content
const displayStore = useDisplayStore()
const { page } = useContent()

const mainHeight = computed(() => displayStore.mainVh)
</script>
