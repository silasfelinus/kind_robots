<!-- /components/navigation/workspace-header.vue -->
<template>
  <header
    class="relative z-30 mb-2 shrink-0 overflow-visible rounded-2xl border border-base-300/70 bg-base-100/95 shadow-sm backdrop-blur"
  >
    <fx-region region="header" />

    <div
      class="flex min-h-12 min-w-0 items-center gap-1.5 px-1.5 py-1.5 sm:gap-2 sm:px-2 xl:min-h-16 xl:gap-3 xl:px-3"
    >
      <button
        v-if="showBackButton"
        type="button"
        class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300 bg-base-100"
        aria-label="Go back"
        title="Go back"
        @click="goBack"
      >
        <Icon name="kind-icon:arrow-left" class="h-5 w-5" />
      </button>

      <!-- Channel picker and tab strip share one bordered shell so they read as
           a single control. Silas: "We are using the title section as a title
           section, when it really should be a tab selector for the current
           channel ... integrating together so it looks more seamless and the
           channel selector doesn't drop awkwardly below the current tab
           title." Nothing is lost by dropping the old title: the active tab's
           own label WAS the title, and it is now something you can act on. -->
      <!-- NO `overflow-hidden` on this shell, however much it wants it for the
           seamless rounded join. channel-select's daisyUI dropdown menu is
           absolutely positioned INSIDE here and is ~318px tall; this shell is
           40px. Clipping it removed the channel list entirely — painted away
           and un-hittable, so elementFromPoint at a menu row returned the page
           <h1> behind it. Silas, 2026-08-04: "I can't actually select the
           channel option anymore." The children round their own outer corners
           instead. -->
      <div
        class="flex h-10 min-h-10 min-w-0 flex-1 items-stretch rounded-xl border border-base-300 bg-base-100 shadow-sm sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14"
      >
        <channel-select seamless class="shrink-0" />

        <!-- This child may clip its own scrolling tabs. The shared shell above
             must remain overflow-visible so the channel dropdown can escape. -->
        <div
          v-if="resolvedTabs.length"
          ref="tabViewport"
          class="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-r-xl border-l border-base-300"
        >
          <button
            v-if="hasTabOverflow"
            type="button"
            class="tab-scroll-button flex w-8 shrink-0 items-center justify-center border-r border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:w-9 xl:w-10"
            :class="canScrollTabsLeft ? '' : 'invisible pointer-events-none'"
            :disabled="!canScrollTabsLeft"
            :aria-hidden="!canScrollTabsLeft"
            :tabindex="canScrollTabsLeft ? 0 : -1"
            aria-label="Show previous channel tabs"
            title="Show previous channel tabs"
            aria-controls="channel-tab-strip"
            @click="scrollTabs(-1)"
          >
            <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
          </button>

          <nav
            id="channel-tab-strip"
            ref="tabStrip"
            class="tab-strip flex min-w-0 flex-1 snap-x snap-mandatory items-stretch gap-1 overflow-x-auto px-1.5 sm:gap-1.5"
            aria-label="Channel tabs"
            @scroll.passive="updateTabScrollState"
          >
            <button
              v-for="(tab, index) in resolvedTabs"
              :key="tab.tabKey"
              type="button"
              class="tab-button relative my-1 flex min-w-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-black transition xl:text-sm"
              :class="
                tab.tabKey === activeTabKey
                  ? 'border-primary bg-primary text-primary-content shadow-sm'
                  : 'border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/30 hover:bg-base-200 hover:text-base-content'
              "
              :data-tab-index="index"
              :style="{ flexBasis: tabButtonBasis }"
              :aria-current="tab.tabKey === activeTabKey ? 'page' : undefined"
              :title="tab.tooltip || tab.title || tab.label"
              @click="goToTab(tab)"
            >
              <Icon
                :name="tab.icon || fallbackIcon"
                class="h-3.5 w-3.5 shrink-0 xl:h-4 xl:w-4"
              />
              <span class="min-w-0 truncate text-center">{{ tab.label }}</span>
            </button>
          </nav>

          <button
            v-if="hasTabOverflow"
            type="button"
            class="tab-scroll-button flex w-8 shrink-0 items-center justify-center border-l border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:w-9 xl:w-10"
            :class="canScrollTabsRight ? '' : 'invisible pointer-events-none'"
            :disabled="!canScrollTabsRight"
            :aria-hidden="!canScrollTabsRight"
            :tabindex="canScrollTabsRight ? 0 : -1"
            aria-label="Show next channel tabs"
            title="Show next channel tabs"
            aria-controls="channel-tab-strip"
            @click="scrollTabs(1)"
          >
            <Icon name="kind-icon:chevron-right" class="h-4 w-4" />
          </button>
        </div>

        <!-- No tabs resolved (a bare route, or content still loading): fall
             back to naming the page rather than rendering an empty bar. -->
        <div
          v-else
          class="flex min-w-0 flex-1 items-center gap-2 border-l border-base-300 px-2"
        >
          <Icon
            :name="activeTabConfig.icon || fallbackIcon"
            class="h-4 w-4 shrink-0 text-primary/70"
          />
          <span class="min-w-0 truncate text-sm font-black xl:text-base">
            {{ activeTitle }}
          </span>
        </div>
      </div>

      <section
        class="header-control-strip flex shrink-0 items-center gap-1 sm:gap-1.5"
      >
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square hidden shrink-0 rounded-xl border border-base-300 bg-base-100 sm:inline-flex"
          aria-label="Refresh with launch animation"
          title="Refresh with launch animation"
          @click="requestFullStartupReload"
        >
          <Icon name="kind-icon:refresh" class="h-5 w-5" />
        </button>

        <!-- Stays on phones: switching server is an action, not a readout, and
             hiding the three below already buys the title enough room. Note it
             could not be hidden with a `hidden sm:flex` class anyway -- its own
             root carries the `inline-flex` UTILITY, which competes with
             `hidden` on equal specificity and wins on stylesheet order. The
             refresh button above hides correctly because daisyUI's `.btn` is a
             component class, which utilities outrank. Wrap in a container if
             this ever does need hiding. -->
        <server-selector class="header-control-item min-w-0" />
        <maturity-toggle
          v-if="showDashboardMaturityToggle && userStore.isLoggedIn"
        />
        <notification-bell class="shrink-0" />
        <login-switcher class="header-control-item min-w-0" />
        <!-- Readouts, not actions, so hiding them on a phone costs no
             capability. Everything else in this row is shrink-0, which makes
             the title section the only thing that can give -- and at 390px it
             gave all the way down to 18px, rendering the page title as a
             meaningless image sliver while these still overflowed the right
             edge as a clipped "395...". Both values remain on the profile. -->
        <karma-widget class="hidden shrink-0 sm:flex" />
        <mana-widget class="hidden shrink-0 sm:flex" />
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ResolvedTab } from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useMaturityPreferenceStore } from '@/stores/maturityPreferenceStore'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'
import { requestFullStartupReload } from '@/utils/startupLaunch'
import { tabRouteTarget } from '@/utils/tabNavigation'

