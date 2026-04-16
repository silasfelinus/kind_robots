<!-- /layouts/default.vue -->
<template>
  <div class="fixed inset-0 overflow-hidden bg-base-300 text-base-content">
    <!-- ══ HEADER ══ -->
    <header
      class="overflow-hidden border-b-2 border-primary-focus bg-primary text-primary-content transition-[height] duration-200"
      :style="headerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="header">
          <main-header />
        </slot>
      </div>
    </header>

    <!-- ══ LEFT SIDEBAR ══ -->
    <ClientOnly>
      <aside
        class="overflow-hidden border-r-2 border-secondary-focus bg-secondary text-secondary-content transition-[top,height,width] duration-200"
        :style="leftSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="left">
            <left-sidebar />
          </slot>
        </div>

        <div
          class="absolute bottom-12 right-1.5 z-[120] flex flex-col items-end gap-1"
        >
          <button
            class="icon-btn icon-btn--mini icon-btn--secondary"
            :class="{ 'icon-btn--active': sidebarLeftHeaderPriority }"
            title="Extend behind header"
            @click="displayStore.toggleSidebarLeftHeaderPriority()"
          >
            <Icon
              :name="
                sidebarLeftHeaderPriority
                  ? 'kind-icon:compress'
                  : 'kind-icon:expand'
              "
              class="icon-btn__icon icon-btn__icon--flip-v"
            />
          </button>

          <button
            class="icon-btn icon-btn--mini icon-btn--secondary"
            :class="{ 'icon-btn--active': sidebarLeftFooterPriority }"
            title="Extend behind footer"
            @click="displayStore.toggleSidebarLeftFooterPriority()"
          >
            <Icon
              :name="
                sidebarLeftFooterPriority
                  ? 'kind-icon:compress'
                  : 'kind-icon:expand'
              "
              class="icon-btn__icon"
            />
          </button>
        </div>
      </aside>
      <template #fallback />
    </ClientOnly>

    <!-- ══ RIGHT SIDEBAR ══ -->
    <ClientOnly>
      <aside
        class="overflow-hidden border-l-2 border-accent-focus bg-accent text-accent-content transition-[top,height,width] duration-200"
        :style="rightSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="right">
            <right-sidebar />
          </slot>
        </div>

        <div
          class="absolute bottom-12 left-1.5 z-[120] flex flex-col items-start gap-1"
        >
          <button
            class="icon-btn icon-btn--mini icon-btn--accent"
            :class="{ 'icon-btn--active': sidebarRightHeaderPriority }"
            title="Extend behind header"
            @click="displayStore.toggleSidebarRightHeaderPriority()"
          >
            <Icon
              :name="
                sidebarRightHeaderPriority
                  ? 'kind-icon:compress'
                  : 'kind-icon:expand'
              "
              class="icon-btn__icon icon-btn__icon--flip-v"
            />
          </button>

          <button
            class="icon-btn icon-btn--mini icon-btn--accent"
            :class="{ 'icon-btn--active': sidebarRightFooterPriority }"
            title="Extend behind footer"
            @click="displayStore.toggleSidebarRightFooterPriority()"
          >
            <Icon
              :name="
                sidebarRightFooterPriority
                  ? 'kind-icon:compress'
                  : 'kind-icon:expand'
              "
              class="icon-btn__icon"
            />
          </button>
        </div>
      </aside>
      <template #fallback />
    </ClientOnly>

    <!-- ══ CENTER ══ -->
    <main
      class="overflow-hidden border-x border-base-300 bg-base-100 text-base-content"
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
      class="overflow-hidden border-t-2 border-neutral-focus bg-neutral text-neutral-content transition-[height] duration-200"
      :style="footerStyle"
    >
      <div class="absolute inset-0 overflow-hidden">
        <slot name="footer">
          <main-footer />
        </slot>
      </div>
    </footer>

    <!-- ══ TOGGLES ══ -->

    <!-- Header toggle: attached to bottom-inside edge of header -->
    <div
      class="pointer-events-none fixed left-0 right-0 z-[200] flex justify-center"
      :style="headerToggleStyle"
    >
      <button
        class="icon-btn icon-btn--pill icon-btn--primary"
        style="pointer-events: auto"
        :class="{ 'icon-btn--dim': headerState === 'hidden' }"
        :title="`Header: ${headerModeLabel}`"
        @click="displayStore.toggleHeader()"
      >
        <Icon
          :name="
            headerState === 'hidden'
              ? 'kind-icon:chevron-double-down'
              : 'kind-icon:chevron-up'
          "
          class="icon-btn__icon"
        />
        <span class="icon-btn__label">{{ headerModeLabel }}</span>
      </button>
    </div>

    <!-- Footer toggle: attached to top-inside edge of footer -->
    <div
      class="pointer-events-none fixed left-0 right-0 z-[200] flex justify-center"
      :style="footerToggleStyle"
    >
      <button
        class="icon-btn icon-btn--pill icon-btn--neutral"
        style="pointer-events: auto"
        :class="{ 'icon-btn--dim': footerState === 'hidden' }"
        :title="`Footer: ${footerModeLabel}`"
        @click="displayStore.toggleFooter()"
      >
        <Icon
          :name="
            footerState === 'hidden'
              ? 'kind-icon:chevron-double-up'
              : 'kind-icon:chevron-down'
          "
          class="icon-btn__icon"
        />
        <span class="icon-btn__label">{{ footerModeLabel }}</span>
      </button>
    </div>

    <!-- Left sidebar toggle: attached to inside-right edge of left sidebar -->
    <div
      class="pointer-events-none fixed z-[200] flex items-center justify-end"
      :style="leftToggleStyle"
    >
      <button
        class="icon-btn icon-btn--tab icon-btn--tab-left icon-btn--secondary"
        style="pointer-events: auto"
        :class="{ 'icon-btn--dim': sidebarLeftState === 'hidden' }"
        :title="`Left sidebar: ${leftSidebarModeLabel}`"
        @click="displayStore.toggleLeftSidebar()"
      >
        <Icon
          :name="
            sidebarLeftState === 'hidden'
              ? 'kind-icon:panel-right'
              : 'kind-icon:panel-right-close'
          "
          class="icon-btn__icon icon-btn__icon--mirror"
        />
        <span class="icon-btn__label icon-btn__label--vertical">
          {{ leftSidebarModeLabel }}
        </span>
      </button>
    </div>

    <!-- Right sidebar toggle: attached to inside-left edge of right sidebar -->
    <div
      class="pointer-events-none fixed z-[200] flex items-center justify-start"
      :style="rightToggleStyle"
    >
      <button
        class="icon-btn icon-btn--tab icon-btn--tab-right icon-btn--accent"
        style="pointer-events: auto"
        :class="{ 'icon-btn--dim': sidebarRightState === 'hidden' }"
        :title="`Right sidebar: ${rightSidebarModeLabel}`"
        @click="displayStore.toggleRightSidebar()"
      >
        <Icon
          :name="
            sidebarRightState === 'hidden'
              ? 'kind-icon:panel-right-close'
              : 'kind-icon:panel-right'
          "
          class="icon-btn__icon"
        />
        <span class="icon-btn__label icon-btn__label--vertical">
          {{ rightSidebarModeLabel }}
        </span>
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

