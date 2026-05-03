<!-- /components/content/wonderlab/lab-manager.vue -->
<template>
  <section
    class="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-2xl bg-base-300 p-3"
  >
    <header
      class="grid shrink-0 grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-accent bg-accent/10"
        >
          <Icon name="kind-icon:sparkles" class="h-9 w-9 text-accent" />
        </div>

        <div class="min-w-0">
          <h1 class="truncate text-2xl font-black">WonderLab</h1>
          <p class="truncate text-sm text-base-content/60">
            Games, component spelunking, and screen goblinry.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
        <button
          v-for="section in sections"
          :key="section.key"
          type="button"
          class="flex items-center gap-3 rounded-2xl border p-3 text-left transition"
          :class="sectionButtonClass(section.key)"
          @click="activeSection = section.key"
        >
          <Icon :name="section.icon" class="h-5 w-5 shrink-0" />

          <span class="min-w-0">
            <span class="block truncate text-sm font-black">
              {{ section.label }}
            </span>

            <span class="hidden truncate text-xs text-base-content/55 xl:block">
              {{ section.description }}
            </span>
          </span>
        </button>
      </div>

      <div class="flex items-center justify-end">
        <span class="badge badge-accent">
          {{ activeLabel }}
        </span>
      </div>
    </header>

    <main
      class="mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <component :is="activeComponent" class="h-full w-full" />
    </main>
  </section>
</template>

<script setup lang="ts">
// /components/content/wonderlab/lab-manager.vue
import { computed, type Component } from 'vue'
import { useNavStore } from '@/stores/navStore'

import MemoryDungeon from '@/components/pages/memory-dungeon.vue'
import WonderLab from '@/components/wonderlab/lab-manager.vue'
import ScreenFx from '@/components/screenfx/screen-fx.vue'
import RebelButton from '@/components/pages/rebel-button.vue'

type WonderDashboardTab =
  | 'memory-dungeon'
  | 'rebel-button'
  | 'wonder-lab'
  | 'screen-fx'

type WonderManagerSection = {
  key: WonderDashboardTab
  label: string
  icon: string
  description: string
}

const navStore = useNavStore()

const sections: WonderManagerSection[] = [
  {
    key: 'memory-dungeon',
    label: 'Dungeon',
    icon: 'kind-icon:dragon',
    description: 'Memory roguelite rewards',
  },
  {
    key: 'rebel-button',
    label: 'Rebel Button',
    icon: 'kind-icon:button',
    description: 'Pressing it was inevitable',
  },
  {
    key: 'wonder-lab',
    label: 'WonderLab',
    icon: 'kind-icon:sparkles',
    description: 'Component folder browser',
  },
  {
    key: 'screen-fx',
    label: 'Screen FX',
    icon: 'kind-icon:bubbles',
    description: 'Visual effects controls',
  },
]

const componentMap: Record<WonderDashboardTab, Component> = {
  'memory-dungeon': MemoryDungeon,
  'rebel-button': RebelButton,
  'wonder-lab': WonderLab,
  'screen-fx': ScreenFx,
}

const activeSection = computed<WonderDashboardTab>({
  get: () => {
    const tab = navStore.getDashboardTab('wonder')

    if (isWonderDashboardTab(tab)) {
      return tab
    }

    return 'memory-dungeon'
  },
  set: (tab: WonderDashboardTab) => {
    navStore.setDashboardTab('wonder', tab)
  },
})

const activeComponent = computed(() => {
  return componentMap[activeSection.value] ?? MemoryDungeon
})

const activeLabel = computed(() => {
  return (
    sections.find((section) => section.key === activeSection.value)?.label ??
    'Memory'
  )
})

function isWonderDashboardTab(value: string): value is WonderDashboardTab {
  return sections.some((section) => section.key === value)
}

function sectionButtonClass(tab: WonderDashboardTab) {
  return activeSection.value === tab
    ? 'border-accent bg-accent/10 text-accent'
    : 'border-base-300 bg-base-200 hover:border-accent/60'
}
</script>
