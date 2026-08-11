<!-- /components/navigation/workspace-header.vue -->
<!--
  FOUR THINGS. Silas, 2026-08-10:

    "Let's move all the icons in that top bar, except the tutorial toggle and
     login-manager, their options inside the login-manager ... so the new header
     has the channel and tab select (but we need to combine the tab title and
     the tab selector, we don't need two icons, clicking the active tab title
     should get us the dropdown to change tabs). login-manager should be on the
     left, tutorial toggle on far right and that's all that's seen. No lost
     options."

  So: account hub, channel, tab, tutorial. Everything else moved into the hub
  (see account-hub.vue for the inventory) and the horizontal tab strip became a
  dropdown hanging off its own title (see tab-select.vue).

  WHAT THIS DELETES, and why none of it is missed
  ----------------------------------------------
  The strip took a scrolling viewport, two chevron scrollers, a map-icon
  dropdown listing the same tabs again, per-breakpoint capacity arithmetic
  (tabLayoutMetrics/tabCapacity/updateVisibleTabCount), a percentage flex-basis,
  scroll-position state, a ResizeObserver, and a measured control-density rule
  that stacked the utility icons whenever the strip hit its min-width floor.

  Every one of those existed to manage a control whose width was unbounded: a
  strip wants room for N tabs and the row only has room for some. A dropdown
  wants room for ONE label. With the demand bounded the competition disappears,
  and everything built to referee it goes with it -- including the density
  measurement added earlier the same day, which now has no floor to watch.

  Keep that in mind before re-adding a wide control here. The reason this row
  is finally quiet is that nothing in it grows.
-->
<template>
  <header
    class="relative z-30 mb-2 shrink-0 overflow-visible rounded-2xl border border-(--kr-surface-border) bg-(--kr-surface-raised) shadow-sm backdrop-blur"
  >
    <fx-region region="header" />

    <div
      class="flex min-h-12 min-w-0 items-center gap-1.5 px-1.5 py-1.5 sm:gap-2 sm:px-2 xl:min-h-16 xl:gap-3 xl:px-3"
    >
      <!--
        KEPT, though Silas's list of four does not mention it, because it only
        appears when there is somewhere to go back TO (navStore.canGoBack) and
        dropping it would remove in-app history with no replacement on a
        device whose browser chrome is hidden. It is navigation, which is what
        this row is for, rather than one of the utility icons that moved into
        the hub. Easy to remove if it is not wanted -- it is this one element.
      -->
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

      <!-- Channel picker and tab picker share one bordered shell so they read
           as a single control -- the same join the channel/strip pair had, now
           with a second dropdown instead of a scroller on the right of it.

           NO `overflow-hidden` on this shell, however much it wants it for the
           seamless rounded join: both children open absolutely-positioned
           menus that are far taller than this 40px row, and clipping them
           painted the menus away and left them un-hittable. Silas, 2026-08-04:
           "I can't actually select the channel option anymore." The children
           round their own outer corners instead. -->
      <div
        class="flex h-10 min-h-10 min-w-0 flex-1 items-stretch rounded-xl border border-base-300 bg-base-100 shadow-sm sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14"
      >
        <channel-select seamless class="min-w-0 shrink" />

        <div
          v-if="resolvedChannel && resolvedTabs.length"
          class="flex min-w-0 flex-1 items-stretch border-l border-base-300"
        >
          <tab-select
            class="min-w-0 flex-1"
            :channel="resolvedChannel"
            :active-tab-key="activeTabKey"
            @select="goToTab"
          />
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

      <!--
        RIGHT OF THE TAB SELECTOR. Silas, 2026-08-11: "login-manager is to the
        right of the tab selector."

        It shipped on the far left, which put the account before the navigation
        in both reading and tab order. Here it reads Channel -> Tab -> You ->
        Tutorial: where you are, then whose session it is, then help. The panel
        it opens had to flip to right-anchored when it moved here -- see the
        note in account-hub.vue.
      -->
      <account-hub class="header-account shrink-0" />

      <!--
        FAR RIGHT, per Silas, and the last icon standing in this row.

        It is the WORKSPACE toggle -- the workspace sheet is what carries the
        tutorial panel, so this is how you reach the tutorial and reads as the
        tutorial button from outside. Silas moved it out of the left-most slot
        in #1708 ("fix tutorial header order") and now to the end; both moves
        say the same thing, that it is a utility rather than navigation.
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
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ResolvedTab } from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'
import { tabRouteTarget } from '@/utils/tabNavigation'

