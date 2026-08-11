<!-- /components/navigation/channel-select.vue -->
<template>
  <div class="dropdown">
    <button
      tabindex="0"
      type="button"
      class="flex h-full min-h-10 w-full min-w-0 items-center gap-2 overflow-hidden px-2 transition-all xl:gap-2.5 xl:px-3"
      :class="
        seamless
          ? 'rounded-l-xl hover:bg-base-200'
          : 'h-10 rounded-xl border border-base-300 bg-base-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14'
      "
      :title="`Navigate ${activeChannel.label}`"
      aria-haspopup="menu"
      @click="scheduleChannelMenuViewportUpdate"
      @focus="scheduleChannelMenuViewportUpdate"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-base-300/70 bg-base-200 sm:h-9 sm:w-9 xl:h-10 xl:w-10"
      >
        <Icon
          :name="activeChannel.icon"
          class="h-4 w-4 shrink-0 xl:h-5 xl:w-5"
        />
      </span>

      <span class="min-w-0 truncate text-sm font-black sm:text-base xl:text-lg">
        {{ activeChannel.label }}
      </span>

      <Icon
        name="kind-icon:chevron-down"
        class="h-3.5 w-3.5 shrink-0 text-base-content/50 xl:h-4 xl:w-4"
      />
    </button>

    <div
      tabindex="0"
      class="dropdown-content z-110 mt-2 kr-anchor-panes"
      @focusin="scheduleChannelMenuViewportUpdate"
    >
      <!--
        SIZED BY ITS OWN CONTENT, not by the tab lists. Silas, 2026-08-11:
        "There is a weird gap with our channel selector, it looks like it's
        always as large as the larger tab listings, but we would have room to
        show the channel and tabs closer to their actual inline with their
        header locations if we didn't make that choice."

        He was reading it exactly right. This was `w-[min(22rem,...)]` — the
        same literal 22rem the tab dropdown uses — so a list of five one-word
        channel names was held open at the width of the longest TAB list on the
        site. Measured on /dashboard at 1440: 352px of menu around 239px of
        content, and the tab flyout consequently started at x=390 when the tab
        control it stands in for sits at x=185 in the header.

        `w-max` lets the four channel rows decide, with a floor so a short list
        does not collapse into a sliver and the old 22rem kept as the cap for
        narrow viewports (where it degrades to the viewport instead). The
        flyout moves left by whatever the rows save, which is the whole of what
        "closer to their header locations" asks for.
      -->
      <ul
        ref="channelMenu"
        class="menu w-max min-w-56 max-w-[min(22rem,calc(100vw-1rem))] flex-nowrap overflow-x-hidden kr-anchor-scroll kr-panel-flat p-2 shadow-2xl"
        :style="{
          maxHeight: `${channelMenuMaxHeight}px`,
          scrollbarGutter: 'stable',
        }"
        @scroll="handleChannelMenuScroll"
      >
        <li
          v-for="channel in visibleChannels"
          :key="channel.channelKey"
          class="channel-menu-item"
          @mouseenter="previewChannelTabs(channel, $event)"
        >
          <div
            class="flex min-h-12 w-full items-stretch overflow-hidden rounded-xl"
            :class="
              activeChannel.channelKey === channel.channelKey
                ? 'bg-primary text-primary-content'
                : 'hover:bg-base-200'
            "
          >
            <button
              type="button"
              class="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
              @click="selectChannel(channel)"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-base-300/50 bg-base-200 text-base-content xl:h-10 xl:w-10"
              >
                <Icon :name="channel.icon" class="h-4 w-4 shrink-0" />
              </span>

              <span
                class="flex min-w-0 flex-1 flex-col items-start leading-tight"
              >
                <span
                  class="max-w-full truncate text-sm font-black xl:text-base"
                >
                  {{ channel.label }}
                </span>
                <span
                  class="max-w-full truncate text-xs font-semibold opacity-65"
                >
                  {{ destinationTab(channel)?.label || channel.title }}
                </span>
              </span>
            </button>

            <button
              v-if="channel.tabs.length > 1"
              type="button"
              class="flex w-10 shrink-0 items-center justify-center border-l border-current/10"
              :aria-label="'Show ' + channel.label + ' tabs'"
              :aria-expanded="expandedChannelKey === channel.channelKey"
              @click.stop="toggleChannel(channel, $event)"
            >
              <Icon
                name="kind-icon:chevron-right"
                class="h-4 w-4 transition-transform"
                :class="
                  expandedChannelKey === channel.channelKey ? 'rotate-90' : ''
                "
              />
            </button>
          </div>

          <!--
            THE BELOW-FALLBACK, AND IT IS INDENTED. Silas, 2026-08-11: the tabs
            go to the right "unless we need the space, in which case there
            still should be an indent."

            `ms-5` plus the accent border is that indent: dropped below its
            channel, a tab list has nothing but position to say which channel it
            belongs to, and position alone reads as a sixth channel.

            THIS PANEL IS ALLOWED TO WIDEN THE MENU, and that is not a
            regression of the sizing fix above. Inline only ever runs where the
            flyout could not fit — under about 582px — and at those widths the
            menu's 14rem of channel names is sitting in a viewport with 350
            spare. Pinning it (a `w-0 min-w-full` trick did exactly that in an
            earlier pass) bought consistency at the price of a 173px-wide tab
            list on a phone, with every summary ellipsised to three words.

            What Silas objected to was the menu being 22rem "always", including
            with nothing expanded. It now costs that width only while an inline
            submenu is actually open, and only where opening one is the only
            option.
          -->
          <div
            v-if="
              submenuMode === 'inline' &&
              expandedChannelKey === channel.channelKey
            "
            class="ms-5 mt-1 rounded-xl border border-base-300/70 border-s-2 border-s-primary/40 bg-base-200/60 p-1"
            :aria-label="channel.label + ' tabs'"
          >
            <ChannelTabList
              :channel="channel"
              :active-channel-key="activeChannel.channelKey"
              :active-tab-key="activeTab?.tabKey || ''"
              :columns="1"
              @select="selectTab(channel, $event)"
            />
          </div>
        </li>
      </ul>

      <div
        v-if="expandedChannel && submenuMode === 'flyout'"
        ref="channelFlyout"
        class="channel-submenu absolute left-full z-120 ml-2 flex-nowrap overflow-x-hidden kr-anchor-scroll kr-panel-flat p-2 shadow-2xl"
        :class="channelFlyoutColumns === 2 ? 'w-[40rem]' : 'w-80'"
        :style="{
          top: `${channelFlyoutTop}px`,
          maxHeight: `${channelFlyoutMaxHeight}px`,
          scrollbarGutter: 'stable',
        }"
        :aria-label="expandedChannel.label + ' tabs'"
      >
        <ChannelTabList
          :channel="expandedChannel"
          :active-channel-key="activeChannel.channelKey"
          :active-tab-key="activeTab?.tabKey || ''"
          :columns="channelFlyoutColumns"
          @select="selectTab(expandedChannel, $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { usePageStore } from '@/stores/pageStore'
