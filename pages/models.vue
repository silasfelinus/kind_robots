<!-- /pages/models.vue -->
<!--
  Model Library — the single home for installed generation models. One endpoint,
  three tabs (URL-param driven so each view is linkable, per repo convention):

    - Checkpoints  browse / filter / add / edit base models (<model-gallery>)
    - LoRAs        browse / filter / edit owned LoRAs        (<lora-gallery>)
    - Discover     browse Civitai / CivArchive + queue downloads (<lora-discover>)

  /lora redirects here (?tab=loras) so old bookmarks keep working.
-->
<template>
  <div class="flex h-full min-h-0 w-full flex-col gap-3 p-3">
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

    <div class="min-h-0 flex-1">
      <model-gallery v-if="activeTab === 'checkpoints'" />
      <lora-gallery v-else-if="activeTab === 'loras'" />
      <lora-discover v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

useHead({ title: 'Model Library' })

type TabKey = 'checkpoints' | 'loras' | 'discover'

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'checkpoints', label: 'Checkpoints', icon: 'kind-icon:blueprint' },
  { key: 'loras', label: 'LoRAs', icon: 'kind-icon:folder' },
  { key: 'discover', label: 'Discover', icon: 'kind-icon:search' },
]

const route = useRoute()
const router = useRouter()

const activeTab = computed<TabKey>(() => {
  const requested = String(route.query.tab ?? '').toLowerCase()
  return tabs.some((tab) => tab.key === requested)
    ? (requested as TabKey)
    : 'checkpoints'
})

function selectTab(key: TabKey) {
  if (key === activeTab.value) return
  router.replace({ query: { ...route.query, tab: key } })
}
</script>
