<!-- /components/navigation/full-header.vue -->
<template>
  <header
    ref="headerRoot"
    :key="headerKey"
    class="isolate flex h-full w-full min-w-0 items-stretch gap-1 overflow-visible z-30"
  >
    <button
      type="button"
      class="group relative z-0 flex h-full shrink-0 overflow-hidden pointer-events-auto rounded-2xl transition-all duration-150 ease-in-out hover:brightness-110 hover:scale-[1.02] active:scale-[0.97] active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-1"
      :style="avatarColumnStyle"
      :title="avatarToggleTitle"
      @click="handleAvatarClick"
    >
      <avatar-image
        alt="User Avatar"
        class="m-0 block h-full w-full object-cover rounded-2xl object-center p-0"
      />

      <div
        v-if="showViewportBadge"
        class="pointer-events-none absolute left-[4%] right-[4%] top-2 z-50 flex justify-start"
      >
        <span
          class="inline-flex max-w-full truncate rounded-md bg-primary/90 px-2 py-1 text-[clamp(0.7rem,1vw,1rem)] leading-none text-white shadow"
        >
          {{ viewportSize }}
        </span>
      </div>

      <!-- Subtle hover overlay -->
      <div
        class="pointer-events-none absolute inset-0 rounded-2xl bg-white/0 transition-colors duration-150 group-hover:bg-white/8"
      />
    </button>

    <div
      v-if="hasHeaderContent"
      class="flex h-full min-w-0 flex-1 items-stretch gap-1 px-1 py-1 md:px-2 lg:px-3 xl:px-4"
    >
      <smart-icons
        class="h-full w-full min-w-0"
        :prepend-icons="prependIcons"
      />
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
  type CSSProperties,
} from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'

const displayStore = useDisplayStore()
const userStore = useUserStore()

function handleAvatarClick() {
  displayStore.toggleHeader()
}

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
  return 'Open header'
})

const prependIcons = computed(() =>
  headerState.value === 'open' ||
  headerState.value === 'compact' ||
  headerState.value === 'priority'
    ? [
        // In the prependIcons computed, change the login entry label:
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

const leftPriority = computed(
  () => displayStore.leftSidebarModeLabel === 'priority',
)
const rightPriority = computed(
  () => displayStore.rightSidebarModeLabel === 'priority',
)
const hasPrioritySidebar = computed(
  () => leftPriority.value || rightPriority.value,
)

const avatarColumnStyle = computed<CSSProperties>(() => {
  if (isCompactHeader.value && hasPrioritySidebar.value) {
    return { flexBasis: '12%', maxWidth: '18%' }
  }
  if (isCompactHeader.value) {
    return { flexBasis: '14%', maxWidth: '22%' }
  }
  if (hasPrioritySidebar.value) {
    return { flexBasis: '12%', maxWidth: '18%' }
  }
  return { flexBasis: '15%', maxWidth: '24%' }
})

const headerKey = computed(() =>
  [
    headerState.value,
    viewportSize.value,
    displayStore.sidebarLeftState,
    displayStore.sidebarRightState,
    displayStore.leftSidebarModeLabel,
    displayStore.rightSidebarModeLabel,
  ].join('-'),
)

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
    displayStore.leftSidebarModeLabel,
    displayStore.rightSidebarModeLabel,
  ],
  async () => {
    await nextTick()
    fireHeaderResized()
  },
  { flush: 'post' },
)
</script>