import { hasSeparatedAdminTabs } from '@/utils/channelTabGroups'
import { tabSharesRoute } from '@/utils/tabNavigation'

withDefaults(
  defineProps<{
    seamless?: boolean
  }>(),
  { seamless: false },
)

type SubmenuMode = 'flyout' | 'inline'
type FlyoutColumns = 1 | 2

const VIEWPORT_GUTTER = 12
const FLYOUT_GAP = 8
const FLYOUT_GUTTER = 8
const SINGLE_FLYOUT_WIDTH = 320
const SPLIT_FLYOUT_WIDTH = 640

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()
const channelContentStore = useChannelContentStore()
const expandedChannelKey = ref('')
/*
 * Whether the open submenu was opened by hovering rather than by pressing the
 * chevron, so the chevron does not immediately undo the hover.
 *
 * Browsers synthesise mouseenter before click on a tap, so on a touch device
 * wide enough for the flyout the two handlers fought each other: the tap's
 * mouseenter opened the flyout, the tap's own click saw it already open and
 * closed it, and the chevron did nothing at all. Every tablet was in that band
 * once the menu narrowed and the flyout started fitting at 604px.
 */
const expandedByPointer = ref(false)
const channelMenu = ref<HTMLElement | null>(null)
const channelFlyout = ref<HTMLElement | null>(null)
const channelFlyoutTop = ref(0)
const channelMenuMaxHeight = ref(320)
const channelFlyoutMaxHeight = ref(320)
const channelFlyoutColumns = ref<FlyoutColumns>(1)
const submenuMode = ref<SubmenuMode>('inline')

