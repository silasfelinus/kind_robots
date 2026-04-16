<!-- /layouts/default.vue -->
<!--
  Every region is ALWAYS in the DOM. Hidden = sectionPaddingSize minimum.
  No v-if on regions. No Tailwind position classes on region elements.
  position:fixed comes exclusively from the store style object.

  Toggle centering uses left:0;right:0;display:flex;justify-content:center
  instead of left:50%;transform:translateX(-50%) to avoid stacking context issues.

  Icons via Nuxt <Icon> component (kind-icon set) — no bare /assets/ img paths.
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
        <!-- Priority controls: bottom-right of sidebar -->
        <div
          class="absolute bottom-12 right-1.5 z-10 flex flex-col gap-1 items-end"
        >
          <button
            class="icon-btn"
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
            class="icon-btn"
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
        class="overflow-hidden bg-secondary text-secondary-content border-l-2 border-secondary-focus transition-[top,height,width] duration-200"
        :style="rightSidebarStyle"
      >
        <div
          class="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain"
        >
          <slot name="right"><right-sidebar /></slot>
        </div>
        <!-- Priority controls: bottom-left of sidebar -->
        <div
          class="absolute bottom-12 left-1.5 z-10 flex flex-col gap-1 items-start"
        >
          <button
            class="icon-btn"
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
            class="icon-btn"
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
         Always visible. z-index 200 above all regions (max is 50).
         Centered via left:0;right:0;justify-content:center — no transform,
         no stacking context created.
    -->

    <!-- Header toggle: top, centered horizontally -->
    <div
      style="
        position: fixed;
        top: 0.3rem;
        left: 0;
        right: 0;
        z-index: 200;
        display: flex;
        justify-content: center;
        pointer-events: none;
      "
    >
      <button
        class="icon-btn icon-btn--pill"
        style="pointer-events: auto"
        :class="{ 'icon-btn--dim': headerState === 'hidden' }"
        :title="`Header: ${headerModeLabel}`"
        @click="displayStore.toggleHeader()"
      >
        <Icon
          :name="
            headerState === 'hidden'
              ? 'kind-icon:chevron-double-up'
              : 'kind-icon:chevron-up'
          "
          class="icon-btn__icon"
        />
        <span class="icon-btn__label">{{ headerModeLabel }}</span>
      </button>
    </div>

    <!-- Footer toggle: bottom, centered horizontally -->
    <div
      style="
        position: fixed;
        bottom: 0.3rem;
        left: 0;
        right: 0;
        z-index: 200;
        display: flex;
        justify-content: center;
        pointer-events: none;
      "
    >
      <button
        class="icon-btn icon-btn--pill"
        style="pointer-events: auto"
        :class="{ 'icon-btn--dim': footerState === 'hidden' }"
        :title="`Footer: ${footerModeLabel}`"
        @click="displayStore.toggleFooter()"
      >
        <Icon
          :name="
            footerState === 'hidden'
              ? 'kind-icon:chevron-double-down'
              : 'kind-icon:chevron-down'
          "
          class="icon-btn__icon"
        />
        <span class="icon-btn__label">{{ footerModeLabel }}</span>
      </button>
    </div>

    <!-- Left sidebar toggle: left edge, vertically centered -->
    <!-- translateY on the button itself, not the wrapper — wrapper is plain fixed -->
    <div
      style="
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 200;
        display: flex;
        align-items: center;
        pointer-events: none;
      "
    >
      <button
        class="icon-btn icon-btn--tab icon-btn--tab-left"
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
        <span class="icon-btn__label icon-btn__label--vertical">{{
          leftSidebarModeLabel
        }}</span>
      </button>
    </div>

    <!-- Right sidebar toggle: right edge, vertically centered -->
    <div
      style="
        position: fixed;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: 200;
        display: flex;
        align-items: center;
        pointer-events: none;
      "
    >
      <button
        class="icon-btn icon-btn--tab icon-btn--tab-right"
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
        <span class="icon-btn__label icon-btn__label--vertical">{{
          rightSidebarModeLabel
        }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// /layouts/default.vue
import { computed } from 'vue'
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
</script>

<style scoped>
/* ── Base icon button ── */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 1px solid oklch(var(--bc) / 0.2);
  background: oklch(var(--b1) / 0.9);
  backdrop-filter: blur(8px);
  color: oklch(var(--bc) / 0.8);
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s,
    border-color 0.15s;
  box-shadow: 0 1px 6px oklch(0 0 0 / 0.15);
}
.icon-btn:hover {
  background: oklch(var(--b1) / 1);
  border-color: oklch(var(--bc) / 0.4);
  color: oklch(var(--bc) / 1);
}

/* Pill — header/footer toggles */
.icon-btn--pill {
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
}

/* Tab — sidebar toggles, flush on the screen-edge side */
.icon-btn--tab {
  flex-direction: column;
  padding: 0.6rem 0.35rem;
  width: 2rem;
  gap: 0.3rem;
}
.icon-btn--tab-left {
  border-radius: 0 0.5rem 0.5rem 0;
  border-left: none;
}
.icon-btn--tab-right {
  border-radius: 0.5rem 0 0 0.5rem;
  border-right: none;
}

/* Small square — priority buttons inside sidebars */
.icon-btn:not(.icon-btn--pill):not(.icon-btn--tab) {
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.35rem;
  padding: 0.2rem;
}

/* Active (priority on) */
.icon-btn--active {
  background: oklch(var(--wa) / 0.85);
  border-color: oklch(var(--wa) / 0.5);
  color: oklch(var(--wac) / 1);
}
.icon-btn--active:hover {
  background: oklch(var(--wa) / 1);
}

/* Dim when region is hidden */
.icon-btn--dim {
  opacity: 0.45;
}
.icon-btn--dim:hover {
  opacity: 1;
}

/* ── Icon ── */
.icon-btn__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.75;
}
.icon-btn:hover .icon-btn__icon {
  opacity: 1;
}
.icon-btn__icon--mirror {
  transform: scaleX(-1);
}
.icon-btn__icon--flip-v {
  transform: scaleY(-1);
}

/* ── Label ── */
.icon-btn__label {
  font-size: 0.5rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: 0.7;
}
.icon-btn__label--vertical {
  writing-mode: vertical-lr;
  letter-spacing: 0.06em;
}
</style>
