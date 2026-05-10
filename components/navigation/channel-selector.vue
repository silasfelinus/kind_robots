<!-- /components/navigation/channel-selector.vue -->
<template>
  <nav
    class="grid h-full w-full grid-cols-5 gap-2 overflow-hidden rounded-2xl border border-base-300 bg-base-100/90 p-2 shadow-xl shadow-base-content/10 backdrop-blur"
    aria-label="Channel selector"
  >
    <button
      v-for="button in buttons"
      :key="button.key"
      type="button"
      :aria-label="button.label"
      :title="button.label"
      :class="[
        'group flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-2xl border border-base-300/80 bg-base-200/80 text-base-content shadow-lg shadow-base-content/10 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-content active:translate-y-0 active:scale-95',
        button.class,
      ]"
      @click="button.action"
    >
      <span
        class="flex h-full w-full flex-col items-center justify-center gap-1 rounded-[inherit] bg-linear-to-b from-white/15 to-transparent px-2 text-center"
      >
        <Icon
          :name="button.icon"
          class="h-5 w-5 shrink-0 transition-transform duration-300 ease-out group-hover:scale-110"
        />

        <span
          class="hidden max-w-full truncate text-[0.65rem] font-semibold uppercase tracking-wide opacity-80 sm:block"
        >
          {{ button.shortLabel }}
        </span>
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

type ChannelRoute = {
  key: string
  label: string
  path: string
}

type ChannelButton = {
  key: string
  label: string
  shortLabel: string
  icon: string
  class: string
  action: () => void
}

const route = useRoute()
const router = useRouter()
const displayStore = useDisplayStore()

const channels: ChannelRoute[] = [
  {
    key: 'home',
    label: 'Home',
    path: '/',
  },
  {
    key: 'screenfx',
    label: 'Screen FX',
    path: '/screenfx',
  },
  {
    key: 'bots',
    label: 'Bots',
    path: '/bots',
  },
  {
    key: 'art',
    label: 'Art',
    path: '/art',
  },
  {
    key: 'stories',
    label: 'Stories',
    path: '/stories',
  },
  {
    key: 'themes',
    label: 'Themes',
    path: '/themes',
  },
  {
    key: 'user',
    label: 'User',
    path: '/user',
  },
  {
    key: 'lab',
    label: 'Lab',
    path: '/wonderlab',
  },
  {
    key: 'brainstorm',
    label: 'Brainstorm',
    path: '/brainstorm',
  },
  {
    key: 'giftshop',
    label: 'Giftshop',
    path: '/giftshop',
  },
  {
    key: 'dreams',
    label: 'Dreams',
    path: '/dreams',
  },
  {
    key: 'rewards',
    label: 'Rewards',
    path: '/rewards',
  },
  {
    key: 'characters',
    label: 'Characters',
    path: '/characters',
  },
]

const activeChannelIndex = computed(() => {
  const exactIndex = channels.findIndex((channel) => {
    return route.path === channel.path
  })

  if (exactIndex >= 0) return exactIndex

  const nestedIndex = channels.findIndex((channel) => {
    return channel.path !== '/' && route.path.startsWith(`${channel.path}/`)
  })

  return nestedIndex >= 0 ? nestedIndex : 0
})

const fallbackChannel: ChannelRoute = {
  key: 'home',
  label: 'Home',
  path: '/',
}

function getWrappedChannel(step: -1 | 1): ChannelRoute {
  const total = channels.length

  if (total === 0) return fallbackChannel

  const nextIndex = (activeChannelIndex.value + step + total) % total

  return channels[nextIndex] ?? fallbackChannel
}

async function goToChannel(channel: ChannelRoute) {
  if (route.path === channel.path) return
  await router.push(channel.path)
}

function showPreviousChannel() {
  void goToChannel(getWrappedChannel(-1))
}

function showNextChannel() {
  void goToChannel(getWrappedChannel(1))
}

const previousChannel = computed(() => getWrappedChannel(-1))
const nextChannel = computed(() => getWrappedChannel(1))

const buttons = computed<ChannelButton[]>(() => [
  {
    key: 'left-sidebar',
    label: 'Toggle left sidebar',
    shortLabel: 'Left',
    icon: 'kind-icon:butterfly',
    class: 'hover:bg-secondary hover:text-secondary-content',
    action: () => displayStore.toggleLeftSidebar('forward'),
  },
  {
    key: 'previous-channel',
    label: `Go to ${previousChannel.value.label}`,
    shortLabel: previousChannel.value.label,
    icon: 'kind-icon:chevron-left',
    class: 'hover:bg-accent hover:text-accent-content',
    action: showPreviousChannel,
  },
  {
    key: 'header-toggle',
    label: 'Show header',
    shortLabel: 'Header',
    icon: 'kind-icon:chevron-up',
    class:
      'border-primary/60 bg-primary/15 text-primary hover:bg-primary hover:text-primary-content',
    action: () => displayStore.toggleHeader('open'),
  },
  {
    key: 'next-channel',
    label: `Go to ${nextChannel.value.label}`,
    shortLabel: nextChannel.value.label,
    icon: 'kind-icon:chevron-right',
    class: 'hover:bg-accent hover:text-accent-content',
    action: showNextChannel,
  },
  {
    key: 'right-sidebar',
    label: 'Toggle right sidebar',
    shortLabel: 'Right',
    icon: 'kind-icon:sidebar-right',
    class: 'hover:bg-info hover:text-info-content',
    action: () => displayStore.toggleRightSidebar('forward'),
  },
])
</script>
