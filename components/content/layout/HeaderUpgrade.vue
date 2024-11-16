<template>
  <header
    class="relative flex items-center justify-between bg-base-300 rounded-2xl border-1 md:border-2 lg:border-3 xl:border-4 max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Avatar and Viewport Size -->
    <div
      class="flex items-center justify-center w-1/5 sm:w-1/6 h-full relative rounded-2xl"
    >
      <avatar-image
        alt="User Avatar"
        class="w-full h-full rounded-2xl object-cover"
      />
      <div
        v-if="isAdmin"
        class="absolute bottom-2 right-2 text-white bg-primary rounded-md text-xs md:text-sm p-1"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Responsive Layout -->
    <div
      class="flex-1 h-full flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0"
    >
      <!-- Medium Screens: Title and Subtitle Stacked -->
      <div class="flex flex-col items-center md:items-start text-center">
        <!-- Title -->
        <h1
          class="text-md md:text-lg lg:text-xl xl:text-2xl font-semibold text-ellipsis"
        >
          The {{ page.title || 'Room' }} Room
        </h1>
        <!-- Subtitle -->
        <h2
          class="text-sm md:text-md lg:text-lg xl:text-xl italic text-ellipsis"
        >
          {{ subtitle }}
        </h2>
      </div>

      <!-- Icons -->
      <div class="flex justify-end md:justify-center items-center space-x-4">
        <login-path class="flex" />
        <theme-icon class="flex" />
        <swarm-icon class="flex" />
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
