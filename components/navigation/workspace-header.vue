<template>
  <header
    role="banner"
    class="kr-system-bar relative z-30 mb-2 shrink-0 overflow-visible rounded-2xl border border-(--kr-surface-border) bg-(--kr-surface-raised) shadow-sm backdrop-blur"
  >
    <fx-region region="header" />

    <div
      class="flex min-h-12 min-w-0 flex-wrap items-center gap-1.5 px-1.5 py-1.5 sm:gap-2 sm:px-2 xl:min-h-16 xl:gap-3 xl:px-3"
    >
      <NuxtLink
        to="/"
        class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300 xl:size-12"
        :class="
          route.path === '/'
            ? 'border-primary bg-primary/15 text-primary'
            : 'bg-base-100'
        "
        :aria-current="route.path === '/' ? 'page' : undefined"
        aria-label="Home"
        title="Home"
      >
        <Icon name="kind-icon:home" class="kr-icon-5 xl:size-6" />
      </NuxtLink>
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
        class="kr-btn-ghost-outline btn-square shrink-0"
        aria-label="Go back"
        title="Go back"
        @click="goBack"
      >
        <Icon name="kind-icon:arrow-left" class="kr-icon-5 xl:size-6" />
      </button>

      <div
        class="flex h-10 min-h-10 min-w-0 flex-1 items-stretch rounded-xl border border-base-300 bg-base-100 shadow-sm sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14 xl:max-w-[min(27rem,35vw)] xl:flex-none"
      >
        <channel-select
          seamless
          unified-mobile
          class="nav-launcher-phone min-w-0 flex-1 sm:hidden"
        />
        <channel-select
          seamless
          class="nav-launcher-desktop hidden min-w-0 sm:block"
        />
      </div>

      <!-- The page bar's teleport target must stay mounted even while hidden.
           Keep the HUD in its own row until 2xl, where there is room for
           the channel picker and all utility controls. A bar that opts in
           with `inline-landscape` joins the icon row in any landscape screen
           (Silas, 2026-11-24 PT: "a container single header with the same
           row as the nav and icons unless we are portrait"). -->
      <div
        v-show="hasPageBar"
        data-kr-page-row
        class="order-last flex min-w-0 basis-full items-center border-t border-base-300 pt-1.5 2xl:contents"
        :class="{ 'landscape:contents': navStore.pageBarInlineLandscape }"
      >
        <div
          id="kr-header-page-bar"
          class="@container flex min-w-0 flex-1 items-center"
        />
      </div>

      <account-hub class="header-account shrink-0 xl:ml-auto" />

      <!--
        ARTJOB QUEUE, ADMINS ONLY. Silas, 2026-09-08: "if the user is an admin
        (me) I want an artjob queue button as well, next to the others."

        v-if rather than a disabled state: a control that only Silas can use is
        noise in everyone else's header, and /artjob already refuses non-admins
        (content/artjob.md carries `requiredRole: ADMIN`, so this is a shortcut
        to a gated page, not the gate itself -- never treat a hidden button as
        access control).

        userStore.isAdmin and account-hub.vue's own `v-if="userStore.isLoggedIn"`
        rows derive from the same user state, so this cluster already renders
        conditionally on who is signed in and adding another such branch changes
        nothing about the header's hydration behaviour.

        Silas, 2026-10-06: badge it with pending + running + failed, and give it
        a process icon.
      -->
      <NuxtLink
        v-if="userStore.isAdmin"
        to="/artjob"
        class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300 xl:size-12"
        :class="
          artjobActive
            ? 'border-primary bg-primary/15 text-primary'
            : 'bg-base-100'
        "
        :aria-current="artjobActive ? 'page' : undefined"
        :aria-label="artjobLabel"
        :title="artjobLabel"
      >
        <span class="indicator">
          <Icon name="kind-icon:art-queue" class="kr-icon-5 xl:size-6" />
          <span
            v-if="artJobStore.activeJobCount"
            class="kr-badge-secondary-xs indicator-item whitespace-nowrap tabular-nums"
            aria-hidden="true"
          >
            {{ artjobBadge }}
          </span>
        </span>
      </NuxtLink>

      <SlimeCityQuickSettings v-if="slimeCityVsPage" header />
      <NuxtLink
        v-else-if="
          route.path !== '/play/slime-city-pvp' &&
          slimePvpStore.pendingTurns > 0
        "
        to="/play/slime-city?vs=1"
        class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300 bg-base-100 xl:size-12"
        :aria-label="slimeCityLabel"
        :title="slimeCityLabel"
        data-testid="header-slime-city"
        @click="openSlimeCityVs"
      >
        <span class="indicator">
          <Icon name="kind-icon:cat" class="kr-icon-5 xl:size-6" />
          <span
            class="kr-badge-secondary-xs indicator-item whitespace-nowrap tabular-nums"
            aria-hidden="true"
            data-testid="header-slime-city-turns"
          >
            {{
              slimePvpStore.pendingTurns > 99
                ? '99+'
                : slimePvpStore.pendingTurns
            }}
          </span>
        </span>
      </NuxtLink>

      <!-- Workspace help is a single permanent header utility, never a
           second page-caption row. -->
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square shrink-0 rounded-xl border border-base-300 xl:size-12"
        :class="[
          workspaceSheetOpen
            ? 'border-primary bg-primary/15 text-primary'
            : tutorialUnseen
              ? 'tutorial-unseen border-secondary bg-secondary/15 text-secondary'
              : 'bg-base-100',
        ]"
        :aria-label="workspaceToggleLabel"
        :title="workspaceToggleLabel"
        :aria-expanded="workspaceSheetOpen"
        @click="navStore.toggleWorkspaceSheet()"
      >
        <span class="indicator">
          <Icon name="kind-icon:question" class="kr-icon-5 xl:size-6" />
          <span
            v-if="tutorialUnseen && !workspaceSheetOpen"
            class="indicator-item h-2.5 w-2.5 rounded-full bg-secondary ring-2 ring-base-100"
            aria-hidden="true"
          />
        </span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { ResolvedTab } from '@/stores/helpers/channelContent'
