<!-- /layouts/default.vue -->
<!--
  Every region is ALWAYS in the DOM. Hidden state = sectionPaddingSize minimum.
  No v-if on any region. No Tailwind position classes (fixed/absolute/relative)
  on region elements — position:fixed comes exclusively from the store style object.

  Toggle buttons use inline style for position to guarantee no class conflicts.
-->
<template>
  <div>
    <!-- ══ HEADER ══ -->
    <header
      class="overflow-hidden bg-primary text-primary-content border-b-2 border-primary-focus transition-[height] duration-200"
      :style="headerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="header"><main-header /></slot>
      </div>
    </header>

    <!-- ══ LEFT SIDEBAR ══ -->
    <ClientOnly>
      <aside
        class="overflow-hidden bg-neutral text-neutral-content border-r-2 border-neutral-focus transition-[top,height,width] duration-200"
        :style="leftSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="left"><left-sidebar /></slot>
        </div>
        <div
          class="absolute bottom-10 right-1.5 z-10 flex flex-col gap-1 items-end"
        >
          <button
            class="region-btn"
            :class="{ 'region-btn--active': sidebarLeftHeaderPriority }"
            title="Extend behind header"
            @click="displayStore.toggleSidebarLeftHeaderPriority()"
          >
            ↑H
          </button>
          <button
            class="region-btn"
            :class="{ 'region-btn--active': sidebarLeftFooterPriority }"
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
        class="overflow-hidden bg-secondary text-secondary-content border-l-2 border-secondary-focus transition-[top,height,width] duration-200"
        :style="rightSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="right"><right-sidebar /></slot>
        </div>
        <div
          class="absolute bottom-10 left-1.5 z-10 flex flex-col gap-1 items-start"
        >
          <button
            class="region-btn"
            :class="{ 'region-btn--active': sidebarRightHeaderPriority }"
            title="Extend behind header"
            @click="displayStore.toggleSidebarRightHeaderPriority()"
          >
            ↑H
          </button>
          <button
            class="region-btn"
            :class="{ 'region-btn--active': sidebarRightFooterPriority }"
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
    <main class="overflow-hidden bg-base-100" :style="mainContentStyle">
      <div
        class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4"
      >
        <slot />
      </div>
    </main>

    <!-- ══ FOOTER ══ -->
    <footer
      class="overflow-hidden bg-accent text-accent-content border-t-2 border-accent-focus transition-[height] duration-200"
      :style="footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer"><main-footer /></slot>
      </div>
    </footer>

    <!-- ══ TOGGLE BUTTONS ══
         Always visible. Inline style for position — no Tailwind class conflict.
         z-index 200 sits above all regions (max region z is 50).
    -->

    <!-- Header: top center -->
    <div
      style="
        position: fixed;
        top: 0.3rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 200;
      "
    >
      <button
        class="region-btn region-btn--mode"
        :class="{ 'region-btn--dim': headerState === 'hidden' }"
        @click="displayStore.toggleHeader()"
      >
        ▲ {{ headerModeLabel }}
      </button>
    </div>

    <!-- Footer: bottom center -->
    <div
      style="
        position: fixed;
        bottom: 0.3rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 200;
      "
    >
      <button
        class="region-btn region-btn--mode"
        :class="{ 'region-btn--dim': footerState === 'hidden' }"
        @click="displayStore.toggleFooter()"
      >
        ▼ {{ footerModeLabel }}
      </button>
    </div>

    <!-- Left sidebar: left edge, vertically centered -->
    <div
      style="
        position: fixed;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 200;
      "
    >
      <button
        class="region-btn region-btn--mode region-btn--vertical"
        style="border-top-left-radius: 0; border-bottom-left-radius: 0"
        :class="{ 'region-btn--dim': sidebarLeftState === 'hidden' }"
        @click="displayStore.toggleLeftSidebar()"
      >
        {{ leftSidebarModeLabel }}
      </button>
    </div>

    <!-- Right sidebar: right edge, vertically centered -->
    <div
      style="
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        z-index: 200;
      "
    >
      <button
        class="region-btn region-btn--mode region-btn--vertical"
        style="border-top-right-radius: 0; border-bottom-right-radius: 0"
        :class="{ 'region-btn--dim': sidebarRightState === 'hidden' }"
        @click="displayStore.toggleRightSidebar()"
      >
        {{ rightSidebarModeLabel }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Read state directly for :class bindings
const headerState = computed(() => displayStore.headerState)
const footerState = computed(() => displayStore.footerState)
const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)

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

// Store provides position:fixed + all coordinates
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
  background: oklch(var(--b1) / 0.9);
  backdrop-filter: blur(8px);
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: oklch(var(--bc) / 0.85);
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
  height: 5rem;
  border-radius: 9999px;
}
</style>
