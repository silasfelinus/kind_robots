<template>
  <header
    class="relative flex items-center justify-between bg-base-300 rounded-2xl border-1 md:border-2 lg:border-3 xl:border-4 max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Avatar and Viewport Size -->
    <div
      class="flex items-center justify-left w-1/5 sm:w-1/6 h-full relative rounded-2xl"
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

    <!-- Title and Subtitle Section -->
    <div
      class="flex-1 h-full flex flex-col items-center justify-center md:justify-between text-center md:flex-row space-y-2 md:space-y-0 px-4"
    >
      <!-- Title and Subtitle -->
      <div
        class="flex flex-col lg:flex-row items-center md:items-start text-center md:text-left flex-1"
      >
        <h1
          class="text-md md:text-2xl lg:text-3xl xl:text-4xl font-semibold text-ellipsis"
        >
          The {{ page.title || 'Room' }} Room
        </h1>
        <h2
          class="text-sm md:text-lg lg:text-xl xl:text-2xl italic text-ellipsis"
        >
          {{ subtitle }}
        </h2>
      </div>

      <!-- Icons -->
      <div
        class="flex justify-center items-center md:ml-5 md:mr-5 flex-shrink-0"
      >
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