const fallbackIcon = 'kind-icon:sparkles'

const channelContentStore = useChannelContentStore()
const maturityPreferenceStore = useMaturityPreferenceStore()
const navStore = useNavStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const tabViewport = ref<HTMLElement | null>(null)
const tabStrip = ref<HTMLElement | null>(null)
const visibleTabCount = ref(1)
const tabGapPx = ref(4)
const canScrollTabsLeft = ref(false)
const canScrollTabsRight = ref(false)
let tabViewportResizeObserver: ResizeObserver | null = null
let observedTabViewport: HTMLElement | null = null

await channelContentStore.initialize()

const showDashboardMaturityToggle = computed(
  () => maturityPreferenceStore.showDashboardMaturityToggle,
)

const requestedTabKey = computed(() => {
  return typeof route.query.tab === 'string' ? route.query.tab.trim() : ''
})

const resolvedChannel = computed(() => pageStore.resolvedChannel)
const resolvedTabs = computed(() => resolvedChannel.value?.tabs ?? [])
const hasTabOverflow = computed(
  () => resolvedTabs.value.length > visibleTabCount.value,
)
const tabButtonBasis = computed(() => {
  const count = Math.max(1, visibleTabCount.value)
  const gapShare = (tabGapPx.value * (count - 1)) / count

  return `calc(${100 / count}% - ${gapShare}px)`
})

