<!-- /components/navigation/full-header.vue -->
<template>
  <header
    ref="headerRoot"
    :key="headerKey"
    class="relative isolate z-30 flex h-full w-full min-w-0 items-stretch gap-1 overflow-visible"
  >
    <!-- Smart icons — now fills the full width since the avatar button is gone -->
    <div
      v-if="hasHeaderContent"
      class="flex h-full min-w-0 flex-1 items-stretch gap-1 px-1 py-1 md:px-2 lg:px-3 xl:px-4"
    >
      <smart-icons
        class="h-full w-full min-w-0"
        :prepend-icons="prependIcons"
      />
    </div>

    <!--
      Floating toggle pill — straddles the bottom edge of the header.
      translate-y-1/2 pushes it half-outside the header into the content area,
      making it visible regardless of what the header is rendering.
      overflow-visible on the header element lets it escape.
    -->
    <button
      type="button"
      class="pointer-events-auto absolute bottom-0 left-1/2 z-50 -translate-x-1/2 translate-y-1/2 flex items-center gap-1 rounded-full border border-base-300 bg-base-100 px-3 py-1 shadow-md transition-all duration-150 hover:border-primary hover:bg-primary hover:text-primary-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
      :title="avatarToggleTitle"
      @click="handleAvatarClick"
    >
      <Icon
        :name="headerToggleIcon"
        class="h-3.5 w-3.5 text-base-content/60 transition group-hover:text-inherit"
      />
    </button>

    <!--
      Viewport debug badge — truly floating, no layout impact.
      fixed + pointer-events-none means it never pushes anything around.
    -->
    <div
      v-if="showViewportBadge"
      class="pointer-events-none fixed left-2 top-2 z-[9999]"
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

const viewportSize = computed(() => displayStore.viewportSize)
const headerState = computed(() => displayStore.headerState)
const isCompactHeader = computed(() => headerState.value === 'compact')
const hasHeaderContent = computed(() => headerState.value !== 'hidden')
const showViewportBadge = computed(() => userStore.user?.Role === 'ADMIN')

const avatarToggleTitle = computed(() => {
  if (headerState.value === 'open') return 'Compact header'
  if (headerState.value === 'compact') return 'Hide header'
  return 'Show header'
})

// Chevron direction signals the action: up = currently visible (click to hide),
// down = currently hidden (click to reveal)
const headerToggleIcon = computed(() => {
  if (headerState.value === 'hidden') return 'kind-icon:chevron-down'
  return 'kind-icon:chevron-up'
})

const prependIcons = computed(() =>
  hasHeaderContent.value
    ? [
        {
          id: '__login',
          component: 'login-icon',
          color: 'text-primary',
          label: userStore.isLoggedIn
            ? userStore.username || 'Profile'
            : 'Login',
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
      ]
    : [],
)

const headerKey = computed(() =>
  [
    headerState.value,
    viewportSize.value,
    displayStore.sidebarLeftState,
    displayStore.sidebarRightState,
  ].join('-'),
)

function handleAvatarClick() {
  displayStore.toggleHeader()
}

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
    displayStore.sidebarLeftState,
    displayStore.sidebarRightState,
  ],
  async () => {
    await nextTick()
    fireHeaderResized()
  },
  { flush: 'post' },
)
</script>
