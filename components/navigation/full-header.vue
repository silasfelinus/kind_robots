<!-- /components/navigation/full-header.vue -->
<template>
  <header
    ref="headerRoot"
    :key="headerKey"
    class="relative isolate z-30 flex h-full w-full min-w-0 items-stretch gap-1 overflow-visible"
  >
    <!-- ── Left sidebar toggle — always visible ── -->
    <button
      type="button"
      :title="sidebarLeftTitle"
      :aria-label="sidebarLeftTitle"
      class="group relative z-10 flex shrink-0 items-center justify-center rounded-xl border border-base-300/80 bg-base-200/80 px-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-secondary-content active:translate-y-0 active:scale-95"
      @click="displayStore.toggleLeftSidebar()"
    >
      <Icon
        :name="sidebarLeftIcon"
        class="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
      />
    </button>

    <!-- ── Center: smart-icons always visible ── -->
    <div class="flex h-full min-w-0 flex-1 items-stretch px-1">
      <smart-icons
        class="h-full w-full min-w-0"
        :prepend-icons="prependIcons"
      />
    </div>

    <!-- ── Right sidebar toggle — always visible ── -->
    <button
      type="button"
      :title="sidebarRightTitle"
      :aria-label="sidebarRightTitle"
      class="group relative z-10 flex shrink-0 items-center justify-center rounded-xl border border-base-300/80 bg-base-200/80 px-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-secondary hover:bg-secondary hover:text-secondary-content active:translate-y-0 active:scale-95"
      @click="displayStore.toggleRightSidebar()"
    >
      <Icon
        :name="sidebarRightIcon"
        class="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
      />
    </button>

    <!--
      ── Header toggle pill ──
      Straddles the bottom edge of the header via translate-y-1/2.
      overflow-visible on the header lets it escape into the content area.
      Larger than before — easier to tap on mobile.
    -->
    <button
      type="button"
      :title="headerToggleTitle"
      :aria-label="headerToggleTitle"
      class="pointer-events-auto absolute bottom-0 left-1/2 z-50 -translate-x-1/2 translate-y-1/2 flex items-center gap-1.5 rounded-full border border-base-300 bg-base-100 px-4 py-1.5 shadow-md transition-all duration-150 hover:border-primary hover:bg-primary hover:text-primary-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 active:scale-95"
      @click="handleHeaderToggle"
    >
      <Icon
        :name="headerToggleIcon"
        class="h-4 w-4 text-base-content/70 transition group-hover:text-inherit"
      />
    </button>

    <!-- ── Viewport debug badge (admin only) ── -->
    <div
      v-if="showViewportBadge"
      class="pointer-events-none fixed left-2 top-2 z-9999"
    >
      <span
        class="inline-flex rounded-md bg-primary/90 px-2 py-1 text-[clamp(0.7rem,1vw,1rem)] leading-none text-white shadow"
      >
        {{ viewportSize }}
      </span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

const displayStore = useDisplayStore()
const userStore = useUserStore()

const headerRoot = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

// ── Derived state ──────────────────────────────────────────────────────────

const viewportSize = computed(() => displayStore.viewportSize)
const headerState = computed(() => displayStore.headerState)
const isOpen = computed(() => headerState.value === 'open')
const showViewportBadge = computed(() => userStore.user?.Role === 'ADMIN')

// ── Header toggle (two-state: open ↔ compact only) ────────────────────────

/** Flip between open and compact; never goes to hidden. */
function handleHeaderToggle() {
  if (isOpen.value) {
    displayStore.changeState('headerState', 'compact')
  } else {
    displayStore.changeState('headerState', 'open')
  }
}

const headerToggleTitle = computed(() =>
  isOpen.value ? 'Compact header' : 'Expand header',
)

// Chevron direction describes the current state so the click action is obvious:
// open  → chevron-up   (header is tall — click to shrink)
// compact → chevron-down (header is short — click to grow)
const headerToggleIcon = computed(() =>
  isOpen.value ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down',
)

// ── Sidebar toggles ───────────────────────────────────────────────────────

const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)

const sidebarLeftTitle = computed(() =>
  sidebarLeftState.value === 'open' ? 'Close left panel' : 'Open left panel',
)
const sidebarRightTitle = computed(() =>
  sidebarRightState.value === 'open' ? 'Close right panel' : 'Open right panel',
)

// Panel-left / panel-right chevrons: arrow points toward the panel when closed,
// away from it when open — universally legible affordance.
const sidebarLeftIcon = computed(() =>
  sidebarLeftState.value === 'open'
    ? 'kind-icon:chevron-left'
    : 'kind-icon:chevron-right',
)
const sidebarRightIcon = computed(() =>
  sidebarRightState.value === 'open'
    ? 'kind-icon:chevron-right'
    : 'kind-icon:chevron-left',
)

// ── Smart-icons prepend list ──────────────────────────────────────────────

const prependIcons = computed(() => [
  {
    id: '__login',
    component: 'login-icon',
    color: 'text-primary',
    label: userStore.isLoggedIn ? userStore.username || 'Profile' : 'Login',
  },
  {
    id: '__jellybean',
    component: 'jellybean-icon',
    color: 'text-secondary',
    label: 'beans',
  },
  {
    id: '__theme',
    component: 'theme-icon',
    color: 'text-accent',
    label: 'theme',
  },
  {
    id: '__swarm',
    component: 'swarm-icon',
    color: 'text-info',
    label: 'swarm',
  },
])

// ── Rekey to force smart-icons remount on layout changes ──────────────────

const headerKey = computed(() =>
  [
    headerState.value,
    viewportSize.value,
    sidebarLeftState.value,
    sidebarRightState.value,
  ].join('-'),
)

// ── Resize observer → notify layout system ────────────────────────────────

function fireHeaderResized() {
  window.dispatchEvent(new CustomEvent('kr:header-resized'))
}

onMounted(() => {
  if (!headerRoot.value) return
  ro = new ResizeObserver(fireHeaderResized)
  ro.observe(headerRoot.value)
  nextTick(fireHeaderResized)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

watch(
  () => [
    headerState.value,
    viewportSize.value,
    sidebarLeftState.value,
    sidebarRightState.value,
  ],
  async () => {
    await nextTick()
    fireHeaderResized()
  },
  { flush: 'post' },
)
</script>
