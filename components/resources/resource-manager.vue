<!-- /components/resources/resource-manager.vue -->
<!--
  The /resources route owner: Library, Discover, and Downloads (the durable
  model import queue).

  WHY THIS EXISTS RATHER THAN pages/resources.vue
  -----------------------------------------------
  This was a standalone Nuxt page, and a standalone page SHADOWS the content
  route. `content/resources.md` — with its `channelKey: play`, `tabKey:
  resources`, backdrop art and loading copy — therefore never ran, so landing on
  /resources left the channel nav sitting on whatever it showed last. Silas,
  2026-08-07: "when I load it, it doesn't change dashboard entry. I truly don't
  understand that one."

  That is the reason. Every other model route is an MDC mount from content, gets
  its channel and tab from the front matter, and updates the nav on arrival;
  /resources was the one page opted out of that machinery by existing as a file.

  The old page also drew its Library/Discover tabs in a `tabs-boxed` strip above
  everything, outside the page surface, which is the band Silas described as "a
  weird library and discover icon set in a dedicated space above everything,
  partially occluded by the background". The switch now docks into the header
  strip: on Library through resource-gallery's `#tabs` slot (beside Add and
  Refresh), on Discover and Downloads through this file's own header-page-bar.

  The tab stays a URL param, per the repo's linkable-routes convention — the
  same reason the old page used one.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-2">
    <resource-gallery v-if="activeTab === 'library'" class="min-h-0 flex-1">
      <template #tabs>
        <div
          role="tablist"
          class="flex max-w-full items-center gap-1 overflow-x-auto"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            type="button"
            class="btn btn-xs shrink-0 gap-1 rounded-2xl"
            :class="activeTab === tab.key ? 'btn-primary' : 'btn-ghost'"
            :aria-selected="activeTab === tab.key"
            :title="tab.label"
            @click="selectTab(tab.key)"
          >
            <Icon :name="tab.icon" class="kr-icon-3-5" />
            <span class="whitespace-nowrap">{{ tab.label }}</span>
          </button>
          <NuxtLink
            to="/admin/lora-triage"
            class="btn btn-xs gap-1 rounded-2xl btn-ghost"
            title="Open LoRA triage"
          >
            <Icon name="kind-icon:checklist" class="kr-icon-3-5" />
            <span class="hidden sm:inline">LoRA Triage</span>
          </NuxtLink>
        </div>
      </template>
    </resource-gallery>

    <template v-else>
      <!-- Discover and Downloads have no gallery header to host the switch,
           so they dock it into the header strip themselves. -->
      <header-page-bar>
        <div
          role="tablist"
          class="flex max-w-full min-w-0 items-center gap-1 overflow-x-auto"
        >
          <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            type="button"
            class="btn btn-xs shrink-0 gap-1 rounded-2xl"
            :class="activeTab === tab.key ? 'btn-primary' : 'btn-ghost'"
            :aria-selected="activeTab === tab.key"
            :title="tab.label"
            @click="selectTab(tab.key)"
          >
            <Icon :name="tab.icon" class="kr-icon-3-5" />
            <span class="whitespace-nowrap">{{ tab.label }}</span>
          </button>
          <NuxtLink
            to="/admin/lora-triage"
            class="btn btn-xs gap-1 rounded-2xl btn-ghost"
            title="Open LoRA triage"
          >
            <Icon name="kind-icon:checklist" class="kr-icon-3-5" />
            <span class="hidden sm:inline">LoRA Triage</span>
          </NuxtLink>
        </div>
      </header-page-bar>

      <lora-discover v-if="activeTab === 'discover'" class="min-h-0 flex-1" />
      <resource-downloads v-else class="min-h-0 flex-1" />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type TabKey = 'library' | 'discover' | 'downloads'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'library', label: 'Library', icon: 'kind-icon:database' },
  { key: 'discover', label: 'Discover', icon: 'kind-icon:search' },
  { key: 'downloads', label: 'Downloads', icon: 'kind-icon:download' },
]

const route = useRoute()
const router = useRouter()

const activeTab = computed<TabKey>(() => {
  const requested = String(route.query.tab ?? '').toLowerCase()
  return tabs.some((tab) => tab.key === requested)
    ? (requested as TabKey)
    : 'library'
})

function selectTab(key: TabKey) {
  if (key === activeTab.value) return
  router.replace({ query: { ...route.query, tab: key } })
}
</script>
