<!-- /components/navigation/channel-select.vue -->
<template>
  <div
    ref="dropdownRoot"
    class="dropdown"
    :class="unifiedMobile ? 'w-full min-w-0' : ''"
  >
    <button
      tabindex="0"
      type="button"
      class="flex h-full min-h-10 w-full min-w-0 items-center gap-2 overflow-hidden px-2 transition-all xl:gap-2.5 xl:px-3"
      :class="
        seamless
          ? 'rounded-xl hover:bg-base-200'
          : 'h-10 rounded-xl border border-base-300 bg-base-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14'
      "
      :title="`Navigate workspace — ${currentPageTitle}`"
      :aria-label="`Navigate workspace — ${currentPageTitle}`"
      aria-haspopup="menu"
      @click="openChannelMenu"
      @focus="scheduleChannelMenuViewportUpdate"
    >
      <span
        class="kr-icon-8 flex shrink-0 items-center justify-center rounded-lg border border-base-300/70 bg-base-200 sm:h-9 sm:w-9 xl:h-10 xl:w-10"
      >
        <Icon
          :name="activeTab?.icon || activeChannel.icon"
          class="kr-icon-4 shrink-0 xl:h-5 xl:w-5"
        />
      </span>

      <span class="flex min-w-0 flex-1 flex-col justify-center leading-tight">
        <span class="kr-text-black-sm truncate sm:text-base xl:text-lg">
          <span v-if="isSlimeCityPage" class="slime-nav-title"
            >SLIME <strong>CITY</strong></span
          >
          <template v-else>{{ currentPageTitle }}</template>
        </span>
        <span
          v-if="currentPageSubtitle && !isSlimeCityPage"
          class="truncate text-[0.65rem] text-base-content/60 xl:text-xs"
        >
          {{ currentPageSubtitle }}
        </span>
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
      @keydown.esc="closeDropdown"
    >
      <!--
        PHONE: one flat, grouped list. Nested hover/flyout navigation is useful
        when there is pointer room, but on a phone it turns a simple destination
        change into a tiny chevron hunt. This menu lists each channel heading
        followed by its navigable tabs, using the same ChannelTabList rows as
        the desktop picker. Its width deliberately leaves four rem of viewport
        slack because this control starts to the right of the optional Back
        button; that keeps the menu inside the screen instead of hanging off the
        left or right edge.
      -->
      <div
        v-if="unifiedMobile"
        ref="channelMenu"
        class="left-0 w-[min(20rem,calc(100vw-4rem))] max-w-[calc(100vw-4rem)] overflow-x-hidden kr-anchor-scroll kr-panel-flat p-2 shadow-2xl"
        :style="{
          maxHeight: `${channelMenuMaxHeight}px`,
          scrollbarGutter: 'stable',
        }"
      >
        <section
          class="mb-2 rounded-xl border border-primary/25 bg-primary/10 p-2"
          aria-label="Current page"
        >
          <p
            class="kr-text-eyebrow text-[0.65rem] tracking-widest text-primary"
          >
            Now visiting
          </p>
          <p class="kr-text-black-base truncate">{{ currentPageTitle }}</p>
          <p
            v-if="currentPageSubtitle"
            class="line-clamp-2 text-xs text-base-content/65"
          >
            {{ currentPageSubtitle }}
          </p>
        </section>
        <section
          v-for="channel in visibleChannels"
          :key="channel.channelKey"
          class="min-w-0 border-b border-base-300/60 py-1 last:border-b-0"
        >
          <div class="flex min-w-0 items-center gap-2 px-2 pb-1 pt-2">
            <Icon
              :name="channel.icon"
              class="h-3.5 w-3.5 shrink-0 text-primary/70"
            />
            <p
              class="kr-text-eyebrow min-w-0 truncate text-[0.65rem] tracking-[0.16em] text-base-content/50"
            >
              {{ channel.label }}
            </p>
          </div>
          <MaturityToggle
            v-if="channel.channelKey === 'admin' && showMatureAdminOptIn"
            variant="resource"
            label="Mature studios are hidden"
            hidden-text="Enable mature content to see private adult previews in Admin."
            visible-text="Mature previews are visible."
          />

          <ChannelTabList
            :channel="channel"
            :active-channel-key="activeChannel.channelKey"
            :active-tab-key="
              channel.channelKey === activeChannel.channelKey
                ? activeTab?.tabKey || ''
                : ''
            "
            :columns="1"
            :reset-subtabs-token="mobileSubtabsResetToken"
            @select="selectTab(channel, $event)"
          />
        </section>
      </div>

      <!--
        THE LAUNCHER. Silas, 2026-11-02: "If I click nav, I want the most image
        friendly great shot appropriate for the room ... this is showing me a
        mobile display when i have an xl display. we should be a lot COOLER."

        From tablet up the menu is one art-led panel sized to the room the
        viewport actually has: a rail of channels, each wearing its own art, and
        a stage for the previewed channel -- a spotlight banner of whatever card
        is under the pointer, then every destination as an image card in as
        many columns as the width allows.
      -->
      <div
        v-if="!unifiedMobile"
        ref="channelMenu"
        class="kr-launcher flex overflow-hidden kr-panel-flat shadow-2xl"
        :style="{
          width: `${launcherWidth}px`,
          maxHeight: `${channelMenuMaxHeight}px`,
        }"
      >
        <ul
          class="flex w-44 shrink-0 flex-col gap-1.5 overflow-x-hidden kr-anchor-scroll border-r border-base-300 bg-base-200/40 p-2 lg:w-56 xl:w-64"
          :style="{ maxHeight: `${channelMenuMaxHeight}px` }"
          aria-label="Channels"
          @wheel="handleLauncherWheel"
        >
          <li
            v-for="channel in visibleChannels"
            :key="channel.channelKey"
            class="channel-menu-item"
            @mouseenter="previewChannel(channel)"
            @focusin="previewChannel(channel)"
          >
            <div
              class="group relative flex min-h-14 w-full items-stretch overflow-hidden rounded-xl border transition-all lg:min-h-16 xl:min-h-[4.5rem]"
              :class="
                previewedChannelKey === channel.channelKey
                  ? 'border-primary shadow-lg ring-2 ring-primary/40'
                  : 'border-base-300 hover:border-primary/50'
              "
            >
              <img
                v-if="imageOk(channel.image)"
                :src="channel.image"
                alt=""
                aria-hidden="true"
                loading="lazy"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                @error="markBroken(channel.image)"
              />
              <span
                class="absolute inset-0 bg-gradient-to-r from-base-100 via-base-100/85 to-base-100/30"
                aria-hidden="true"
              />

              <button
                type="button"
                class="relative flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
                :aria-current="
                  activeChannel.channelKey === channel.channelKey
                    ? 'location'
                    : undefined
                "
                @click="selectChannel(channel)"
              >
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-sm xl:h-10 xl:w-10"
                  :class="
                    activeChannel.channelKey === channel.channelKey
                      ? 'border-primary bg-primary text-primary-content'
                      : 'border-base-300/70 bg-base-100/90 text-base-content'
                  "
                >
                  <Icon :name="channel.icon" class="kr-icon-4 shrink-0" />
                </span>

                <span
                  class="flex min-w-0 flex-1 flex-col items-start leading-tight"
                >
                  <span
                    class="kr-text-black-sm max-w-full truncate lg:text-base"
                  >
                    {{ channel.label }}
                  </span>
                  <span
                    class="max-w-full truncate text-xs font-semibold opacity-70"
                  >
                    {{ destinationTab(channel)?.label || channel.title }}
                  </span>
                </span>
              </button>

              <button
                v-if="channel.tabs.length > 1"
                type="button"
                class="relative flex w-9 shrink-0 items-center justify-center text-base-content/70 hover:text-primary"
                :aria-label="'Show ' + channel.label + ' destinations'"
                :aria-expanded="previewedChannelKey === channel.channelKey"
                @click.stop="previewChannel(channel)"
              >
                <Icon
                  name="kind-icon:chevron-right"
                  class="kr-icon-4 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </div>
          </li>
        </ul>

        <div
          v-if="previewedChannel"
          ref="channelFlyout"
          @wheel="handleLauncherWheel"
          class="channel-submenu @container min-w-0 flex-1 flex-nowrap overflow-x-hidden kr-anchor-scroll p-3 xl:p-4"
          :style="{
            maxHeight: `${channelFlyoutMaxHeight}px`,
            scrollbarGutter: 'stable',
          }"
          :aria-label="previewedChannel.label + ' destinations'"
        >
          <section
            class="mb-2 flex min-w-0 items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2"
            aria-label="Current page"
          >
            <Icon
              :name="activeTab?.icon || activeChannel.icon"
              class="h-5 w-5 shrink-0 text-primary"
            />
            <div class="min-w-0 flex-1">
              <p
                class="kr-text-eyebrow text-[0.6rem] tracking-widest text-primary"
              >
                Now visiting
              </p>
              <p class="kr-text-black-sm truncate">{{ currentPageTitle }}</p>
              <p
                v-if="currentPageSubtitle"
                class="truncate text-xs text-base-content/70"
              >
                {{ currentPageSubtitle }}
              </p>
            </div>
          </section>
          <button
            type="button"
            class="group relative mb-3 flex h-28 w-full items-end overflow-hidden rounded-2xl border border-base-300 bg-gradient-to-br from-primary/40 via-secondary/30 to-accent/40 text-left shadow-md lg:h-32 xl:h-40"
            :aria-label="`Open ${spotlight.label}`"
            @click="openSpotlight"
          >
            <img
              v-if="imageOk(spotlight.image)"
              :key="spotlight.image"
              :src="spotlight.image"
              alt=""
              aria-hidden="true"
              class="kr-launcher-spotlight absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              @error="markBroken(spotlight.image)"
            />
            <Icon
              v-else
              :name="spotlight.icon"
              class="absolute right-6 top-1/2 h-20 w-20 -translate-y-1/2 text-base-content/20"
            />
            <span
              class="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/60 to-transparent"
              aria-hidden="true"
            />
            <span
              class="relative flex w-full min-w-0 items-end gap-3 p-3 xl:p-4"
            >
              <span class="flex min-w-0 flex-1 flex-col leading-tight">
                <span
                  class="kr-text-eyebrow truncate text-[0.65rem] tracking-[0.2em] text-primary"
                >
                  {{ spotlight.eyebrow }}
                </span>
                <span
                  class="kr-text-black-lg truncate text-xl drop-shadow-sm lg:text-2xl xl:text-3xl"
                >
                  {{ spotlight.label }}
                </span>
                <span
                  v-if="spotlight.blurb"
                  class="line-clamp-1 text-sm font-medium text-base-content/75 lg:line-clamp-2"
                >
                  {{ spotlight.blurb }}
                </span>
              </span>
              <span
                class="btn btn-primary btn-sm hidden shrink-0 rounded-xl shadow-md @lg:inline-flex"
              >
                Go
                <Icon name="kind-icon:arrow-right" class="h-3.5 w-3.5" />
              </span>
            </span>
          </button>

          <MaturityToggle
            v-if="
              previewedChannel.channelKey === 'admin' && showMatureAdminOptIn
            "
            variant="resource"
            class="mb-3"
            label="Mature studios are hidden"
            hidden-text="Enable mature content to see private adult previews in Admin."
            visible-text="Mature previews are visible."
          />

          <section
            v-for="section in launcherSections"
            :key="section.key"
            class="mb-3 last:mb-0"
            :aria-label="section.label || previewedChannel.label"
          >
            <p
              v-if="section.label"
              class="kr-text-eyebrow mb-1.5 flex items-center gap-2 px-1 text-[0.65rem] tracking-[0.18em] text-base-content/55"
            >
              <Icon
                v-if="section.parent"
                :name="section.parent.icon || previewedChannel.icon"
                class="h-3 w-3"
              />
              {{ section.label }}
              <span
                v-if="section.admin"
                class="kr-text-eyebrow-bold kr-badge-warning-xs"
              >
                Admin
              </span>
            </p>

            <div
              class="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2.5 @5xl:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] @5xl:gap-3"
            >
              <button
                v-for="(tab, index) in section.tabs"
                :key="tab.tabKey"
                type="button"
                class="kr-launcher-card group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-base-100 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                :class="
                  isActiveTab(previewedChannel, tab)
                    ? 'border-secondary ring-2 ring-secondary'
                    : 'border-base-300'
                "
                :style="{ animationDelay: `${Math.min(index, 12) * 25}ms` }"
                :aria-current="
                  isActiveTab(previewedChannel, tab) ? 'page' : undefined
                "
                @mouseenter="spotlightTabKey = tab.tabKey"
                @focus="spotlightTabKey = tab.tabKey"
                @click="selectTab(previewedChannel, tab)"
              >
                <span
                  class="relative block aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/25 via-base-200 to-secondary/25"
                >
                  <Icon
                    :name="tab.icon || previewedChannel.icon"
                    class="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-base-content/30"
                  />
                  <img
                    v-if="imageOk(tab.image)"
                    :src="tab.image"
                    :alt="tab.title || tab.label"
                    loading="lazy"
                    class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    @error="markBroken(tab.image)"
                  />
                  <span
                    class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-base-content/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden="true"
                  />
                  <span
                    class="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-base-100/85 shadow-sm backdrop-blur"
                    aria-hidden="true"
                  >
                    <Icon
                      :name="tab.icon || previewedChannel.icon"
                      class="h-4 w-4"
                    />
                  </span>
                  <span
                    v-if="isActiveTab(previewedChannel, tab)"
                    class="kr-text-eyebrow-bold absolute right-2 top-2 rounded-full bg-secondary px-2 py-0.5 text-[0.6rem] text-secondary-content shadow"
                  >
                    Here
                  </span>
                  <span
                    v-else-if="isAdminOnlyTab(previewedChannel, tab)"
                    class="kr-text-eyebrow-bold kr-badge-warning-xs absolute right-2 top-2"
                    title="Admin-only page"
                  >
                    Admin
                  </span>
                </span>

                <span class="flex min-w-0 flex-col gap-0.5 px-2.5 py-2">
                  <span class="kr-text-black-sm truncate xl:text-base">
                    {{ tab.label }}
                  </span>
                  <span
                    v-if="tab.summary || tab.description"
                    class="line-clamp-2 text-[0.72rem] font-medium leading-snug text-base-content/65"
                  >
                    {{ tab.summary || tab.description }}
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
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
import { useUserStore } from '@/stores/userStore'
import { usePageStore } from '@/stores/pageStore'
import {
  channelTabGroups,
  isAdminOnlyTab,
  navigationSubtabs,
} from '@/utils/channelTabGroups'
import { tabSharesRoute } from '@/utils/tabNavigation'
import {
  adjacentChannelIndex,
  canScrollVertically,
} from '@/utils/channelWheelNavigation'

