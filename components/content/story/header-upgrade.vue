<template>
  <header
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-accent max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Top Section: Avatar and Viewport -->
    <div class="flex items-center justify-between w-full h-full">
      <!-- Avatar Section -->
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

      <!-- Conditional Header Content -->
      <div class="flex-1 h-full">
        <SmallHeader v-if="isSmallDisplay" />
        <LargeHeader v-else />
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

// Access stores
const displayStore = useDisplayStore()
const userStore = useUserStore()
const isAdmin = computed(() => userStore.user?.Role === 'ADMIN')
const isSmallDisplay = computed(() => displayStore.viewportSize === 'small')
</script>