await channelContentStore.initialize()

const visibleChannels = computed(() => channelContentStore.visibleChannels)
const expandedChannel = computed<ResolvedChannel | null>(() => {
  return (
    visibleChannels.value.find(
      (channel) => channel.channelKey === expandedChannelKey.value,
    ) ?? null
  )
})
const requestedTabKey = computed(() => {
  return typeof route.query.tab === 'string' ? route.query.tab.trim() : ''
})

const fallbackChannel: ResolvedChannel = {
  key: 'home',
  channelKey: 'home',
  dashboardKey: 'user',
  label: 'Home',
  title: 'Home',
  room: 'Kind Robots',
  subtitle: '',
  description: '',
  summary: '',
  narrative: '',
  tooltip: '',
  icon: 'kind-icon:home',
  image: '/images/channels/home/channel.webp',
  route: '/',
  defaultTab: 'dashboard',
  sort: 0,
  requiredRole: '',
  requiredPermission: '',
  loadingMessage: 'Loading Home…',
  refreshLabel: 'Refresh Home',
  dottiTip: '',
  amiTip: '',
  tutorial: null,
  tabs: [],
}

const activeChannel = computed<ResolvedChannel>(() => {
  return (
    pageStore.resolvedChannel ?? visibleChannels.value[0] ?? fallbackChannel
  )
})

const activeTab = computed<ResolvedTab | null>(() => {
  const channel = activeChannel.value
  const requested = channel.tabs.find(
    (tab) => tab.tabKey === requestedTabKey.value,
  )
  if (requested) return requested

  if (
    pageStore.resolvedTab &&
    pageStore.resolvedTab.channelKey === channel.channelKey
  ) {
    return pageStore.resolvedTab
  }

  const storedTabKey = channelContentStore.getActiveTab(channel.channelKey)

  return (
    channel.tabs.find((tab) => tab.tabKey === storedTabKey) ??
    channel.tabs.find((tab) => tab.tabKey === channel.defaultTab) ??
    channel.tabs[0] ??
    null
  )
})

function destinationTab(channel: ResolvedChannel): ResolvedTab | null {
  const storedTabKey = channelContentStore.getActiveTab(channel.channelKey)

  return (
    channel.tabs.find((tab) => tab.tabKey === storedTabKey) ??
    channel.tabs.find((tab) => tab.tabKey === channel.defaultTab) ??
    channel.tabs[0] ??
    null
  )
}

function closeChannelTabs(): void {
  expandedChannelKey.value = ''
  expandedByPointer.value = false
  channelFlyoutColumns.value = 1
}

function getViewportBottom(): number {
  if (typeof window === 'undefined') return 640

  const viewport = window.visualViewport
  return viewport ? viewport.offsetTop + viewport.height : window.innerHeight
}

function availableViewportHeight(element: HTMLElement): number {
  const elementTop = element.getBoundingClientRect().top
  return Math.max(
    0,
    Math.floor(getViewportBottom() - elementTop - VIEWPORT_GUTTER),
  )
}

function updateChannelFlyoutViewport(): void {
  const flyout = channelFlyout.value
  if (!flyout) return

  channelFlyoutMaxHeight.value = availableViewportHeight(flyout)
}

function updateChannelMenuViewport(): void {
  const menu = channelMenu.value
  if (!menu) return

  channelMenuMaxHeight.value = availableViewportHeight(menu)

  const channel = expandedChannel.value
  if (submenuMode.value === 'flyout' && channel) {
    channelFlyoutColumns.value = preferredFlyoutColumns(channel)
  }

  updateChannelFlyoutViewport()
}

function scheduleChannelMenuViewportUpdate(): void {
  if (typeof window === 'undefined') return

  void nextTick(() => {
    window.requestAnimationFrame(updateChannelMenuViewport)
  })
}

function handleViewportResize(): void {
  if (
    submenuMode.value === 'flyout' &&
    expandedChannel.value &&
    !canShowFlyoutWidth(SINGLE_FLYOUT_WIDTH)
  ) {
    submenuMode.value = 'inline'
    channelFlyoutColumns.value = 1
  }

  scheduleChannelMenuViewportUpdate()
}