const fallbackIcon = 'kind-icon:sparkles'

const channelContentStore = useChannelContentStore()
const navStore = useNavStore()
const pageStore = usePageStore()
const router = useRouter()
const route = useRoute()

await channelContentStore.initialize()

const requestedTabKey = computed(() => {
  return typeof route.query.tab === 'string' ? route.query.tab.trim() : ''
})

/**
 * The channel this route belongs to, resolved from the ROUTE rather than from
 * pageStore — because this header renders before the page that fills pageStore.
 *
 * THE BUG THIS FIXES, which presented as something else entirely. The tab list
 * highlighted the wrong tab: on /bots it marked Dreams. Instrumenting the same
 * element showed `isActiveTab` computing FALSE for Dreams and TRUE for Bots
 * while the DOM carried `active` on Dreams — a rendered decision and a class
 * that disagreed, which no single render can produce.
 *
 * It came from the SERVER. app.vue renders this header above <NuxtPage>, so
 * during SSR the header's setup runs BEFORE pages/[...slug].vue calls
 * setPage() — and pageStore, still empty, resolved every route to its default
 * channel. The server therefore emitted the HOME channel's four tabs
 * (dashboard/registration/navigation/themes, Dashboard marked active) on a
 * route whose real channel is Play. Confirmed in the SSR HTML for /bots.
 *
 * Hydration then reused those elements for a thirteen-tab list, patched their
 * text and attributes, and left the server's `active` sitting on the first one
 * — which is why the stale highlight was always position one, and why it
 * looked like a Vue patching anomaly rather than a data problem.
 *
 * `route.path` is available identically on both sides, so resolving from it
 * makes the two renders agree and removes the mismatch rather than papering
 * over its symptom. channelContentStore is awaited in setup above, so the
 * channel data is present when this first evaluates, server included.
 *
 * pageStore stays as the fallback: it carries frontmatter that a path alone
 * cannot express, and routes outside any channel resolve to null here.
 */
const routeChannelLocation = computed(() =>
  channelContentStore.resolveActiveLocation({ path: route.path }),
)

const resolvedChannel = computed(
  () => routeChannelLocation.value?.channel ?? pageStore.resolvedChannel,
)
const resolvedTabs = computed(() => resolvedChannel.value?.tabs ?? [])

// The room label this fed ("CREATIVE WORLDS") sat above the page title in the
// old title section. The channel name in channel-select says the same thing one
// control to the left, so nothing repeats it.

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

  /*
   * The route's own tab, and the second half of the SSR fix above.
   *
   * Resolving the CHANNEL from the route was not enough: this fell straight
   * past the empty pageStore into the stored/default branches, so the server
   * still named the channel's defaultTab — `dreams` for Play — on every Play
   * route. The client then said `bots`, the class mismatched, and hydration
   * kept the server's highlight.
   *
   * Sits below pageStore so frontmatter still wins wherever it has loaded, and
   * above the stored/default fallbacks because those are guesses where this is
   * the actual route. Available identically on both sides, which is the point.
   */
  const routeTabKey = routeChannelLocation.value?.tab?.tabKey
  if (routeTabKey && channel.tabs.some((tab) => tab.tabKey === routeTabKey)) {
    return routeTabKey
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
 * Navigates the tab picker. Routes through the shared tabRouteTarget so this
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
/*
 * The avatar is the one control in this row with a fixed size to defend: it is
 * a circle, and a squashed circle reads as a rendering fault rather than a
 * tight layout. Everything else here either has its own intrinsic size (the
 * two square buttons) or is deliberately shrinkable (the channel/tab shell).
 *
 * This is all that survives of a stylesheet that used to run 300 lines. The
 * rest sized, hid and re-stacked a control strip that no longer exists — see
 * the note at the top of this file for what went and why.
 */
.header-account :deep(.account-hub-avatar) {
  width: 2.25rem;
  min-width: 2.25rem;
  height: 2.25rem;
  min-height: 2.25rem;
  aspect-ratio: 1 / 1;
  border-radius: 9999px;
  padding-left: 0;
  padding-right: 0;
}

@media (min-width: 1280px) {
  .header-account :deep(.account-hub-avatar) {
    width: 2.75rem;
    min-width: 2.75rem;
    height: 2.75rem;
    min-height: 2.75rem;
  }
}
</style>
