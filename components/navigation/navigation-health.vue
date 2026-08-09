<!-- /components/navigation/navigation-health.vue -->
<template>
  <section class="kr-container-wide flex flex-col gap-4 p-4 sm:p-6">
    <header class="overflow-hidden kr-panel p-0">
      <div class="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:compass" class="h-6 w-6 text-primary" />
            <h1 class="text-xl font-black sm:text-2xl">Navigation Health</h1>
          </div>
          <p class="mt-2 max-w-3xl text-sm leading-relaxed text-base-content/65">
            Inspect the resolved Nuxt Content navigation graph, route sharing,
            compatibility adapters, permissions, and artwork failures from one
            operational view.
          </p>
        </div>

        <button
          type="button"
          class="btn btn-ghost btn-sm shrink-0 rounded-xl"
          :disabled="channelContentStore.loading"
          @click="refresh"
        >
          <span
            v-if="channelContentStore.loading"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Reload content
        </button>
      </div>
    </header>

    <div
      v-if="channelContentStore.lastError"
      class="alert alert-error rounded-2xl border border-error/30"
    >
      <Icon name="kind-icon:error" class="h-5 w-5" />
      <span>{{ channelContentStore.lastError }}</span>
    </div>

    <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <kr-stat-tile
        title="Channels"
        :value="channels.length"
        tone="primary"
        desc="Resolved parent documents"
      />

      <kr-stat-tile title="Tabs" :value="totalTabs" desc="Resolved child documents" />

      <kr-stat-tile
        title="Shared routes"
        :value="sharedRouteGroups.length"
        tone="secondary"
        desc="Groups using ?tab= addressing"
      />

      <kr-stat-tile
        title="Legacy adapters"
        :value="`${legacyAdapterCount - legacyAdapterFailureCount}/${legacyAdapterCount}`"
        :tone="legacyAdapterFailureCount ? 'error' : 'warning'"
        :desc="
          legacyAdapterFailureCount
            ? `${legacyAdapterFailureCount} failing navManifest validation`
            : 'Tabs bridging old dashboards, all resolving'
        "
      />

      <kr-stat-tile
        title="Broken artwork"
        :value="brokenImages.size"
        :tone="brokenImages.size ? 'error' : 'success'"
        desc="Detected by browser image loading"
      />
    </section>

    <section
      v-if="sharedRouteGroups.length"
      class="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 shadow-sm"
    >
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:link" class="h-5 w-5 text-secondary" />
        <h2 class="font-black">Shared-route groups</h2>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <span
          v-for="group in sharedRouteGroups"
          :key="`${group.channelKey}:${group.route}`"
          class="badge badge-secondary badge-outline h-auto gap-1 whitespace-normal py-1.5"
        >
          <strong>{{ group.channelKey }}</strong>
          <span>{{ group.route }}</span>
          <span>({{ group.tabs.join(', ') }})</span>
        </span>
      </div>
    </section>

    <section
      v-if="manifestIssues.length"
      class="rounded-2xl border border-error/30 bg-error/5 p-4 shadow-sm"
    >
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:error" class="h-5 w-5 text-error" />
        <h2 class="font-black">Nav manifest issues</h2>
      </div>
      <ul class="mt-3 flex flex-col gap-1.5">
        <li
          v-for="issue in manifestIssues"
          :key="`${issue.channelKey}:${issue.tabKey}:${issue.message}`"
          class="text-sm"
          :class="issue.severity === 'error' ? 'text-error' : 'text-warning'"
        >
          <strong>{{ issue.channelKey }}/{{ issue.tabKey }}</strong>: {{ issue.message }}
        </li>
      </ul>
    </section>

    <section class="grid gap-4 xl:grid-cols-2">
      <article
        v-for="channel in channels"
        :key="channel.channelKey"
        class="overflow-hidden kr-panel p-0"
      >
        <header class="relative overflow-hidden border-b border-base-300 p-4">
          <img
            v-if="channel.image"
            :src="channel.image"
            :alt="channel.title"
            class="absolute inset-0 -z-10 h-full w-full object-cover opacity-10"
            @error="markBroken(channel.image)"
          />
          <div class="absolute inset-0 -z-10 bg-base-100/85" />

          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-base-300 bg-base-200"
              >
                <Icon :name="channel.icon" class="h-5 w-5" />
              </span>
              <div class="min-w-0">
                <h2 class="truncate text-lg font-black">{{ channel.label }}</h2>
                <p class="truncate text-xs font-bold text-base-content/45">
                  {{ channel.channelKey }} · {{ channel.route }}
                </p>
                <p class="mt-1 line-clamp-2 text-sm text-base-content/65">
                  {{ channel.description || channel.summary || channel.subtitle }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 flex-col items-end gap-1">
              <span class="badge badge-primary badge-outline">
                {{ channel.tabs.length }} tabs
              </span>
              <span v-if="channel.requiredRole" class="badge badge-warning badge-sm">
                {{ channel.requiredRole }}
              </span>
            </div>
          </div>
        </header>

        <div class="divide-y divide-base-300">
          <div
            v-for="tab in channel.tabs"
            :key="tab.tabKey"
            class="flex items-start gap-3 p-3"
          >
            <span
              class="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-base-300 bg-base-200"
            >
              <img
                v-if="tab.image"
                :src="tab.image"
                :alt="tab.title"
                class="h-full w-full object-cover"
                @error="markBroken(tab.image)"
              />
              <span
                class="absolute inset-0 flex items-center justify-center bg-base-content/15"
              >
                <Icon :name="tab.icon || channel.icon" class="h-4 w-4 text-base-100" />
              </span>
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="font-black">{{ tab.label }}</span>
                <span
                  v-if="tab.tabKey === channel.defaultTab"
                  class="badge badge-primary badge-xs"
                >
                  default
                </span>
                <span
                  v-if="tab.dashboardKey"
                  class="badge badge-warning badge-outline badge-xs"
                >
                  {{ tab.dashboardKey }}/{{ tab.dashboardTab }}
                </span>
                <span v-if="tab.requiredRole" class="badge badge-error badge-outline badge-xs">
                  {{ tab.requiredRole }}
                </span>
              </div>
              <p class="mt-0.5 truncate text-xs font-semibold text-base-content/45">
                {{ tab.tabKey }} · {{ tab.route }}
              </p>
              <p class="mt-1 line-clamp-2 text-xs text-base-content/65">
                {{ tab.description || tab.summary || tab.subtitle }}
              </p>
              <p
                v-if="brokenImages.has(tab.image)"
                class="mt-1 break-all text-xs font-bold text-error"
              >
                Missing: {{ tab.image }}
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChannelContentStore } from '@/stores/channelContentStore'
import { validateNavManifest, type NavManifestEntry } from '@/utils/navManifest'

