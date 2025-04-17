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

 <!-- Toggle Button with Animated Indicator -->
<div class="w-full xl:w-1/3 flex justify-end items-center">
  <div class="relative bg-base-200 rounded-full p-1 flex gap-1 border border-base-300 shadow-inner">
    <button
      @click="showIcons = true"
      class="relative z-10 px-3 py-1 text-xs rounded-full transition-all duration-300"
      :class="showIcons ? 'text-white' : 'text-gray-400'"
    >
      Icons
    </button>
    <button
      @click="showIcons = false"
      class="relative z-10 px-3 py-1 text-xs rounded-full transition-all duration-300"
      :class="!showIcons ? 'text-white' : 'text-gray-400'"
    >
      Modes
    </button>

    <!-- Animated Indicator -->
    <span
      class="absolute top-1 bottom-1 w-1/2 rounded-full bg-info transition-all duration-300 z-0"
      :class="showIcons ? 'left-1' : 'left-1/2'"
    />
  </div>
</div>


<!-- Transitioned Icon/Mode Section -->
<transition
  name="fade-slide"
  mode="out-in"
  appear
>
  <component
    :is="showIcons ? 'kind-icons' : 'mode-row'"
    :compact="displayStore.bigMode"
    key="toggle-view"
    class="w-full xl:w-1/3 flex justify-end gap-2 items-center"
  />
</transition>


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
const showIcons = ref(true)

onMounted(() => {
  hydrated.value = true
})

</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Shimmer effect on the indicator pill */
.animated-indicator {
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 25%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
  opacity: 0.9;
}

@keyframes shimmer {
  0% {
    background-position: -150% 0;
  }
  100% {
    background-position: 150% 0;
  }
}

</style>
