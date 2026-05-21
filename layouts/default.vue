<!-- /layouts/default.vue -->
<template>
  <div
    class="relative flex min-h-dvh w-full flex-col overflow-hidden bg-base-200"
  >
    <aside
      class="fixed z-20 overflow-visible transition-all duration-300 ease-out"
      :style="displayStore.leftSidebarStyle"
    >
      <div class="h-full overflow-y-auto">
        <slot name="left">
          <splash-tutorial />
        </slot>
      </div>
    </aside>

    <aside
      class="fixed z-20 overflow-visible transition-all duration-300 ease-out"
      :style="displayStore.rightSidebarStyle"
    >
      <div class="h-full overflow-y-auto">
        <slot name="right">
          <user-panel />
        </slot>
      </div>
    </aside>

    <button
      v-if="displayStore.sidebarLeftVisible"
      :style="displayStore.leftSidebarBackToggleStyle"
      class="btn btn-circle btn-xs fixed z-50 transition-all duration-300 ease-out"
      aria-label="Reduce left sidebar"
      type="button"
      @click="displayStore.toggleLeftSidebar('backward')"
    >
      <icon name="kind-icon:chevron-left" class="h-4 w-4" />
    </button>

    <button
      v-if="displayStore.sidebarRightVisible"
      :style="displayStore.rightSidebarBackToggleStyle"
      class="btn btn-circle btn-xs fixed z-50 transition-all duration-300 ease-out"
      aria-label="Reduce right sidebar"
      type="button"
      @click="displayStore.toggleRightSidebar('backward')"
    >
      <icon name="kind-icon:chevron-right" class="h-4 w-4" />
    </button>

    <main
      class="fixed z-10 overflow-hidden bg-base-200 transition-all duration-300 ease-out"
      :style="safeMainContentStyle"
    >
      <div class="relative h-full w-full overflow-y-auto px-4 pb-4">
        <slot />
      </div>
    </main>

    <header
      class="fixed z-40 overflow-visible transition-all duration-300 ease-out"
      :style="safeHeaderStyle"
    >
      <slot name="header">
        <full-header />
      </slot>
    </header>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const safeMainContentStyle = computed(() => ({
  top: '0px',
  left: '0px',
  right: '0px',
  bottom: '0px',
  minWidth: '1px',
  minHeight: '1px',
  ...displayStore.mainContentStyle,
}))

const safeHeaderStyle = computed(() => ({
  left: '0px',
  right: '0px',
  bottom: '0px',
  minHeight: '64px',
  ...displayStore.headerStyle,
}))

onMounted(() => {
  displayStore.initialize()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>
