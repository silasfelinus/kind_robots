<!-- /layouts/desktop.vue -->
<template>
  <!--
    ROOT: h-dvh + overflow-hidden locks the shell to exactly the viewport.
    No scrolling at this level — only the main region scrolls internally.
  -->
  <div class="flex h-dvh w-full flex-col overflow-hidden bg-base-100">
    <!-- ═══ H1: HEADER (full width, fixed height) ═══ -->
    <template v-if="showHeaderFinal">
      <div
        class="region-shell relative flex-none w-full overflow-hidden border-b border-base-300"
        :style="{ height: `calc(var(--vh, 1vh) * ${headerHeight})` }"
      >
        <!-- Region label -->
        <div class="region-label">Header</div>

        <!-- Slot content -->
        <div class="h-full w-full min-h-0">
          <slot name="header"><main-header /></slot>
        </div>

        <!-- Visibility toggle -->
        <button
          v-if="debugStore.enabled"
          class="region-toggle"
          title="Hide Header"
          @click="debugStore.toggle('header')"
        >
          ✕
        </button>
      </div>
    </template>

    <!-- Collapsed header restore pill -->
    <button
      v-else-if="debugStore.enabled"
      class="region-restore-h"
      @click="debugStore.toggle('header')"
    >
      + Header
    </button>

    <!-- ═══ MIDDLE ROW: Left | Main | Right ═══ -->
    <!--
      flex-1 min-h-0 is the critical pair: flex-1 takes remaining space,
      min-h-0 overrides the default min-height:auto that causes overflow.
    -->
    <div class="flex flex-1 min-h-0 w-full overflow-hidden">
      <!-- ─── L2: LEFT SIDEBAR ─── -->
      <template v-if="showLeftSidebarFinal">
        <div
          class="region-shell relative flex-none h-full overflow-y-auto overflow-x-hidden border-r border-base-300"
          :style="{ width: `${sidebarLeftWidth}vw` }"
        >
          <div class="region-label region-label--vertical">Left</div>
          <div class="h-full w-full min-h-0 p-3">
            <slot name="left"><left-sidebar /></slot>
          </div>
          <button
            v-if="debugStore.enabled"
            class="region-toggle"
            title="Hide Left Sidebar"
            @click="debugStore.toggle('left')"
          >
            ✕
          </button>
        </div>
      </template>

      <!-- Collapsed left restore pill -->
      <button
        v-else-if="debugStore.enabled"
        class="region-restore-v region-restore-v--left"
        @click="debugStore.toggle('left')"
      >
        + L
      </button>

      <!-- ─── M: MAIN CONTENT (only this scrolls) ─── -->
      <div
        class="region-shell relative flex-1 min-w-0 h-full overflow-y-auto overscroll-contain"
      >
        <div class="region-label region-label--dim">Main</div>
        <div class="h-full w-full min-h-0 px-4 py-6">
          <slot />
        </div>
      </div>

      <!-- ─── R3: RIGHT SIDEBAR ─── -->
      <template v-if="showRightSidebarFinal">
        <div
          class="region-shell relative flex-none h-full overflow-y-auto overflow-x-hidden border-l border-base-300"
          :style="{ width: `${sidebarRightWidth}vw` }"
        >
          <div class="region-label region-label--vertical region-label--right">
            Right
          </div>
          <div class="h-full w-full min-h-0 p-3">
            <slot name="right"><right-sidebar /></slot>
          </div>
          <button
            v-if="debugStore.enabled"
            class="region-toggle"
            title="Hide Right Sidebar"
            @click="debugStore.toggle('right')"
          >
            ✕
          </button>
        </div>
      </template>

      <!-- Collapsed right restore pill -->
      <button
        v-else-if="debugStore.enabled"
        class="region-restore-v region-restore-v--right"
        @click="debugStore.toggle('right')"
      >
        + R
      </button>
    </div>
    <!-- end middle row -->

    <!-- ═══ F4: FOOTER (full width, fixed height) ═══ -->
    <template v-if="showFooterFinal">
      <div
        class="region-shell relative flex-none w-full overflow-hidden border-t border-base-300"
        :style="{ height: `calc(var(--vh, 1vh) * ${footerHeight})` }"
      >
        <div class="region-label">Footer</div>
        <div class="h-full w-full min-h-0">
          <slot name="footer"><main-footer /></slot>
        </div>
        <button
          v-if="debugStore.enabled"
          class="region-toggle"
          title="Hide Footer"
          @click="debugStore.toggle('footer')"
        >
          ✕
        </button>
      </div>
    </template>

    <!-- Collapsed footer restore pill -->
    <button
      v-else-if="debugStore.enabled"
      class="region-restore-h region-restore-h--bottom"
      @click="debugStore.toggle('footer')"
    >
      + Footer
    </button>
  </div>
