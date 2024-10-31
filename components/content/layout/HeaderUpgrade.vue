<template>
  <header
    class="flex items-center justify-between bg-base-300 rounded-2xl border-4 p-1 max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Left Section: Avatar -->
    <div
      class="flex items-center justify-center w-1/4 h-full relative rounded-2xl"
    >
      <avatar-image
        alt="User Avatar"
        class="w-full h-full rounded-2xl object-cover"
      />
      <!-- Special Overlay: Shows viewportSize, positioned inside avatar-image -->
      <div
        v-if="isAdmin"
        class="absolute bottom-2 right-2 text-white bg-primary rounded-md text-xs md:text-sm p-1"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Middle Section: Title and Subtitle -->
    <div
      class="flex flex-col justify-center items-center text-center flex-grow w-1/4 h-full"
    >
      <h1
        class="text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold max-w-full text-ellipsis whitespace-nowrap"
      >
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2
        class="text-md md:text-lg lg:text-xl xl:text-2xl italic max-w-full text-ellipsis whitespace-nowrap lg:mt-0"
      >
        {{ subtitle }}
      </h2>
    </div>

    <!-- Right Section: Icons and Login -->
    <div class="flex items-center justify-end space-x-4 w-1/2">
      <login-path class="w-1/3" />
      <theme-icon class="w-1/3" />
      <swarm-icon class="w-1/3" />
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
