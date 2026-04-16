<!-- /layouts/default.vue -->
<template>
  <div
    class="relative flex flex-col w-screen h-dvh overflow-hidden bg-base-200 text-base-content"
    :style="{ '--header-h': `calc(var(--vh, 1vh) * ${headerHeight})` }"
  >
    <!-- ══ HEADER ══ -->
    <header
      v-if="showHeader"
      class="relative flex-none w-full overflow-hidden z-30 bg-primary text-primary-content border-b-2 border-primary-focus transition-[height] duration-200"
      :style="headerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="header"><main-header /></slot>
      </div>
      <div class="absolute top-1.5 right-1.5 z-10 flex gap-1">
        <button
          class="region-btn region-btn--mode"
          @click="displayStore.toggleHeader()"
        >
          {{ headerModeLabel }}
        </button>
      </div>
    </header>

    <button
      v-else
      class="flex-none flex items-center justify-center w-full h-6 bg-primary/40 border-b border-dashed border-primary/30 hover:bg-primary/60 transition-colors duration-150 cursor-pointer"
      @click="displayStore.toggleHeader()"
    >
      <span class="restore-label text-primary-content/50">Header · hidden</span>
    </button>

    <!-- ══ BODY ══ -->
    <div class="flex-1 min-h-0 relative w-full">
      <main
        class="overflow-hidden bg-base-100 transition-[top,left,width,height] duration-200"
        :style="centerStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4"
        >
          <slot />
        </div>
      </main>
    </div>

    <!-- ══ LEFT SIDEBAR ══ -->
    <ClientOnly>
      <aside
        v-if="leftSidebarVisible"
        class="overflow-hidden bg-neutral text-neutral-content border-r-2 border-neutral-focus transition-[top,height,width] duration-200"
        :style="leftSidebarStyle"
      >
        <div class="absolute inset-0 overflow-hidden">
          <slot name="left"><left-sidebar /></slot>
        </div>
        <div class="absolute bottom-1.5 right-1.5 z-10 flex flex-wrap gap-1">
          <button
            class="region-btn region-btn--mode"
            @click="displayStore.toggleLeftSidebar()"
          >
            {{ leftSidebarModeLabel }}
          </button>
          <button
            class="region-btn"
            :class="sidebarLeftHeaderPriority && 'region-btn--active'"
            title="Header priority"
            @click="displayStore.toggleSidebarLeftHeaderPriority()"
          >
            ↑H
          </button>
          <button
            class="region-btn"
            :class="sidebarLeftFooterPriority && 'region-btn--active'"
            title="Footer priority"
            @click="displayStore.toggleSidebarLeftFooterPriority()"
          >
            ↓F
          </button>
          <button
            class="region-btn"
            @click="displayStore.changeState('sidebarLeftState', 'hidden')"
          >
            ✕
          </button>
        </div>
      </aside>

      <button
        v-else
        class="fixed top-0 left-0 h-dvh w-6 z-10 flex items-center justify-center bg-neutral/40 border-r border-dashed border-neutral/30 hover:bg-neutral/60 transition-colors duration-150 cursor-pointer [writing-mode:vertical-lr]"
        @click="displayStore.toggleLeftSidebar()"
      >
        <span class="restore-label text-neutral-content/50">L</span>
      </button>

      <template #fallback />
    </ClientOnly>

    <!-- ══ RIGHT SIDEBAR ══ -->
    <ClientOnly>
      <aside
        v-if="rightSidebarVisible"
        class="overflow-hidden bg-secondary text-secondary-content border-l-2 border-secondary-focus transition-[top,height,width] duration-200"
        :style="rightSidebarStyle"
      >
        <div class="absolute inset-0 overflow-hidden">
          <slot name="right"><right-sidebar /></slot>
        </div>
        <div class="absolute bottom-1.5 left-1.5 z-10 flex flex-wrap gap-1">
          <button
            class="region-btn region-btn--mode"
            @click="displayStore.toggleRightSidebar()"
          >
            {{ rightSidebarModeLabel }}
          </button>
          <button
            class="region-btn"
            :class="sidebarRightHeaderPriority && 'region-btn--active'"
            title="Header priority"
            @click="displayStore.toggleSidebarRightHeaderPriority()"
          >
            ↑H
          </button>
          <button
            class="region-btn"
            :class="sidebarRightFooterPriority && 'region-btn--active'"
            title="Footer priority"
            @click="displayStore.toggleSidebarRightFooterPriority()"
          >
            ↓F
          </button>
          <button
            class="region-btn"
            @click="displayStore.changeState('sidebarRightState', 'hidden')"
          >
            ✕
          </button>
        </div>
      </aside>

      <button
        v-else
        class="fixed top-0 right-0 h-dvh w-6 z-10 flex items-center justify-center bg-secondary/40 border-l border-dashed border-secondary/30 hover:bg-secondary/60 transition-colors duration-150 cursor-pointer [writing-mode:vertical-lr]"
        @click="displayStore.toggleRightSidebar()"
      >
        <span class="restore-label text-secondary-content/50">R</span>
      </button>

      <template #fallback />
    </ClientOnly>

    <!-- ══ FOOTER ══ -->
    <footer
      v-if="showFooter"
      class="relative flex-none w-full overflow-hidden z-30 bg-accent text-accent-content border-t-2 border-accent-focus transition-[height] duration-200"
      :style="footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer"><main-footer /></slot>
      </div>
      <div class="absolute top-1.5 right-1.5 z-10 flex gap-1">
        <button
          class="region-btn region-btn--mode"
          @click="displayStore.toggleFooter()"
        >
          {{ footerModeLabel }}
        </button>
      </div>
    </footer>

    <button
      v-else
      class="flex-none flex items-center justify-center w-full h-6 bg-accent/40 border-t border-dashed border-accent/30 hover:bg-accent/60 transition-colors duration-150 cursor-pointer"
      @click="displayStore.toggleFooter()"
    >
      <span class="restore-label text-accent-content/50">Footer · hidden</span>
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

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)

