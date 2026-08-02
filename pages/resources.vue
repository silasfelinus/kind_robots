<!-- /pages/resources.vue -->
<!--
  Resource Library — the single home for every generation resource: checkpoints,
  LoRAs, embeddings, and other tools. One endpoint, two tabs (URL-param driven so
  each view is linkable, per repo convention):

    - Library    browse / filter / add / edit / preview  (<resource-gallery>)
    - Discover   browse Civitai / CivArchive + queue downloads (<lora-discover>)
-->
<template>
  <div class="kr-surface p-3">
    <div role="tablist" class="tabs tabs-boxed w-fit self-center">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        role="tab"
        class="tab"
        :class="{ 'tab-active': activeTab === tab.key }"
        type="button"
        @click="selectTab(tab.key)"
      >
        <Icon :name="tab.icon" class="mr-1 h-4 w-4" />
        {{ tab.label }}
      </button>
    </div>

    <div class="kr-scroll">
      <resource-gallery v-if="activeTab === 'library'" />
      <lora-discover v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

useHead({ title: 'Resource Library' })

type TabKey = 'library' | 'discover'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'library', label: 'Library', icon: 'kind-icon:database' },
  { key: 'discover', label: 'Discover', icon: 'kind-icon:search' },
]

const route = useRoute()
const router = useRouter()

const activeTab = computed<TabKey>(() => {
  const requested = String(route.query.tab ?? '').toLowerCase()
  return tabs.some((tab) => tab.key === requested) ? (requested as TabKey) : 'library'
})

function selectTab(key: TabKey) {
  if (key === activeTab.value) return
  router.replace({ query: { ...route.query, tab: key } })
}
</script>
