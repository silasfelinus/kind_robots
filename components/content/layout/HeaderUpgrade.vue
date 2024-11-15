<template>
  <header
    class="flex flex-col md:flex-row items-center justify-between bg-base-300 rounded-2xl border-1 md:border-2 lg:border-3 xl:border-4 max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Section 1: Avatar -->
    <div
      class="flex items-center justify-center w-1/5 h-full relative rounded-2xl"
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
    <!-- Title Section -->
    <div
      class="flex flex-col md:w-3/5 w-full justify-center items-center text-center order-1 md:order-none"
    >
      <h1
        class="text-md md:text-lg lg:text-xl xl:text-2xl font-semibold w-full text-ellipsis"
      >
        The {{ page.title || 'Room' }} Room
      </h1>
    </div>

    <!-- Icons Section -->
    <div
      class="flex justify-around items-center w-full md:w-1/5 h-auto order-2 md:order-none my-2 md:my-0"
    >
      <login-path class="flex" />
      <theme-icon class="flex" />
      <swarm-icon class="flex" />
    </div>

    <!-- Subtitle Section -->
    <div
      class="flex flex-col md:w-3/5 w-full justify-center items-center text-center order-3 md:order-none"
    >
      <h2
        class="text-sm md:text-md lg:text-lg xl:text-xl italic text-ellipsis w-full"
      >
        {{ subtitle }}
      </h2>
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
