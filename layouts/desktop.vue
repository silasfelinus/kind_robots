<!-- /layouts/desktop.vue -->
<template>
  <div
    class="flex h-dvh w-full flex-col overflow-hidden bg-base-100 text-base-content"
  >
    <!-- HEADER -->
    <section
      v-if="showHeader"
      class="region-shell flex-none w-full border-b border-base-300"
      :style="{ height: `calc(var(--vh, 1vh) * ${headerHeight})` }"
    >
      <span class="region-label">Header</span>

      <button
        class="region-toggle"
        @click="displayStore.changeState('headerState', 'hidden')"
      >
        ✕
      </button>

      <div class="h-full w-full min-h-0">
        <slot name="header">
          <main-header />
        </slot>
      </div>
    </section>

    <button
      v-else
      class="region-restore-h"
      @click="displayStore.changeState('headerState', 'open')"
    >
      + Header
    </button>

    <!-- MIDDLE -->
    <div class="flex flex-1 min-h-0 w-full overflow-hidden">
      <!-- LEFT -->
      <aside
        v-if="showLeftSidebar"
        class="region-shell flex-none h-full border-r border-base-300"
        :style="{ width: `${sidebarLeftWidth}vw` }"
      >
        <span class="region-label region-label--vertical">Left</span>

        <button
          class="region-toggle"
          @click="displayStore.changeState('sidebarLeftState', 'hidden')"
        >
          ✕
        </button>

        <div class="h-full w-full min-h-0 overflow-y-auto">
          <slot name="left">
            <left-sidebar />
          </slot>
        </div>
      </aside>

      <button
        v-else
        class="region-restore-v"
        @click="displayStore.changeState('sidebarLeftState', 'open')"
      >
        +
      </button>

      <!-- MAIN (ONLY SCROLLER) -->
      <main
        class="region-shell flex-1 min-w-0 h-full overflow-y-auto overscroll-contain"
      >
        <span class="region-label region-label--dim">Main</span>

        <div class="h-full w-full min-h-0 px-4 py-4">
          <slot />
        </div>
      </main>

      <!-- RIGHT -->
      <aside
        v-if="showRightSidebar"
        class="region-shell flex-none h-full border-l border-base-300"
        :style="{ width: `${sidebarRightWidth}vw` }"
      >
        <span class="region-label region-label--vertical region-label--right">
          Right
        </span>

        <button
          class="region-toggle"
          @click="displayStore.changeState('sidebarRightState', 'hidden')"
        >
          ✕
        </button>

        <div class="h-full w-full min-h-0 overflow-y-auto">
          <slot name="right">
            <right-sidebar />
          </slot>
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

    <!-- FOOTER -->
    <section
      v-if="showFooter"
      class="region-shell flex-none w-full border-t border-base-300"
      :style="{ height: `calc(var(--vh, 1vh) * ${footerHeight})` }"
    >
      <span class="region-label">Footer</span>

      <button
        class="region-toggle"
        @click="displayStore.changeState('footerState', 'hidden')"
      >
        ✕
      </button>

      <div class="h-full w-full min-h-0">
        <slot name="footer">
          <main-footer />
        </slot>
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

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
</script>
