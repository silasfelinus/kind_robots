<!-- /layouts/default.vue -->
<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden bg-base-200">
    <corner-panel
      v-if="displayStore.showCornerPanel"
      class="pointer-events-auto fixed transition-all duration-300 ease-out"
      :style="displayStore.cornerPanelStyle"
    />

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
          <smart-panel />
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

      <button
        :style="displayStore.leftSidebarForwardToggleStyle"
        class="btn btn-circle btn-xs transition-all duration-300 ease-out"
        aria-label="Expand left sidebar"
        type="button"
        @click="displayStore.toggleLeftSidebar('forward')"
      >
        <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
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

      <button
        :style="displayStore.rightSidebarForwardToggleStyle"
        class="btn btn-circle btn-xs transition-all duration-300 ease-out"
        aria-label="Expand right sidebar"
        type="button"
        @click="displayStore.toggleRightSidebar('forward')"
      >
        <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
      </button>
    </template>

    <main
      class="fixed overflow-hidden bg-base-200 transition-all duration-300 ease-out"
      :style="displayStore.mainContentStyle"
    >
      <div class="absolute inset-0 overflow-y-auto px-4 pb-4">
        <slot />
      </div>
    </main>

    <header
      class="fixed overflow-hidden transition-all duration-300 ease-out"
      :style="displayStore.headerStyle"
    >
      <slot name="header">
        <full-header />
      </slot>
    </header>

    <section
      v-if="displayStore.channelPanelVisible"
      class="fixed overflow-hidden transition-all duration-300 ease-out"
      :style="displayStore.channelPanelStyle"
    >
      <bottom-panel />
    </section>
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
