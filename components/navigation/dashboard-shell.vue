<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-2 sm:p-3"
  >
    <!-- ── Collapsed bar ───────────────────────────────────────────────── -->
    <div
      v-if="!showHeader"
      class="relative mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-2.5 py-1.5 shadow-sm"
      :class="navZClass"
    >
      <div
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-base-300 bg-base-200"
      >
        <Icon
          :name="activeTabConfig.icon || fallbackIcon"
          class="h-4 w-4 text-primary"
        />
      </div>

      <span class="min-w-0 truncate text-sm font-black text-base-content">
        {{ activeTitle }}
      </span>

      <span v-if="title" class="hidden text-xs text-base-content/40 sm:block"
        >·</span
      >
      <span
        v-if="title"
        class="hidden min-w-0 truncate text-xs uppercase tracking-widest text-base-content/40 sm:block"
      >
        {{ title }}
      </span>

      <div class="ml-auto flex shrink-0 items-center gap-1">
        <slot
          name="actions"
          :active-tab="normalizedActiveTab"
          :active-tab-config="activeTabConfig"
        />

        <button
          class="btn btn-xs btn-primary rounded-lg"
          type="button"
          title="Show header"
          @click="toggleHeader"
        >
          <Icon name="kind-icon:expand" class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">Show</span>
        </button>
      </div>
    </div>

    <!-- ── Expanded header ─────────────────────────────────────────────── -->
    <header
      v-if="showHeader"
      class="relative mb-2 shrink-0 overflow-visible rounded-xl border border-base-300 bg-base-100 shadow-sm"
      :class="navZClass"
    >
      <!-- Row 1: image anchor + title + controls -->
      <div class="flex items-center gap-2.5 px-2.5 pt-2.5 pb-2">
        <!-- Page image / icon anchor -->
        <div class="relative shrink-0">
          <img
            v-if="headerImage"
            :src="headerImage"
            alt=""
            class="h-11 w-11 rounded-xl border border-base-300 object-cover shadow-sm"
          />
          <div
            v-else
            class="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 shadow-sm"
          >
            <Icon
              :name="activeTabConfig.icon || fallbackIcon"
              class="h-6 w-6 text-primary"
            />
          </div>
          <!-- Active indicator dot -->
          <span
            class="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-base-100 bg-primary"
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
            class="truncate text-base font-black leading-tight text-base-content"
          >
            {{ activeTitle }}
          </h1>
        </div>

        <!-- Controls: all in one tight row -->
        <div class="flex shrink-0 items-center gap-1">
          <slot
            name="actions"
            :active-tab="normalizedActiveTab"
            :active-tab-config="activeTabConfig"
          />

          <button
            v-if="showRefresh"
            class="btn btn-xs btn-ghost rounded-lg border border-base-300"
            type="button"
            :disabled="loading"
            :title="refreshLabel"
            @click="emit('refresh')"
          >
            <Icon name="kind-icon:refresh" class="h-3.5 w-3.5" />
            <span class="hidden md:inline">{{ refreshLabel }}</span>
          </button>

          <button
            class="btn btn-xs btn-ghost rounded-lg border border-base-300"
            type="button"
            title="Hide header"
            @click="toggleHeader"
          >
            <Icon name="kind-icon:collapse" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <!-- Row 2: tabs + channels — single scrollable strip -->
      <div
        v-if="resolvedTabs.length"
        ref="channelMenuRef"
        class="relative flex items-center gap-1 overflow-x-auto border-t border-base-300/60 px-2.5 py-1.5"
        :class="navZClass"
        style="scrollbar-width: none"
      >
        <button
          v-for="tab in resolvedTabs"
          :key="tab.key"
          class="btn btn-xs shrink-0 rounded-lg transition-all"
          type="button"
          :class="
            normalizedActiveTab === tab.key
              ? 'btn-primary shadow-sm'
              : 'btn-ghost hover:btn-ghost'
          "
          @click="setTab(tab.key)"
        >
          <Icon :name="tab.icon || fallbackIcon" class="h-3.5 w-3.5" />
          {{ tab.label }}
        </button>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Channels: inline at end of tab row -->
        <div class="relative shrink-0">
          <button
            class="btn btn-xs rounded-lg"
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
            <Icon name="kind-icon:compass" class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">{{ activeChannel.label }}</span>
            <Icon
              :name="
                showChannels ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'
              "
              class="h-3 w-3 opacity-60"
            />
          </button>

          <!-- Channels dropdown -->
          <Transition name="fade-up">
            <div
              v-if="showChannels"
              class="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl"
            >
              <div
                class="flex items-center justify-between gap-2 border-b border-base-300 bg-base-200/60 px-3 py-2"
              >
                <div class="min-w-0">
                  <p
                    class="text-xs font-bold uppercase tracking-[0.2em] text-base-content/50"
                  >
                    Channels
                  </p>
                  <p class="truncate text-sm font-semibold text-base-content">
                    {{ activeChannel.label }}
                  </p>
                </div>
                <button
                  class="btn btn-xs btn-ghost rounded-lg"
                  type="button"
                  title="Close"
                  @click="showChannels = false"
                >
                  <Icon name="kind-icon:close" class="h-4 w-4" />
                </button>
              </div>

              <div
                class="grid max-h-[55vh] grid-cols-2 gap-1.5 overflow-y-auto p-2.5"
              >
                <NuxtLink
                  v-for="channel in channels"
                  :key="channel.key"
                  :to="channel.path"
                  class="group flex min-w-0 items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
                  :class="
                    isChannelActive(channel)
                      ? 'border-primary bg-primary text-primary-content shadow-sm'
                      : 'border-base-300 bg-base-200 text-base-content'
                  "
                  @click="showChannels = false"
                >
                  <Icon
                    :name="channel.icon"
                    class="h-4 w-4 shrink-0 transition group-hover:scale-110"
                  />
                  <span class="min-w-0 truncate">{{ channel.label }}</span>
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </header>

    <!-- ── Status banners ──────────────────────────────────────────────── -->
    <div
      v-if="loading"
      class="relative z-40 mb-2 shrink-0 rounded-xl border border-info/40 bg-info/10 px-3 py-2 text-xs text-info"
    >
      {{ loadingMessage }}
    </div>

    <div
      v-if="error"
      class="relative z-40 mb-2 shrink-0 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error"
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
    /** Optional page/section image shown in the header top-left corner */
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

// ── Computed ──────────────────────────────────────────────────────────────────

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

// ── Methods ───────────────────────────────────────────────────────────────────

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
