<!-- /layouts/default.vue -->
<template>
  <div
    class="flex h-dvh w-full flex-col overflow-hidden bg-base-100 text-base-content"
  >
    <!-- ═══ HEADER ═══ -->
    <section
      v-if="showHeader"
      class="relative flex-none w-full border-b border-base-300"
      :style="{ height: `calc(var(--vh, 1vh) * ${headerHeight})` }"
    >
      <span class="region-label">Header</span>
      <button
        class="region-toggle"
        title="Hide header"
        @click="displayStore.changeState('headerState', 'hidden')"
      >
        ✕
      </button>
      <div class="h-full w-full min-h-0">
        <slot name="header"><main-header /></slot>
      </div>
    </section>
    <button
      v-else
      class="region-restore-h"
      @click="displayStore.changeState('headerState', 'open')"
    >
      + Header
    </button>

    <!-- ═══ BODY ═══
         ClientOnly gates the mobile/desktop branch so the server always renders
         the same tree, and the correct layout is applied only on the client.
         The fallback renders a neutral shell that matches the desktop structure
         closely enough that the initial paint looks correct before hydration.
    -->
    <ClientOnly>
      <!-- MOBILE: full-page panel switcher -->
      <template v-if="isMobile">
        <main class="relative flex-1 min-h-0 w-full overflow-hidden">
          <span class="region-label region-label--dim">{{
            mobileRegionLabel
          }}</span>

          <!-- Panel switcher tabs -->
          <div
            class="absolute left-[0.45rem] top-[0.45rem] z-20 flex gap-[0.35rem]"
          >
            <button
              v-for="tab in mobileTabs"
              :key="tab.region"
              class="region-tab"
              :class="
                activeMobileRegion === tab.region ? 'region-tab--active' : ''
              "
              @click="setMobileRegion(tab.region)"
            >
              {{ tab.label }}
            </button>
          </div>

          <transition name="mobile-panel" mode="out-in">
            <section
              :key="activeMobileRegion"
              class="h-full w-full min-h-0 overflow-y-auto overscroll-contain px-3 py-4"
            >
              <template v-if="activeMobileRegion === 'left'">
                <slot name="left"><left-sidebar /></slot>
              </template>
              <template v-else-if="activeMobileRegion === 'right'">
                <slot name="right"><right-sidebar /></slot>
              </template>
              <template v-else>
                <slot />
              </template>
            </section>
          </transition>
        </main>
      </template>

      <!-- DESKTOP/TABLET: sidebar columns -->
      <template v-else>
        <div class="flex flex-1 min-h-0 w-full overflow-hidden">
          <aside
            v-if="showLeftSidebar"
            class="relative flex-none h-full border-r border-base-300"
            :style="{ width: `${sidebarLeftWidth}vw` }"
          >
            <span class="region-label region-label--vertical">Left</span>
            <button
              class="region-toggle"
              title="Hide left sidebar"
              @click="displayStore.changeState('sidebarLeftState', 'hidden')"
            >
              ✕
            </button>
            <div class="h-full w-full min-h-0 overflow-y-auto">
              <slot name="left"><left-sidebar /></slot>
            </div>
          </aside>
          <button
            v-else
            class="region-restore-v"
            @click="displayStore.changeState('sidebarLeftState', 'open')"
          >
            +
          </button>

          <main
            class="relative flex-1 min-w-0 h-full overflow-y-auto overscroll-contain"
          >
            <span class="region-label region-label--dim">Main</span>
            <div class="w-full min-h-0 px-4 py-4">
              <slot />
            </div>
          </main>

          <aside
            v-if="showRightSidebar"
            class="relative flex-none h-full border-l border-base-300"
            :style="{ width: `${sidebarRightWidth}vw` }"
          >
            <span
              class="region-label region-label--vertical region-label--right"
              >Right</span
            >
            <button
              class="region-toggle"
              title="Hide right sidebar"
              @click="displayStore.changeState('sidebarRightState', 'hidden')"
            >
              ✕
            </button>
            <div class="h-full w-full min-h-0 overflow-y-auto">
              <slot name="right"><right-sidebar /></slot>
            </div>
          </aside>
          <button
            v-else
            class="region-restore-v"
            @click="displayStore.changeState('sidebarRightState', 'open')"
          >
            +
          </button>
        </div>
      </template>

      <!-- SSR fallback: neutral desktop shell — server renders this, client
           replaces it after hydration. Keeps layout from jumping on first paint. -->
      <template #fallback>
        <div class="flex flex-1 min-h-0 w-full overflow-hidden">
          <main
            class="relative flex-1 min-w-0 h-full overflow-y-auto overscroll-contain"
          >
            <div class="w-full min-h-0 px-4 py-4">
              <slot />
            </div>
          </main>
        </div>
      </template>
    </ClientOnly>

    <!-- ═══ FOOTER ═══ -->
    <section
      v-if="showFooter"
      class="relative flex-none w-full border-t border-base-300"
      :style="{ height: `calc(var(--vh, 1vh) * ${footerHeight})` }"
    >
      <span class="region-label">Footer</span>
      <button
        class="region-toggle"
        title="Hide footer"
        @click="displayStore.changeState('footerState', 'hidden')"
      >
        ✕
      </button>
      <div class="h-full w-full min-h-0">
        <slot name="footer"><main-footer /></slot>
      </div>
    </section>
    <button
      v-else
      class="region-restore-h"
      @click="displayStore.changeState('footerState', 'open')"
    >
      + Footer
    </button>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// isMobile reads viewport — only safe to use inside ClientOnly
