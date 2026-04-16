<!-- /layouts/default.vue -->
<!--
  All regions are position:fixed. The store computes every coordinate.
  The root div is a 100vw × 100dvh canvas — just a stacking context.

  Toggle buttons are position:fixed at predictable screen positions,
  always rendered regardless of whether the region is visible.

  Toggle anchor points:
    Header     → fixed top-0 left-1/2  (centered, top edge)
    Footer     → fixed bottom-0 left-1/2 (centered, bottom edge)
    Left       → fixed left-0 top-1/2  (left edge, vertically centered)
    Right      → fixed right-0 top-1/2 (right edge, vertically centered)
-->
<template>
  <div class="fixed inset-0 overflow-hidden bg-base-200 text-base-content">
    <!-- ══ HEADER ══ -->
    <header
      v-if="showHeader"
      class="absolute overflow-hidden bg-primary text-primary-content border-b-2 border-primary-focus transition-[height] duration-200"
      :style="headerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="header"><main-header /></slot>
      </div>
    </header>

    <!-- ══ LEFT SIDEBAR ══ -->
    <ClientOnly>
      <aside
        v-if="leftSidebarVisible"
        class="absolute overflow-hidden bg-neutral text-neutral-content border-r-2 border-neutral-focus transition-[top,height,width] duration-200"
        :style="leftSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="left"><left-sidebar /></slot>
        </div>
        <!-- Priority controls inside sidebar, bottom-right -->
        <div
          class="absolute bottom-10 right-1.5 z-10 flex flex-col gap-1 items-end"
        >
          <button
            class="region-btn"
            :class="sidebarLeftHeaderPriority && 'region-btn--active'"
            title="Extend behind header"
            @click="displayStore.toggleSidebarLeftHeaderPriority()"
          >
            ↑H
          </button>
          <button
            class="region-btn"
            :class="sidebarLeftFooterPriority && 'region-btn--active'"
            title="Extend behind footer"
            @click="displayStore.toggleSidebarLeftFooterPriority()"
          >
            ↓F
          </button>
        </div>
      </aside>
      <template #fallback />
    </ClientOnly>

    <!-- ══ RIGHT SIDEBAR ══ -->
    <ClientOnly>
      <aside
        v-if="rightSidebarVisible"
        class="absolute overflow-hidden bg-secondary text-secondary-content border-l-2 border-secondary-focus transition-[top,height,width] duration-200"
        :style="rightSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="right"><right-sidebar /></slot>
        </div>
        <!-- Priority controls inside sidebar, bottom-left -->
        <div
          class="absolute bottom-10 left-1.5 z-10 flex flex-col gap-1 items-start"
        >
          <button
            class="region-btn"
            :class="sidebarRightHeaderPriority && 'region-btn--active'"
            title="Extend behind header"
            @click="displayStore.toggleSidebarRightHeaderPriority()"
          >
            ↑H
          </button>
          <button
            class="region-btn"
            :class="sidebarRightFooterPriority && 'region-btn--active'"
            title="Extend behind footer"
            @click="displayStore.toggleSidebarRightFooterPriority()"
          >
            ↓F
          </button>
        </div>
      </aside>
      <template #fallback />
    </ClientOnly>

    <!-- ══ CENTER ══ -->
    <main
      class="absolute overflow-hidden bg-base-100 transition-[top,left,width,height] duration-200"
      :style="mainContentStyle"
    >
      <div
        class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4"
      >
        <slot />
      </div>
    </main>

    <!-- ══ FOOTER ══ -->
    <footer
      v-if="showFooter"
      class="absolute overflow-hidden bg-accent text-accent-content border-t-2 border-accent-focus transition-[height] duration-200"
      :style="footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer"><main-footer /></slot>
      </div>
    </footer>

    <!-- ══════════════════════════════════════════════════
         ALWAYS-VISIBLE TOGGLE BUTTONS
         Fixed to screen edges, z-50, never disappear.
    ══════════════════════════════════════════════════ -->

    <!-- Header toggle — top center -->
    <ClientOnly>
      <div class="fixed top-1 left-1/2 -translate-x-1/2 z-50">
        <button
          class="region-btn region-btn--mode"
          :class="!showHeader && 'region-btn--dim'"
          @click="displayStore.toggleHeader()"
        >
          ▲ {{ headerModeLabel }}
        </button>
      </div>
    </ClientOnly>

    <!-- Footer toggle — bottom center -->
    <ClientOnly>
      <div class="fixed bottom-1 left-1/2 -translate-x-1/2 z-50">
        <button
          class="region-btn region-btn--mode"
          :class="!showFooter && 'region-btn--dim'"
          @click="displayStore.toggleFooter()"
        >
          ▼ {{ footerModeLabel }}
        </button>
      </div>
    </ClientOnly>

    <!-- Left sidebar toggle — left edge, vertically centered -->
    <ClientOnly>
      <div class="fixed left-0 top-1/2 -translate-y-1/2 z-50">
        <button
          class="region-btn region-btn--mode region-btn--vertical rounded-l-none"
          :class="!leftSidebarVisible && 'region-btn--dim'"
          @click="displayStore.toggleLeftSidebar()"
        >
          {{ leftSidebarModeLabel }}
        </button>
      </div>
    </ClientOnly>

    <!-- Right sidebar toggle — right edge, vertically centered -->
    <ClientOnly>
      <div class="fixed right-0 top-1/2 -translate-y-1/2 z-50">
        <button
          class="region-btn region-btn--mode region-btn--vertical rounded-r-none"
          :class="!rightSidebarVisible && 'region-btn--dim'"
          @click="displayStore.toggleRightSidebar()"
        >
          {{ rightSidebarModeLabel }}
        </button>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => displayStore.footerState !== 'hidden')
