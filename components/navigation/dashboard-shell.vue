// /components/content/navigation/dashboard-shell.vue
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

if (import.meta.client) {
  navStore.hydrateFromLocalStorage()
}

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
    const matched = resolvedTabs.value.find((tab) => tab.key === requested)
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