const channelContentStore = useChannelContentStore()
const brokenImages = ref(new Set<string>())

await channelContentStore.initialize()

const channels = computed(() => channelContentStore.channels)
const totalTabs = computed(() =>
  channels.value.reduce((total, channel) => total + channel.tabs.length, 0),
)

const manifestEntries = computed<NavManifestEntry[]>(() =>
  channels.value.flatMap((channel) =>
    channel.tabs.map((tab) => ({
      file: `${tab.channelKey}/${tab.tabKey}`,
      channelKey: tab.channelKey,
      tabKey: tab.tabKey,
      dashboardKey: tab.dashboardKey,
      dashboardTab: tab.dashboardTab,
      cardsKey: typeof tab.cards === 'string' ? tab.cards : '',
      route: tab.route,
    })),
  ),
)
const manifestIssues = computed(() => validateNavManifest(manifestEntries.value))
const manifestErrors = computed(() =>
  manifestIssues.value.filter((issue) => issue.severity === 'error'),
)

const legacyAdapterTabs = computed(() =>
  channels.value.flatMap((channel) =>
    channel.tabs.filter((tab) => Boolean(tab.dashboardKey)),
  ),
)
const legacyAdapterCount = computed(() => legacyAdapterTabs.value.length)
const legacyAdapterFailureCount = computed(
  () =>
    legacyAdapterTabs.value.filter((tab) =>
      manifestErrors.value.some(
        (issue) => issue.channelKey === tab.channelKey && issue.tabKey === tab.tabKey,
      ),
    ).length,
)
const sharedRouteGroups = computed(() => {
  return channels.value.flatMap((channel) => {
    const routes = new Map<string, string[]>()

    for (const tab of channel.tabs) {
      const current = routes.get(tab.route) ?? []
      current.push(tab.tabKey)
      routes.set(tab.route, current)
    }

    return Array.from(routes.entries())
      .filter(([, tabs]) => tabs.length > 1)
      .map(([route, tabs]) => ({
        channelKey: channel.channelKey,
        route,
        tabs,
      }))
  })
})

function markBroken(image: string): void {
  if (!image) return
  brokenImages.value = new Set([...brokenImages.value, image])
}

async function refresh(): Promise<void> {
  brokenImages.value = new Set()
  await channelContentStore.initialize(true)
}
</script>
