<template>
  <header
    class="relative flex items-center justify-between bg-base-300 rounded-2xl border-1 max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Avatar and Viewport -->
    <div class="flex items-center justify-left w-1/5 h-full relative rounded-2xl">
      <avatar-image
        alt="User Avatar"
        class="w-full h-full rounded-2xl object-cover"
      />
      <div
        v-if="isAdmin"
        class="absolute bottom-2 right-2 text-white bg-primary rounded-md text-xs p-1"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Title and Subtitle -->
    <div class="flex flex-col items-center justify-center text-center flex-1 px-4">
      <h1 class="text-lg font-semibold text-ellipsis">
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2 class="text-sm italic text-ellipsis">
        {{ subtitle }}
      </h2>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

// Stores
const displayStore = useDisplayStore()
const userStore = useUserStore()

// Computed values
const isAdmin = computed(() => userStore.user?.Role === 'ADMIN')

// Page and subtitle
const { page } = useContent()
const subtitle = computed(() => page.value?.subtitle ?? 'Welcome to Kind Robots')
</script>
