<!-- /components/navigation/navigation-health.vue -->
<template>
  <section class="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6">
    <header
      class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
    >
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
      <article class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div class="stat-title">Channels</div>
        <div class="stat-value text-primary">{{ channels.length }}</div>
        <div class="stat-desc">Resolved parent documents</div>
      </article>

      <article class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div class="stat-title">Tabs</div>
        <div class="stat-value">{{ totalTabs }}</div>
        <div class="stat-desc">Resolved child documents</div>
      </article>

      <article class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div class="stat-title">Shared routes</div>
        <div class="stat-value text-secondary">{{ sharedRouteGroups.length }}</div>
        <div class="stat-desc">Groups using ?tab= addressing</div>
      </article>

      <article class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div class="stat-title">Legacy adapters</div>
        <div class="stat-value text-warning">{{ legacyAdapterCount }}</div>
        <div class="stat-desc">Tabs bridging old dashboards</div>
      </article>

      <article class="stat rounded-2xl border border-base-300 bg-base-100 shadow-sm">
        <div class="stat-title">Broken artwork</div>
        <div class="stat-value" :class="brokenImages.size ? 'text-error' : 'text-success'">
          {{ brokenImages.size }}
        </div>
        <div class="stat-desc">Detected by browser image loading</div>
      </article>
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

    <section class="grid gap-4 xl:grid-cols-2">
      <article
        v-for="channel in channels"
        :key="channel.channelKey"
        class="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
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

const channelContentStore = useChannelContentStore()
const brokenImages = ref(new Set<string>())

await channelContentStore.initialize()

const channels = computed(() => channelContentStore.channels)
const totalTabs = computed(() =>
  channels.value.reduce((total, channel) => total + channel.tabs.length, 0),
)
const legacyAdapterCount = computed(() =>
  channels.value.reduce(
    (total, channel) =>
      total + channel.tabs.filter((tab) => Boolean(tab.dashboardKey)).length,
    0,
  ),
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