</template>

<script setup lang="ts">
// /layouts/desktop.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import { useDebugStore } from '@/stores/debugStore'

const debugStore = useDebugStore()
const displayStore = useDisplayStore()
const pageStore = usePageStore()

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => displayStore.footerState !== 'hidden')
const showLeftSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)
const showRightSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)

const showHeaderFinal = computed(() =>
  debugStore.enabled ? debugStore.showHeader : showHeader.value,
)
const showFooterFinal = computed(() =>
  debugStore.enabled ? debugStore.showFooter : showFooter.value,
)
const showLeftSidebarFinal = computed(() =>
  debugStore.enabled ? debugStore.showLeft : showLeftSidebar.value,
)
const showRightSidebarFinal = computed(() =>
  debugStore.enabled ? debugStore.showRight : showRightSidebar.value,
)

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
</script>

<style scoped>
/* ─────────────────────────────────────────
   Region shell — the bounding box for each layout zone
   ───────────────────────────────────────── */
.region-shell {
  position: relative;
}

/* ─────────────────────────────────────────
   Region label — subtle watermark in corner
   ───────────────────────────────────────── */
.region-label {
  position: absolute;
  top: 0.4rem;
  right: 0.6rem;
  z-index: 10;
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: oklch(var(--bc) / 0.18);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

/* Sidebar labels — rotated along the edge */
.region-label--vertical {
  top: 50%;
  right: auto;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-90deg);
  transform-origin: center;
  font-size: 0.55rem;
  letter-spacing: 0.25em;
  color: oklch(var(--bc) / 0.12);
}

/* Right sidebar: mirror rotation */
.region-label--right {
  transform: translate(-50%, -50%) rotate(90deg);
}

/* Main content label — extra subtle since content lives here */
.region-label--dim {
  color: oklch(var(--bc) / 0.07);
}

.region-toggle {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 9999px;
  border: 1px solid oklch(var(--bc) / 0.15);
  background: oklch(var(--b1) / 0.7);
  backdrop-filter: blur(4px);
  font-size: 0.6rem;
  color: oklch(var(--bc) / 0.5);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
  line-height: 1;
}
.region-toggle:hover {
  background: oklch(var(--er) / 0.15);
  border-color: oklch(var(--er) / 0.4);
  color: oklch(var(--er));
}

/* Horizontal restore (header/footer) */
.region-restore-h {
  flex: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1.25rem;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border: 1px dashed oklch(var(--bc) / 0.2);
  color: oklch(var(--bc) / 0.35);
  background: transparent;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.region-restore-h:hover {
  background: oklch(var(--bc) / 0.05);
  color: oklch(var(--bc) / 0.7);
}

/* Vertical restore (sidebars) */
.region-restore-v {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 100%;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  writing-mode: vertical-lr;
  border: 1px dashed oklch(var(--bc) / 0.2);
  color: oklch(var(--bc) / 0.35);
  background: transparent;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.region-restore-v:hover {
  background: oklch(var(--bc) / 0.05);
  color: oklch(var(--bc) / 0.7);
}
.region-restore-v--right {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}
</style>
