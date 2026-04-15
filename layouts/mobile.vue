<!-- /layouts/mobile.vue -->
<template>
  <div
    class="flex h-dvh w-full flex-col overflow-hidden bg-base-100 text-base-content"
  >
    <section
      v-if="showHeader"
      class="region-shell flex-none w-full border-b border-base-300"
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

    <main
      class="region-shell flex-1 min-h-0 w-full overflow-y-auto overscroll-contain"
    >
      <span class="region-label region-label--dim">Main</span>

      <div class="h-full w-full min-h-0 px-3 py-4">
        <slot />
      </div>
    </main>

    <section
      v-if="showFooter"
      class="region-shell flex-none w-full border-t border-base-300"
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
// /layouts/mobile.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const showHeader = computed(() => displayStore.headerState !== 'hidden')
const showFooter = computed(() => displayStore.footerState !== 'hidden')

const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)
</script>

<style scoped>
.region-shell {
  position: relative;
}

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

.region-label--dim {
  color: oklch(var(--bc) / 0.18);
}

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
</style>
