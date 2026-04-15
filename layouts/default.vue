<!-- /layouts/default.vue -->
<!--
  Layout regions — color-coded and store-driven.
  Each region renders its own toggle controls.

  Sidebar height modes (cycled per sidebar):
    'compact'  → inset: sits below header, above footer
    'open'     → full-height: spans full screen height, overlapping header/footer
    'hidden'   → not rendered

  Header / Footer modes:
    'open'     → visible at configured height
    'hidden'   → collapsed to a thin restore strip
-->
<template>
  <div class="layout-root">
    <!-- ══════════════════════════════════════════
         HEADER
         'open'   → rendered at headerHeight
         'hidden' → thin restore strip
    ══════════════════════════════════════════ -->
    <header v-if="showHeader" class="layout-header" :style="headerStyle">
      <slot name="header"><main-header /></slot>

      <!-- Hide control -->
      <button
        class="region-btn region-btn--tr"
        title="Hide header"
        @click="displayStore.changeState('headerState', 'hidden')"
      >
        ✕
      </button>
    </header>

    <!-- Header restore strip -->
    <button
      v-else
      class="restore-strip restore-strip--h restore-strip--header"
      @click="displayStore.changeState('headerState', 'open')"
    >
      <span class="restore-label">Header</span>
    </button>

    <!-- ══════════════════════════════════════════
         BODY ROW  (sidebars + center)
         Fills the space between header and footer.
         Sidebars may break out to full-height via
         position:fixed when state === 'open'.
    ══════════════════════════════════════════ -->
    <div class="layout-body">
      <!-- LEFT SIDEBAR -->
      <ClientOnly>
        <template v-if="showLeftSidebar">
          <!-- full-height overlay mode -->
          <aside
            v-if="sidebarLeftState === 'open'"
            class="layout-sidebar layout-sidebar--left layout-sidebar--full"
            :style="{ width: `${sidebarLeftWidth}vw` }"
          >
            <slot name="left"><left-sidebar /></slot>
            <div class="sidebar-controls sidebar-controls--left">
              <button
                class="region-btn"
                title="Compact"
                @click="displayStore.changeState('sidebarLeftState', 'compact')"
              >
                ↙
              </button>
              <button
                class="region-btn"
                title="Hide"
                @click="displayStore.changeState('sidebarLeftState', 'hidden')"
              >
                ✕
              </button>
            </div>
          </aside>

          <!-- inset (compact) mode -->
          <aside
            v-else
            class="layout-sidebar layout-sidebar--left layout-sidebar--inset"
            :style="{ width: `${sidebarLeftWidth}vw` }"
          >
            <slot name="left"><left-sidebar /></slot>
            <div class="sidebar-controls sidebar-controls--left">
              <button
                class="region-btn"
                title="Full height"
                @click="displayStore.changeState('sidebarLeftState', 'open')"
              >
                ↗
              </button>
              <button
                class="region-btn"
                title="Hide"
                @click="displayStore.changeState('sidebarLeftState', 'hidden')"
              >
                ✕
              </button>
            </div>
          </aside>
        </template>

        <!-- Left restore strip -->
        <button
          v-else
          class="restore-strip restore-strip--v restore-strip--left"
          @click="displayStore.changeState('sidebarLeftState', 'compact')"
        >
          <span class="restore-label restore-label--v">L</span>
        </button>

        <template #fallback>
          <div
            class="layout-sidebar layout-sidebar--left layout-sidebar--inset"
            :style="{ width: `${sidebarLeftWidth}vw` }"
          />
        </template>
      </ClientOnly>

      <!-- CENTER CONTENT -->
      <main class="layout-center">
        <div class="layout-center-inner">
          <slot />
        </div>
      </main>

      <!-- RIGHT SIDEBAR -->
      <ClientOnly>
        <template v-if="showRightSidebar">
          <!-- full-height overlay mode -->
          <aside
            v-if="sidebarRightState === 'open'"
            class="layout-sidebar layout-sidebar--right layout-sidebar--full"
            :style="{ width: `${sidebarRightWidth}vw` }"
          >
            <slot name="right"><right-sidebar /></slot>
            <div class="sidebar-controls sidebar-controls--right">
              <button
                class="region-btn"
                title="Compact"
                @click="
                  displayStore.changeState('sidebarRightState', 'compact')
                "
              >
                ↘
              </button>
              <button
                class="region-btn"
                title="Hide"
                @click="displayStore.changeState('sidebarRightState', 'hidden')"
              >
                ✕
              </button>
            </div>
          </aside>

          <!-- inset (compact) mode -->
          <aside
            v-else
            class="layout-sidebar layout-sidebar--right layout-sidebar--inset"
            :style="{ width: `${sidebarRightWidth}vw` }"
          >
            <slot name="right"><right-sidebar /></slot>
            <div class="sidebar-controls sidebar-controls--right">
              <button
                class="region-btn"
                title="Full height"
                @click="displayStore.changeState('sidebarRightState', 'open')"
              >
                ↖
              </button>
              <button
                class="region-btn"
                title="Hide"
                @click="displayStore.changeState('sidebarRightState', 'hidden')"
              >
                ✕
              </button>
            </div>
          </aside>
        </template>

        <!-- Right restore strip -->
        <button
          v-else
          class="restore-strip restore-strip--v restore-strip--right"
          @click="displayStore.changeState('sidebarRightState', 'compact')"
        >
          <span class="restore-label restore-label--v">R</span>
        </button>

        <template #fallback>
          <div
            class="layout-sidebar layout-sidebar--right layout-sidebar--inset"
            :style="{ width: `${sidebarRightWidth}vw` }"
          />
        </template>
      </ClientOnly>
    </div>
    <!-- /layout-body -->

    <!-- ══════════════════════════════════════════
         FOOTER
    ══════════════════════════════════════════ -->
    <footer
      v-if="showFooter"
      class="layout-footer"
      :style="{ height: `calc(var(--vh, 1vh) * ${footerHeight})` }"
    >
      <slot name="footer"><main-footer /></slot>
      <button
        class="region-btn region-btn--tr"
        title="Hide footer"
        @click="displayStore.changeState('footerState', 'hidden')"
      >
        ✕
      </button>
    </footer>

    <!-- Footer restore strip -->
    <button
      v-else
      class="restore-strip restore-strip--h restore-strip--footer"
      @click="displayStore.changeState('footerState', 'open')"
    >
      <span class="restore-label">Footer</span>
    </button>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => displayStore.footerState !== 'hidden')
const showLeftSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)
const showRightSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)

const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)

// Pull header style from store (includes height, width, top, left)
const headerStyle = computed(() => displayStore.headerStyle)
</script>

<style scoped>
/* ─────────────────────────────────────────────
   ROOT — full viewport, no outer scroll
───────────────────────────────────────────── */
.layout-root {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  position: relative;
}

/* ─────────────────────────────────────────────
   HEADER
───────────────────────────────────────────── */
.layout-header {
  position: relative;
  flex: none;
  width: 100%;
  background: oklch(0.28 0.04 240); /* deep navy */
  border-bottom: 2px solid oklch(0.38 0.05 240 / 0.6);
  overflow: hidden;
  z-index: 30;
}

/* ─────────────────────────────────────────────
   BODY ROW
───────────────────────────────────────────── */
.layout-body {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* ─────────────────────────────────────────────
   CENTER
───────────────────────────────────────────── */
.layout-center {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: oklch(0.97 0.005 60); /* warm sand */
}

.layout-center-inner {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 1rem 1.25rem;
}

/* ─────────────────────────────────────────────
   SIDEBARS — shared
───────────────────────────────────────────── */
.layout-sidebar {
  flex: none;
  position: relative;
  overflow: hidden;
}

/* Inset: sits within the body row flow */
.layout-sidebar--inset {
  height: 100%;
  z-index: 20;
}

/* Full-height: breaks out via absolute + full dvh */
.layout-sidebar--full {
  position: absolute;
  top: 0;
  height: 100dvh;
  z-index: 100;
  /* translate upward to cover header; body-row top is header height — */
  /* we offset by pulling the element above its container */
  transform: translateY(calc(-1 * var(--header-h, 0px)));
}

.layout-sidebar--left.layout-sidebar--full {
  left: 0;
}
.layout-sidebar--right.layout-sidebar--full {
  right: 0;
}

/* Left sidebar color: redwood */
.layout-sidebar--left {
  background: oklch(0.38 0.08 20);
  border-right: 2px solid oklch(0.45 0.09 20 / 0.5);
}

/* Right sidebar color: seafoam */
.layout-sidebar--right {
  background: oklch(0.52 0.07 170);
  border-left: 2px solid oklch(0.58 0.08 170 / 0.5);
}

/* ─────────────────────────────────────────────
   FOOTER
───────────────────────────────────────────── */
.layout-footer {
  position: relative;
  flex: none;
  width: 100%;
  background: oklch(0.32 0.06 55); /* amber-brown */
  border-top: 2px solid oklch(0.42 0.08 55 / 0.6);
  overflow: hidden;
  z-index: 30;
}

/* ─────────────────────────────────────────────
   RESTORE STRIPS
───────────────────────────────────────────── */
.restore-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  border: none;
  outline: none;
}

