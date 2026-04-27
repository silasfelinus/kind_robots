<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-100/80 p-2"
  >
    <template v-if="isCompact">
      <div
        class="flex h-full w-full min-w-0 items-center gap-2 overflow-hidden"
      >
        <section
          class="flex h-full shrink-0 items-center gap-2 rounded-2xl border border-base-300 bg-base-200 px-2"
        >
          <icon name="kind-icon:sparkles" class="h-6 w-6 text-accent" />
          <div class="hidden min-w-0 sm:block">
            <p class="truncate text-sm font-black">WonderLab</p>
            <p class="truncate text-xs text-base-content/60">
              {{ activeLabel }}
            </p>
          </div>
        </section>

        <section
          class="flex h-full min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-2xl border border-base-300 bg-base-200 px-2"
        >
          <button
            v-for="link in footerLinks"
            :key="link.key"
            type="button"
            class="btn btn-xs sm:btn-sm min-w-12 shrink-0 rounded-2xl px-2"
            :class="activeButtonClass(link.key)"
            :title="link.label"
            @click="selectWonderTab(link.key)"
          >
            <icon :name="link.icon" class="h-4 w-4 shrink-0" />
            <span class="hidden md:inline">{{ link.shortLabel }}</span>
          </button>
        </section>
      </div>
    </template>

    <template v-else-if="isPriority">
      <div
        class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[18rem_minmax(0,1fr)]"
      >
        <section
          class="flex min-h-0 flex-col justify-between overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <div class="space-y-2 text-center">
            <icon
              name="kind-icon:sparkles"
              class="mx-auto h-16 w-16 text-accent"
            />
            <h2 class="text-xl font-black">WonderLab</h2>
            <p class="text-sm text-base-content/60">
              Tiny games, big toys, questionable lab safety.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2 pt-3">
            <button
              v-for="link in footerLinks"
              :key="link.key"
              type="button"
              class="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-base-100 p-3 text-center transition hover:border-accent hover:bg-accent/10"
              :class="cardButtonClass(link.key)"
              @click="selectWonderTab(link.key)"
            >
              <icon
                :name="link.icon"
                class="h-7 w-7 text-accent transition group-hover:scale-110"
              />
              <span class="text-sm font-black">{{ link.label }}</span>
              <span class="line-clamp-2 text-xs text-base-content/55">
                {{ link.description }}
              </span>
            </button>
          </div>
        </section>

        <section
          class="min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div
            v-if="activeTab === 'wonder-lab'"
            class="flex h-full min-h-0 flex-col gap-2"
          >
            <div class="flex shrink-0 items-center justify-between gap-2">
              <p class="text-sm font-black">Component Folders</p>
              <button
                type="button"
                class="btn btn-xs btn-outline"
                @click="selectFolder(null)"
              >
                All
              </button>
            </div>

            <div
              class="grid min-h-0 flex-1 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3 xl:grid-cols-4"
            >
              <button
                v-for="folder in folderNames"
                :key="folder"
                type="button"
                class="rounded-2xl border bg-base-100 p-3 text-left transition hover:border-accent hover:bg-accent/10"
                :class="folderButtonClass(folder)"
                @click="selectFolder(folder)"
              >
                <icon
                  name="kind-icon:folder"
                  class="mb-2 h-6 w-6 text-accent"
                />
                <span class="block truncate text-sm font-black">
                  {{ folder }}
                </span>
              </button>
            </div>
          </div>

          <div
            v-else
            class="grid h-full min-h-0 grid-cols-1 gap-3 md:grid-cols-2"
          >
            <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h3 class="text-lg font-black">{{ activeLabel }}</h3>
              <p class="mt-2 text-sm text-base-content/60">
                {{ activeDescription }}
              </p>
            </article>

            <article class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h3 class="text-lg font-black">Footer Tools</h3>
              <p class="mt-2 text-sm text-base-content/60">
                {{ activeToolText }}
              </p>
            </article>
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full w-full min-h-0 grid-cols-[auto_minmax(0,1fr)] items-stretch gap-3 overflow-hidden"
      >
        <section
          class="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 px-3"
        >
          <icon name="kind-icon:sparkles" class="h-10 w-10 text-accent" />
          <div class="min-w-0">
            <p class="truncate text-base font-black">WonderLab</p>
            <p class="truncate text-xs text-base-content/60">
              {{ activeLabel }}
            </p>
          </div>
        </section>

        <section
          class="grid min-w-0 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-2 md:grid-cols-4"
        >
          <button
            v-for="link in footerLinks"
            :key="link.key"
            type="button"
            class="group flex min-h-16 items-center gap-2 rounded-2xl border bg-base-100 px-3 py-2 text-left transition hover:border-accent hover:bg-accent/10"
            :class="cardButtonClass(link.key)"
            @click="selectWonderTab(link.key)"
          >
            <icon :name="link.icon" class="h-5 w-5 shrink-0 text-accent" />
            <span class="min-w-0">
              <span class="block truncate text-sm font-black">
                {{ link.label }}
              </span>
              <span class="line-clamp-1 text-xs text-base-content/55">
                {{ link.description }}
              </span>
            </span>
          </button>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
