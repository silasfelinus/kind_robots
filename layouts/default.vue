<!-- /layouts/default.vue -->
<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden bg-base-200">
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

    <template v-if="displayStore.sidebarLeftVisible">
      <button
        :style="displayStore.leftSidebarBackToggleStyle"
        class="btn btn-circle btn-xs transition-all duration-300 ease-out"
        aria-label="Reduce left sidebar"
        type="button"
        @click="displayStore.toggleLeftSidebar('backward')"
      >
        <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
      </button>
    </template>

    <template v-if="displayStore.sidebarRightVisible">
      <button
        :style="displayStore.rightSidebarBackToggleStyle"
        class="btn btn-circle btn-xs transition-all duration-300 ease-out"
        aria-label="Reduce right sidebar"
        type="button"
        @click="displayStore.toggleRightSidebar('backward')"
      >
        <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
      </button>
    </template>

    <main
      class="fixed z-30 overflow-hidden border-4 border-error bg-base-100 transition-all duration-300 ease-out"
      :style="safeMainContentStyle"
    >
      <div class="flex h-full w-full flex-col gap-4 overflow-y-auto p-4">
        <div
          class="rounded-2xl border border-error bg-error p-4 text-lg font-black text-error-content shadow-xl"
        >
          MAIN SLOT CONTAINER ALIVE
        </div>

        <div
          class="rounded-2xl border border-info bg-info p-4 text-sm font-black text-info-content"
        >
          BEFORE DEFAULT SLOT
        </div>

        <div
          class="min-h-64 rounded-2xl border-4 border-primary bg-base-200 p-4"
        >
          <slot>
            <div
              class="rounded-2xl border border-warning bg-warning p-4 text-lg font-black text-warning-content"
            >
              DEFAULT SLOT FALLBACK RENDERED
            </div>
          </slot>
        </div>

        <div
          class="rounded-2xl border border-success bg-success p-4 text-sm font-black text-success-content"
        >
          AFTER DEFAULT SLOT
        </div>
      </div>
    </main>

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

const safeMainContentStyle = computed(() => ({
  top: '96px',
  left: '96px',
  right: '96px',
  bottom: '96px',
  minWidth: '240px',
  minHeight: '240px',
  ...displayStore.mainContentStyle,
}))

onMounted(() => {
  displayStore.initialize()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>
