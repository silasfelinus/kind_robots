<template>
  <header
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-black max-w-full box-border"
  >
    <div class="flex items-center justify-between w-full h-full">
      <div
        class="relative flex items-center flex-shrink-0 w-1/5 sm:w-1/6 h-full rounded-2xl overflow-hidden"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover"
        />
      </div>

      <div
        class="absolute bottom-0 left-2 text-white bg-primary rounded-md text-xs md:text-sm"
      >
        {{ viewportSize }}
      </div>

      <div class="flex flex-1 h-full">
        <div
          class="flex flex-wrap md:flex-nowrap w-full h-full items-center gap-2 xl:gap-4"
        >
          <!-- Title/Sub Toggle -->
          <div
            class="w-full flex justify-center items-center text-center flex-grow basis-full md:basis-1/4 min-w-0 pr-2 relative min-h-[3rem]"
          >
            <Transition name="fade-scale" mode="out-in" appear>
              <h1
                v-if="showTitle"
                key="title"
                class="absolute inset-0 flex items-center justify-center font-bold text-lg md:text-xl lg:text-2xl xl:text-3xl leading-tight tracking-tight drop-shadow"
              >
                The {{ page?.title || 'Room' }} Room
              </h1>

              <h2
                v-else
                key="subtitle"
                class="absolute inset-0 flex items-center justify-center md:text-lg lg:text-2xl xl:text-4xl drop-shadow-md"
              >
                {{ subtitle }}
              </h2>
            </Transition>
          </div>

          <!-- Icon Section -->
          <div
            class="flex justify-end items-center flex-grow basis-full md:basis-3/4 min-w-0"
          >
            <kind-icons
              :compact="bigMode"
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
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'

const displayStore = useDisplayStore()
const pageStore = usePageStore()

const { page, subtitle } = storeToRefs(pageStore)
const { sidebarLeftState, viewportSize, bigMode } = storeToRefs(displayStore)

const showTitle = computed(() =>
  ['hidden', 'disabled'].includes(sidebarLeftState.value),
)
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease,
    translate 0.3s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(0.5rem);
}

.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}
</style>