function toUnit(value: unknown, fallback = '0px'): string {
  if (typeof value === 'number') return `${value}px`
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function styleNumber(style: Record<string, unknown>, key: string): string {
  return toUnit(style[key], '0px')
}

const headerToggleStyle = computed<CSSProperties>(() => {
  const header = headerStyle.value as Record<string, unknown>
  return {
    top: `calc(${styleNumber(header, 'height')} - 1.1rem)`,
  }
})

const footerToggleStyle = computed<CSSProperties>(() => {
  const footer = footerStyle.value as Record<string, unknown>
  return {
    bottom: `calc(${styleNumber(footer, 'height')} - 1.1rem)`,
  }
})

const leftToggleStyle = computed<CSSProperties>(() => {
  const sidebar = leftSidebarStyle.value as Record<string, unknown>
  return {
    top: styleNumber(sidebar, 'top'),
    left: `calc(${styleNumber(sidebar, 'width')} - 1rem)`,
    height: styleNumber(sidebar, 'height'),
    width: '0px',
  }
})

const rightToggleStyle = computed<CSSProperties>(() => {
  const sidebar = rightSidebarStyle.value as Record<string, unknown>
  return {
    top: styleNumber(sidebar, 'top'),
    right: `calc(${styleNumber(sidebar, 'width')} - 1rem)`,
    height: styleNumber(sidebar, 'height'),
    width: '0px',
  }
})
</script>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
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
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}

.icon-btn--tab {
  flex-direction: column;
  width: 2rem;
  gap: 0.3rem;
  padding: 0.6rem 0.35rem;
}

.icon-btn--tab-left {
  border-radius: 0.75rem 0 0 0.75rem;
}

.icon-btn--tab-right {
  border-radius: 0 0.75rem 0.75rem 0;
}

.icon-btn--mini {
  width: 1.6rem;
  height: 1.6rem;
  padding: 0.2rem;
  border-radius: 0.45rem;
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

.icon-btn--neutral {
  background: oklch(var(--n) / 0.95);
  border-color: oklch(var(--nf) / 0.9);
  color: oklch(var(--nc) / 1);
}

.icon-btn--neutral:hover {
  background: oklch(var(--nf) / 1);
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
  opacity: 0.85;
}

.icon-btn__icon--mirror {
  transform: scaleX(-1);
}

.icon-btn__icon--flip-v {
  transform: scaleY(-1);
}

.icon-btn__label {
  white-space: nowrap;
  font-size: 0.5rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.82;
}

.icon-btn__label--vertical {
  writing-mode: vertical-lr;
  letter-spacing: 0.06em;
}
</style>