/* Horizontal strips (header / footer) */
.restore-strip--h {
  width: 100%;
  height: 1.5rem;
}
.restore-strip--header {
  background: oklch(0.28 0.04 240 / 0.55);
  border-bottom: 1px dashed oklch(0.28 0.04 240 / 0.35);
}
.restore-strip--header:hover {
  background: oklch(0.28 0.04 240 / 0.8);
}
.restore-strip--footer {
  background: oklch(0.32 0.06 55 / 0.55);
  border-top: 1px dashed oklch(0.32 0.06 55 / 0.35);
}
.restore-strip--footer:hover {
  background: oklch(0.32 0.06 55 / 0.8);
}

/* Vertical strips (sidebars) */
.restore-strip--v {
  height: 100%;
  width: 1.4rem;
  writing-mode: vertical-lr;
}
.restore-strip--left {
  background: oklch(0.38 0.08 20 / 0.5);
  border-right: 1px dashed oklch(0.38 0.08 20 / 0.35);
}
.restore-strip--left:hover {
  background: oklch(0.38 0.08 20 / 0.8);
}
.restore-strip--right {
  background: oklch(0.52 0.07 170 / 0.5);
  border-left: 1px dashed oklch(0.52 0.07 170 / 0.35);
}
.restore-strip--right:hover {
  background: oklch(0.52 0.07 170 / 0.8);
}

/* ─────────────────────────────────────────────
   RESTORE LABELS
───────────────────────────────────────────── */
.restore-label {
  font-size: 0.52rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: oklch(1 0 0 / 0.45);
  pointer-events: none;
  user-select: none;
}
.restore-label--v {
  writing-mode: vertical-lr;
  letter-spacing: 0.15em;
}

/* ─────────────────────────────────────────────
   CONTROL BUTTONS (per-region)
───────────────────────────────────────────── */
.region-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  border: 1px solid oklch(1 0 0 / 0.18);
  background: oklch(0 0 0 / 0.25);
  backdrop-filter: blur(4px);
  font-size: 0.6rem;
  color: oklch(1 0 0 / 0.55);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
  flex: none;
}
.region-btn:hover {
  background: oklch(0 0 0 / 0.5);
  color: oklch(1 0 0 / 0.9);
  border-color: oklch(1 0 0 / 0.4);
}

/* top-right positioned (header / footer close btn) */
.region-btn--tr {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  z-index: 10;
}

/* sidebar control clusters */
.sidebar-controls {
  position: absolute;
  top: 0.4rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.sidebar-controls--left {
  right: 0.4rem;
}
.sidebar-controls--right {
  left: 0.4rem;
}
</style>