const { seamless, unifiedMobile } = withDefaults(
  defineProps<{
    seamless?: boolean
    unifiedMobile?: boolean
  }>(),
  {
    seamless: false,
    unifiedMobile: false,
  },
)

type LauncherSection = {
  key: string
  label: string
  admin: boolean
  parent: ResolvedTab | null
  tabs: ResolvedTab[]
}

type Spotlight = {
  eyebrow: string
  label: string
  blurb: string
  image: string
  icon: string
  tab: ResolvedTab | null
}

const VIEWPORT_GUTTER = 12
const LAUNCHER_MIN_WIDTH = 480
const LAUNCHER_MAX_WIDTH = 1760
const CHANNEL_WHEEL_COOLDOWN_MS = 550

const route = useRoute()
const isSlimeCityPage = computed(
  () => route.path === '/play/slime-city' || route.path === '/admin/slime-city',
)
const router = useRouter()
const pageStore = usePageStore()
const channelContentStore = useChannelContentStore()
const userStore = useUserStore()
const showMatureAdminOptIn = computed(
  () =>
    userStore.isLoggedIn &&
    userStore.isAdmin &&
    !userStore.isMaturityRestricted &&
    !userStore.showMature,
)
const mobileSubtabsResetToken = ref(0)
const dropdownRoot = ref<HTMLElement | null>(null)
const channelMenu = ref<HTMLElement | null>(null)
const channelFlyout = ref<HTMLElement | null>(null)
const channelMenuMaxHeight = ref(320)
const channelFlyoutMaxHeight = ref(320)
const launcherWidth = ref(960)
const previewedChannelKey = ref('')
const spotlightTabKey = ref('')
const brokenImages = ref<Set<string>>(new Set())
let lastWheelChannelSwitchAt = 0

