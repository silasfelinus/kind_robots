<!-- /layouts/default.vue -->
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
          class="icon-btn icon-btn--pill icon-btn--primary"
          title="Open header"
          @click="displayStore.toggleHeader('open')"
        >
          <Icon name="kind-icon:chevron-double-down" class="icon-btn__icon" />
          <span class="icon-btn__label"> Open </span>
        </button>
      </div>
    </div>

    <ClientOnly>
      <aside
        class="fixed overflow-hidden text-secondary-content transition-[top,height,width,left] duration-200"
        :style="displayStore.leftSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="left">
            <splash-tutorial />
          </slot>
        </div>
      </aside>

      <div
        class="pointer-events-none fixed"
        :style="displayStore.leftToggleStyle"
      >
        <div class="pointer-events-auto flex flex-col items-start gap-2">
          <button
            class="icon-btn icon-btn--tab icon-btn--secondary"
            :title="`Left sidebar: ${displayStore.leftSidebarModeLabel}`"
            @click="displayStore.toggleLeftSidebar"
          >
            <Icon
              :name="leftSidebarIcon"
              class="icon-btn__icon icon-btn__icon--mirror"
            />
            <span class="icon-btn__label icon-btn__label--vertical">
              {{ displayStore.leftSidebarModeLabel }}
            </span>
          </button>
        </div>
      </div>

      <template #fallback />
    </ClientOnly>

    <ClientOnly>
      <aside
        class="fixed overflow-hidden border-l-2 border-accent-focus bg-accent text-accent-content transition-[top,height,width,right] duration-200"
        :style="displayStore.rightSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="right">
            <user-dashboard />
          </slot>
        </div>
      </aside>

      <div
        class="pointer-events-none fixed"
        :style="displayStore.rightToggleStyle"
      >
        <div class="pointer-events-auto flex flex-col items-end gap-2">
          <button
            class="icon-btn icon-btn--tab icon-btn--accent"
            :title="`Right sidebar: ${displayStore.rightSidebarModeLabel}`"
            @click="displayStore.toggleRightSidebar"
          >
            <Icon :name="rightSidebarIcon" class="icon-btn__icon" />
            <span class="icon-btn__label icon-btn__label--vertical">
              {{ displayStore.rightSidebarModeLabel }}
            </span>
          </button>
        </div>
      </div>

      <template #fallback />
    </ClientOnly>

    <!-- /layouts/default.vue -->
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
        class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-4 pt-20"
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
          :title="`Footer: ${displayStore.footerModeLabel}`"
          @click="displayStore.toggleFooter"
        >
          <Icon :name="footerIcon" class="icon-btn__icon" />
          <span class="icon-btn__label">
            {{ displayStore.footerModeLabel }}
          </span>
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
  if (displayStore.footerState === 'hidden')
    return 'kind-icon:chevron-double-up'
  if (displayStore.footerState === 'compact')
    return 'kind-icon:chevron-double-up'
  if (displayStore.footerState === 'priority') return 'kind-icon:chevron-down'
  return 'kind-icon:chevron-down'
})

const leftSidebarIcon = computed(() => {
  if (displayStore.leftSidebarModeLabel === 'hidden')
    return 'kind-icon:panel-right'
  if (displayStore.leftSidebarModeLabel === 'compact')
    return 'kind-icon:panel-right'
  if (displayStore.leftSidebarModeLabel === 'open')
    return 'kind-icon:panel-right-close'
  return 'kind-icon:panel-right-close'
})

const rightSidebarIcon = computed(() => {
  if (displayStore.rightSidebarModeLabel === 'hidden')
    return 'kind-icon:panel-right-close'
  if (displayStore.rightSidebarModeLabel === 'compact')
    return 'kind-icon:panel-right-close'
  if (displayStore.rightSidebarModeLabel === 'open')
    return 'kind-icon:panel-right'
  return 'kind-icon:panel-right'
})
</script>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  border-width: 1px;
  border-style: solid;
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s,
    border-color 0.15s,
    color 0.15s,
    transform 0.15s;
  box-shadow: 0 1px 6px oklch(0 0 0 / 0.18);
}

.icon-btn:hover {
  transform: scale(1.03);
}

.icon-btn--pill {
  padding: 0.3rem 0.7rem;
  border-radius: 9999px;
}

.icon-btn--tab {
  flex-direction: column;
  width: 2rem;
  gap: 0.3rem;
  padding: 0.6rem 0.35rem;
  border-radius: 0.75rem;
}

.icon-btn--primary {
  background: oklch(var(--p) / 0.95);
  border-color: oklch(var(--pf) / 0.9);
  color: oklch(var(--pc) / 1);
}

.icon-btn--primary:hover {
  background: oklch(var(--pf) / 1);
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
  opacity: 0.9;
}

.icon-btn__icon--mirror {
  transform: scaleX(-1);
}

.icon-btn__label {
  white-space: nowrap;
  font-size: 0.52rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.85;
}

.icon-btn__label--vertical {
  writing-mode: vertical-lr;
  letter-spacing: 0.06em;
}
</style>
