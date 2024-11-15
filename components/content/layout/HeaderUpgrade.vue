<template>
  <header
    class="relative flex md:flex-row flex-wrap sm:flex-nowrap items-center justify-between bg-base-300 rounded-2xl border-1 md:border-2 lg:border-3 xl:border-4 max-w-full box-border"
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
    <div class="relative flex-1 h-full">
      <!-- Small Screens -->
      <div
        class="absolute inset-0 flex flex-col justify-between sm:hidden space-y-2 p-2"
      >
        <!-- Title (Top) -->
        <h1
          class="absolute top-2 left-1/5 text-md font-semibold w-full text-ellipsis text-left"
        >
          The {{ page.title || 'Room' }} Room
        </h1>

        <!-- Subtitle (Bottom) -->
        <h2
          class="absolute bottom-2 left-1/5 text-sm italic text-ellipsis w-full text-left"
        >
          {{ subtitle }}
        </h2>

        <!-- Icons (Middle) -->
        <div
          class="absolute inset-y-1/2 left-1/5 transform -translate-y-1/2 flex justify-start items-center space-x-4"
        >
          <login-path class="flex" />
          <theme-icon class="flex" />
          <swarm-icon class="flex" />
        </div>
      </div>

      <!-- Medium Screens -->
      <div
        class="hidden sm:flex md:flex-col md:justify-between items-center text-center space-y-2"
      >
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

      <!-- Large Screens -->
      <div
        class="hidden lg:flex lg:flex-row lg:items-center lg:justify-between w-full space-x-4"
      >
        <!-- Title -->
        <h1
          class="text-lg lg:text-xl xl:text-2xl font-semibold text-ellipsis flex-grow text-left"
        >
          The {{ page.title || 'Room' }} Room
        </h1>
        <!-- Subtitle -->
        <h2
          class="text-md lg:text-lg xl:text-xl italic text-ellipsis flex-grow text-left"
        >
          {{ subtitle }}
        </h2>
        <!-- Icons -->
        <div class="flex justify-end items-center space-x-4">
          <login-path class="flex" />
          <theme-icon class="flex" />
          <swarm-icon class="flex" />
        </div>
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
