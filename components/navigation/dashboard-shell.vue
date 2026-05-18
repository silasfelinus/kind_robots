<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-3 sm:p-4"
  >
    <!-- ── Collapsed bar ───────────────────────────────────────────────── -->
    <div
      v-if="!showHeader"
      class="relative mb-3 flex shrink-0 items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-3 py-2 shadow-sm"
      :class="navZClass"
    >
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-base-300 bg-base-200"
      >
        <Icon
          :name="activeTabConfig.icon || fallbackIcon"
          class="h-5 w-5 text-primary"
        />
      </div>

      <span class="min-w-0 truncate text-base font-black text-base-content">
        {{ activeTitle }}
      </span>

      <span v-if="title" class="hidden text-sm text-base-content/40 sm:block"
        >·</span
      >
      <span
        v-if="title"
        class="hidden min-w-0 truncate text-xs uppercase tracking-widest text-base-content/40 sm:block"
      >
        {{ title }}
      </span>

      <div class="ml-auto flex shrink-0 items-center gap-1.5">
        <slot
          name="actions"
          :active-tab="normalizedActiveTab"
          :active-tab-config="activeTabConfig"
        />

        <button
          class="btn btn-sm btn-primary rounded-lg"
          type="button"
          title="Show header"
          @click="toggleHeader"
        >
          <Icon name="kind-icon:expand" class="h-4 w-4" />
          <span class="hidden sm:inline">Show</span>
        </button>
      </div>
    </div>

    <!-- ── Expanded header ─────────────────────────────────────────────── -->
    <header
      v-if="showHeader"
      class="relative mb-3 shrink-0 overflow-visible rounded-xl border border-base-300 bg-base-100 shadow-sm"
      :class="navZClass"
    >
      <!-- Row 1: image anchor + title + controls -->
      <div class="flex items-center gap-4 p-4">
        <!-- Page image / icon anchor — scaled up -->
        <!-- After (gives page-image a sized box to fill) -->
        <div
          class="relative h-16 w-16 shrink-0 rounded-xl border border-base-300 shadow-sm"
        >
          <page-image />
          <span
            class="absolute -bottom-1 -right-1 z-10 h-3.5 w-3.5 rounded-full border-2 border-base-100 bg-primary"
          />
        </div>

        <!-- Title -->
        <div class="min-w-0 flex-1">
          <p
            v-if="title"
            class="text-xs font-bold uppercase tracking-[0.2em] text-base-content/40"
          >
            {{ title }}
          </p>
          <h1
            class="truncate text-xl font-black leading-tight text-base-content"
          >
            {{ activeTitle }}
          </h1>
          <p
            v-if="activeSummary"
            class="mt-0.5 truncate text-sm text-base-content/50"
          >
            {{ activeSummary }}
          </p>
        </div>

        <!-- Controls -->
        <div class="flex shrink-0 items-center gap-1.5">
          <slot
            name="actions"
            :active-tab="normalizedActiveTab"
            :active-tab-config="activeTabConfig"
          />

          <button
            v-if="showRefresh"
            class="btn btn-sm btn-ghost rounded-lg border border-base-300"
            type="button"
            :disabled="loading"
            :title="refreshLabel"
            @click="emit('refresh')"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden md:inline">{{ refreshLabel }}</span>
          </button>

          <button
            class="btn btn-sm btn-ghost rounded-lg border border-base-300"
            type="button"
            title="Hide header"
            @click="toggleHeader"
          >
            <Icon name="kind-icon:collapse" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Row 2: [channels | divider | scrollable tabs] -->
      <div
        v-if="resolvedTabs.length"
        class="flex items-center border-t border-base-300/60"
      >
        <!-- Channels — left-anchored, outside the scroll container -->
        <div ref="channelMenuRef" class="relative shrink-0 px-3 py-2">
          <button
            class="btn btn-sm rounded-lg"
            :class="
              showChannels
                ? 'btn-secondary'
                : 'btn-ghost border border-base-300'
            "
            type="button"
            :aria-expanded="showChannels"
            title="Channels"
            @click.stop="toggleChannels"
          >
            <Icon name="kind-icon:compass" class="h-4 w-4" />
            <span class="hidden sm:inline">{{ activeChannel.label }}</span>
            <Icon
              :name="
                showChannels ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
              "
              class="h-3.5 w-3.5 opacity-60"
            />
          </button>

          <!-- Channels dropdown -->
          <Transition name="fade-up">
            <div
              v-if="showChannels"
              class="absolute left-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl"
            >
              <div
                class="flex items-center justify-between gap-2 border-b border-base-300 bg-base-200/60 px-4 py-3"
              >
                <div class="min-w-0">
                  <p
                    class="text-xs font-bold uppercase tracking-[0.2em] text-base-content/50"
                  >
                    Channels
                  </p>
                  <p class="truncate text-base font-semibold text-base-content">
                    {{ activeChannel.label }}
                  </p>
                </div>
                <button
                  class="btn btn-sm btn-ghost rounded-lg"
                  type="button"
                  title="Close"
                  @click="showChannels = false"
                >
                  <Icon name="kind-icon:close" class="h-4 w-4" />
                </button>
              </div>

              <div
                class="grid max-h-[55vh] grid-cols-2 gap-2 overflow-y-auto p-3"
              >
                <NuxtLink
                  v-for="channel in channels"
                  :key="channel.key"
                  :to="channel.path"
                  class="group flex min-w-0 items-center gap-2.5 rounded-xl border p-3 text-sm font-bold transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
                  :class="
                    isChannelActive(channel)
                      ? 'border-primary bg-primary text-primary-content shadow-sm'
                      : 'border-base-300 bg-base-200 text-base-content'
                  "
                  @click="showChannels = false"
                >
                  <Icon
                    :name="channel.icon"
                    class="h-5 w-5 shrink-0 transition group-hover:scale-110"
                  />
                  <span class="min-w-0 truncate">{{ channel.label }}</span>
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Divider -->
        <div class="h-6 w-px shrink-0 bg-base-300" />

        <!-- Scrollable tab strip -->
        <nav
          class="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-2 pl-3 pr-3"
          style="scrollbar-width: none; -webkit-overflow-scrolling: touch"
        >
          <button
            v-for="tab in resolvedTabs"
            :key="tab.key"
            class="btn btn-sm shrink-0 rounded-lg transition-all"
            type="button"
            :class="
              normalizedActiveTab === tab.key
                ? 'btn-primary shadow-sm'
                : 'btn-ghost'
            "
            @click="setTab(tab.key)"
          >
            <Icon :name="tab.icon || fallbackIcon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <!-- ── Status banners ──────────────────────────────────────────────── -->
    <div
      v-if="loading"
      class="relative z-40 mb-3 shrink-0 rounded-xl border border-info/40 bg-info/10 px-4 py-2.5 text-sm text-info"
    >
      {{ loadingMessage }}
    </div>

    <div
      v-if="error"
      class="relative z-40 mb-3 shrink-0 rounded-xl border border-error/40 bg-error/10 px-4 py-2.5 text-sm text-error"
    >
      {{ error }}
    </div>

    <!-- ── Main content ────────────────────────────────────────────────── -->
    <main
      class="relative z-0 min-h-0 flex-1 overflow-y-auto rounded-xl border border-base-300 bg-base-100 shadow-sm"
    >
      <slot
        :active-tab="normalizedActiveTab"
        :active-tab-config="activeTabConfig"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  isDashboardKey,
  type DashboardKey,
  type DashboardTabConfig,
} from '@/stores/helpers/dashboardHelper'
import { useNavStore } from '@/stores/navStore'

