<!-- /components/navigation/workspace-header.vue -->
<template>
  <header
    class="relative z-30 mb-2 shrink-0 overflow-visible rounded-2xl border border-(--kr-surface-border) bg-(--kr-surface-raised) shadow-sm backdrop-blur"
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
      <!-- channel-select used to carry `shrink-0` here, which pinned it to its
           full unclamped label width (e.g. "Sanctuary") no matter how little
           room the row had left, crushing `#channel-tab-strip` to a
           several-pixel sliver on narrow phones (interface-vision/t-109:
           /about, /cart, /giving, /mermaids, /privacy, /sanctuary, and
           /auth/google, all only on the 390px phone viewport — there was
           always enough room at tablet+). `shrink` (default flex-shrink: 1)
           plus `min-w-0` here, and the matching `w-full min-w-0` replacing
           channel-select's own internal `shrink-0` in channel-select.vue, let
           the picker absorb a shrink deficit and truncate its label instead
           of starving the navigation the row exists for -- but by itself
           this was NOT enough to fix the crush: see the `.tab-strip`
           min-width comment below for why, and the empirical confirmation
           that this half alone still crushed identically. -->
      <div
        class="flex h-10 min-h-10 min-w-0 flex-1 items-stretch rounded-xl border border-base-300 bg-base-100 shadow-sm sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14"
      >
        <channel-select seamless class="min-w-0 shrink" />

        <!-- The horizontal strip owns clipping. This wrapper stays visible so
             the complete-tab menu can escape below the one-row header. -->
        <div
          v-if="resolvedTabs.length"
          ref="tabViewport"
          class="flex min-w-0 flex-1 items-stretch overflow-visible rounded-r-xl border-l border-base-300"
        >
          <!--
            A NARROW WALL, not a button. Silas, 2026-08-10: "Chevrons (< and >
            around the channel tab strip) carry too much padding. Thin them to a
            narrow wall — this is what causes crowding as the window narrows."

            They were w-8/sm:w-9/xl:w-10 around a 16px icon, so up to 24px of
            each 40px was padding, and the pair plus the map button reserved
            120px of a 390px row before a single tab was drawn. 20px is the icon
            plus 2px of breathing room on each side; the full-height hit area
            (h-10 to h-14) keeps it a comfortable target vertically, which is
            the axis a thumb actually has room in on a phone.

            Keep tabLayoutMetrics().chevronWidth in step with these — it is the
            same reservation expressed in pixels, and the tab-count arithmetic
            is wrong the moment the two disagree.
          -->
          <button
            v-if="hasTabOverflow"
            type="button"
            class="tab-scroll-button flex w-5 shrink-0 items-center justify-center border-r border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary xl:w-6"
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
            class="tab-strip flex min-w-0 flex-1 flex-nowrap snap-x snap-mandatory items-stretch gap-1 overflow-x-auto overflow-y-hidden px-1.5 sm:gap-1.5"
            aria-label="Channel tabs"
            @scroll.passive="updateTabScrollState"
          >
            <button
              v-for="(tab, index) in resolvedTabs"
              :key="tab.tabKey"
              type="button"
              class="tab-button relative my-1 flex min-w-0 whitespace-nowrap items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-black transition xl:text-sm"
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
            class="tab-scroll-button flex w-5 shrink-0 items-center justify-center border-l border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary xl:w-6"
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

          <div v-if="hasTabOverflow" class="dropdown dropdown-end shrink-0">
            <button
              tabindex="0"
              type="button"
              class="flex h-full w-8 items-center justify-center rounded-r-xl border-l border-base-300 text-base-content/60 transition hover:bg-base-200 hover:text-base-content focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:w-9 xl:w-10"
              :aria-label="`Show all ${resolvedChannel?.label || 'channel'} tabs`"
              :title="`Show all ${resolvedTabs.length} tabs`"
              aria-haspopup="menu"
            >
              <Icon name="kind-icon:map" class="h-4 w-4" />
            </button>

            <ul
              tabindex="0"
              class="dropdown-content menu absolute right-0 top-full z-120 mt-2 max-h-[min(70vh,28rem)] w-[min(18rem,calc(100vw-1rem))] flex-nowrap overflow-y-auto kr-panel-flat p-2 shadow-2xl"
              :aria-label="`${resolvedChannel?.label || 'Channel'} tabs`"
            >
              <li v-for="tab in resolvedTabs" :key="`all-${tab.tabKey}`">
                <button
                  type="button"
                  class="flex min-h-11 items-center gap-2 rounded-xl"
                  :class="
                    tab.tabKey === activeTabKey
                      ? 'active bg-primary text-primary-content'
                      : ''
                  "
                  :aria-current="
                    tab.tabKey === activeTabKey ? 'page' : undefined
                  "
                  @click="goToTab(tab)"
                >
                  <Icon
                    :name="tab.icon || fallbackIcon"
                    class="h-4 w-4 shrink-0"
                  />
                  <span class="min-w-0 truncate text-sm font-black">
                    {{ tab.label }}
                  </span>
                </button>
              </li>
            </ul>
          </div>
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
        <!--
          The tutorial/workspace toggle is a header utility, not primary
          navigation. It now follows the channel + tab shell so both visual and
          keyboard order read Back → Channel → Tabs → Tutorial → utilities.

          The previous fix correctly moved this button out of app.vue's
          absolute overlay and into the reserved header row, but interpreted
          "inline" as "left-most" and put it ahead of the actual navigation.
          Keeping it here preserves the no-overlap fix without making Tutorial
          the first thing users encounter on every page.
        -->
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300"
          :class="
            workspaceSheetOpen
              ? 'border-primary bg-primary/15 text-primary'
              : 'bg-base-100'
          "
          :aria-label="workspaceToggleLabel"
          :title="workspaceToggleLabel"
          :aria-expanded="workspaceSheetOpen"
          @click="navStore.toggleWorkspaceSheet()"
        >
          <Icon name="kind-icon:question" class="h-5 w-5" />
        </button>

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

        <!--
          WHERE A PAGE PUTS ITS OWN CONTROLS. Filled through
          kr-header-actions.vue, which teleports here from inside <NuxtPage>.

          Silas, 2026-08-10: "Same dead band holds refresh and log out on some
          pages. Fold them into the header row too, so there is no strip between
          header and content." That band was user-manager.vue's opening
          `justify-end` row — a full page-width row whose only contents were
          Refresh and Log Out, spent on /dashboard, /themes and /achievements.

          AFTER login-switcher, not before the global refresh, and that position
          is load-bearing. The first arrangement put this at the head of the
          strip, which landed user-manager's account-refresh immediately beside
          the global startup-reload — two buttons drawing the identical
          `kind-icon:refresh` glyph, side by side, meaning different things.
          There is no second refresh icon in assets/icons to tell them apart
          (`rotate.svg` is the same path data), so separation does the work
          instead: the page actions now sit with the avatar, which is also where
          "refresh my account" and "log out" belong semantically.

          `display: contents` rather than a plain wrapper: an empty flex child
          still earns a gap from its siblings, so a bare <div> would leave a
          visible notch in the control strip on every page that teleports
          nothing. With `contents` the wrapper generates no box at all — the
          teleported buttons become direct flex items of this strip, and an
          empty target costs exactly zero.
        -->
        <div id="kr-header-actions" class="contents" />
        <!-- Readouts, not actions, so hiding them on a phone costs no
             capability. Everything else in this row is shrink-0, which makes
             the title section the only thing that can give -- and at 390px it
             gave all the way down to 18px, rendering the page title as a
             meaningless image sliver while these still overflowed the right
             edge as a clipped "395...". Both values remain on the profile. -->
        <!--
          STACKED AT sm AND md, side by side from lg. Silas, 2026-08-10: "Stack
          the karma and mana readouts (✨3955 / ⚡709, header right) in a COLUMN
          at sm and md."

          Two readouts of four or five digits are ~150px side by side, and sm/md
          is exactly the band where the row is tightest but they are still
          shown: below sm they are hidden outright (see above), and from lg
          there is room for both on one line. Stacking trades horizontal space
          the tab strip is starved of for vertical space the row already had --
          the compact sizing in the scoped block below keeps the pair inside the
          2.25rem the other controls stand at, so the header does not grow.
        -->
        <div
          class="header-readouts hidden shrink-0 flex-col items-stretch gap-0.5 sm:flex lg:flex-row lg:items-center lg:gap-1.5"
        >
          <karma-widget class="shrink-0" />
          <mana-widget class="shrink-0" />
        </div>
      </section>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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