const isMobile = computed(() => displayStore.viewportSize === 'mobile')

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => displayStore.footerState !== 'hidden')
const showLeftSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarLeftState),
)
const showRightSidebar = computed(() =>
  ['open', 'compact'].includes(displayStore.sidebarRightState),
)

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)

const activeMobileRegion = computed<'left' | 'center' | 'right'>(() => {
  if (displayStore.showLeft) return 'left'
  if (displayStore.showRight) return 'right'
  return 'center'
})

const mobileRegionLabel = computed(() => {
  if (activeMobileRegion.value === 'left') return 'Left'
  if (activeMobileRegion.value === 'right') return 'Right'
  return 'Main'
})

const mobileTabs = [
  { region: 'left' as const, label: 'Left' },
  { region: 'center' as const, label: 'Main' },
  { region: 'right' as const, label: 'Right' },
]

function setMobileRegion(region: 'left' | 'center' | 'right') {
  displayStore.showLeft = region === 'left'
  displayStore.showCenter = region === 'center'
  displayStore.showRight = region === 'right'
  displayStore.saveState()
}
</script>

<style scoped>
/* ── Region labels ── */
.region-label {
  position: absolute;
  top: 0.45rem;
  right: 0.65rem;
  z-index: 10;
  border-radius: 9999px;
  border: 1px solid oklch(var(--bc) / 0.1);
  background: oklch(var(--b1) / 0.7);
  backdrop-filter: blur(6px);
  padding: 0.18rem 0.42rem;
  font-size: 0.58rem;
  font-weight: 900;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: oklch(var(--bc) / 0.3);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}
.region-label--vertical {
  top: 50%;
  left: 0.5rem;
  right: auto;
  transform: translateY(-50%) rotate(-90deg);
}
.region-label--right {
  left: auto;
  right: 0.5rem;
  transform: translateY(-50%) rotate(90deg);
}
.region-label--dim {
  color: oklch(var(--bc) / 0.18);
}

/* ── Toggle buttons ── */
.region-toggle {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 9999px;
  border: 1px solid oklch(var(--bc) / 0.13);
  background: oklch(var(--b1) / 0.7);
  backdrop-filter: blur(6px);
  font-size: 0.6rem;
  line-height: 1;
  color: oklch(var(--bc) / 0.45);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.region-toggle:hover {
  background: oklch(var(--er) / 0.12);
  border-color: oklch(var(--er) / 0.35);
  color: oklch(var(--er));
}

/* ── Restore pills ── */
.region-restore-h {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 1.25rem;
  border-top: 1px dashed oklch(var(--bc) / 0.16);
  border-bottom: 1px dashed oklch(var(--bc) / 0.16);
  background: transparent;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: oklch(var(--bc) / 0.32);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.region-restore-h:hover {
  background: oklch(var(--bc) / 0.04);
  color: oklch(var(--bc) / 0.65);
}

.region-restore-v {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 100%;
  border-left: 1px dashed oklch(var(--bc) / 0.16);
  border-right: 1px dashed oklch(var(--bc) / 0.16);
  background: transparent;
  font-size: 0.7rem;
  color: oklch(var(--bc) / 0.32);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.region-restore-v:hover {
  background: oklch(var(--bc) / 0.04);
  color: oklch(var(--bc) / 0.65);
}

/* ── Mobile panel tabs ── */
.region-tab {
  border-radius: 9999px;
  border: 1px solid oklch(var(--bc) / 0.15);
  background: oklch(var(--b1) / 0.7);
  backdrop-filter: blur(6px);
  padding: 0.2rem 0.55rem;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: oklch(var(--bc) / 0.45);
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}
.region-tab:hover {
  background: oklch(var(--bc) / 0.05);
  color: oklch(var(--bc) / 0.7);
}
.region-tab--active {
  border-color: oklch(var(--p) / 0.35);
  background: oklch(var(--p) / 0.15);
  color: oklch(var(--p));
}

/* ── Mobile panel transitions ── */
.mobile-panel-enter-active,
.mobile-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.mobile-panel-enter-from {
  opacity: 0;
  transform: translateX(18px);
}
.mobile-panel-leave-to {
  opacity: 0;
  transform: translateX(-18px);
}
</style>
