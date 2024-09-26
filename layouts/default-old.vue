<template>
  <div class="flex flex-col h-screen w-screen relative">
    <!-- Toggle Navigation Button -->
    <button class="absolute top-[10vh] left-3 z-40" @click="toggleNav">
      <icon name="fluent:row-triple-20-filled" class="text-2xl" />
    </button>

    <!-- Header Dashboard -->
    <div class="flex w-full shadow-lg">
      DefaultOld
      <header-dashboard />
    </div>

    <!-- Messages Area (tutorial-cards) -->
    <div>
      <dotti-cards />
    </div>
    <smart-links />

    <div class="flex-grow flex">
      <!-- User Navigation -->
      <div
        :class="{
          'w-[50%]': isNavVisible && isLargeScreen,
          hidden: !isNavVisible || !isLargeScreen,
          'w-full': isNavVisible && !isLargeScreen,
        }"
        class="flex-none h-full overflow-y-auto transition-all duration-600 ease-in-out bg-base-300 rounded-lg shadow-lg"
        @click.stop
      >
        <navigation-trimmed class="rounded-2xl p-1 m-1" />
      </div>

      <!-- Main Slot -->
      <div
        class="flex-grow h-full overflow-y-auto bg-gray-100 rounded-lg shadow-lg"
        @click="closeNav"
      >
        <div class="h-full w-full border border-gray-300 rounded">
          <slot class="bg-grey-200 rounded-2xl p-1 m-1" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const isNavVisible = ref(false)
const isLargeScreen = ref(false)

const toggleNav = () => {
  isNavVisible.value = !isNavVisible.value
}

const closeNav = () => {
  isNavVisible.value = false
}

const handleResize = () => {
  isLargeScreen.value = window.innerWidth > 1024
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>
