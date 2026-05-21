<!-- /layouts/default.vue -->
<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden bg-base-200">
    <!-- Left sidebar -->
    <aside
      class="fixed overflow-visible transition-all duration-300 ease-out"
      :style="displayStore.leftSidebarStyle"
    >
      <div class="h-full overflow-y-auto">
        <slot name="left">
          <splash-tutorial />
        </slot>
      </div>
    </aside>

    <!-- Right sidebar -->
    <aside
      class="fixed overflow-visible transition-all duration-300 ease-out"
      :style="displayStore.rightSidebarStyle"
    >
      <div class="h-full overflow-y-auto">
        <slot name="right">
          <user-panel />
        </slot>
      </div>
    </aside>

    <!-- Left sidebar back-toggle -->
    <template v-if="displayStore.sidebarLeftVisible">
      <button
        :style="displayStore.leftSidebarBackToggleStyle"
        class="btn btn-circle btn-xs border border-base-300 bg-base-100/90 text-base-content shadow-md backdrop-blur transition-all duration-300 ease-out hover:border-secondary hover:bg-secondary hover:text-secondary-content active:scale-90"
        aria-label="Reduce left sidebar"
        type="button"
        @click="displayStore.toggleLeftSidebar('backward')"
      >
        <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
      </button>
    </template>

    <!-- Right sidebar back-toggle -->
    <template v-if="displayStore.sidebarRightVisible">
      <button
        :style="displayStore.rightSidebarBackToggleStyle"
        class="btn btn-circle btn-xs border border-base-300 bg-base-100/90 text-base-content shadow-md backdrop-blur transition-all duration-300 ease-out hover:border-secondary hover:bg-secondary hover:text-secondary-content active:scale-90"
        aria-label="Reduce right sidebar"
        type="button"
        @click="displayStore.toggleRightSidebar('backward')"
      >
        <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
      </button>
    </template>

    <!-- Main content -->
    <main
      class="fixed overflow-hidden bg-base-200 transition-all duration-300 ease-out"
      :style="displayStore.mainContentStyle"
    >
      <div class="absolute inset-0 overflow-y-auto px-4 pb-4 pt-2">
        <slot />
      </div>
    </main>

    <!-- Header -->
    <header
      class="fixed z-40 overflow-visible transition-all duration-300 ease-out"
      :style="displayStore.headerStyle"
    >
      <slot name="header">
        <full-header />
      </slot>
    </header>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

onMounted(() => {
  displayStore.initialize()
})
onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>