await channelContentStore.initialize()

const visibleChannels = computed(() => channelContentStore.navigationChannels)
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

/*
 * Route first, like workspace-header. Only content pages call setPage, so on a
 * dedicated page such as /admin/worlds/zuzu pageStore still describes the last
 * content page visited -- the button read "Home" beside an Admin tab picker
 * and the Admin row was never highlighted.
 */
const routeLocation = computed(() =>
  channelContentStore.resolveActiveLocation({ path: route.path }),
)

const activeChannel = computed<ResolvedChannel>(() => {
  return (
    routeLocation.value?.channel ??
    pageStore.resolvedChannel ??
    visibleChannels.value[0] ??
    fallbackChannel
  )
})

const activeTab = computed<ResolvedTab | null>(() => {
  const channel = activeChannel.value
  const requested = channel.tabs.find(
    (tab) => tab.tabKey === requestedTabKey.value,
  )
  if (requested) return requested

  if (
    pageStore.describesPath(route.path) &&
    pageStore.resolvedTab &&
    pageStore.resolvedTab.channelKey === channel.channelKey
  ) {
    return pageStore.resolvedTab
  }

  const routeTab = routeLocation.value?.tab
  if (routeTab && routeTab.channelKey === channel.channelKey) return routeTab

  const storedTabKey = channelContentStore.getActiveTab(channel.channelKey)

  return (
    channel.tabs.find((tab) => tab.tabKey === storedTabKey) ??
    channel.tabs.find((tab) => tab.tabKey === channel.defaultTab) ??
    channel.tabs[0] ??
    null
  )
})