const headerStyle = computed(() => displayStore.headerStyle)
const footerStyle = computed(() => displayStore.footerStyle)
const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)

const headerModeLabel = computed(() => displayStore.headerModeLabel)
const footerModeLabel = computed(() => displayStore.footerModeLabel)
const leftSidebarModeLabel = computed(() => displayStore.leftSidebarModeLabel)
const rightSidebarModeLabel = computed(() => displayStore.rightSidebarModeLabel)

const centerStyle = computed(() => ({
  position: 'fixed' as const,
  top: `calc(var(--vh, 1vh) * ${headerHeight.value})`,
  left: `${displayStore.sidebarLeftWidth}vw`,
  width: `calc(${100 - displayStore.sidebarLeftWidth}vw)`,
  height: `calc(var(--vh, 1vh) * ${100 - headerHeight.value - footerHeight.value})`,
}))
</script>

<style scoped>
/* Only what DaisyUI + Tailwind genuinely can't express */

.restore-label {
  font-size: 0.5rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

.region-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.4rem;
  border-radius: 9999px;
  border: 1px solid oklch(var(--bc) / 0.2);
  background: oklch(var(--b1) / 0.25);
  backdrop-filter: blur(4px);
  font-size: 0.6rem;
  font-weight: 800;
  color: oklch(var(--bc) / 0.6);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.region-btn:hover {
  background: oklch(var(--b1) / 0.5);
  color: oklch(var(--bc) / 1);
  border-color: oklch(var(--bc) / 0.4);
}
.region-btn--mode {
  font-size: 0.55rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.region-btn--active {
  background: oklch(var(--wa) / 0.8);
  border-color: oklch(var(--wa) / 0.6);
  color: oklch(var(--wac) / 1);
}
.region-btn--active:hover {
  background: oklch(var(--wa) / 1);
}
</style>
