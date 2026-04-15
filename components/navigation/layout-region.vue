<!-- /components/navigation/layout-region.vue -->
<template>
  <section :class="rootClasses">
    <div
      class="flex h-full w-full min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100"
    >
      <div
        v-if="props.chrome"
        class="flex items-center justify-between border-b border-base-300 px-3 py-2"
      >
        <div class="flex min-w-0 items-center gap-2">
          <icon :name="resolvedIcon" class="shrink-0" />
          <span class="truncate font-semibold">
            {{ resolvedTitle }}
          </span>
        </div>

        <button
          v-if="props.collapsible && props.region !== 'main'"
          class="btn btn-xs rounded-2xl"
          type="button"
          @click="toggleRegion"
        >
          Toggle
        </button>
      </div>

      <div :class="bodyClasses">
        <slot />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useLayoutStore } from '@/stores/layoutStore'

type DisplayRegionKey = 'header' | 'left' | 'main' | 'right' | 'footer'
type RegionTone =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
type LayoutMode = 'mobile' | 'tablet' | 'desktop'
type DisplayState = 'hidden' | 'compact' | 'extended'

interface DisplayStoreCompat {
  showLeft?: boolean
  showRight?: boolean
  showCenter?: boolean
  showHeader?: boolean
  showFooter?: boolean
  headerState?: DisplayState
  footerState?: DisplayState
  toggleSection?: (section: 'left' | 'right' | 'center') => void
  toggleFooter?: () => void
  toggleHeader?: () => void
}

const props = withDefaults(
  defineProps<{
    region: DisplayRegionKey
    title?: string
    icon?: string
    collapsible?: boolean
    chrome?: boolean
    forceShow?: boolean
    allowOverlay?: boolean
    scroll?: boolean
    padded?: boolean
    tone?: RegionTone
  }>(),
  {
    title: '',
    icon: '',
    collapsible: true,
    chrome: true,
    forceShow: false,
    allowOverlay: true,
    scroll: true,
    padded: true,
    tone: 'neutral',
  },
)

const displayStore = useDisplayStore()
const layoutStore = useLayoutStore()
const display = displayStore as unknown as DisplayStoreCompat

const resolvedLayout = computed<LayoutMode>(() => layoutStore.resolvedLayout)

const regionTitles: Record<DisplayRegionKey, string> = {
  header: 'Header',
  left: 'Left Sidebar',
  main: 'Main Content',
  right: 'Right Sidebar',
  footer: 'Footer',
}

const regionIcons: Record<DisplayRegionKey, string> = {
  header: 'kind-icon:smarttoy',
  left: 'kind-icon:apps',
  main: 'kind-icon:dashboard',
  right: 'kind-icon:settings',
  footer: 'kind-icon:drag_handle',
}

const resolvedTitle = computed(() => props.title || regionTitles[props.region])
const resolvedIcon = computed(() => props.icon || regionIcons[props.region])

const isHeaderVisible = computed(() => {
  if (typeof display.showHeader === 'boolean') return display.showHeader
  if (display.headerState) return display.headerState !== 'hidden'
  return true
})

const isFooterVisible = computed(() => {
  if (typeof display.showFooter === 'boolean') return display.showFooter
  if (display.footerState) return display.footerState !== 'hidden'
  return true
})

const regionVisibleMap = computed<Record<DisplayRegionKey, boolean>>(() => ({
  header: isHeaderVisible.value,
  left: Boolean(display.showLeft ?? true),
  main: Boolean(display.showCenter ?? true),
  right: Boolean(display.showRight ?? true),
  footer: isFooterVisible.value,
}))

const isVisible = computed(() => {
  if (props.forceShow) return true
  return regionVisibleMap.value[props.region]
})

const isHeader = computed(() => props.region === 'header')
const isLeft = computed(() => props.region === 'left')
const isMain = computed(() => props.region === 'main')
const isRight = computed(() => props.region === 'right')
const isFooter = computed(() => props.region === 'footer')

const isMobile = computed(() => resolvedLayout.value === 'mobile')
const isTablet = computed(() => resolvedLayout.value === 'tablet')
const isDesktop = computed(() => resolvedLayout.value === 'desktop')

const useOverlay = computed(() => {
  if (!props.allowOverlay) return false
  return (isLeft.value || isRight.value) && isMobile.value
})

const rootClasses = computed(() => {
  if (!isVisible.value) return 'hidden'

  if (useOverlay.value) {
    return [
      'fixed inset-y-0 z-40 flex flex-col',
      isLeft.value ? 'left-0 w-[88vw] max-w-sm' : '',
      isRight.value ? 'right-0 w-[88vw] max-w-sm' : '',
    ].join(' ')
  }

  if (isHeader.value || isFooter.value) {
    return 'flex w-full shrink-0 flex-col'
  }

  if (isLeft.value) {
    if (isMobile.value) return 'flex w-full flex-col'
    if (isTablet.value) return 'flex w-72 shrink-0 flex-col'
    if (isDesktop.value) return 'flex w-80 shrink-0 flex-col'
  }

  if (isRight.value) {
    if (isMobile.value) return 'flex w-full flex-col'
    if (isTablet.value) return 'flex w-80 shrink-0 flex-col'
    if (isDesktop.value) return 'flex w-96 shrink-0 flex-col'
  }

  return 'flex min-h-0 min-w-0 flex-1 flex-col'
})

const bodyClasses = computed(() => {
  return [
    'flex min-h-0 flex-1 flex-col',
    props.scroll ? 'overflow-auto' : 'overflow-hidden',
    props.padded ? 'p-3 sm:p-4' : '',
  ].join(' ')
})

function toggleRegion() {
  if (isLeft.value) {
    display.toggleSection?.('left')
    return
  }

  if (isRight.value) {
    display.toggleSection?.('right')
    return
  }

  if (isMain.value) {
    display.toggleSection?.('center')
    return
  }

  if (isFooter.value) {
    display.toggleFooter?.()
    return
  }

  if (isHeader.value) {
    display.toggleHeader?.()
  }
}
</script>