// The room label this fed ("CREATIVE WORLDS") sat above the page title in the
// old title section. The channel name in channel-select says the same thing one
// control to the left, so the tab strip that replaced it does not repeat it.

const shellSummary = computed(
  () => pageStore.subtitle || pageStore.description || '',
)

const showBackButton = computed(() => navStore.canGoBack)

const activeTabKey = computed(() => {
  const channel = resolvedChannel.value
  if (!channel) return ''

  if (
    requestedTabKey.value &&
    channel.tabs.some((tab) => tab.tabKey === requestedTabKey.value)
  ) {
    return requestedTabKey.value
  }

  if (
    pageStore.resolvedTab &&
    pageStore.resolvedTab.channelKey === channel.channelKey
  ) {
    return pageStore.resolvedTab.tabKey
  }

  const stored = channelContentStore.getActiveTab(channel.channelKey)
  if (stored && channel.tabs.some((tab) => tab.tabKey === stored)) return stored

  return channel.defaultTab || channel.tabs[0]?.tabKey || ''
})

const fallbackTab: ResolvedTab = {
  key: 'overview',
  channelKey: 'home',
  tabKey: 'overview',
  dashboardKey: '',
  dashboardTab: '',
  label: pageStore.title || 'Overview',
  title: pageStore.title || 'Overview',
  room: pageStore.room || 'Kind Robots',
  subtitle: shellSummary.value,
  description: shellSummary.value,
  summary: shellSummary.value,
  narrative: shellSummary.value || pageStore.title || 'Overview',
  tooltip: pageStore.tooltip,
  icon: fallbackIcon,
  image: pageStore.image || '',
  route: pageStore.currentPage?.path || '/',
  component: '',
  modelType: '',
  sort: 0,
  cards: null,
  tutorial: null,
  requiredBeforeNext: [],
  requiredRole: '',
  requiredPermission: '',
  loadingMessage: pageStore.loadingMessage || 'Loading…',
  refreshLabel: pageStore.refreshLabel || 'Refresh',
  dottiTip: pageStore.dottiTip,
  amiTip: pageStore.amiTip,
}

const activeTabConfig = computed<ResolvedTab>(() => {
  return (
    resolvedTabs.value.find((tab) => tab.tabKey === activeTabKey.value) ??
    resolvedTabs.value[0] ??
    fallbackTab
  )
})

const activeTitle = computed(
  () =>
    activeTabConfig.value.title ||
    activeTabConfig.value.label ||
    pageStore.title,
)

function tabLayoutMetrics(): {
  minimumTabWidth: number
  gap: number
  arrowWidth: number
} {
  const viewportWidth = window.innerWidth

  if (viewportWidth >= 1280) {
    return { minimumTabWidth: 128, gap: 6, arrowWidth: 40 }
  }

  if (viewportWidth >= 640) {
    return { minimumTabWidth: 112, gap: 6, arrowWidth: 36 }
  }

  return { minimumTabWidth: 96, gap: 4, arrowWidth: 32 }
}

function tabCapacity(
  viewportWidth: number,
  reserveArrows: boolean,
  metrics: ReturnType<typeof tabLayoutMetrics>,
): number {
  const { minimumTabWidth, gap, arrowWidth } = metrics
  const stripPadding = 12
  const arrowSpace = reserveArrows ? arrowWidth * 2 : 0
  const availableWidth = Math.max(0, viewportWidth - stripPadding - arrowSpace)

  return Math.max(
    1,
    Math.floor((availableWidth + gap) / (minimumTabWidth + gap)),
  )
}

