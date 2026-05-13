<!-- /components/content/navigation/dashboard-shell.vue -->
<template>
  <div
    class="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-base-200 p-3 sm:p-4"
  >
    <header
      class="relative mb-4 flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md sm:p-4"
      :class="navZClass"
    >
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0">
          <p
            v-if="title"
            class="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-base-content/50"
          >
            {{ title }}
          </p>

          <h1
            class="inline-flex items-center gap-2 rounded-2xl bg-primary px-3 py-2 text-2xl font-bold text-primary-content md:text-3xl"
          >
            <Icon
              :name="activeTabConfig.icon || fallbackIcon"
              class="h-6 w-6"
            />
            {{ activeTitle }}
          </h1>

          <p
            v-if="activeSummary"
            class="mt-2 max-w-4xl text-sm text-base-content/70 sm:text-base"
          >
            {{ activeSummary }}
          </p>

          <p
            v-else-if="summary"
            class="mt-2 max-w-4xl text-sm text-base-content/70 sm:text-base"
          >
            {{ summary }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <slot
            name="actions"
            :active-tab="normalizedActiveTab"
            :active-tab-config="activeTabConfig"
          />

          <button
            v-if="showRefresh"
            class="btn btn-sm btn-secondary rounded-xl"
            type="button"
            :disabled="loading"
            @click="emit('refresh')"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            {{ refreshLabel }}
          </button>
        </div>
      </div>

      <div
        v-if="tabs.length"
        ref="channelMenuRef"
        class="relative flex min-w-0 items-start gap-2"
        :class="navZClass"
      >
        <div class="relative shrink-0">
          <button
            class="btn btn-sm rounded-xl border-primary/50 bg-primary/10 text-primary hover:bg-primary hover:text-primary-content"
            type="button"
            :aria-expanded="showChannels"
            aria-label="Toggle channels"
            title="Channels"
            @click.stop="toggleChannels"
          >
            <Icon name="kind-icon:compass" class="h-4 w-4" />
            <span class="hidden sm:inline">Channels</span>
          </button>

          <Transition name="fade-up">
            <div
              v-if="showChannels"
              class="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl shadow-base-content/20"
            >
              <div
                class="flex items-center justify-between gap-2 border-b border-base-300 bg-base-200/80 px-3 py-2"
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
                  class="btn btn-xs btn-ghost rounded-xl"
                  type="button"
                  aria-label="Close channels"
                  title="Close channels"
                  @click="showChannels = false"
                >
                  <Icon name="kind-icon:close" class="h-4 w-4" />
                </button>
              </div>

              <div
                class="grid max-h-[55vh] grid-cols-1 gap-2 overflow-y-auto p-3 sm:grid-cols-2"
              >
                <NuxtLink
                  v-for="channel in channels"
                  :key="channel.key"
                  :to="channel.path"
                  class="group flex min-w-0 items-center gap-2 rounded-2xl border p-3 text-sm font-bold transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content"
                  :class="
                    isChannelActive(channel)
                      ? 'border-primary bg-primary text-primary-content shadow-md'
                      : 'border-base-300 bg-base-200 text-base-content'
                  "
                  @click="showChannels = false"
                >
                  <Icon
                    :name="channel.icon"
                    class="h-5 w-5 shrink-0 transition group-hover:scale-110"
                  />
                  <span class="min-w-0 truncate">
                    {{ channel.label }}
                  </span>
                </NuxtLink>
              </div>
            </div>
          </Transition>
        </div>

        <nav
          class="relative grid min-w-0 flex-1 grid-cols-2 gap-2 md:grid-cols-3"
          :class="[navGridClass, navZClass]"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="btn btn-sm rounded-xl"
            type="button"
            :class="
              normalizedActiveTab === tab.key ? 'btn-primary' : 'btn-ghost'
            "
            @click="emit('set-tab', tab.key)"
          >
            <Icon :name="tab.icon || fallbackIcon" class="h-4 w-4" />
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <div
      v-if="loading"
      class="relative z-40 mb-4 shrink-0 rounded-2xl border border-info/40 bg-info/10 p-4 text-info"
    >
      {{ loadingMessage }}
    </div>

    <div
      v-if="error"
      class="relative z-40 mb-4 shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      {{ error }}
    </div>

    <main
      class="relative z-0 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md sm:p-4"
    >
      <slot
        :active-tab="normalizedActiveTab"
        :active-tab-config="activeTabConfig"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { DashboardTabConfig } from '@/stores/helpers/dashboardHelper'

type ChannelRoute = {
  key: string
  label: string
  path: string
  icon: string
}

const fallbackIcon = 'kind-icon:sparkles'

const props = withDefaults(
  defineProps<{
    title?: string
    summary?: string
    tabs?: DashboardTabConfig[]
    activeTab?: string
    loading?: boolean
    loadingMessage?: string
    error?: string | null
    showRefresh?: boolean
    refreshLabel?: string
    navGridClass?: string
    navZClass?: string
  }>(),
  {
    title: 'Dashboard',
    summary: '',
    tabs: () => [],
    activeTab: '',
    loading: false,
    loadingMessage: 'Loading...',
    error: null,
    showRefresh: true,
    refreshLabel: 'Refresh DB',
    navGridClass: 'xl:grid-cols-6',
    navZClass: 'z-40',
  },
)

const emit = defineEmits<{
  'set-tab': [tab: string]
  refresh: []
}>()

const route = useRoute()
const showChannels = ref(false)
const channelMenuRef = ref<HTMLElement | null>(null)

const channels: ChannelRoute[] = [
  {
    key: 'home',
    label: 'Home',
    path: '/',
    icon: 'kind-icon:home',
  },
  {
    key: 'bots',
    label: 'Bots',
    path: '/bots',
    icon: 'kind-icon:robot-color',
  },
  {
    key: 'art',
    label: 'Art',
    path: '/art',
    icon: 'kind-icon:palette',
  },
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
  {
    key: 'lab',
    label: 'Lab',
    path: '/wonderlab',
    icon: 'kind-icon:foundry',
  },
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
  {
    key: 'dreams',
    label: 'Dreams',
    path: '/dreams',
    icon: 'kind-icon:moon',
  },
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

const fallbackTab = computed<DashboardTabConfig>(() => {
  const key = props.activeTab || props.tabs[0]?.key || 'overview'
  const label = props.activeTab || props.tabs[0]?.label || 'Overview'

  return {
    key,
    label,
    icon: fallbackIcon,
    title: label,
    summary: '',
  }
})

const activeTabConfig = computed<DashboardTabConfig>(() => {
  return (
    props.tabs.find((tab) => tab.key === props.activeTab) ??
    props.tabs[0] ??
    fallbackTab.value
  )
})

const normalizedActiveTab = computed(() => activeTabConfig.value.key)

const activeTitle = computed(() => {
  return activeTabConfig.value.title || activeTabConfig.value.label
})

const activeSummary = computed(() => {
  return activeTabConfig.value.summary || props.summary || ''
})

const activeChannel = computed(() => {
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

function isChannelActive(channel: ChannelRoute) {
  if (route.path === channel.path) return true
  return channel.path !== '/' && route.path.startsWith(`${channel.path}/`)
}

function toggleChannels() {
  showChannels.value = !showChannels.value
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target

  if (!(target instanceof Node)) return
  if (channelMenuRef.value?.contains(target)) return

  showChannels.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