import { useArtJobStore } from '@/stores/artJobStore'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { useNavStore } from '@/stores/navStore'
import { usePageStore } from '@/stores/pageStore'
import { tutorialPageKey, useTutorialStore } from '@/stores/tutorialStore'
import { useUserStore } from '@/stores/userStore'
import { useSlimeCityPvpStore } from '@/stores/slimeCityPvp'
import { useSlimeCityStore } from '@/stores/slimeCity'

const fallbackIcon = 'kind-icon:sparkles'

const channelContentStore = useChannelContentStore()
const navStore = useNavStore()
const pageStore = usePageStore()
const userStore = useUserStore()
const artJobStore = useArtJobStore()
const slimePvpStore = useSlimeCityPvpStore()
const pinia = useNuxtApp().$pinia
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
const routeChannelLocation = computed(
  () =>
    channelContentStore.resolveActiveLocation({ path: route.path }) ??
    (route.path === '/play/slime-city-pvp'
      ? channelContentStore.resolveActiveLocation({ path: '/play/slime-city' })
      : null),
)

const resolvedChannel = computed(
  () => routeChannelLocation.value?.channel ?? pageStore.resolvedChannel,
)
const resolvedTabs = computed(() => resolvedChannel.value?.tabs ?? [])

const shellSummary = computed(
  () => pageStore.subtitle || pageStore.description || '',
)

const showBackButton = computed(() => navStore.canGoBack)

const hasPageBar = computed(() => navStore.hasPageBar)

const workspaceSheetOpen = computed(() => navStore.workspaceSheetOpen)

const tutorialStore = useTutorialStore()

const workspaceToggleLabel = computed(() => {
  if (workspaceSheetOpen.value) return 'Close tutorial'
  return tutorialUnseen.value
    ? 'New here? Open the tutorial for this page'
    : 'Open tutorial'
})

const slimeCityVsPage = computed(
  () =>
    (route.path === '/play/slime-city-pvp' && !slimePvpStore.duel?.board) ||
    ((route.path === '/play/slime-city' ||
      route.path === '/admin/slime-city') &&
      useSlimeCityStore(pinia).view === 'vs'),
)

const slimeCityLabel = computed(
  () => `Slime City: ${slimePvpStore.pendingTurns} games awaiting your turn`,
)

function openSlimeCityVs(event: MouseEvent): void {
  if (
    route.path === '/play/slime-city' &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.button === 0
  ) {
    useSlimeCityStore(pinia).showVs()
  }
}

let slimeCityBadgeTimer: ReturnType<typeof setInterval> | null = null
watch(
  () => (userStore.isLoggedIn ? userStore.userId : null),
  (accountId) => {
    if (slimeCityBadgeTimer) clearInterval(slimeCityBadgeTimer)
    slimeCityBadgeTimer = null
    if (import.meta.client && accountId !== null) {
      void slimePvpStore.loadGames()
      slimeCityBadgeTimer = setInterval(
        () => void slimePvpStore.loadGames(),
        30000,
      )
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  if (slimeCityBadgeTimer) clearInterval(slimeCityBadgeTimer)
})

const artjobActive = computed(() => route.path === '/artjob')

const artjobBadge = computed(() =>
  artJobStore.activeJobCount > 9999
    ? '9999+'
    : String(artJobStore.activeJobCount),
)

const artjobLabel = computed(() => {
  if (!artJobStore.activeJobCount) return 'ArtJob queue'
  const { PENDING, RUNNING, FAILED } = artJobStore.activeJobCounts
  return `ArtJob queue — ${PENDING} pending, ${RUNNING} running, ${FAILED} failed`
})

watch(
  () => userStore.isAdmin,
  (isAdmin) => {
    if (isAdmin) artJobStore.startQueueBadgePolling()
    else artJobStore.stopQueueBadgePolling()
  },
  { immediate: true },
)

onBeforeUnmount(() => artJobStore.stopQueueBadgePolling())

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
    pageStore.describesPath(route.path) &&
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
  navigation: true,
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

const activeTutorialPageKey = computed(() => {
  const tab = activeTabConfig.value
  if (!tab.tutorial?.explicit) return ''
  return tutorialPageKey(tab.channelKey, tab.tabKey)
})

const tutorialUnseen = computed(() =>
  tutorialStore.isPageUnseen(activeTutorialPageKey.value),
)

onMounted(() => tutorialStore.hydrate())

watch(
  () => [workspaceSheetOpen.value, activeTutorialPageKey.value] as const,
  ([open, pageKey]) => {
    if (open && pageKey) tutorialStore.markPageSeen(pageKey)
  },
  { immediate: true },
)

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
.tutorial-unseen {
  animation: tutorial-unseen-pulse 2.4s ease-in-out infinite;
}

@keyframes tutorial-unseen-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0
      color-mix(in oklab, var(--color-secondary) 45%, transparent);
  }
  50% {
    box-shadow: 0 0 0 6px
      color-mix(in oklab, var(--color-secondary) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tutorial-unseen {
    animation: none;
  }
}
</style>
