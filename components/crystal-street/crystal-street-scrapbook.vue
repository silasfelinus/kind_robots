<template>
  <section
    class="kr-panes grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-3"
    aria-label="Scrapbook"
  >
    <nav
      class="cs-frame flex flex-wrap items-center gap-1 px-3 py-2"
      aria-label="Scrapbook sections"
    >
      <h2 class="cs-display mr-auto text-xl">Scrapbook</h2>
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        class="btn btn-xs rounded-2xl @2xl:btn-sm"
        :class="tab === t.id ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="tab === t.id"
        :data-testid="`cs-scrapbook-${t.id}`"
        @click="tab = t.id"
      >
        <icon :name="t.icon" class="h-4 w-4" />
        <span>{{ t.label }}</span>
        <span class="cs-micro opacity-75">{{ t.count() }}</span>
      </button>
    </nav>
    <crystal-street-weeks v-if="tab === 'weeks'" />
    <crystal-street-gallery
      v-else-if="tab === 'nightmares'"
      :initial="focusVillain"
      @endings="showEndings"
    />
    <crystal-street-endings
      v-else-if="tab === 'endings'"
      :initial="focusVillain"
    />
    <crystal-street-crew v-else roster />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCrystalStreetStore } from '~/stores/crystalStreetStore'
import { villainEndings } from '~/utils/crystalStreet/rules'
import type { ScrapbookTab } from '~/utils/crystalStreet/menu'

const props = defineProps<{ initial?: ScrapbookTab }>()

const store = useCrystalStreetStore()
const tab = ref<ScrapbookTab>(props.initial ?? 'weeks')
const focusVillain = ref<string | undefined>()

const TABS: {
  id: ScrapbookTab
  label: string
  icon: string
  count: () => string
}[] = [
  {
    id: 'weeks',
    label: 'Weeks',
    icon: 'kind-icon:book',
    count: () => String(store.scrapbook.runs.length),
  },
  {
    id: 'nightmares',
    label: 'Nightmares',
    icon: 'kind-icon:mask',
    count: () => String(store.metVillains.size),
  },
  {
    id: 'endings',
    label: 'Endings',
    icon: 'kind-icon:trophy',
    count: () => String(villainEndings(store.scrapbook.endings).length),
  },
  {
    id: 'friends',
    label: 'Friends',
    icon: 'kind-icon:users',
    count: () => String(store.scrapbook.friends.length),
  },
]

function showEndings(villainId: string): void {
  focusVillain.value = villainId
  tab.value = 'endings'
}
</script>
