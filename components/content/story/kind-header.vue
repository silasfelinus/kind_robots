<!-- /components/content/story/kind-header.vue -->
<template>
  <header
    v-if="hydrated"
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-black max-w-full box-border"
  >
    <!-- Top Row -->
    <div class="flex items-center justify-between w-full h-full px-2 sm:px-4">
      <!-- Avatar -->
      <div
        class="relative flex items-center w-1/5 sm:w-1/6 h-full rounded-2xl overflow-hidden"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover"
        />
      </div>

      <!-- Viewport Label -->
      <div
        class="absolute bottom-0 left-2 mb-1 px-2 py-1 text-white bg-primary rounded-md text-xs md:text-sm"
      >
        {{ displayStore.viewportSize }}
      </div>

      <!-- Header Content -->
      <div class="flex flex-col flex-1 h-full px-4">
        <div
          class="flex flex-wrap xl:flex-nowrap w-full h-full items-center gap-2 xl:gap-4"
        >
          <!-- Title + Subtitle -->
          <div class="flex flex-col justify-center w-full xl:w-1/3 pr-2">
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

          <!-- Icons -->
          <div class="w-full xl:w-1/3 flex justify-end gap-2 items-center">
            <kind-icons :compact="displayStore.bigMode" />
            <login-path
              :compact="displayStore.bigMode"
              class="flex max-w-[80px]"
            />
            <jellybean-count
              :compact="displayStore.bigMode"
              class="flex max-w-[80px]"
            />
            <theme-icon
              :compact="displayStore.bigMode"
              class="flex max-w-[80px]"
            />
            <swarm-icon
              :compact="displayStore.bigMode"
              class="flex max-w-[80px]"
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
