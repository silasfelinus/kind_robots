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
      class="flex-1 flex flex-col items-center justify-between p-2 box-border overflow-y-auto no-scrollbar"
    >
      <!-- Main Image -->
      <img
        v-if="page && page.image"
        :src="'/images/' + page.image"
        alt="Main Image"
        class="rounded-2xl border border-accent shadow-md object-contain w-full max-w-full max-h-[35vh] flex-grow"
      />

      <!-- Title, Description, and Subtitle -->
      <div class="text-center w-full space-y-2 flex-grow">
        <h1
          v-if="page && page.title"
          class="text-2xl lg:text-4xl font-bold truncate bg-primary text-white rounded-xl p-2 box-border"
        >
          {{ page.title }}
        </h1>

        <h3
          v-if="page && page.description"
          class="text-sm lg:text-md font-medium px-4"
        >
          {{ page.description }}
        </h3>
      </div>

      <!-- Floating Background Icon -->
      <div
        v-if="page && page.icon"
        class="flex justify-center items-center opacity-30 z-10 flex-grow"
      >
        <Icon
          :name="page.icon"
          class="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20"
        />
      </div>
    </div>

    <!-- Bot Messages Section -->
    <div
      v-if="page && page.dottitip && page.amitip"
      class="flex flex-col w-full max-w-3xl px-4 py-2 mx-auto"
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
</script>
