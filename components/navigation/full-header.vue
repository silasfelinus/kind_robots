<!-- /components/navigation/full-header.vue -->
<template>
  <header
    ref="headerRoot"
    :key="headerKey"
    class="isolate flex h-full w-full min-w-0 items-stretch gap-0 overflow-hidden"
  >
    <button
      type="button"
      class="relative z-0 flex h-full shrink-0 overflow-hidden pointer-events-auto"
      :style="avatarColumnStyle"
      :title="avatarToggleTitle"
      @click="displayStore.toggleHeaderCompact"
    >
      <avatar-image
        alt="User Avatar"
        class="m-0 block h-full w-full object-cover object-center p-0"
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
    </button>

    <div
      v-if="hasHeaderContent"
      class="flex h-full min-w-0 flex-1 items-center px-1 py-0 md:px-2 lg:px-3 xl:px-4"
    >
      <div
        class="flex h-full w-full min-w-0 items-center justify-between gap-2 lg:gap-3 xl:gap-4"
      >
        <template v-if="isCompactHeader">
          <div class="flex h-full w-full min-w-0 items-center gap-2 py-0">
            <div class="min-w-0 shrink flex items-center">
              <div
                class="inline-flex min-w-0 max-w-full items-center gap-2 rounded-2xl border border-black bg-linear-to-r from-base-100 via-base-200 to-base-100 px-3 py-1.5 shadow-[0_3px_0_rgba(0,0,0,0.6)] sm:px-4 sm:py-2"
              >
                <span
                  class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-black px-2.5 py-px text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-base-100 sm:text-[0.7rem]"
                >
                  Kind
                </span>
                <span
                  class="block min-w-0 truncate text-[clamp(0.95rem,2vw,1.45rem)] font-semibold leading-tight tracking-tight"
                >
                  {{ title }}
                </span>
              </div>
            </div>

            <div class="relative h-full min-w-0 flex-1">
              <smart-icons class="h-full w-full min-w-0" />
            </div>
          </div>
        </template>

        <template v-else>
          <div
            class="flex min-w-0 flex-1 flex-col items-start justify-center gap-1"
          >
            <span
              class="block w-full truncate text-lg font-extrabold leading-tight tracking-tight md:text-2xl lg:text-3xl xl:text-4xl"
            >
              <span
                class="bg-linear-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
              >
                {{ displayTitle }}
              </span>
            </span>

            <span
              v-if="showSubtitle"
              class="block min-w-0 w-full truncate text-sm font-medium italic leading-snug text-base-content/90 md:text-lg lg:text-xl xl:text-2xl"
            >
              {{ subtitle }}
            </span>
          </div>

          <div
            class="flex h-full shrink-0 items-center justify-end overflow-hidden"
            :style="utilityColumnStyle"
          >
            <div
              class="flex h-full w-full items-center justify-end xl:justify-center"
            >
              <div
                class="grid h-full w-full grid-cols-4 place-items-center gap-1 p-0"
              >
                <div class="flex h-full w-full items-center justify-center">
                  <div class="aspect-square h-[78%] w-auto max-h-full">
                    <login-icon class="h-full w-full text-primary" />
                  </div>
                </div>

                <div class="flex h-full w-full items-center justify-center">
                  <div class="aspect-square h-[78%] w-auto max-h-full">
                    <jellybean-icon class="h-full w-full text-secondary" />
                  </div>
                </div>

                <div class="flex h-full w-full items-center justify-center">
                  <div class="aspect-square h-[78%] w-auto max-h-full">
                    <theme-icon class="h-full w-full text-accent" />
                  </div>
                </div>

                <div class="flex h-full w-full items-center justify-center">
                  <div class="aspect-square h-[78%] w-auto max-h-full">
                    <swarm-icon class="h-full w-full text-info" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// /components/navigation/full-header.vue
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
const pageStore = usePageStore()
const userStore = useUserStore()

const headerRoot = ref<HTMLElement | null>(null)
let ro: ResizeObserver | null = null

const page = computed(() => pageStore.page)
const title = computed(() => pageStore.page?.title || '')
const viewportSize = computed(() => displayStore.viewportSize)
const headerState = computed(() => displayStore.headerState)

const isCompactHeader = computed(() => headerState.value === 'compact')
const isOpenHeader = computed(() => headerState.value === 'open')

const leftPriority = computed(
  () => displayStore.leftSidebarModeLabel === 'priority',
)
const rightPriority = computed(
  () => displayStore.rightSidebarModeLabel === 'priority',
)
const hasPrioritySidebar = computed(
  () => leftPriority.value || rightPriority.value,
)

const subtitle = computed(() => page.value?.subtitle || '')
const showSubtitle = computed(() => isOpenHeader.value && !!subtitle.value)

const displayTitle = computed(() => {
  if (isCompactHeader.value) return `Kind ${page.value?.title || ''}`.trim()
  return 'Kind Robots'
})

const hasHeaderContent = computed(() => headerState.value !== 'hidden')
const showViewportBadge = computed(() => userStore.user?.Role === 'ADMIN')

const avatarColumnStyle = computed<CSSProperties>(() => {
  if (isCompactHeader.value && hasPrioritySidebar.value) {
    return {
      flexBasis: '12%',
      maxWidth: '18%',
    }
  }

  if (isCompactHeader.value) {
    return {
      flexBasis: '14%',
      maxWidth: '22%',
    }
  }

  if (hasPrioritySidebar.value) {
    return {
      flexBasis: '12%',
      maxWidth: '18%',
    }
  }

  return {
    flexBasis: '15%',
    maxWidth: '24%',
  }
})

const utilityColumnStyle = computed<CSSProperties>(() => {
  if (hasPrioritySidebar.value) {
    return {
      flexBasis: '24%',
      maxWidth: '24%',
    }
  }

  return {
    flexBasis: '30%',
    maxWidth: '32%',
  }
})

const avatarToggleTitle = computed(() => {
  if (headerState.value === 'open') return 'Compact header'
  return 'Open header'
})

const headerKey = computed(() => {
  return [
    headerState.value,
    viewportSize.value,
    displayStore.sidebarLeftState,
    displayStore.sidebarRightState,
    displayStore.leftSidebarModeLabel,
    displayStore.rightSidebarModeLabel,
  ].join('-')
})

function fireHeaderResized() {
  window.dispatchEvent(new CustomEvent('kr:header-resized'))
}

function attachObserver() {
  if (!headerRoot.value) return

  ro = new ResizeObserver(() => {
    fireHeaderResized()
  })

  ro.observe(headerRoot.value)
}

function detachObserver() {
  if (!ro) return
  ro.disconnect()
  ro = null
}

onMounted(() => {
  attachObserver()
  nextTick(fireHeaderResized)
})

onBeforeUnmount(() => {
  detachObserver()
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