function updateVisibleTabCount(): boolean {
  const viewport = tabViewport.value
  const tabCount = resolvedTabs.value.length

  if (!viewport || tabCount === 0) {
    const changed = visibleTabCount.value !== 1
    visibleTabCount.value = 1
    return changed
  }

  const metrics = tabLayoutMetrics()
  const allTabsFit =
    tabCapacity(viewport.clientWidth, false, metrics) >= tabCount
  const nextCount = allTabsFit
    ? tabCount
    : Math.min(tabCount, tabCapacity(viewport.clientWidth, true, metrics))
  const changed = visibleTabCount.value !== nextCount

  tabGapPx.value = metrics.gap
  visibleTabCount.value = nextCount
  return changed
}

function tabButtons(): HTMLElement[] {
  return Array.from(
    tabStrip.value?.querySelectorAll<HTMLElement>('[data-tab-index]') ?? [],
  )
}

function tabOffset(button: HTMLElement, firstButton: HTMLElement): number {
  return button.offsetLeft - firstButton.offsetLeft
}

function currentTabStartIndex(): number {
  const strip = tabStrip.value
  const buttons = tabButtons()
  const firstButton = buttons[0]

  if (!strip || !firstButton) return 0

  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  buttons.forEach((button, index) => {
    const distance = Math.abs(
      tabOffset(button, firstButton) - strip.scrollLeft,
    )

    if (distance < closestDistance) {
      closestIndex = index
      closestDistance = distance
    }
  })

  return closestIndex
}

function scrollToTabIndex(
  requestedIndex: number,
  behavior: ScrollBehavior,
): void {
  const strip = tabStrip.value
  const buttons = tabButtons()
  const firstButton = buttons[0]

  if (!strip || !firstButton) return

  const maxStart = Math.max(0, buttons.length - visibleTabCount.value)
  const index = Math.min(Math.max(requestedIndex, 0), maxStart)
  const button = buttons[index]

  if (!button) return

  strip.scrollTo({
    left: tabOffset(button, firstButton),
    behavior,
  })
}

function ensureActiveTabVisible(behavior: ScrollBehavior): void {
  const activeIndex = resolvedTabs.value.findIndex(
    (tab) => tab.tabKey === activeTabKey.value,
  )

  if (activeIndex < 0) {
    scrollToTabIndex(0, behavior)
    return
  }

  const currentStart = currentTabStartIndex()
  const currentEnd = currentStart + visibleTabCount.value - 1

  if (activeIndex < currentStart) {
    scrollToTabIndex(activeIndex, behavior)
    return
  }

  if (activeIndex > currentEnd) {
    scrollToTabIndex(activeIndex - visibleTabCount.value + 1, behavior)
    return
  }

  scrollToTabIndex(currentStart, behavior)
}

function updateTabScrollState(): void {
  const strip = tabStrip.value
  if (!strip || !hasTabOverflow.value) {
    canScrollTabsLeft.value = false
    canScrollTabsRight.value = false
    return
  }

  const tolerance = 2
  const maxScrollLeft = strip.scrollWidth - strip.clientWidth
  canScrollTabsLeft.value = strip.scrollLeft > tolerance
  canScrollTabsRight.value = strip.scrollLeft < maxScrollLeft - tolerance
}

function observeTabViewport(): void {
  const viewport = tabViewport.value
  if (viewport === observedTabViewport) return

  tabViewportResizeObserver?.disconnect()
  tabViewportResizeObserver = null
  observedTabViewport = viewport

  if (!viewport || typeof ResizeObserver === 'undefined') return

  tabViewportResizeObserver = new ResizeObserver(() => {
    void syncTabStrip('auto')
  })
  tabViewportResizeObserver.observe(viewport)
}

async function syncTabStrip(
  behavior: ScrollBehavior = 'smooth',
): Promise<void> {
  await nextTick()
  observeTabViewport()

  if (updateVisibleTabCount()) {
    await nextTick()
  }

  ensureActiveTabVisible(behavior)

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(updateTabScrollState)
  } else {
    updateTabScrollState()
  }
}

function scrollTabs(direction: -1 | 1): void {
  const currentStart = currentTabStartIndex()
  scrollToTabIndex(
    currentStart + direction * visibleTabCount.value,
    'smooth',
  )
}

