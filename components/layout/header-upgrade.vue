<!-- /components/content/layout/header-upgrade.vue -->
<template>
  <header
    class="relative flex flex-col bg-base-300 rounded-2xl border border-accent max-w-full box-border overflow-hidden"
    :style="{ height: `calc(var(--vh) * ${displayStore.headerHeight})` }"
  >
    <div class="flex items-center justify-between w-full h-full">
      <div
        class="relative flex items-center justify-start w-1/5 sm:w-1/6 h-full rounded-2xl pr-2"
      >
        <avatar-image
          alt="User Avatar"
          class="h-full w-full rounded-2xl object-cover"
        />

        <div
          class="absolute bottom-2 left-2 text-white bg-primary/80 rounded-md text-xs md:text-sm p-1"
        >
          {{ displayStore.viewportSize }}
        </div>
      </div>

      <screen-debug />

      <div class="flex flex-col flex-1 h-full min-w-0">
        <SmallHeader v-if="isMobileDisplay" />
        <LargeHeader v-else />
        <ModeRow class="w-full" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// /components/content/layout/header-upgrade.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
const isMobileDisplay = computed(() => displayStore.viewportSize === 'mobile')
</script>
