<!-- /components/navigation/navigation-trimmed.vue -->
<!--
  Home → Navigation directory. A live, full-site map built from the resolved
  channel graph (channelContentStore.visibleChannels), so it always reflects
  the current nav structure and the viewer's role/permission gating. Rendered
  on /navigation via the `:navigation-trimmed` MDC directive in
  content/navigation.md.
-->
<template>
  <section class="flex w-full flex-col gap-5">
    <header class="flex flex-col gap-3">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="flex min-w-0 flex-col">
          <h2 class="text-xl font-black sm:text-2xl">Explore Kind Robots</h2>
          <p class="text-sm text-base-content/60">
            Every place you can go, grouped by channel.
          </p>
        </div>

        <label class="relative flex w-full max-w-xs items-center sm:w-64">
          <Icon
            name="kind-icon:search"
            class="pointer-events-none absolute left-3 h-4 w-4 text-base-content/50"
          />
          <input
            v-model="query"
            type="search"
            placeholder="Search destinations…"
            aria-label="Search destinations"
            class="input input-bordered h-10 w-full rounded-xl pl-9 text-sm"
          />
        </label>
      </div>
    </header>

    <p
      v-if="!filteredChannels.length"
      class="kr-panel-flat p-6 text-center text-sm text-base-content/60"
    >
      No destinations match “{{ query }}”.
    </p>

    <div
      v-for="channel in filteredChannels"
      :key="channel.channelKey"
      class="flex flex-col gap-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-base-300/70 bg-base-200"
        >
          <Icon :name="channel.icon" class="h-5 w-5" />
        </span>
        <div class="flex min-w-0 flex-col leading-tight">
          <h3 class="truncate text-base font-black">{{ channel.label }}</h3>
          <p
            v-if="channel.summary || channel.description"
            class="line-clamp-1 text-xs text-base-content/55"
          >
            {{ channel.summary || channel.description }}
          </p>
        </div>
      </div>

      <ul
        class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
        :aria-label="`${channel.label} destinations`"
      >
        <li v-for="tab in channel.visibleTabs" :key="tab.tabKey">
          <NuxtLink
            :to="tabTo(channel, tab)"
            class="flex h-full items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-2 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <span
              class="relative flex h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-base-200"
            >
              <NavigationArtwork
                :src="tab.image"
                :alt="tab.title || tab.label"
              />
              <span
                class="absolute inset-0 flex items-center justify-center bg-base-content/15"
              >
                <Icon
                  :name="tab.icon || channel.icon"
                  class="h-5 w-5 text-base-100 drop-shadow"
                />
              </span>
            </span>

            <span
              class="flex min-w-0 flex-1 flex-col items-start leading-tight"
            >
              <span class="flex max-w-full items-center gap-1">
                <span class="truncate text-sm font-black">
                  {{ tab.label }}
                </span>
                <span
                  v-if="isAdminOnlyTab(channel, tab)"
                  class="badge badge-warning badge-xs shrink-0 font-bold uppercase"
                  title="Admin-only page"
                >
                  Admin
                </span>
              </span>
              <span
                v-if="tab.summary || tab.description"
                class="line-clamp-2 text-xs font-medium text-base-content/60"
              >
                {{ tab.summary || tab.description }}
              </span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  ResolvedChannel,
  ResolvedTab,
} from '@/stores/helpers/channelContent'
import { useChannelContentStore } from '@/stores/channelContentStore'

type DirectoryChannel = ResolvedChannel & { visibleTabs: ResolvedTab[] }

const channelContentStore = useChannelContentStore()
const query = ref('')

await channelContentStore.initialize()

const visibleChannels = computed(() => channelContentStore.visibleChannels)

const normalizedQuery = computed(() => query.value.trim().toLowerCase())

function tabMatches(tab: ResolvedTab, needle: string): boolean {
  return [tab.label, tab.title, tab.summary, tab.description]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle))
}

const filteredChannels = computed<DirectoryChannel[]>(() => {
  const needle = normalizedQuery.value

  return visibleChannels.value
    .map((channel) => {
      const channelHit =
        !!needle &&
        [channel.label, channel.title, channel.summary, channel.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(needle))

      const visibleTabs = !needle
        ? channel.tabs
        : channelHit
          ? channel.tabs
          : channel.tabs.filter((tab) => tabMatches(tab, needle))

      return { ...channel, visibleTabs }
    })
    .filter((channel) => channel.visibleTabs.length > 0)
})

// Mirror channel-select.vue: when several tabs in a channel share one route,
// disambiguate with a ?tab= query so the correct tab activates.
function tabTo(channel: ResolvedChannel, tab: ResolvedTab) {
  const shared =
    channel.tabs.filter((item) => item.route === tab.route).length > 1

  return shared ? { path: tab.route, query: { tab: tab.tabKey } } : tab.route
}

// Mark admin-gated tabs that live outside the dedicated admin channel.
function isAdminOnlyTab(channel: ResolvedChannel, tab: ResolvedTab): boolean {
  return tab.requiredRole === 'ADMIN' && channel.channelKey !== 'admin'
}
</script>