const workspaceSheetOpen = computed(() => navStore.workspaceSheetOpen)

const workspaceToggleLabel = computed(() =>
  workspaceSheetOpen.value ? 'Close workspace' : 'Open workspace',
)

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

/**
 * What the overflow controls actually reserve, per breakpoint.
 *
 * `chevronWidth` and `menuWidth` are separate because the two controls are no
 * longer the same size: the chevrons were thinned to a narrow wall (see the
 * template comment beside them) while the map/all-tabs dropdown kept its width,
 * being a menu trigger rather than a repeat-click scroller. A single
 * `arrowWidth * 3` reserved 120px at xl for what is now 88, and over-reserving
 * here is not harmless — it drops the tab count, which is the crowding this
 * change exists to relieve.
 *
 * Keep these in step with the `w-*` classes on those three buttons.
 */
function tabLayoutMetrics(): {
  minimumTabWidth: number
  gap: number
  chevronWidth: number
  menuWidth: number
} {
  const viewportWidth = window.innerWidth

  if (viewportWidth >= 1280) {
    return { minimumTabWidth: 128, gap: 6, chevronWidth: 24, menuWidth: 40 }
  }

  if (viewportWidth >= 640) {
    return { minimumTabWidth: 112, gap: 6, chevronWidth: 20, menuWidth: 36 }
  }

  return { minimumTabWidth: 96, gap: 4, chevronWidth: 20, menuWidth: 32 }
}