// /components/wonderlab/lab-footer.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore, type WonderDashboardTab } from '@/stores/navStore'
import { useComponentStore, type KindComponent } from '@/stores/componentStore'

type WonderFooterLink = {
  label: string
  shortLabel: string
  key: WonderDashboardTab
  icon: string
  description: string
  toolText: string
}

const displayStore = useDisplayStore()
const navStore = useNavStore()
const componentStore = useComponentStore()

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const isPriority = computed(() => footerState.value === 'priority')
const activeTab = computed(() => navStore.wonderDashboardTab)

const footerLinks: WonderFooterLink[] = [
  {
    label: 'Memory',
    shortLabel: 'Memory',
    key: 'memory-test',
    icon: 'kind-icon:brain',
    description: 'The matching game gets the spotlight first.',
    toolText: 'Leaderboard, new game setup, and shiny score-chasing nonsense.',
  },
  {
    label: 'Rebel Button',
    shortLabel: 'Button',
    key: 'rebel-button',
    icon: 'kind-icon:button',
    description: 'Do not press it. So obviously, press it.',
    toolText: 'Leaderboard and click record tools.',
  },
  {
    label: 'WonderLab',
    shortLabel: 'Lab',
    key: 'wonder-lab',
    icon: 'kind-icon:sparkles',
    description: 'Browse components by folder.',
    toolText: 'Folder navigation appears here in open and priority mode.',
  },
  {
    label: 'Screen FX',
    shortLabel: 'FX',
    key: 'screen-fx',
    icon: 'kind-icon:bubbles',
    description: 'Bubbles, rain, butterflies, and respectable nonsense.',
    toolText: 'Toggle visual effects without leaving the lab.',
  },
]

const activeLink = computed(
  () =>
    footerLinks.find((link) => link.key === activeTab.value) ?? footerLinks[0],
)

const activeLabel = computed(() => activeLink.value?.label ?? 'Memory')
const activeDescription = computed(() => activeLink.value?.description ?? '')
const activeToolText = computed(() => activeLink.value?.toolText ?? '')

const folderNames = computed<string[]>(() => {
  const folders = new Set<string>()

  componentStore.components.forEach((component: KindComponent) => {
    const name = component.folderName?.trim()
    if (name) folders.add(name)
  })

  return Array.from(folders).sort()
})

function selectWonderTab(tab: WonderDashboardTab) {
  navStore.setWonderDashboardTab(tab)
}

function selectFolder(folder: string | null) {
  navStore.setWonderLabFolder(folder)
  navStore.setWonderDashboardTab('wonder-lab')
}

function activeButtonClass(tab: WonderDashboardTab) {
  return activeTab.value === tab
    ? 'btn-accent scale-105'
    : 'btn-ghost bg-base-100'
}

function cardButtonClass(tab: WonderDashboardTab) {
  return activeTab.value === tab
    ? 'border-accent bg-accent/10 text-accent shadow-sm'
    : 'border-base-300 text-base-content'
}

function folderButtonClass(folder: string) {
  return navStore.wonderLabFolder === folder
    ? 'border-accent bg-accent/10 text-accent shadow-sm'
    : 'border-base-300 text-base-content'
}
</script>