type ChannelRoute = {
  key: string
  label: string
  path: string
  icon: string
}

const fallbackIcon = 'kind-icon:sparkles'
const storageKey = 'kind-dashboard-shell-show-header'

const props = withDefaults(
  defineProps<{
    title?: string
    summary?: string
    dashboardKey?: DashboardKey | string | null
    tabs?: DashboardTabConfig[]
    activeTab?: string
    loading?: boolean
    loadingMessage?: string
    error?: string | null
    showRefresh?: boolean
    refreshLabel?: string
    navGridClass?: string
    navZClass?: string
    headerImage?: string
  }>(),
  {
    title: 'Dashboard',
    summary: '',
    dashboardKey: null,
    tabs: () => [],
    activeTab: '',
    loading: false,
    loadingMessage: 'Loading…',
    error: null,
    showRefresh: true,
    refreshLabel: 'Refresh',
    navGridClass: 'xl:grid-cols-6',
    navZClass: 'z-40',
    headerImage: '',
  },
)

const emit = defineEmits<{
  'set-tab': [tab: string]
  refresh: []
}>()

const route = useRoute()
const navStore = useNavStore()

const showChannels = ref(false)
const showHeader = ref(true)
const channelMenuRef = ref<HTMLElement | null>(null)

const channels: ChannelRoute[] = [
  { key: 'home', label: 'Home', path: '/', icon: 'kind-icon:home' },
  {
    key: 'builder',
    label: 'Builder',
    path: '/builder',
    icon: 'kind-icon:blueprint',
  },
  { key: 'bots', label: 'Bots', path: '/bots', icon: 'kind-icon:robot-color' },
  { key: 'art', label: 'Art', path: '/art', icon: 'kind-icon:palette' },
  {
    key: 'stories',
    label: 'Stories',
    path: '/stories',
    icon: 'kind-icon:story',
  },
  {
    key: 'themes',
    label: 'Themes',
    path: '/themes',
    icon: 'kind-icon:paintbrush',
  },
  { key: 'lab', label: 'Lab', path: '/wonderlab', icon: 'kind-icon:foundry' },
  {
    key: 'brainstorm',
    label: 'Brainstorm',
    path: '/brainstorm',
    icon: 'kind-icon:brain',
  },
  {
    key: 'sanctuary',
    label: 'Sanctuary',
    path: '/sanctuary',
    icon: 'kind-icon:butterfly',
  },
  { key: 'dreams', label: 'Dreams', path: '/dreams', icon: 'kind-icon:moon' },
  {
    key: 'rewards',
    label: 'Rewards',
    path: '/rewards',
    icon: 'kind-icon:trophy',
  },
  {
    key: 'characters',
    label: 'Characters',
    path: '/characters',
    icon: 'kind-icon:mask',
  },
]

