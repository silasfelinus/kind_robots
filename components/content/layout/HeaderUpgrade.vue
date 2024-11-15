<template>
  <header
    class="flex md:flex-row flex-wrap sm:flex-nowrap items-center justify-between bg-base-300 rounded-2xl border-1 md:border-2 lg:border-3 xl:border-4 max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Section 1: Avatar -->
    <div
      class="flex items-center justify-center w-1/5 sm:w-1/6 h-full relative rounded-2xl"
    >
      <avatar-image
        alt="User Avatar"
        class="w-full h-full rounded-2xl object-cover"
      />
      <!-- Overlay: Viewport size -->
      <div
        v-if="isAdmin"
        class="absolute bottom-2 right-2 text-white bg-primary rounded-md text-xs md:text-sm p-1"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Right Section: Title, Icons, and Subtitle -->
    <div
      class="flex flex-col sm:flex-1 w-full h-full justify-between sm:justify-center sm:items-center sm:text-center space-y-2 sm:space-y-0"
    >
      <!-- Title -->
      <div class="flex justify-center sm:justify-start sm:text-center">
        <h1
          class="text-md md:text-lg lg:text-xl xl:text-2xl font-semibold text-ellipsis w-full sm:w-auto"
        >
          The {{ page.title || 'Room' }} Room
        </h1>
      </div>

      <!-- Icons -->
      <div
        class="flex justify-around items-center w-full sm:w-auto sm:justify-center"
      >
        <login-path class="flex" />
        <theme-icon class="flex" />
        <swarm-icon class="flex" />
      </div>

      <!-- Subtitle -->
      <div class="flex justify-center sm:justify-start sm:text-center">
        <h2
          class="text-sm md:text-md lg:text-lg xl:text-xl italic text-ellipsis w-full sm:w-auto"
        >
          {{ subtitle }}
        </h2>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

// Access display store
const displayStore = useDisplayStore()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.Role === 'ADMIN')

// Access page content and subtitle
const { page } = useContent()
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>