function tabCapacity(
  viewportWidth: number,
  reserveControls: boolean,
  metrics: ReturnType<typeof tabLayoutMetrics>,
): number {
  const { minimumTabWidth, gap, chevronWidth, menuWidth } = metrics
  const stripPadding = 12
  // Two chevrons and one map dropdown — the exact three controls that render
  // together under `hasTabOverflow`.
  const controlSpace = reserveControls ? chevronWidth * 2 + menuWidth : 0
  const availableWidth = Math.max(
    0,
    viewportWidth - stripPadding - controlSpace,
  )

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
    const distance = Math.abs(tabOffset(button, firstButton) - strip.scrollLeft)

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
  scrollToTabIndex(currentStart + direction * visibleTabCount.value, 'smooth')
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

/*
 * PAGE ACTIONS ARE NOT SQUARE. Everything else in this strip is an icon-only
 * control, so the rule above stands every .btn at a 2.25rem square with zero
 * horizontal padding — correct for those, wrong for anything teleported in
 * through kr-header-actions, which carries a label from `sm` up.
 *
 * This has to be said explicitly because CSS matches the DOM, not the component
 * tree: a teleported button really is a descendant of .header-control-strip and
 * really does pick up its `:deep` rules, however far away the component that
 * wrote it lives. The ID selector clears the two-class rule by a wide margin,
 * so ordering is not load-bearing here.
 *
 * Height stays as the strip sets it — page actions should stand exactly as tall
 * as the controls beside them.
 */
.header-control-strip :deep(#kr-header-actions > .btn) {
  width: auto;
  min-width: 2.25rem;
  padding-left: 0.625rem;
  padding-right: 0.625rem;
  gap: 0.25rem;
}

@media (min-width: 1280px) {
  .header-control-strip :deep(#kr-header-actions > .btn) {
    min-width: 2.75rem;
  }
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

/*
 * THE STACKED READOUTS MUST NOT GROW THE ROW.
 *
 * Karma and mana are `.btn`s, and the strip rules above stand every .btn at
 * 2.25rem. Two of those stacked is 4.5rem in a row whose other controls are
 * 2.25rem — the header would grow by half its height at exactly the two
 * breakpoints this stage is trying to give space back at, which is the
 * opposite of the point.
 *
 * 1.125rem each plus the 0.125rem `gap-0.5` is 2.375rem, so the pair stands
 * within a rounding error of everything beside it. The emoji needs its own
 * rule: karma-widget and mana-widget carry `text-lg` (18px) on the glyph
 * span, which alone would set the line box taller than the button.
 *
 * Bounded at max-width 1023.98px to match the `lg:flex-row` on the wrapper —
 * from lg the pair is a row again and wants the ordinary control sizing back.
 * The selectors carry `.karma-widget`/`.mana-widget` to outrank the strip's
 * own two-class rule for the same buttons; equal specificity would leave this
 * decided by source order, which is too fragile to rely on.
 */
@media (max-width: 1023.98px) {
  /*
   * The widget ROOTS, not just their buttons. Each widget is a block <div>
   * wrapping an inline-flex .btn, so the div gets a line box and the line box
   * reserves descender space under the button -- 6px per widget, measured, for
   * a glyph nothing renders. That put the stack at 50px while the buttons
   * inside it were the 18px asked for below. Making the wrapper a flex
   * container removes the line box, so the div hugs the button and the pair
   * comes out at the 2.375rem this block is sized for.
   */
  .header-readouts :deep(.karma-widget),
  .header-readouts :deep(.mana-widget) {
    display: flex;
  }

  .header-readouts :deep(.karma-widget .btn),
  .header-readouts :deep(.mana-widget .btn) {
    height: 1.125rem;
    min-height: 1.125rem;
    width: auto;
    min-width: 0;
    padding: 0 0.375rem;
    font-size: 0.6875rem;
    line-height: 1;
    gap: 0.1875rem;
    border-radius: 0.5rem;
  }

  .header-readouts :deep(.karma-icon),
  .header-readouts :deep(.mana-icon) {
    font-size: 0.8125rem;
    line-height: 1;
  }
}

.tab-strip {
  flex-wrap: nowrap;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-padding-inline: 0.375rem;
  overscroll-behavior-inline: contain;

  /*
   * Follow-up to the interface-vision/t-109 fix above: making channel-select
   * shrinkable was necessary but not sufficient. `overflow-x: auto` makes an
   * item's AUTOMATIC minimum size (the one used when min-width is `auto`)
   * resolve to 0, per the flexbox spec -- so with no min-width set here, the
   * browser never sees the row as overflowing at all: channel-select simply
   * keeps its full content width (flex-grow: 0 means "don't grow past
   * content", not "shrink to make room"), and this strip is handed whatever
   * sliver is left over, same as before that fix. Confirmed empirically: PR
   * #1577 shipped the shrinkable channel-select alone and the responsive
   * audit (kind_robots run 31212650601, this PR's own head) still measured
   * the identical crush -- w=18 on the six sanctuary routes, w=12 on
   * /auth/google -- because shrink/grow never engaged without a real deficit
   * to detect.
   *
   * An EXPLICIT min-width bypasses the automatic-minimum-is-0 rule, so the
   * browser now genuinely detects overflow once channel-select's content
   * plus this floor exceed the row -- at which point channel-select (now
   * shrinkable) is the one that gives ground, per normal shrink-factor
   * distribution. Matches tab-button's own floor below (same three values),
   * since one visible, readable tab is the minimum this strip is for.
   */
  min-width: 6rem; /* 96px */
}

@media (min-width: 640px) {
  .tab-strip {
    min-width: 7rem; /* 112px */
  }
}

@media (min-width: 1280px) {
  .tab-strip {
    min-width: 8rem; /* 128px */
  }
}

.tab-button {
  flex-grow: 0;
  flex-shrink: 0;
  white-space: nowrap;
  scroll-snap-align: start;
  scroll-snap-stop: always;

  /*
   * ENFORCE the minimum width, do not merely calculate with it.
   *
   * tabLayoutMetrics() already knows a tab needs 96/112/128px to be readable,
   * but it only uses that to decide HOW MANY tabs fit; the width each tab
   * actually gets is a percentage from tabButtonBasis. Those two agree only if
   * the strip's clientWidth was measured correctly at the moment the count was
   * computed. When it is measured before the strip is constrained — first
   * paint, an in-flight layout, a resize that has not settled — capacity comes
   * out too high, every tab is declared to fit, and each is handed an equal
   * fraction of a much narrower strip.
   *
   * On a 390px phone that produced FOUR TABS AT 31px WIDE (measured on the
   * deployed app, 2026-08-05: Dashboard / Register / Navigation / Themes). At
   * that size a tab is an icon and a truncated letter — it looks like a
   * rendering fault rather than navigation, which is worse than hiding it,
   * because it tells the user nothing about where they are.
   *
   * Enforcing the floor in CSS makes the layout correct regardless of whether
   * the measurement was right. Tabs that no longer fit overflow into the
   * horizontal scroller this strip already is — snap points, hidden scrollbar
   * and both arrow controls are all present and were always the intended
   * behaviour for overflow. Degrading to "scroll to reach the rest" is
   * strictly better than "every tab is illegible".
   *
   * Keep these three values in step with tabLayoutMetrics(); they are the same
   * numbers expressed in rem.
   */
  min-width: 6rem; /* 96px — tabLayoutMetrics() mobile minimumTabWidth */
}

@media (min-width: 640px) {
  .tab-button {
    min-width: 7rem; /* 112px */
  }
}

@media (min-width: 1280px) {
  .tab-button {
    min-width: 8rem; /* 128px */
  }
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