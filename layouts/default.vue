<!-- /layouts/default.vue -->
<!--
  Layout model:
  ┌─────────────────────────────────┐  ← HEADER (flex-none, bg-primary)
  ├──────┬──────────────────┬───────┤
  │      │                  │       │
  │ LEFT │     CENTER       │ RIGHT │  ← BODY row (flex-1)
  │      │   (bg-base-100)  │       │
  ├──────┴──────────────────┴───────┤
  └─────────────────────────────────┘  ← FOOTER (flex-none, bg-accent)

  Fixed toggle buttons always sit at predictable corners/edges — they never
  disappear when a region is hidden. Regions show/hide via v-if; the toggle
  button is always rendered regardless of region state.

  Toggle positions:
    Header   → top-left pill (always visible above layout)
    Footer   → bottom-left pill (always visible below layout)
    Left     → left edge, vertically centered
    Right    → right edge, vertically centered
-->
<template>
  <div
    class="relative flex flex-col w-screen h-dvh overflow-hidden bg-base-200 text-base-content"
  >
    <!-- ══ HEADER ══ -->
    <header
      v-if="showHeader"
      class="relative flex-none w-full overflow-hidden z-30 bg-primary text-primary-content border-b-2 border-primary-focus transition-[height] duration-200"
      :style="{ height: `calc(var(--vh, 1vh) * ${headerHeight})` }"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="header"><main-header /></slot>
      </div>
    </header>

    <!-- ══ BODY ROW ══ -->
    <div class="flex flex-1 min-h-0 w-full overflow-hidden">
      <!-- LEFT SIDEBAR -->
      <ClientOnly>
        <aside
          v-if="showLeftSidebar"
          class="relative flex-none h-full overflow-hidden bg-neutral text-neutral-content border-r-2 border-neutral-focus transition-[width] duration-200"
          :style="{ width: `${sidebarLeftWidth}vw` }"
        >
          <div class="absolute inset-0 overflow-y-auto overflow-x-hidden">
            <slot name="left"><left-sidebar /></slot>
          </div>
          <!-- Priority controls, bottom of sidebar -->
          <div class="absolute bottom-8 right-1.5 z-10 flex flex-col gap-1">
            <button
              class="region-btn"
              :class="sidebarLeftHeaderPriority && 'region-btn--active'"
              title="Header priority: sidebar extends behind header"
              @click="displayStore.toggleSidebarLeftHeaderPriority()"
            >
              ↑H
            </button>
            <button
              class="region-btn"
              :class="sidebarLeftFooterPriority && 'region-btn--active'"
              title="Footer priority: sidebar extends behind footer"
              @click="displayStore.toggleSidebarLeftFooterPriority()"
            >
              ↓F
            </button>
          </div>
        </aside>
        <template #fallback>
          <div
            class="flex-none h-full bg-neutral"
            :style="{ width: `${sidebarLeftWidth}vw` }"
          />
        </template>
      </ClientOnly>

      <!-- CENTER -->
      <main class="relative flex-1 min-w-0 h-full overflow-hidden bg-base-100">
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4"
        >
          <slot />
        </div>
      </main>

      <!-- RIGHT SIDEBAR -->
      <ClientOnly>
        <aside
          v-if="showRightSidebar"
          class="relative flex-none h-full overflow-hidden bg-secondary text-secondary-content border-l-2 border-secondary-focus transition-[width] duration-200"
          :style="{ width: `${sidebarRightWidth}vw` }"
        >
          <div class="absolute inset-0 overflow-y-auto overflow-x-hidden">
            <slot name="right"><right-sidebar /></slot>
          </div>
          <!-- Priority controls, bottom of sidebar -->
          <div class="absolute bottom-8 left-1.5 z-10 flex flex-col gap-1">
            <button
              class="region-btn"
              :class="sidebarRightHeaderPriority && 'region-btn--active'"
              title="Header priority: sidebar extends behind header"
              @click="displayStore.toggleSidebarRightHeaderPriority()"
            >
              ↑H
            </button>
            <button
              class="region-btn"
              :class="sidebarRightFooterPriority && 'region-btn--active'"
              title="Footer priority: sidebar extends behind footer"
              @click="displayStore.toggleSidebarRightFooterPriority()"
            >
              ↓F
            </button>
          </div>
        </aside>
        <template #fallback>
          <div
            class="flex-none h-full bg-secondary"
            :style="{ width: `${sidebarRightWidth}vw` }"
          />
        </template>
      </ClientOnly>
    </div>
    <!-- /body row -->

    <!-- ══ FOOTER ══ -->
    <footer
      v-if="showFooter"
      class="relative flex-none w-full overflow-hidden z-30 bg-accent text-accent-content border-t-2 border-accent-focus transition-[height] duration-200"
      :style="{ height: `calc(var(--vh, 1vh) * ${footerHeight})` }"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer"><main-footer /></slot>
      </div>
    </footer>

    <!-- ══════════════════════════════════════════════════════════
         ALWAYS-VISIBLE TOGGLE BUTTONS
         Fixed to screen corners/edges, never hidden.
    ═══════════════════════════════════════════════════════════ -->

    <!-- Header toggle — top-left -->
    <ClientOnly>
      <div class="fixed top-1.5 left-1.5 z-50 flex items-center gap-1">
        <button
          class="region-btn region-btn--mode"
          :class="!showHeader && 'region-btn--dim'"
          :title="`Header: ${headerModeLabel}`"
          @click="displayStore.toggleHeader()"
        >
          ▲ {{ headerModeLabel }}
        </button>
      </div>
    </ClientOnly>

    <!-- Footer toggle — bottom-left -->
    <ClientOnly>
      <div class="fixed bottom-1.5 left-1.5 z-50 flex items-center gap-1">
        <button
          class="region-btn region-btn--mode"
          :class="!showFooter && 'region-btn--dim'"
          :title="`Footer: ${footerModeLabel}`"
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
          class="region-btn region-btn--mode [writing-mode:vertical-lr] h-16 w-6 rounded-none rounded-r-full"
          :class="!showLeftSidebar && 'region-btn--dim'"
          :title="`Left: ${leftSidebarModeLabel}`"
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
          class="region-btn region-btn--mode [writing-mode:vertical-rl] h-16 w-6 rounded-none rounded-l-full"
          :class="!showRightSidebar && 'region-btn--dim'"
          :title="`Right: ${rightSidebarModeLabel}`"
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
const showLeftSidebar = computed(() => displayStore.leftSidebarVisible)
const showRightSidebar = computed(() => displayStore.rightSidebarVisible)

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

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)

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
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 9999px;
  border: 1px solid oklch(var(--bc) / 0.2);
  background: oklch(var(--b1) / 0.7);
  backdrop-filter: blur(6px);
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: oklch(var(--bc) / 0.7);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.region-btn:hover {
  background: oklch(var(--b1) / 0.95);
  color: oklch(var(--bc) / 1);
  border-color: oklch(var(--bc) / 0.5);
}

.region-btn--active {
  background: oklch(var(--wa) / 0.85);
  border-color: oklch(var(--wa) / 0.5);
  color: oklch(var(--wac) / 1);
}
.region-btn--active:hover {
  background: oklch(var(--wa) / 1);
}
/* Dimmed when its region is hidden — still clickable */
.region-btn--dim {
  opacity: 0.45;
}
.region-btn--dim:hover {
  opacity: 1;
}
</style>