const resolvedDashboardKey = computed<DashboardKey | null>(() => {
  const key = (props.dashboardKey ?? '').trim()
  if (!key || !isDashboardKey(key)) return null
  return key
})

const resolvedTabs = computed<DashboardTabConfig[]>(() => {
  const dk = resolvedDashboardKey.value
  return dk ? navStore.getDashboardTabs(dk) : props.tabs
})

const requestedActiveTab = computed(() => {
  const dk = resolvedDashboardKey.value
  return dk ? navStore.getDashboardTab(dk) : props.activeTab
})

const fallbackTab = computed<DashboardTabConfig>(() => {
  const firstTab = resolvedTabs.value[0]
  const requested = requestedActiveTab.value
  return {
    key: requested || firstTab?.key || 'overview',
    label: firstTab?.label || requested || 'Overview',
    icon: firstTab?.icon || fallbackIcon,
    title: firstTab?.title || firstTab?.label || requested || 'Overview',
    summary: firstTab?.summary || '',
  }
})

const activeTabConfig = computed<DashboardTabConfig>(() => {
  const requested = (requestedActiveTab.value || '').trim()
  if (requested) {
    const matched = resolvedTabs.value.find((t) => t.key === requested)
    if (matched) return matched
    return {
      key: requested,
      label: requested,
      icon: fallbackIcon,
      title: requested,
      summary: '',
    }
  }
  return resolvedTabs.value[0] ?? fallbackTab.value
})

const normalizedActiveTab = computed(
  () => requestedActiveTab.value || activeTabConfig.value.key,
)

const activeTitle = computed(
  () => activeTabConfig.value.title || activeTabConfig.value.label,
)

const activeSummary = computed(
  () => activeTabConfig.value.summary || props.summary || '',
)

const activeChannel = computed(
  () =>
    channels.find((c) => isChannelActive(c)) ??
    channels[0] ?? {
      key: 'home',
      label: 'Home',
      path: '/',
      icon: 'kind-icon:home',
    },
)

function setTab(tabKey: string) {
  const dk = resolvedDashboardKey.value
  if (dk) navStore.setDashboardTab(dk, tabKey)
  emit('set-tab', tabKey)
}

function isChannelActive(channel: ChannelRoute) {
  if (route.path === channel.path) return true
  return channel.path !== '/' && route.path.startsWith(`${channel.path}/`)
}

function toggleChannels() {
  showChannels.value = !showChannels.value
}

function toggleHeader() {
  showHeader.value = !showHeader.value
  if (!showHeader.value) showChannels.value = false
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Node)) return
  if (channelMenuRef.value?.contains(target)) return
  showChannels.value = false
}

function loadHeaderPreference() {
  if (!import.meta.client) return
  const saved = localStorage.getItem(storageKey)
  if (saved === 'true') {
    showHeader.value = true
    return
  }
  if (saved === 'false') showHeader.value = false
}

watch(showHeader, (value) => {
  if (!import.meta.client) return
  localStorage.setItem(storageKey, String(value))
})

onMounted(async () => {
  await navStore.initialize()
  loadHeaderPreference()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
