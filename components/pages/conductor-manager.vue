<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden">
    <header class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <p class="text-xs font-bold uppercase tracking-wide text-primary/70">Conductor</p>
        <h2 class="text-xl font-black leading-tight">Agent Cockpit</h2>
      </div>
      <div role="tablist" class="tabs tabs-boxed w-fit max-w-full overflow-x-auto">
        <button v-for="tab in conductorTabs" :key="tab.key" type="button" role="tab" class="tab gap-1 text-xs sm:text-sm" :class="activeTab === tab.key ? 'tab-active' : ''" @click="setActiveTab(tab.key)">
          <Icon :name="tab.icon" class="size-4" />
          {{ tab.label }}
        </button>
      </div>
    </header>

    <section v-if="activeTab === 'conductor'" class="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ConductorPage class="h-full min-h-0 flex-1 overflow-hidden" :show-header="false" />
    </section>

    <section v-else-if="activeTab === 'portos'" class="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <PortosPage class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <div v-else class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning">
      Unknown Conductor tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ConductorPage from '@/components/pages/conductor-page.vue'
import PortosPage from '@/components/pages/portos-page.vue'
import { conductorTabs, type ConductorTabKey } from '@/stores/helpers/conductorTabs'

const activeTab = ref<ConductorTabKey>('conductor')

function setActiveTab(tab: ConductorTabKey) {
  activeTab.value = tab
}
</script>
