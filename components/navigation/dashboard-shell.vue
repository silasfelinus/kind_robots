<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-3 sm:p-4"
  >
    <transition name="fade-up">
      <button
        v-if="!showHeader"
        class="absolute left-3 top-3 z-50 flex items-center gap-1.5 rounded-xl border border-base-300 bg-base-100 px-2.5 py-1.5 text-xs font-bold text-base-content shadow-md backdrop-blur transition-all hover:border-primary hover:text-primary active:scale-95"
        type="button"
        title="Show header"
        @click="toggleHeader"
      >
        <Icon name="kind-icon:expand" class="h-3.5 w-3.5" />
        <span>Show</span>
      </button>
    </transition>

    <transition name="fade-up">
      <header
        v-if="showHeader"
        class="relative mb-3 shrink-0 overflow-visible rounded-xl border border-base-300 bg-base-100 shadow-sm"
        :class="navZClass"
      >
        <div class="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:p-4">
          <section class="flex min-w-0 flex-col gap-3">
            <div class="flex min-w-0 items-start gap-4">
              <button
                type="button"
                title="Hide header"
                class="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-1 ring-base-300 sm:h-24 sm:w-24"
                @click="toggleHeader"
              >
                <page-image
                  class="h-full w-full rounded-2xl transition-opacity group-hover:opacity-60"
                />
                <span
                  class="absolute inset-0 flex items-center justify-center rounded-2xl bg-base-content/0 opacity-0 transition-all group-hover:bg-base-content/15 group-hover:opacity-100"
                >
                  <Icon
                    name="kind-icon:collapse"
                    class="h-5 w-5 text-base-content drop-shadow"
                  />
                </span>
              </button>

              <div class="min-w-0 flex-1 pt-1">
                <p
                  v-if="title"
                  class="truncate text-[0.65rem] font-bold uppercase tracking-[0.22em] text-base-content/40"
                >
                  {{ title }}
                </p>

                <h1
                  class="truncate text-2xl font-black leading-tight text-base-content"
                >
                  {{ activeTitle }}
                </h1>

                <p
                  v-if="activeSummary"
                  class="mt-1 line-clamp-2 text-sm text-base-content/55"
                >
                  {{ activeSummary }}
                </p>
              </div>
            </div>

            <div
              class="flex flex-wrap items-center gap-2 rounded-xl border border-base-300 bg-base-200/70 p-2"
            >
              <div ref="channelMenuRef" class="relative">
                <button
                  class="btn btn-sm gap-1.5 rounded-xl"
                  :class="
                    showChannels
                      ? 'btn-secondary'
                      : 'btn-ghost border border-base-300 bg-base-100'
                  "
                  type="button"
                  :aria-expanded="showChannels"
                  title="Channels"
                  @click.stop="toggleChannels"
                >
                  <Icon name="kind-icon:compass" class="h-4 w-4" />
                  <span>{{ activeChannel.label }}</span>
                  <Icon
                    :name="
                      showChannels
                        ? 'kind-icon:chevron-up'
                        : 'kind-icon:chevron-down'
                    "
                    class="h-3.5 w-3.5 opacity-50"
                  />
                </button>

                <Transition name="fade-up">
                  <div
                    v-if="showChannels"
                    class="absolute left-0 top-full z-50 mt-2 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-xl"
                  >
                    <div
                      class="flex items-center justify-between gap-2 border-b border-base-300 bg-base-200/60 px-4 py-3"
                    >
                      <div class="min-w-0">
                        <p
                          class="text-[0.6rem] font-black uppercase tracking-[0.2em] text-base-content/40"
                        >
                          Navigate to
                        </p>
                        <p class="truncate text-sm font-bold text-base-content">
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
                      class="grid max-h-[55vh] grid-cols-2 gap-1.5 overflow-y-auto p-3"
                    >
                      <NuxtLink
                        v-for="channel in channels"
                        :key="channel.key"
                        :to="channel.path"
                        class="group flex min-w-0 items-center gap-2.5 rounded-xl border p-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content hover:shadow-sm"
                        :class="
                          isChannelActive(channel)
                            ? 'border-primary bg-primary text-primary-content shadow-sm'
                            : 'border-base-300 bg-base-100 text-base-content'
                        "
                        @click="showChannels = false"
                      >
                        <span
                          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-transform group-hover:scale-110"
                          :class="
                            isChannelActive(channel)
                              ? 'border-primary-content/30 bg-primary-content/20 text-primary-content'
                              : 'border-base-300 bg-base-200 text-base-content'
                          "
                        >
                          <Icon :name="channel.icon" class="h-4 w-4" />
                        </span>

                        <span class="min-w-0 truncate">
                          {{ channel.label }}
                        </span>
                      </NuxtLink>
                    </div>
                  </div>
                </Transition>
              </div>

              <slot
                name="actions"
                :active-tab="normalizedActiveTab"
                :active-tab-config="activeTabConfig"
              />

              <button
                v-if="showRefresh"
                class="btn btn-sm btn-ghost rounded-xl border border-base-300 bg-base-100"
                type="button"
                :disabled="loading"
                :title="refreshLabel"
                @click="emit('refresh')"
              >
                <Icon
                  name="kind-icon:refresh"
                  class="h-4 w-4"
                  :class="loading ? 'animate-spin' : ''"
                />
              </button>
            </div>
          </section>

          <aside
            v-if="resolvedTabs.length"
            class="flex min-h-0 w-fit flex-col gap-2 rounded-xl border border-base-300 bg-base-200/70 p-2"
          >
            <nav
              class="grid max-h-44 grid-rows-2 gap-1.5 overflow-x-auto overflow-y-hidden pb-1 pr-1 lg:max-h-48"
              style="scrollbar-width: none; -webkit-overflow-scrolling: touch"
              :style="tabGridStyle"
            >
              <button
                v-for="tab in resolvedTabs"
                :key="tab.key"
                class="btn btn-sm min-h-11 w-full justify-start rounded-xl transition-all"
                type="button"
                :class="
                  normalizedActiveTab === tab.key
                    ? 'btn-primary shadow-sm'
                    : 'btn-ghost border border-base-300 bg-base-100 hover:bg-base-200'
                "
                @click="setTab(tab.key)"
              >
                <Icon
                  :name="tab.icon || fallbackIcon"
                  class="h-4 w-4 shrink-0"
                />
                <span class="min-w-0 truncate">{{ tab.label }}</span>
              </button>
            </nav>
          </aside>
        </div>
      </header>
    </transition>

    <transition name="fade-up">
      <div
        v-if="loading"
        class="relative z-40 mb-3 flex shrink-0 items-center gap-2 rounded-xl border border-info/30 bg-info/10 px-4 py-2.5 text-sm font-medium text-info"
      >
        <Icon name="kind-icon:spinner" class="h-4 w-4 animate-spin" />
        {{ loadingMessage }}
      </div>
    </transition>

    <transition name="fade-up">
      <div
        v-if="error"
        class="relative z-40 mb-3 flex shrink-0 items-center gap-2 rounded-xl border border-error/30 bg-error/10 px-4 py-2.5 text-sm font-medium text-error"
      >
        <Icon name="kind-icon:alert" class="h-4 w-4 shrink-0" />
        {{ error }}
      </div>
    </transition>

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
    navZClass?: string
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
    navZClass: 'z-40',
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
  const dashboardKey = resolvedDashboardKey.value

  if (dashboardKey) {
    return navStore.getDashboardTabs(dashboardKey)
  }

  return props.tabs
})