onMounted(() => {
  window.addEventListener('resize', handleViewportResize)
  window.visualViewport?.addEventListener('resize', handleViewportResize)
  window.visualViewport?.addEventListener('scroll', handleViewportResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleViewportResize)
  window.visualViewport?.removeEventListener('resize', handleViewportResize)
  window.visualViewport?.removeEventListener('scroll', handleViewportResize)
})

function canShowFlyoutWidth(width: number): boolean {
  const menu = channelMenu.value
  if (!menu || typeof window === 'undefined') return false

  const menuRect = menu.getBoundingClientRect()
  const flyoutRight = menuRect.right + FLYOUT_GAP + width

  return flyoutRight <= window.innerWidth - FLYOUT_GUTTER
}

function preferredFlyoutColumns(channel: ResolvedChannel): FlyoutColumns {
  return hasSeparatedAdminTabs(channel) &&
    canShowFlyoutWidth(SPLIT_FLYOUT_WIDTH)
    ? 2
    : 1
}

function positionChannelTabs(event: Event): void {
  const menu = channelMenu.value
  const target = (event.currentTarget as HTMLElement | null)?.closest(
    '.channel-menu-item',
  )

  if (!menu || !(target instanceof HTMLElement)) return

  const menuRect = menu.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  channelFlyoutTop.value = Math.max(0, targetRect.top - menuRect.top)

  void nextTick(() => {
    const flyout = channelFlyout.value
    if (!flyout) return

    const maxTop = Math.max(0, menu.clientHeight - flyout.offsetHeight)
    channelFlyoutTop.value = Math.min(channelFlyoutTop.value, maxTop)
    scheduleChannelMenuViewportUpdate()
  })
}

function openChannelTabs(
  channel: ResolvedChannel,
  event: Event,
  allowInline: boolean,
): void {
  if (channel.tabs.length <= 1) {
    closeChannelTabs()
    return
  }

  const nextMode: SubmenuMode = canShowFlyoutWidth(SINGLE_FLYOUT_WIDTH)
    ? 'flyout'
    : 'inline'
  if (nextMode === 'inline' && !allowInline) return

  submenuMode.value = nextMode
  expandedChannelKey.value = channel.channelKey
  expandedByPointer.value = !allowInline
  channelFlyoutColumns.value =
    nextMode === 'flyout' ? preferredFlyoutColumns(channel) : 1

  if (nextMode === 'flyout') {
    positionChannelTabs(event)
  }
}

function previewChannelTabs(channel: ResolvedChannel, event: Event): void {
  openChannelTabs(channel, event, false)
}

function toggleChannel(channel: ResolvedChannel, event: Event): void {
  if (expandedChannelKey.value === channel.channelKey) {
    /*
     * Already open, but only because the pointer passed over the row -- the
     * user has not asked for it yet, so the first press CLAIMS it rather than
     * dismissing it. Without this a tap is a no-op (see expandedByPointer) and
     * a mouse user has to click the chevron twice to make a hover stick.
     */
    if (expandedByPointer.value) {
      expandedByPointer.value = false
      return
    }

    closeChannelTabs()
    return
  }

  openChannelTabs(channel, event, true)
}

function handleChannelMenuScroll(): void {
  if (submenuMode.value === 'flyout') {
    closeChannelTabs()
  }
}

function navigateToTab(channel: ResolvedChannel, tab: ResolvedTab): void {
  if (!tab.route) return

  if (tabSharesRoute(channel, tab)) {
    if (route.path === tab.route && requestedTabKey.value === tab.tabKey) return

    void router.push({
      path: tab.route,
      query: { tab: tab.tabKey },
    })
    return
  }

  if (route.path !== tab.route || requestedTabKey.value) {
    void router.push(tab.route)
  }
}

function selectChannel(channel: ResolvedChannel): void {
  const tab = destinationTab(channel)

  if (tab) {
    selectTab(channel, tab)
    return
  }

  if (channel.route && channel.route !== route.path) {
    void router.push(channel.route)
  }

  closeDropdown()
}

function selectTab(channel: ResolvedChannel, tab: ResolvedTab): void {
  channelContentStore.setActiveTab(channel.channelKey, tab.tabKey)
  navigateToTab(channel, tab)
  closeDropdown()
}

function closeDropdown(): void {
  closeChannelTabs()
  if (typeof document === 'undefined') return

  const element = document.activeElement as HTMLElement | null
  element?.blur()
}
</script>
