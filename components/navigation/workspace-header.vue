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
          class="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-r-xl border-l border-base-300"
        >
          <button
            v-show="canScrollTabsLeft"
            type="button"
            class="tab-scroll-button flex w-8 shrink-0 items-center justify-center border-r border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:w-9 xl:w-10"
            aria-label="Scroll channel tabs left"
            title="Scroll channel tabs left"
            aria-controls="channel-tab-strip"
            @click="scrollTabs(-1)"
          >
            <Icon name="kind-icon:chevron-left" class="h-4 w-4" />
          </button>

          <nav
            id="channel-tab-strip"
            ref="tabStrip"
            class="tab-strip flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto px-1.5 sm:gap-1.5"
            aria-label="Channel tabs"
            @scroll.passive="updateTabScrollState"
          >
            <button
              v-for="tab in resolvedTabs"
              :key="tab.tabKey"
              type="button"
              class="relative my-1 flex shrink-0 items-center gap-1.5 rounded-lg border px-2 text-xs font-black transition xl:text-sm"
              :class="
                tab.tabKey === activeTabKey
                  ? 'border-primary bg-primary text-primary-content shadow-sm'
                  : 'border-base-300 bg-base-100 text-base-content/70 hover:border-base-content/30 hover:bg-base-200 hover:text-base-content'
              "
              :aria-current="tab.tabKey === activeTabKey ? 'page' : undefined"
              :title="tab.tooltip || tab.title || tab.label"
              @click="goToTab(tab)"
            >
              <Icon
                :name="tab.icon || fallbackIcon"
                class="h-3.5 w-3.5 shrink-0 xl:h-4 xl:w-4"
              />
              <span class="max-w-28 truncate xl:max-w-40">{{ tab.label }}</span>
            </button>
          </nav>

          <button
            v-show="canScrollTabsRight"
            type="button"
            class="tab-scroll-button flex w-8 shrink-0 items-center justify-center border-l border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:w-9 xl:w-10"
            aria-label="Scroll channel tabs right"
            title="Scroll channel tabs right"
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

const tabStrip = ref<HTMLElement | null>(null)
const canScrollTabsLeft = ref(false)
const canScrollTabsRight = ref(false)
let tabStripResizeObserver: ResizeObserver | null = null
let observedTabStrip: HTMLElement | null = null

await channelContentStore.initialize()

const showDashboardMaturityToggle = computed(
  () => maturityPreferenceStore.showDashboardMaturityToggle,
)

const requestedTabKey = computed(() => {
  return typeof route.query.tab === 'string' ? route.query.tab.trim() : ''
})

const resolvedChannel = computed(() => pageStore.resolvedChannel)
const resolvedTabs = computed(() => resolvedChannel.value?.tabs ?? [])

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

function updateTabScrollState(): void {
  const strip = tabStrip.value
  if (!strip) {
    canScrollTabsLeft.value = false
    canScrollTabsRight.value = false
    return
  }

  const tolerance = 2
  const maxScrollLeft = strip.scrollWidth - strip.clientWidth
  canScrollTabsLeft.value = strip.scrollLeft > tolerance
  canScrollTabsRight.value = strip.scrollLeft < maxScrollLeft - tolerance
}

function observeTabStrip(): void {
  const strip = tabStrip.value
  if (strip === observedTabStrip) return

  tabStripResizeObserver?.disconnect()
  tabStripResizeObserver = null
  observedTabStrip = strip

  if (!strip || typeof ResizeObserver === 'undefined') return

  tabStripResizeObserver = new ResizeObserver(updateTabScrollState)
  tabStripResizeObserver.observe(strip)
}

async function syncTabStrip(): Promise<void> {
  await nextTick()
  observeTabStrip()

  const strip = tabStrip.value
  if (!strip) {
    updateTabScrollState()
    return
  }

  strip
    .querySelector<HTMLElement>('[aria-current="page"]')
    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })

  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(updateTabScrollState)
  } else {
    updateTabScrollState()
  }
}

function scrollTabs(direction: -1 | 1): void {
  const strip = tabStrip.value
  if (!strip) return

  strip.scrollBy({
    left: direction * Math.max(strip.clientWidth * 0.75, 160),
    behavior: 'smooth',
  })
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
    void syncTabStrip()
  },
)

onMounted(() => {
  maturityPreferenceStore.initialize()
  void syncTabStrip()
})

onBeforeUnmount(() => {
  tabStripResizeObserver?.disconnect()
  tabStripResizeObserver = null
  observedTabStrip = null
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