const currentPageTitle = computed(() =>
  pageStore.describesPath(route.path)
    ? pageStore.title ||
      activeTab.value?.title ||
      activeTab.value?.label ||
      activeChannel.value.label
    : activeTab.value?.title ||
      activeTab.value?.label ||
      activeChannel.value.title ||
      activeChannel.value.label,
)
const currentPageSubtitle = computed(() =>
  pageStore.describesPath(route.path)
    ? pageStore.tabMessage ||
      activeTab.value?.subtitle ||
      pageStore.subtitle ||
      activeTab.value?.summary ||
      ''
    : activeTab.value?.subtitle || activeTab.value?.summary || '',
)

const previewedChannel = computed<ResolvedChannel | null>(() => {
  const channels = visibleChannels.value
  return (
    channels.find(
      (channel) => channel.channelKey === previewedChannelKey.value,
    ) ??
    channels.find(
      (channel) => channel.channelKey === activeChannel.value.channelKey,
    ) ??
    channels[0] ??
    null
  )
})

const launcherSections = computed<LauncherSection[]>(() => {
  const channel = previewedChannel.value
  if (!channel) return []

  const sections: LauncherSection[] = []
  for (const group of channelTabGroups(channel)) {
    const leaves = group.tabs.filter(
      (tab) => navigationSubtabs(channel, tab).length === 0,
    )
    if (leaves.length) {
      sections.push({
        key: group.key,
        label: group.label,
        admin: group.admin,
        parent: null,
        tabs: leaves,
      })
    }

    for (const parent of group.tabs) {
      const subtabs = navigationSubtabs(channel, parent)
      if (!subtabs.length) continue

      sections.push({
        key: `${group.key}:${parent.tabKey}`,
        label: parent.label,
        admin: group.admin,
        parent,
        tabs: parent.route ? [parent, ...subtabs] : subtabs,
      })
    }
  }

  return sections
})

