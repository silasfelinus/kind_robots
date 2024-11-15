<template>
  <header
    class="flex items-center justify-between bg-base-300 rounded-2xl border-1 md:border-2 lg:border-3 xl:border-4 max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Left Section: Avatar -->
    <div class="flex items-center justify-center w-1/4 h-full relative rounded-2xl">
      <avatar-image alt="User Avatar" class="w-full h-full rounded-2xl object-cover" />
      <!-- Special Overlay: Shows viewportSize, positioned inside avatar-image -->
      <div
        v-if="isAdmin"
        class="absolute bottom-2 right-2 text-white bg-primary rounded-md text-xs md:text-sm p-1"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Title and subtitle  -->
    <div
      class="flex flex-col justify-center items-center text-center h-full w-1/2"
    >
      <h1
        class="flex text-md md:text-lg lg:text-xl xl:text-2xl font-semibold w-full h-1/2 text-ellipsis sm:order-first"
      >
        The {{ page.title || 'Room' }} Room
      </h1>
        <h2
          class="text-sm md:text-md flex lg:text-lg xl:text-xl italic text-ellipsis w-full h-1/2"
        >
          {{ subtitle }}
        </h2>
    </div>

      <div class="flex justify-between h-full w-1/4">
        

        <!-- Icons Section -->
        <div class="flex-row items-center justify-end">
          <login-path class="flex w-1/3" />
          <theme-icon class="flex w-1/3" />
          <swarm-icon class="flex w-1/3" />
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
const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots')
</script>
