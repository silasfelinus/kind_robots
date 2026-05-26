<!-- /components/navigation/full-header.vue -->
<template>
  <header
    ref="headerRoot"
    class="relative isolate z-30 h-full w-full overflow-visible border-t border-base-300 bg-base-100/95 shadow-lg backdrop-blur transition-[height] duration-200"
  >
    <div
      class="flex h-full w-full min-w-0 items-center gap-2 overflow-hidden px-2 py-0.5"
    >
      <!-- Left sidebar toggle -->
      <button
        type="button"
        :title="sidebarLeftTitle"
        :aria-label="sidebarLeftTitle"
        class="group relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        :class="
          sidebarLeftState === 'open'
            ? 'border-secondary/50 bg-secondary/15 text-secondary hover:bg-secondary hover:text-secondary-content'
            : 'border-base-300 bg-base-200 text-base-content hover:border-secondary hover:bg-secondary hover:text-secondary-content'
        "
        @click="displayStore.toggleLeftSidebar()"
      >
        <Icon
          :name="sidebarLeftIcon"
          class="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
        />
      </button>

      <page-image />

      <!-- Smart icons bar -->
      <div
        class="flex h-full min-w-0 flex-1 items-center overflow-hidden rounded-2xl border border-base-300 bg-base-200/60 px-2"
      >
        <smart-icons
          :key="smartIconsKey"
          class="h-full min-h-10 w-full min-w-0"
          :prepend-icons="prependIcons"
        />
      </div>

      <!-- Right sidebar toggle -->
      <button
        type="button"
        :title="sidebarRightTitle"
        :aria-label="sidebarRightTitle"
        class="group relative z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
        :class="
          sidebarRightState === 'open'
            ? 'border-secondary/50 bg-secondary/15 text-secondary hover:bg-secondary hover:text-secondary-content'
            : 'border-base-300 bg-base-200 text-base-content hover:border-secondary hover:bg-secondary hover:text-secondary-content'
        "
        @click="displayStore.toggleRightSidebar()"
      >
        <Icon
          :name="sidebarRightIcon"
          class="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
        />
      </button>
    </div>

    <!-- ── Header expand / collapse pill ─────────────────────────────── -->
    <button
      type="button"
      :title="headerToggleTitle"
      :aria-label="headerToggleTitle"
      class="group pointer-events-auto absolute left-1/2 top-0 z-50 flex -translate-x-1/2 -translate-y-[calc(100%+3px)] items-center gap-1.5 rounded-full border border-base-300 bg-base-100/95 px-3.5 py-1.5 text-xs font-bold text-base-content/70 shadow-md backdrop-blur transition-all duration-150 hover:border-primary hover:bg-primary hover:text-primary-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 active:scale-95"
      @click="handleHeaderToggle"
    >
      <Icon
        :name="headerToggleIcon"
        class="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:scale-110"
      />
      <span>{{ isOpen ? 'Compact' : 'Expand' }}</span>
    </button>

    <!-- Viewport size badge (admin only) -->
    <div
      v-if="showViewportBadge"
      class="pointer-events-none fixed left-2 top-2 z-9999"
    >
      <span
        class="inline-flex rounded-md bg-primary/90 px-2 py-1 text-[clamp(0.7rem,1vw,1rem)] leading-none text-primary-content shadow"
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

const viewportSize = computed(() => displayStore.viewportSize)
const headerState = computed(() => displayStore.headerState)
const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)

const isOpen = computed(() => headerState.value === 'open')
const showViewportBadge = computed(() => userStore.user?.Role === 'ADMIN')

function normalizeHeaderState() {
  if (headerState.value !== 'open' && headerState.value !== 'compact') {
    displayStore.changeState('headerState', 'compact')
  }
}

function handleHeaderToggle() {
  displayStore.changeState('headerState', isOpen.value ? 'compact' : 'open')
}

const headerToggleTitle = computed(() =>
  isOpen.value ? 'Compact header' : 'Expand header',
)
const headerToggleIcon = computed(() =>
  isOpen.value ? 'kind-icon:chevron-down' : 'kind-icon:chevron-up',
)
const sidebarLeftTitle = computed(() =>
  sidebarLeftState.value === 'open' ? 'Close left panel' : 'Open left panel',
)
const sidebarRightTitle = computed(() =>
  sidebarRightState.value === 'open' ? 'Close right panel' : 'Open right panel',
)
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

const smartIconsKey = computed(() =>
  [
    headerState.value,
    viewportSize.value,
    sidebarLeftState.value,
    sidebarRightState.value,
    userStore.isLoggedIn ? 'user' : 'guest',
  ].join('-'),
)

function fireHeaderResized() {
  window.dispatchEvent(new CustomEvent('kr:header-resized'))
}

onMounted(async () => {
  normalizeHeaderState()
  await nextTick()
  if (headerRoot.value) {
    ro = new ResizeObserver(fireHeaderResized)
    ro.observe(headerRoot.value)
  }
  fireHeaderResized()
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

watch(
  () => headerState.value,
  async () => {
    normalizeHeaderState()
    await nextTick()
    fireHeaderResized()
  },
  { flush: 'post' },
)

watch(
  () => [
    viewportSize.value,
    sidebarLeftState.value,
    sidebarRightState.value,
    isOpen.value,
  ],
  async () => {
    await nextTick()
    fireHeaderResized()
  },
  { flush: 'post' },
)
</script>