const requestedActiveTab = computed(() => {
  const dashboardKey = resolvedDashboardKey.value

  if (dashboardKey) {
    return navStore.getDashboardTab(dashboardKey)
  }

  return props.activeTab
})

const fallbackTab = computed<DashboardTabConfig>(() => {
  const firstTab = resolvedTabs.value[0]
  const requested = requestedActiveTab.value

  return {
    key: requested || firstTab?.key || 'overview',
    label: firstTab?.label || requested || 'Overview',
    icon: firstTab?.icon || fallbackIcon,
    title: firstTab?.title || firstTab?.label || requested || 'Overview',
    summary: firstTab?.summary || props.summary || '',
  }
})

const activeTabConfig = computed<DashboardTabConfig>(() => {
  const requested = (requestedActiveTab.value || '').trim()

  if (requested) {
    const matched = resolvedTabs.value.find((tab) => tab.key === requested)

    if (matched) return matched

    return {
      key: requested,
      label: requested,
      icon: fallbackIcon,
      title: requested,
      summary: props.summary || '',
    }
  }

  return resolvedTabs.value[0] ?? fallbackTab.value
})

const normalizedActiveTab = computed(() => {
  return requestedActiveTab.value || activeTabConfig.value.key
})

const activeTitle = computed(() => {
  return activeTabConfig.value.title || activeTabConfig.value.label
})

const activeSummary = computed(() => {
  return activeTabConfig.value.summary || props.summary || ''
})

const activeChannel = computed<ChannelRoute>(() => {
  return (
    channels.find((channel) => isChannelActive(channel)) ??
    channels[0] ?? {
      key: 'home',
      label: 'Home',
      path: '/',
      icon: 'kind-icon:home',
    }
  )
})

const tabGridStyle = computed(() => {
  const cols = Math.max(1, Math.ceil(resolvedTabs.value.length / 2))

  return {
    gridTemplateColumns: `repeat(${cols}, 8.5rem)`,
  }
})

function setTab(tabKey: string) {
  const dashboardKey = resolvedDashboardKey.value

  if (dashboardKey) {
    const savedTab = navStore.setDashboardTab(
      dashboardKey,
      tabKey,
      'user clicked dashboard-shell tab button',
    )
    emit('set-tab', savedTab)
    return
  }

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

  if (!showHeader.value) {
    showChannels.value = false
  }
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

  if (saved === 'false') {
    showHeader.value = false
  }
}

watch(showHeader, (value) => {
  if (!import.meta.client) return

  localStorage.setItem(storageKey, String(value))
})

onMounted(async () => {
  if (!navStore.isInitialized && !navStore.isInitializing) {
    await navStore.initialize()
  }

  loadHeaderPreference()
  document.addEventListener('click', handleDocumentClick)
})
</script>
