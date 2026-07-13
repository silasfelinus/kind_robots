<!-- /components/navigation/channel-select.vue -->
<template>
  <div class="dropdown">
    <button
      tabindex="0"
      type="button"
      class="flex h-10 min-h-10 shrink-0 items-center gap-2 overflow-hidden rounded-xl border border-base-300 bg-base-100 px-2 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:h-11 sm:min-h-11 xl:h-14 xl:min-h-14 xl:gap-2.5 xl:px-3"
      :title="`Channel: ${activeChannel.label}`"
    >
      <span
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-base-300/70 bg-base-200 sm:h-9 sm:w-9 xl:h-10 xl:w-10"
      >
        <Icon
          :name="activeChannel.icon"
          class="h-4 w-4 shrink-0 xl:h-5 xl:w-5"
        />
      </span>

      <span class="truncate text-sm font-black sm:text-base xl:text-lg">
        {{ activeChannel.label }}
      </span>

      <Icon
        name="kind-icon:chevron-down"
        class="h-3.5 w-3.5 shrink-0 text-base-content/50 xl:h-4 xl:w-4"
      />
    </button>

    <ul
      tabindex="0"
      class="menu dropdown-content z-110 mt-2 max-h-[min(32rem,calc(100dvh-5rem))] w-[min(14rem,calc(100vw-1rem))] flex-nowrap overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 shadow-2xl"
    >
      <li v-for="channel in visibleChannels" :key="channel.channelKey">
        <NuxtLink
          :to="channel.route"
          class="flex min-h-11 items-center gap-2 rounded-xl xl:min-h-12"
          :class="
            isChannelActive(channel) ? 'bg-primary text-primary-content' : ''
          "
          @click="closeDropdown"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-base-300/50 bg-base-200 xl:h-9 xl:w-9"
          >
            <Icon :name="channel.icon" class="h-4 w-4 shrink-0" />
          </span>
          <span class="truncate text-sm font-black xl:text-base">
            {{ channel.label }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  resolveChannels,
  type ResolvedChannel,
  type ChannelContentItem,
} from '@/stores/helpers/channelContent'
import { useUserStore } from '@/stores/userStore'

const route = useRoute()
const userStore = useUserStore()

const { data: navigationContent } = await useAsyncData(
  'navigation-content',
  () =>
    queryCollection('content')
      .where('contentType', 'IN', ['channel', 'tab'])
      .all(),
)

const allChannels = computed(() =>
  resolveChannels((navigationContent.value ?? []) as ChannelContentItem[]),
)

const visibleChannels = computed(() =>
  allChannels.value.filter(
    (channel) =>
      !channel.requiredRole || channel.requiredRole === userStore.role,
  ),
)

const fallbackChannel: ResolvedChannel = {
  channelKey: 'home',
  label: 'Home',
  title: 'Home',
  subtitle: '',
  description: '',
  summary: '',
  narrative: '',
  icon: 'kind-icon:home',
  image: '/images/channels/home/channel.webp',
  route: '/',
  defaultTab: 'dashboard',
  sort: 0,
  requiredRole: '',
  requiredPermission: '',
  dottiTip: '',
  amiTip: '',
  tabs: [],
}

const activeChannel = computed<ResolvedChannel>(
  () =>
    visibleChannels.value.find((channel) => isChannelActive(channel)) ??
    visibleChannels.value[0] ??
    fallbackChannel,
)

function isChannelActive(channel: ResolvedChannel): boolean {
  if (route.path === channel.route) return true
  return channel.route !== '/' && route.path.startsWith(`${channel.route}/`)
}

function closeDropdown(): void {
  if (typeof document !== 'undefined') {
    const el = document.activeElement as HTMLElement | null
    el?.blur()
  }
}
</script>
