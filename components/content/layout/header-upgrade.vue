<!-- /components/content/layout/header-upgrade.vue -->
<template>
  <header
    class="relative flex flex-col bg-base-300 rounded-2xl border-1 border-accent max-w-full box-border"
    :style="{ height: displayStore.headerHeight }"
  >
    <!-- Top Section: Avatar and Viewport -->
    <div class="flex items-center justify-between w-full h-full">
      <!-- Avatar Section -->
      <div
        class="relative flex items-center justify-left w-1/5 sm:w-1/6 h-full rounded-2xl pr-2"
      >
        <!-- Image takes full height with no padding -->
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover"
        />

        <!-- Viewport Notice Overlay -->
        <div
          class="absolute bottom-2 left-2 text-white bg-primary/80 rounded-md text-xs md:text-sm p-1"
        >
          {{ displayStore.viewportSize }}
        </div>
      </div>

      <screen-debug />

      <!-- Conditional Header Content -->
      <div class="flex flex-col flex-1 h-full">
        <SmallHeader v-if="isSmallDisplay" />
        <LargeHeader v-else />
        <ModeRow class="w-full" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access stores
const displayStore = useDisplayStore()
const isSmallDisplay = computed(() => displayStore.viewportSize === 'small')
</script>
