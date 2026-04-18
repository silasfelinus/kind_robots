<!-- /layouts/default.vue -->
<template>
  <div class="flex min-h-dvh w-full flex-col overflow-hidden">
    <header
      class="fixed overflow-hidden border-b-2 border-primary-focus text-primary-content transition-[height,width,left,top] duration-200"
      :style="displayStore.headerStyle"
    >
      <slot name="header">
        <full-header />
      </slot>
    </header>

    <div
      v-if="displayStore.headerState === 'hidden'"
      class="pointer-events-none fixed z-80"
      :style="displayStore.headerCornerToggleStyle"
    >
      <div class="pointer-events-auto flex items-start">
        <button
          class="flex items-center gap-2 rounded-full border border-primary-focus bg-primary/95 px-2 py-1 text-primary-content shadow-md backdrop-blur-sm transition hover:scale-[1.02] hover:bg-primary-focus"
          title="Open header"
          @click="displayStore.toggleHeader('open')"
        >
          <kind-title />
        </button>
      </div>
    </div>

    <ClientOnly>
      <aside
        class="fixed overflow-visible text-secondary-content transition-[top,height,width,left] duration-200"
        :style="displayStore.leftSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="left">
            <splash-tutorial />
          </slot>
        </div>

        <button
          class="sidebar-toggle sidebar-toggle--left icon-btn icon-btn--edge icon-btn--secondary"
          title="Toggle left sidebar"
          @click="displayStore.toggleLeftSidebar"
        >
          <Icon :name="leftSidebarIcon" class="icon-btn__icon" />
        </button>
      </aside>

      <template #fallback />
    </ClientOnly>

    <ClientOnly>
      <aside
        class="fixed overflow-visible border-l-2 border-accent-focus bg-accent text-accent-content transition-[top,height,width,right] duration-200"
        :style="displayStore.rightSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="right">
            <user-dashboard />
          </slot>
        </div>

        <button
          class="sidebar-toggle sidebar-toggle--right icon-btn icon-btn--edge icon-btn--accent"
          title="Toggle right sidebar"
          @click="displayStore.toggleRightSidebar"
        >
          <Icon :name="rightSidebarIcon" class="icon-btn__icon" />
        </button>
      </aside>

      <template #fallback />
    </ClientOnly>

    <main
      class="fixed overflow-hidden rounded-none border border-base-300/60 bg-base-200 text-base-content transition-[top,left,width,height] duration-200"
      :style="displayStore.mainContentStyle"
    >
      <corner-panel
        v-if="displayStore.showCorner"
        class="pointer-events-auto fixed z-40"
        :style="displayStore.cornerPanelStyle"
      />

      <div
        class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-4"
        :style="mainInnerStyle"
      >
        <div class="flex min-h-full w-full flex-col justify-start">
          <slot />
        </div>
      </div>
    </main>

    <footer
      class="fixed overflow-hidden border-t-2 border-base-content/20 bg-base-200 text-base-content transition-[height,width,left,bottom] duration-200"
      :style="displayStore.footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer">
          <art-generator />
        </slot>
      </div>
    </footer>

    <div
      class="pointer-events-none fixed"
      :style="displayStore.footerToggleStyle"
    >
      <div class="pointer-events-auto flex justify-center">
        <button
          class="icon-btn icon-btn--pill icon-btn--base"
          title="Toggle footer"
          @click="displayStore.toggleFooter"
        >
          <Icon :name="footerIcon" class="icon-btn__icon" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
onMounted(() => {
  displayStore.initialize()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})

const footerIcon = computed(() => {
  if (displayStore.footerState === 'hidden') return 'kind-icon:chevron-up'
  if (displayStore.footerState === 'compact') return 'kind-icon:chevron-up'
  if (displayStore.footerState === 'priority') return 'kind-icon:chevron-down'
  return 'kind-icon:chevron-down'
})

const leftSidebarIcon = computed(() => {
  if (displayStore.leftSidebarModeLabel === 'open')
    return 'kind-icon:sidebar-left'
  return 'kind-icon:sidebar-left'
})

const rightSidebarIcon = computed(() => {
  if (displayStore.rightSidebarModeLabel === 'open')
    return 'kind-icon:sidebar-right'
  return 'kind-icon:sidebar-right'
})

const mainInnerStyle = computed(() => {
  return {
    paddingTop: displayStore.showCorner ? '5.5rem' : '1rem',
  }
})
</script>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-style: solid;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s,
    border-color 0.15s,
    color 0.15s,
    transform 0.15s;
  box-shadow: 0 1px 6px oklch(0 0 0 / 0.18);
  backdrop-filter: blur(8px);
}

.icon-btn:hover {
  transform: scale(1.03);
}

.icon-btn--pill {
  padding: 0.35rem 0.65rem;
  border-radius: 9999px;
}

.icon-btn--edge {
  width: 2rem;
  height: 2.75rem;
  border-radius: 0.85rem;
  padding: 0;
}

.icon-btn--secondary {
  background: oklch(var(--s) / 0.95);
  border-color: oklch(var(--sf) / 0.9);
  color: oklch(var(--sc) / 1);
}

.icon-btn--secondary:hover {
  background: oklch(var(--sf) / 1);
}

.icon-btn--accent {
  background: oklch(var(--a) / 0.95);
  border-color: oklch(var(--af) / 0.9);
  color: oklch(var(--ac) / 1);
}

.icon-btn--accent:hover {
  background: oklch(var(--af) / 1);
}

.icon-btn--base {
  background: oklch(var(--b2) / 0.95);
  border-color: oklch(var(--b3) / 0.9);
  color: oklch(var(--bc) / 1);
}

.icon-btn--base:hover {
  background: oklch(var(--b3) / 1);
}

.icon-btn__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.95;
}

.sidebar-toggle {
  position: absolute;
  top: 50%;
  z-index: 60;
  transform: translateY(-50%);
}

.sidebar-toggle--left {
  right: -0.75rem;
}

.sidebar-toggle--right {
  left: -0.75rem;
}
</style>