/**
 * Navigates the tab strip. Routes through the shared tabRouteTarget so this
 * agrees with channel-select's dropdown, which reaches the same tabs — several
 * tabs in a channel can share one route and are disambiguated by `?tab=`, and
 * a second hand-rolled copy of that rule would drift.
 */
function goToTab(tab: ResolvedTab): void {
  const channel = resolvedChannel.value
  if (!channel) return

  const target = tabRouteTarget(channel, tab)
  if (!target) return

  // Already here — pushing again would add a redundant history entry the back
  // button then has to be pressed twice to escape.
  const sameQuery = (target.query?.tab ?? '') === requestedTabKey.value
  if (route.path === target.path && sameQuery) return

  void router.push(target)
}

watch(
  () => ({
    channelKey: resolvedChannel.value?.channelKey || '',
    tabKey: activeTabKey.value,
    path: route.path,
    queryTab: requestedTabKey.value,
  }),
  ({ channelKey, tabKey }) => {
    if (!channelKey || !tabKey) return
    channelContentStore.setActiveTab(channelKey, tabKey)
  },
  { immediate: true },
)

watch(
  () =>
    `${resolvedTabs.value.map((tab) => tab.tabKey).join('|')}::${activeTabKey.value}`,
  () => {
    if (!import.meta.client) return
    void syncTabStrip('smooth')
  },
)

onMounted(() => {
  maturityPreferenceStore.initialize()
  void syncTabStrip('auto')
})

onBeforeUnmount(() => {
  tabViewportResizeObserver?.disconnect()
  tabViewportResizeObserver = null
  observedTabViewport = null
})

function goBack(): void {
  const path = navStore.backPath

  if (path) {
    void router.push(path)
    return
  }

  router.back()
}
</script>

<style scoped>
.header-control-strip :deep(.btn),
.header-control-item :deep(.btn) {
  min-height: 2.25rem;
  height: 2.25rem;
  min-width: 2.25rem;
  width: 2.25rem;
  padding-left: 0;
  padding-right: 0;
  gap: 0;
}

.header-control-strip :deep(.btn .control-label),
.header-control-strip :deep(.btn > .badge),
.header-control-item :deep(.btn .control-label),
.header-control-item :deep(.btn > .badge) {
  display: none;
}

.header-control-strip :deep(.mana-icon),
.header-control-strip :deep(.iconify),
.header-control-strip :deep(svg),
.header-control-item :deep(.mana-icon),
.header-control-item :deep(.iconify),
.header-control-item :deep(svg) {
  display: inline-flex;
  flex-shrink: 0;
}

.header-control-strip :deep(.login-switcher),
.header-control-item :deep(.login-switcher) {
  width: 100%;
  justify-self: center;
}

.header-control-strip :deep(.login-switcher-avatar),
.header-control-item :deep(.login-switcher-avatar) {
  width: 2.25rem;
  min-width: 2.25rem;
  height: 2.25rem;
  min-height: 2.25rem;
  aspect-ratio: 1 / 1;
  border-radius: 9999px;
  padding-left: 0;
  padding-right: 0;
}

.header-control-strip :deep(.mana-widget .btn),
.header-control-strip :deep(.karma-widget .btn) {
  width: auto;
  min-width: 2.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  gap: 0.25rem;
}

.tab-strip {
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-padding-inline: 0.375rem;
  overscroll-behavior-inline: contain;
}

.tab-button {
  flex-grow: 0;
  flex-shrink: 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.tab-strip::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

@media (min-width: 1280px) {
  .header-control-strip :deep(.btn),
  .header-control-item :deep(.btn) {
    min-height: 2.75rem;
    height: 2.75rem;
    min-width: 2.75rem;
    width: 2.75rem;
  }

  .header-control-strip :deep(.mana-widget .btn),
  .header-control-strip :deep(.karma-widget .btn) {
    width: auto;
    min-width: 2.75rem;
    padding-left: 0.625rem;
    padding-right: 0.625rem;
  }

  .header-control-strip :deep(.login-switcher-avatar),
  .header-control-item :deep(.login-switcher-avatar) {
    width: 2.75rem;
    min-width: 2.75rem;
    height: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
