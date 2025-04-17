<!-- /components/content/story/kind-header.vue -->
<template>
  <header
    v-if="hydrated"
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-black max-w-full box-border"
  >
    <!-- Top Row -->
    <div class="flex items-center justify-between w-full h-full">
      <!-- Avatar -->
      <div
        class="relative flex items-center flex-shrink-0 w-1/5 sm:w-1/6 h-full rounded-2xl overflow-hidden"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover"
        />
      </div>

      <!-- Viewport Label -->
      <div
        class="absolute bottom-0 left-2 text-white bg-primary rounded-md text-xs md:text-sm"
      >
        {{ displayStore.viewportSize }}
      </div>

      <!-- Header Content -->
      <div class="flex flex-1 h-full">
        <div
          class="flex flex-wrap md:flex-nowrap w-full h-full items-center gap-2 xl:gap-4"
        >
          <!-- Title + Subtitle -->
          <div
            class="flex flex-col justify-center flex-grow basis-full md:basis-1/2 xl:basis-1/3 min-w-0 pr-2"
          >
            <h1
              class="font-semibold text-md md:text-lg lg:text-xl xl:text-2xl leading-tight tracking-tight"
            >
              The {{ page?.title || 'Room' }} Room
            </h1>
            <h2
              v-if="!displayStore.bigMode"
              class="italic text-xs md:text-sm lg:text-md xl:text-lg text-ellipsis leading-tight mt-1 sm:mt-2"
            >
              {{ subtitle }}
            </h2>
          </div>

          <!-- Icons Section -->
          <div
            class="flex justify-end items-center flex-grow basis-full md:basis-1/2 xl:basis-2/3 min-w-0"
          >
            <kind-icons
              :compact="displayStore.bigMode"
              class="flex justify-end items-center gap-2 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// /components/content/story/kind-header.vue
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const { page, subtitle } = storeToRefs(pageStore)

const hydrated = ref(false)

onMounted(() => {
  hydrated.value = true
})
</script>
