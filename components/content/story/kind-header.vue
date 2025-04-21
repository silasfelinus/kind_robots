<!-- /components/content/story/kind-header.vue -->
<template>
  <header
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
          <!-- Mobile: Animated toggle between title and subtitle -->
          <div
            v-if="
              ['small', 'medium'].includes(displayStore.viewportSize) &&
              !displayStore.bigMode
            "
            class="w-full flex justify-center items-center text-center flex-grow basis-full md:basis-1/4 min-w-0 pr-2 relative"
          >
            <Transition name="fade-scale" mode="out-in" appear>
              <h1
                v-if="
                  ['hidden', 'disabled'].includes(displayStore.sidebarLeftState)
                "
                key="title"
                class="absolute font-semibold text-md md:text-lg lg:text-xl xl:text-2xl leading-tight tracking-tight transition duration-300"
              >
                The {{ page?.title || 'Room' }} Room
              </h1>

              <h2
                v-else
                key="subtitle"
                class="absolute italic text-xs md:text-sm lg:text-md xl:text-lg leading-tight text-primary transition duration-300"
              >
                {{ subtitle }}
              </h2>
            </Transition>
          </div>

          <!-- Icons Section -->
          <div
            class="flex justify-end items-center flex-grow basis-full md:basis-3/4 min-w-0"
          >
            <kind-icons
              :compact="displayStore.bigMode"
              class="flex justify-end items-center pb-1 w-full"
            />
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// /components/content/story/kind-header.vue
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()
const { page, subtitle } = storeToRefs(pageStore)
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
