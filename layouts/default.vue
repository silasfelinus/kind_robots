<!-- /layouts/default.vue -->
<template>
  <div
    class="relative flex min-h-dvh w-full flex-col overflow-hidden bg-base-200"
  >
    <div
      class="fixed left-2 top-14 z-9999 rounded-2xl border border-warning bg-warning px-3 py-2 text-xs font-black text-warning-content shadow-xl"
    >
      DEFAULT LAYOUT ALIVE
    </div>

    <div
      class="fixed left-2 top-26 z-9999 max-w-[90vw] rounded-2xl border border-info bg-info px-3 py-2 text-[10px] font-bold text-info-content shadow-xl"
    >
      main:
      {{ JSON.stringify(displayStore.mainContentStyle) }}
    </div>

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
      class="fixed z-30 overflow-hidden border-4 border-error bg-base-100 transition-all duration-300 ease-out"
      :style="safeMainContentStyle"
    >
      <div class="flex h-full w-full flex-col overflow-y-auto p-4">
        <div
          class="mb-4 rounded-2xl border border-error bg-error p-4 text-lg font-black text-error-content shadow-xl"
        >
          MAIN SLOT CONTAINER ALIVE
        </div>

        <div
          class="min-h-96 rounded-2xl border-4 border-primary bg-base-200 p-4"
        >
          <slot>
            <div
              class="rounded-2xl border border-warning bg-warning p-4 font-black text-warning-content"
            >
              DEFAULT SLOT FALLBACK RENDERED
            </div>
          </slot>
        </div>
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
  top: '96px',
  left: '96px',
  right: '96px',
  bottom: '96px',
  minWidth: '240px',
  minHeight: '240px',
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
