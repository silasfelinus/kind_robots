<!-- /layouts/default.vue -->
<template>
  <div class="fixed inset-0 overflow-hidden bg-base-300 text-base-content">
    <header
      class="fixed overflow-hidden border-b-2 border-primary-focus bg-primary text-primary-content transition-[height,width,left,top] duration-200"
      :style="headerStyle"
    >
      <slot name="header">
        <full-header />
      </slot>

      <div class="absolute right-2 top-2 z-[220] flex items-start gap-2">
        <button
          class="icon-btn icon-btn--pill icon-btn--primary"
          :class="{ 'icon-btn--dim': headerState === 'hidden' }"
          :title="`Header: ${headerModeLabel}`"
          @click="displayStore.toggleHeader()"
        >
          <Icon
            :name="headerIcon"
            class="icon-btn__icon"
          />
          <span class="icon-btn__label">{{ headerModeLabel }}</span>
        </button>
      </div>
    </header>

    <ClientOnly>
      <aside
        class="fixed overflow-hidden border-r-2 border-secondary-focus bg-secondary text-secondary-content transition-[top,height,width,left] duration-200"
        :style="leftSidebarStyle"
      >
        <div class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <slot name="left">
            <left-sidebar />
          </slot>
        </div>

        <div class="absolute left-2 top-2 z-[220] flex flex-col items-start gap-2">
          <button
            class="icon-btn icon-btn--tab icon-btn--secondary"
            :class="{ 'icon-btn--dim': sidebarLeftState === 'hidden' }"
            :title="`Left sidebar: ${leftSidebarModeLabel}`"
            @click="displayStore.toggleLeftSidebar()"
          >
            <Icon
              :name="leftSidebarIcon"
              class="icon-btn__icon icon-btn__icon--mirror"
            />
            <span class="icon-btn__label icon-btn__label--vertical">
              {{ leftSidebarModeLabel }}
            </span>
          </button>

          <div class="flex flex-col gap-1">
            <button
              class="icon-btn icon-btn--mini icon-btn--secondary"
              :class="{ 'icon-btn--active': sidebarLeftHeaderPriority }"
              title="Left sidebar header priority"
              @click="displayStore.toggleSidebarLeftHeaderPriority()"
            >
              <Icon
                :name="sidebarLeftHeaderPriority ? 'kind-icon:compress' : 'kind-icon:expand'"
                class="icon-btn__icon icon-btn__icon--flip-v"
              />
            </button>

            <button
              class="icon-btn icon-btn--mini icon-btn--secondary"
              :class="{ 'icon-btn--active': sidebarLeftFooterPriority }"
              title="Left sidebar footer priority"
              @click="displayStore.toggleSidebarLeftFooterPriority()"
            >
              <Icon
                :name="sidebarLeftFooterPriority ? 'kind-icon:compress' : 'kind-icon:expand'"
                class="icon-btn__icon"
              />
            </button>
          </div>
        </div>
      </aside>
      <template #fallback />
    </ClientOnly>

    <ClientOnly>
      <aside
        class="fixed overflow-hidden border-l-2 border-accent-focus bg-accent text-accent-content transition-[top,height,width,right] duration-200"
        :style="rightSidebarStyle"
      >
        <div class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <slot name="right">
            <right-sidebar />
          </slot>
        </div>

        <div class="absolute right-2 top-2 z-[220] flex flex-col items-end gap-2">
          <button
            class="icon-btn icon-btn--tab icon-btn--accent"
            :class="{ 'icon-btn--dim': sidebarRightState === 'hidden' }"
            :title="`Right sidebar: ${rightSidebarModeLabel}`"
            @click="displayStore.toggleRightSidebar()"
          >
            <Icon
              :name="rightSidebarIcon"
              class="icon-btn__icon"
            />
            <span class="icon-btn__label icon-btn__label--vertical">
              {{ rightSidebarModeLabel }}
            </span>
          </button>

          <div class="flex flex-col gap-1">
            <button
              class="icon-btn icon-btn--mini icon-btn--accent"
              :class="{ 'icon-btn--active': sidebarRightHeaderPriority }"
              title="Right sidebar header priority"
              @click="displayStore.toggleSidebarRightHeaderPriority()"
            >
              <Icon
                :name="sidebarRightHeaderPriority ? 'kind-icon:compress' : 'kind-icon:expand'"
                class="icon-btn__icon icon-btn__icon--flip-v"
              />
            </button>

            <button
              class="icon-btn icon-btn--mini icon-btn--accent"
              :class="{ 'icon-btn--active': sidebarRightFooterPriority }"
              title="Right sidebar footer priority"
              @click="displayStore.toggleSidebarRightFooterPriority()"
            >
              <Icon
                :name="sidebarRightFooterPriority ? 'kind-icon:compress' : 'kind-icon:expand'"
                class="icon-btn__icon"
              />
            </button>
          </div>
        </div>
      </aside>
      <template #fallback />
    </ClientOnly>

    <main
      class="fixed overflow-hidden border border-base-300 bg-base-100 text-base-content transition-[top,left,width,height] duration-200"
      :style="mainContentStyle"
    >
      <div class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4">
        <slot />
      </div>
    </main>

    <footer
      class="fixed overflow-hidden border-t-2 border-base-content/20 bg-base-200 text-base-content transition-[height,width,left,bottom] duration-200"
      :style="footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer">
          <main-footer />
        </slot>
      </div>

      <div class="absolute left-1/2 top-2 z-[220] flex -translate-x-1/2 justify-center">
        <button
          class="icon-btn icon-btn--pill icon-btn--base"
          :class="{ 'icon-btn--dim': footerState === 'hidden' }"
          :title="`Footer: ${footerModeLabel}`"
          @click="displayStore.toggleFooter()"
        >
          <Icon
            :name="footerIcon"
            class="icon-btn__icon"
          />
          <span class="icon-btn__label">{{ footerModeLabel }}</span>
        </button>
      </div>
    </footer>

    <div
      class="pointer-events-none fixed z-[230]"
      :style="headerGhostToggleStyle"
    >
      <button
        v-if="headerState === 'hidden'"
        class="icon-btn icon-btn--pill icon-btn--primary"
        style="pointer-events: auto"
        title="Show header"
        @click="displayStore.toggleHeader()"
      >
        <Icon name="kind-icon:chevron-double-down" class="icon-btn__icon" />
        <span class="icon-btn__label">header</span>
      </button>
    </div>

    <div
      class="pointer-events-none fixed z-[230]"
      :style="footerGhostToggleStyle"
    >
      <button
        v-if="footerState === 'hidden'"
        class="icon-btn icon-btn--pill icon-btn--base"
        style="pointer-events: auto"
        title="Show footer"
        @click="displayStore.toggleFooter()"
      >
        <Icon name="kind-icon:chevron-double-up" class="icon-btn__icon" />
        <span class="icon-btn__label">footer</span>
      </button>
    </div>

    <div
      class="pointer-events-none fixed z-[230]"
      :style="leftGhostToggleStyle"
    >
      <button
        v-if="sidebarLeftState === 'hidden'"
        class="icon-btn icon-btn--tab icon-btn--secondary"
        style="pointer-events: auto"
        title="Show left sidebar"
        @click="displayStore.toggleLeftSidebar()"
      >
        <Icon name="kind-icon:panel-right" class="icon-btn__icon icon-btn__icon--mirror" />
        <span class="icon-btn__label icon-btn__label--vertical">left</span>
      </button>
    </div>

    <div
      class="pointer-events-none fixed z-[230]"
      :style="rightGhostToggleStyle"
    >
      <button
        v-if="sidebarRightState === 'hidden'"
        class="icon-btn icon-btn--tab icon-btn--accent"
        style="pointer-events: auto"
        title="Show right sidebar"
        @click="displayStore.toggleRightSidebar()"
      >
        <Icon name="kind-icon:panel-right-close" class="icon-btn__icon" />
        <span class="icon-btn__label icon-btn__label--vertical">right</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed, type CSSProperties } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const headerState = computed(() => displayStore.headerState)
