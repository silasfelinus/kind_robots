<!-- /components/navigation/navigation-trimmed.vue -->
<!--
  Home → Navigation directory. A live, full-site map built from the resolved
  channel graph (channelContentStore.visibleChannels), so it always reflects
  the current nav structure and the viewer's role/permission gating. Rendered
  on /navigation via the `:navigation-trimmed` MDC directive in
  content/navigation.md.
-->
<template>
  <section class="directory-home kr-unbound flex w-full flex-col gap-3">
    <header-page-bar>
      <label
        class="relative ml-auto flex w-full max-w-sm min-w-0 items-center"
        title="Find your next adventure: every game, story, studio and workshop in one place."
      >
        <Icon
          name="kind-icon:search"
          class="pointer-events-none absolute left-3 h-4 w-4 text-base-content/50"
        />
        <input
          v-model="query"
          type="search"
          placeholder="Search destinations…"
          aria-label="Search destinations"
          class="kr-input-rounded-xl h-9 w-full pl-9 text-sm"
        />
      </label>
    </header-page-bar>

    <div class="space-y-4 pb-4 sm:space-y-5">
      <p
        v-if="!filteredChannels.length"
        class="rounded-2xl border border-base-300 bg-base-100/95 p-6 text-center text-sm text-base-content/75"
      >
        No destinations match “{{ query }}”.
      </p>

      <section
        v-for="channel in filteredChannels"
        :key="channel.channelKey"
        :aria-label="channel.label"
        class="rounded-3xl border border-base-300/75 bg-base-100/95 p-3 shadow-md sm:p-4"
      >
        <header class="mb-3 flex items-center gap-3">
          <span
            class="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary"
          >
            <Icon :name="channel.icon" class="size-6" />
          </span>
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-black leading-tight text-base-content">
              {{ channel.label }}
            </h2>
            <p
              v-if="channel.summary || channel.description"
              class="line-clamp-2 text-xs leading-snug text-base-content/65 sm:text-sm"
            >
              {{ channel.summary || channel.description }}
            </p>
          </div>
          <span
            class="hidden shrink-0 rounded-full border border-base-300 bg-base-200 px-3 py-1 text-xs font-bold text-base-content/65 sm:inline-flex"
          >
            {{ channel.visibleTabs.length }}
            {{
              channel.visibleTabs.length === 1 ? 'destination' : 'destinations'
            }}
          </span>
        </header>

        <ul
          class="directory-grid grid gap-3"
          :aria-label="channel.label + ' destinations'"
        >
          <li
            v-for="tab in channel.visibleTabs"
            :key="tab.tabKey"
            class="min-w-0"
          >
            <NuxtLink
              :to="tabTo(channel, tab)"
              class="group flex h-full min-h-32 min-w-0 items-stretch gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-2.5 text-base-content shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span
                class="relative min-h-28 w-28 shrink-0 self-stretch overflow-hidden rounded-xl bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 sm:w-36"
              >
                <NavigationArtwork :src="tab.image" alt="" />
                <span
                  class="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-xl border border-base-100/80 bg-base-100/90 text-primary shadow-sm backdrop-blur-sm"
                >
                  <Icon :name="tab.icon || channel.icon" class="size-4" />
                </span>
              </span>

              <span class="flex min-w-0 flex-1 flex-col gap-2 py-1 pr-0.5">
                <span class="flex items-start justify-between gap-2">
                  <span
                    class="min-w-0 text-base font-black leading-snug text-base-content transition group-hover:text-primary"
                  >
                    {{ tab.label }}
                  </span>
                  <Icon
                    name="kind-icon:arrow-right"
                    class="mt-0.5 size-4 shrink-0 text-primary/65 transition group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </span>
                <span
                  v-if="tab.summary || tab.description"
                  class="line-clamp-3 text-sm leading-snug text-base-content/70"
                >
                  {{ tab.summary || tab.description }}
                </span>
                <span
                  v-if="isAdminOnlyTab(channel, tab)"
                  class="mt-auto w-fit rounded-full bg-warning/20 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide text-warning-content"
                  title="Admin-only page"
                >
                  Admin only
                </span>
              </span>
            </NuxtLink>
          </li>
        </ul>
      </section>
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
import {
  navigationDestinations,
  navigationTabs,
} from '@/utils/channelTabGroups'

type DirectoryChannel = ResolvedChannel & { visibleTabs: ResolvedTab[] }

const channelContentStore = useChannelContentStore()
const query = ref('')

await channelContentStore.initialize()

const visibleChannels = computed(() => channelContentStore.navigationChannels)

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
      const tabs = navigationDestinations(channel)
      const matchingParentKeys = new Set(
        navigationTabs(channel)
          .filter((tab) => tabMatches(tab, needle))
          .map((tab) => tab.tabKey),
      )
      const visibleTabs = !needle
        ? tabs
        : channelHit
          ? tabs
          : tabs.filter(
              (tab) =>
                tabMatches(tab, needle) ||
                (!!tab.parentTabKey &&
                  matchingParentKeys.has(tab.parentTabKey)),
            )

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

<style scoped>
.directory-home {
  container-type: inline-size;
}

.directory-grid {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 21rem), 1fr));
}

@container (min-width: 80rem) {
  .directory-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
