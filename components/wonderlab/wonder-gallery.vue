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
          <icon name="kind-icon:sparkles" class="h-9 w-9 text-accent" />
        </div>

        <div class="min-w-0">
          <h1 class="truncate text-2xl font-black">WonderLab</h1>
          <p class="truncate text-sm text-base-content/60">
            Games, component spelunking, and screen goblinry.
          </p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
        <button
          v-for="section in sections"
          :key="section.key"
          type="button"
          class="flex items-center gap-3 rounded-2xl border p-3 text-left transition"
          :class="sectionButtonClass(section.key)"
          @click="activeSection = section.key"
        >
          <icon :name="section.icon" class="h-5 w-5 shrink-0" />
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
        <span class="badge badge-accent">{{ activeLabel }}</span>
      </div>
    </header>

    <main
      class="mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <section
        v-if="activeSection === 'memory'"
        class="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden p-3 xl:grid-cols-[20rem_minmax(0,1fr)]"
      >
        <aside class="grid min-h-0 gap-3 overflow-y-auto">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h2 class="text-xl font-black">Memory Game</h2>
            <p class="mt-1 text-sm text-base-content/60">
              Biggest wow goes first. The lab has priorities.
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h3 class="text-lg font-black">New Game</h3>
            <div class="mt-3">
              <memory-game-select />
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h3 class="text-lg font-black">Leaderboard</h3>
            <div class="mt-3">
              <memory-leaderboard />
            </div>
          </div>
        </aside>

        <div
          class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200"
        >
          <memory-game />
        </div>
      </section>

      <section
        v-else-if="activeSection === 'button'"
        class="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden p-3 xl:grid-cols-[20rem_minmax(0,1fr)]"
      >
        <aside class="grid min-h-0 gap-3 overflow-y-auto">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h2 class="text-xl font-black">Button Game</h2>
            <p class="mt-1 text-sm text-base-content/60">
              A moral test disguised as a dopamine vending machine.
            </p>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
            <h3 class="text-lg font-black">Leaderboard</h3>
            <div class="mt-3">
              <button-game-leaderboard />
            </div>
          </div>
        </aside>

        <div
          class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200"
        >
          <button-game />
        </div>
      </section>

      <section
        v-else-if="activeSection === 'wonderlab'"
        class="h-full min-h-0 overflow-hidden"
      >
        <wonderlab />
      </section>

      <section
        v-else-if="activeSection === 'screenfx'"
        class="h-full min-h-0 overflow-y-auto p-3"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h2 class="text-xl font-black">Screen FX</h2>
          <p class="mt-1 text-sm text-base-content/60">
            Totally necessary visual chaos. For science.
          </p>
        </div>

        <div class="mt-3 rounded-2xl border border-base-300 bg-base-200 p-4">
          <screen-fx />
        </div>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
// /components/content/wonderlab/wonder-manager.vue
import { computed } from 'vue'
import { useNavStore, type WonderDashboardTab } from '@/stores/navStore'

type WonderManagerSection = {
  key: WonderDashboardTab
  label: string
  icon: string
  description: string
}

const navStore = useNavStore()

const activeSection = computed({
  get: () => navStore.wonderDashboardTab,
  set: (tab: WonderDashboardTab) => navStore.setWonderDashboardTab(tab),
})

const sections: WonderManagerSection[] = [
  {
    key: 'memory',
    label: 'Memory',
    icon: 'kind-icon:brain',
    description: 'Match cards and chase records',
  },
  {
    key: 'button',
    label: 'Button Game',
    icon: 'kind-icon:button',
    description: 'Pressing it was inevitable',
  },
  {
    key: 'wonderlab',
    label: 'WonderLab',
    icon: 'kind-icon:sparkles',
    description: 'Component folder browser',
  },
  {
    key: 'screenfx',
    label: 'Screen FX',
    icon: 'kind-icon:bubbles',
    description: 'Visual effects controls',
  },
]

const activeLabel = computed(
  () =>
    sections.find((section) => section.key === activeSection.value)?.label ??
    'Memory',
)

function sectionButtonClass(tab: WonderDashboardTab) {
  return activeSection.value === tab
    ? 'border-accent bg-accent/10 text-accent'
    : 'border-base-300 bg-base-200 hover:border-accent/60'
}
</script>