const footerState = computed(() => displayStore.footerState)
const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)

const sidebarLeftHeaderPriority = computed(() => displayStore.sidebarLeftHeaderPriority)
const sidebarLeftFooterPriority = computed(() => displayStore.sidebarLeftFooterPriority)
const sidebarRightHeaderPriority = computed(() => displayStore.sidebarRightHeaderPriority)
const sidebarRightFooterPriority = computed(() => displayStore.sidebarRightFooterPriority)

const headerStyle = computed(() => displayStore.headerStyle)
const footerStyle = computed(() => displayStore.footerStyle)
const leftSidebarStyle = computed(() => displayStore.leftSidebarStyle)
const rightSidebarStyle = computed(() => displayStore.rightSidebarStyle)
const mainContentStyle = computed(() => displayStore.mainContentStyle)

const headerModeLabel = computed(() => displayStore.headerModeLabel)
const footerModeLabel = computed(() => displayStore.footerModeLabel)
const leftSidebarModeLabel = computed(() => displayStore.leftSidebarModeLabel)
const rightSidebarModeLabel = computed(() => displayStore.rightSidebarModeLabel)

function toUnit(value: unknown, fallback = '0px'): string {
  if (typeof value === 'number') return `${value}px`
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function styleValue(style: Record<string, unknown>, key: string, fallback = '0px'): string {
  return toUnit(style[key], fallback)
}

function parsePixels(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const match = value.match(/-?\d+(\.\d+)?/)
    return match ? Number(match[0]) : 0
  }
  return 0
}