const spotlight = computed<Spotlight>(() => {
  const channel = previewedChannel.value ?? fallbackChannel
  const tab =
    channel.tabs.find(
      (candidate) => candidate.tabKey === spotlightTabKey.value,
    ) ?? null

  if (tab) {
    return {
      eyebrow: `${channel.room || channel.label} · ${channel.label}`,
      label: tab.title || tab.label,
      blurb: tab.summary || tab.description || tab.subtitle || '',
      image: imageOk(tab.image) ? tab.image : channel.image,
      icon: tab.icon || channel.icon,
      tab,
    }
  }

  return {
    eyebrow: channel.room || 'Kind Robots',
    label: channel.title || channel.label,
    blurb: channel.summary || channel.description || channel.subtitle || '',
    image: channel.image,
    icon: channel.icon,
    tab: null,
  }
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

function isActiveTab(channel: ResolvedChannel, tab: ResolvedTab): boolean {
  return (
    activeChannel.value.channelKey === channel.channelKey &&
    activeTab.value?.tabKey === tab.tabKey
  )
}

function imageOk(src: string | undefined): src is string {
  return !!src && !brokenImages.value.has(src)
}

function markBroken(src: string | undefined): void {
  if (!src || brokenImages.value.has(src)) return
  const next = new Set(brokenImages.value)
  next.add(src)
  brokenImages.value = next
}

function previewChannel(
  channel: ResolvedChannel,
  arriveAt: 'start' | 'end' = 'start',
): void {
  if (previewedChannelKey.value === channel.channelKey) return
  previewedChannelKey.value = channel.channelKey
  spotlightTabKey.value = ''
  void nextTick(() => {
    const flyout = channelFlyout.value
    if (flyout) flyout.scrollTop = arriveAt === 'end' ? flyout.scrollHeight : 0
  })
}

function handleLauncherWheel(event: WheelEvent): void {
  if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

  const scroller = event.currentTarget
  if (!(scroller instanceof HTMLElement)) return

  let scrollTarget = event.target instanceof Element ? event.target : null
  while (scrollTarget && scrollTarget !== scroller) {
    if (
      scrollTarget instanceof HTMLElement &&
      canScrollVertically(scrollTarget, event.deltaY)
    ) return
    scrollTarget = scrollTarget.parentElement
  }
  if (canScrollVertically(scroller, event.deltaY)) return

  const channels = visibleChannels.value
  const index = channels.findIndex(
    (channel) => channel.channelKey === previewedChannel.value?.channelKey,
  )
  const nextIndex = adjacentChannelIndex(index, channels.length, event.deltaY)
  event.preventDefault()
  if (nextIndex === null) return

  const now = Date.now()
  if (now - lastWheelChannelSwitchAt < CHANNEL_WHEEL_COOLDOWN_MS) return
  const nextChannel = channels[nextIndex]
  if (!nextChannel) return

  lastWheelChannelSwitchAt = now
  previewChannel(nextChannel, event.deltaY < 0 ? 'end' : 'start')
}

function openSpotlight(): void {
  const channel = previewedChannel.value
  if (!channel) return

  const tab = spotlight.value.tab
  if (tab) {
    selectTab(channel, tab)
    return
  }

  selectChannel(channel)
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

function updateLauncherWidth(): void {
  const root = dropdownRoot.value
  if (!root || typeof window === 'undefined') return

  const left = root.getBoundingClientRect().left
  const available = Math.floor(window.innerWidth - left - VIEWPORT_GUTTER)
  const floor = Math.min(
    LAUNCHER_MIN_WIDTH,
    window.innerWidth - VIEWPORT_GUTTER * 2,
  )

  launcherWidth.value = Math.max(floor, Math.min(LAUNCHER_MAX_WIDTH, available))
}

function updateChannelMenuViewport(): void {
  if (!unifiedMobile) updateLauncherWidth()

  const menu = channelMenu.value
  if (!menu) return

  channelMenuMaxHeight.value = availableViewportHeight(menu)
  channelFlyoutMaxHeight.value = channelMenuMaxHeight.value
}

function openChannelMenu(): void {
  if (unifiedMobile) {
    mobileSubtabsResetToken.value += 1
  } else {
    previewedChannelKey.value = activeChannel.value.channelKey
    spotlightTabKey.value = ''
    lastWheelChannelSwitchAt = 0
  }

  scheduleChannelMenuViewportUpdate()
}

function scheduleChannelMenuViewportUpdate(): void {
  if (typeof window === 'undefined') return

  void nextTick(() => {
    window.requestAnimationFrame(updateChannelMenuViewport)
  })
}

onMounted(() => {
  window.addEventListener('resize', scheduleChannelMenuViewportUpdate)
  window.visualViewport?.addEventListener(
    'resize',
    scheduleChannelMenuViewportUpdate,
  )
  window.visualViewport?.addEventListener(
    'scroll',
    scheduleChannelMenuViewportUpdate,
  )
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleChannelMenuViewportUpdate)
  window.visualViewport?.removeEventListener(
    'resize',
    scheduleChannelMenuViewportUpdate,
  )
  window.visualViewport?.removeEventListener(
    'scroll',
    scheduleChannelMenuViewportUpdate,
  )
})

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

  if (route.fullPath !== tab.route) {
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
  spotlightTabKey.value = ''
  if (typeof document === 'undefined') return

  const element = document.activeElement as HTMLElement | null
  element?.blur()
}
</script>

<style scoped>
/* The navigator, not the battle stage, owns the one Slime City wordmark. */
.slime-nav-title {
  color: #f7fbfd;
  display: inline-block;
  font-size: clamp(0.86rem, 1.2vw, 1.24rem);
  font-style: italic;
  font-weight: 1000;
  letter-spacing: -0.075em;
  line-height: 1;
  white-space: nowrap;
  text-shadow: 0 0 12px #9cfd4763;
}
.slime-nav-title strong {
  color: #c7ff55;
  font: inherit;
}

.kr-launcher {
  animation: kr-launcher-in 180ms ease-out both;
  transform-origin: top left;
}

.kr-launcher-card {
  animation: kr-launcher-card-in 260ms ease-out both;
}

.kr-launcher-spotlight {
  animation: kr-launcher-fade 320ms ease-out both;
}

@keyframes kr-launcher-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.985);
  }
}

@keyframes kr-launcher-card-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes kr-launcher-fade {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kr-launcher,
  .kr-launcher-card,
  .kr-launcher-spotlight {
    animation: none;
  }
}
</style>