const leftSidebarVisible = computed(() => displayStore.leftSidebarVisible)
const rightSidebarVisible = computed(() => displayStore.rightSidebarVisible)

const sidebarLeftHeaderPriority = computed(
  () => displayStore.sidebarLeftHeaderPriority,
)
const sidebarLeftFooterPriority = computed(
  () => displayStore.sidebarLeftFooterPriority,
)
const sidebarRightHeaderPriority = computed(
  () => displayStore.sidebarRightHeaderPriority,
)
const sidebarRightFooterPriority = computed(
  () => displayStore.sidebarRightFooterPriority,
)

const headerStyle = computed(() => displayStore.headerStyle)
const footerStyle = computed(() => displayStore.footerStyle)
const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)
const mainContentStyle = computed(() => displayStore.mainContentStyle)

const headerModeLabel = computed(() => displayStore.headerModeLabel)
const footerModeLabel = computed(() => displayStore.footerModeLabel)
const leftSidebarModeLabel = computed(() => displayStore.leftSidebarModeLabel)
const rightSidebarModeLabel = computed(() => displayStore.rightSidebarModeLabel)
</script>

<style scoped>
.region-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  border: 1px solid oklch(var(--bc) / 0.25);
  background: oklch(var(--b1) / 0.85);
  backdrop-filter: blur(8px);
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: oklch(var(--bc) / 0.8);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s,
    opacity 0.15s;
  box-shadow: 0 1px 4px oklch(0 0 0 / 0.15);
}
.region-btn:hover {
  background: oklch(var(--b1) / 1);
  color: oklch(var(--bc) / 1);
}
.region-btn--active {
  background: oklch(var(--wa) / 0.85);
  border-color: oklch(var(--wa) / 0.5);
  color: oklch(var(--wac) / 1);
}
.region-btn--active:hover {
  background: oklch(var(--wa) / 1);
}
.region-btn--dim {
  opacity: 0.4;
}
.region-btn--dim:hover {
  opacity: 1;
}
.region-btn--vertical {
  writing-mode: vertical-lr;
  padding: 0.55rem 0.2rem;
  height: 4rem;
  border-radius: 9999px;
}
</style>