const headerIcon = computed(() => {
  if (headerState.value === 'hidden') return 'kind-icon:chevron-double-down'
  if (headerState.value === 'compact') return 'kind-icon:chevron-double-down'
  return 'kind-icon:chevron-up'
})

const footerIcon = computed(() => {
  if (footerState.value === 'hidden') return 'kind-icon:chevron-double-up'
  if (footerState.value === 'compact') return 'kind-icon:chevron-double-up'
  return 'kind-icon:chevron-down'
})

const leftSidebarIcon = computed(() => {
  if (sidebarLeftState.value === 'hidden') return 'kind-icon:panel-right'
  if (sidebarLeftState.value === 'compact') return 'kind-icon:panel-right'
  return 'kind-icon:panel-right-close'
})

const rightSidebarIcon = computed(() => {
  if (sidebarRightState.value === 'hidden') return 'kind-icon:panel-right-close'
  if (sidebarRightState.value === 'compact') return 'kind-icon:panel-right-close'
  return 'kind-icon:panel-right'
})

const headerGhostToggleStyle = computed<CSSProperties>(() => {
  const header = headerStyle.value as Record<string, unknown>
  const right = rightSidebarStyle.value as Record<string, unknown>
  const rightShift =
    sidebarRightHeaderPriority.value && sidebarRightState.value !== 'hidden'
      ? parsePixels(right.width) + 8
      : 8

  return {
    top: '8px',
    right: `${rightShift}px`,
  }
})

const footerGhostToggleStyle = computed<CSSProperties>(() => ({
  left: '50%',
  bottom: '8px',
  transform: 'translateX(-50%)',
}))

const leftGhostToggleStyle = computed<CSSProperties>(() => {
  const main = mainContentStyle.value as Record<string, unknown>
  return {
    top: styleValue(main, 'top', '8px'),
    left: '8px',
  }
})

const rightGhostToggleStyle = computed<CSSProperties>(() => {
  const main = mainContentStyle.value as Record<string, unknown>
  return {
    top: styleValue(main, 'top', '8px'),
    right: '8px',
  }
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

.icon-btn--mini {
  width: 1.7rem;
  height: 1.7rem;
  padding: 0.2rem;
  border-radius: 0.5rem;
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

.icon-btn--active {
  outline: 2px solid oklch(var(--wa) / 0.95);
  outline-offset: 1px;
}

.icon-btn--dim {
  opacity: 0.45;
}

.icon-btn--dim:hover {
  opacity: 1;
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

.icon-btn__icon--flip-v {
  transform: scaleY(-1);
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