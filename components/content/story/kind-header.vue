<template>
  <header
    class="relative bg-base-300 rounded-2xl border border-black w-full h-full box-border"
  >
    <div class="grid grid-cols-12 items-stretch h-full w-full">
      <!-- Avatar: always 10% on lg+, full-width otherwise -->
      <div class="col-span-12 lg:col-span-1 flex items-center justify-center overflow-hidden rounded-2xl">
        <avatar-image
          alt="User Avatar"
          class="h-full w-full object-cover rounded-2xl"
        />
      </div>

      <!-- Title/Subtitle (only on lg+ and when not bigMode) -->
      <div
        v-if="!bigMode"
        class="hidden lg:flex flex-col justify-center items-center col-span-3 text-center px-2"
      >
        <Transition name="fade-scale" mode="out-in" appear>
          <h1
            v-if="showTitle"
            key="title"
            class="font-bold text-xl lg:text-2xl xl:text-3xl tracking-tight drop-shadow"
          >
            The {{ page?.title || 'Room' }} Room
          </h1>
          <h2
            v-else
            key="subtitle"
            class="text-lg lg:text-2xl xl:text-3xl drop-shadow-md"
          >
            {{ subtitle }}
          </h2>
        </Transition>
      </div>

      <!-- Smart Icons -->
      <div
        class="col-span-12 lg:col-span-8 flex justify-end items-center px-4"
        :class="{ 'pt-4': bigMode }"
      >
        <smart-icons
          :compact="bigMode"
          class="w-full flex justify-end items-center"
        />
      </div>
    </div>

    <!-- Debug Viewport -->
    <div class="absolute bottom-0 left-2 text-white bg-primary rounded-md text-xs md:text-sm">
      {{ viewportSize }}
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
