<!-- /components/content/butterfly/butterfly-sanctuary.vue -->
<template>
  <div class="flex min-h-0 hfull w-full flex-col overflow-hidden bg-base-200">
    <header
      class="flex shrink-0 flex-wrap items-center gap-3 border-b border-base-300 bg-base-100 px-4 py-2.5"
    >
      <span class="text-base font-semibold tracking-tight">
        🦋 Butterfly Sanctuary
      </span>

      <div class="badge badge-outline font-mono text-xs tabular-nums">
        {{ activeCount }} active
      </div>

      <div
        v-if="isSinglePane"
        class="flex items-center gap-1 rounded-xl border border-base-300 bg-base-200 p-1"
      >
        <button
          type="button"
          class="btn btn-xs"
          :class="mobilePanel === 'roster' ? 'btn-primary' : 'btn-ghost'"
          @click="mobilePanel = 'roster'"
        >
          Roster
        </button>
        <button
          type="button"
          class="btn btn-xs"
          :class="mobilePanel === 'guide' ? 'btn-primary' : 'btn-ghost'"
          @click="mobilePanel = 'guide'"
        >
          Guide
        </button>
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          class="btn btn-sm"
          :class="showSwarm ? 'btn-ghost' : 'btn-primary'"
          @click="butterflyStore.setShowSwarm(!showSwarm)"
        >
          {{ showSwarm ? 'Hide Swarm' : 'Show Swarm' }}
        </button>

        <div class="hidden h-5 w-px bg-base-300 sm:block" />

        <button
          type="button"
          class="btn btn-sm btn-ghost"
          @click="butterflyStore.setShowNames(!showNames)"
        >
          {{ showNames ? 'Hide Names' : 'Show Names' }}
        </button>

        <button
          type="button"
          class="btn btn-sm btn-warning"
          :disabled="activeCount <= 0"
          @click="clearButterflies"
        >
          Clear All
        </button>
      </div>
    </header>

    <div
      v-if="isSinglePane"
      class="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <aside
        v-show="mobilePanel === 'roster'"
        class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-base-100 p-3"
      >
        <div class="shrink-0 rounded-xl border border-base-300 bg-base-200 p-3">
          <div
            class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50"
          >
            Summon
          </div>

          <div class="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              @click="removeRandom"
            >
              <icon name="kind-icon:minus" class="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              class="btn btn-sm col-span-2 btn-primary"
              @click="summon(1)"
            >
              <icon name="kind-icon:plus" class="h-3.5 w-3.5" />
              +1
            </button>

            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click="summon(5)"
            >
              +5
            </button>

            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click="summon(10)"
            >
              +10
            </button>

            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click="summon(20)"
            >
              +20
            </button>
          </div>
        </div>

        <div class="shrink-0 rounded-xl border border-base-300 bg-base-200 p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span
              class="text-xs font-semibold uppercase tracking-wide text-base-content/50"
            >
              Selected
            </span>

            <button
              v-if="canEditSelected"
              type="button"
              class="btn btn-xs btn-accent"
              @click="editSelectedButterfly"
            >
              <icon name="kind-icon:pen" class="h-3 w-3" />
              Edit
            </button>
          </div>

          <template v-if="currentButterfly">
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <div class="col-span-2 rounded-lg bg-base-100 px-2.5 py-1.5">
                <div class="text-base-content/40">Name</div>
                <div class="truncate font-semibold">
                  {{ currentButterfly.name || currentButterfly.id }}
                </div>
              </div>

              <div class="rounded-lg bg-base-100 px-2.5 py-1.5">
                <div class="text-base-content/40">Status</div>
                <div class="font-semibold">
                  {{ currentButterfly.status || 'random' }}
                </div>
              </div>

              <div class="rounded-lg bg-base-100 px-2.5 py-1.5">
                <div class="text-base-content/40">Z Index</div>
                <div class="font-semibold">
                  {{ currentButterfly.zIndex ?? '—' }}
                </div>
              </div>

              <div class="col-span-2 rounded-lg bg-base-100 px-2.5 py-1.5">
                <div class="text-base-content/40">Position</div>
                <div class="font-semibold tabular-nums">
                  {{ currentButterfly.x ?? '—' }},
                  {{ currentButterfly.y ?? '—' }}
                </div>
              </div>
            </div>

            <button
              type="button"
              class="btn btn-outline btn-xs mt-2 w-full"
              @click="removeSelectedButterfly"
            >
              Send Away
            </button>

            <button
              type="button"
              class="btn btn-primary btn-xs mt-2 w-full"
              @click="mobilePanel = 'guide'"
            >
              Open Guide
            </button>
          </template>

          <p v-else class="text-xs text-base-content/40">
            No butterfly selected.
          </p>
        </div>

        <div
          class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-200 p-3"
        >
          <div
            class="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-base-content/50"
          >
            Roster
          </div>

          <div
            v-if="selectableButterflies.length"
            class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
          >
            <button
              v-for="butterfly in selectableButterflies"
              :key="butterfly.id"
              type="button"
              class="flex w-full shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors"
              :class="
                selectedButterflyId === butterfly.id
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-100 hover:bg-base-300'
              "
              @click="selectButterfly(butterfly.id)"
            >
              <span class="text-base leading-none">🦋</span>
              <span class="min-w-0 flex-1 truncate font-medium">
                {{ butterfly.name || butterfly.id }}
              </span>
              <span class="shrink-0 tabular-nums text-[10px] opacity-50">
                {{ butterfly.x ?? '?' }},{{ butterfly.y ?? '?' }}
              </span>
            </button>
          </div>

          <p v-else class="text-xs text-base-content/40">
            No butterflies in the swarm.
          </p>
        </div>
      </aside>

      <section
        v-show="mobilePanel === 'guide'"
        class="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div
          class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-4 py-2.5"
        >
          <span class="truncate text-sm font-semibold">
            {{
              currentButterfly?.name || currentButterfly?.id || 'Field Guide'
            }}
          </span>

          <div class="flex items-center gap-2">
            <div
              v-if="currentButterfly"
              class="badge shrink-0 text-xs"
              :class="canEditSelected ? 'badge-secondary' : 'badge-ghost'"
            >
              {{ canEditSelected ? 'Editable' : 'Read only' }}
            </div>

            <button
              type="button"
              class="btn btn-xs btn-ghost"
              @click="mobilePanel = 'roster'"
            >
              Back
            </button>
          </div>
        </div>

        <butterfly-guide class="min-h-0 flex-1" :empty-label="emptyLabel" />
      </section>
    </div>

    <div
      v-else
      class="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[17rem_1fr] xl:grid-cols-[18rem_1fr]"
    >
      <aside
        class="flex min-h-0 flex-col gap-2 overflow-y-auto border-r border-base-300 bg-base-100 p-3"
      >
        <div class="shrink-0 rounded-xl border border-base-300 bg-base-200 p-3">
          <div
            class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50"
          >
            Summon
          </div>

          <div class="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              class="btn btn-sm btn-secondary"
              @click="removeRandom"
            >
              <icon name="kind-icon:minus" class="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              class="btn btn-sm col-span-2 btn-primary"
              @click="summon(1)"
            >
              <icon name="kind-icon:plus" class="h-3.5 w-3.5" />
              +1
            </button>

            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click="summon(5)"
            >
              +5
            </button>

            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click="summon(10)"
            >
              +10
            </button>

            <button
              type="button"
              class="btn btn-sm btn-ghost"
              @click="summon(20)"
            >
              +20
            </button>
          </div>
        </div>

        <div class="shrink-0 rounded-xl border border-base-300 bg-base-200 p-3">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span
              class="text-xs font-semibold uppercase tracking-wide text-base-content/50"
            >
              Selected
            </span>

            <button
              v-if="canEditSelected"
              type="button"
              class="btn btn-xs btn-accent"
              @click="editSelectedButterfly"
            >
              <icon name="kind-icon:pen" class="h-3 w-3" />
              Edit
            </button>
          </div>

          <template v-if="currentButterfly">
            <div class="grid grid-cols-2 gap-1.5 text-xs">
              <div class="col-span-2 rounded-lg bg-base-100 px-2.5 py-1.5">
                <div class="text-base-content/40">Name</div>
                <div class="truncate font-semibold">
                  {{ currentButterfly.name || currentButterfly.id }}
                </div>
              </div>

              <div class="rounded-lg bg-base-100 px-2.5 py-1.5">
                <div class="text-base-content/40">Status</div>
                <div class="font-semibold">
                  {{ currentButterfly.status || 'random' }}
                </div>
              </div>

              <div class="rounded-lg bg-base-100 px-2.5 py-1.5">
                <div class="text-base-content/40">Z Index</div>
                <div class="font-semibold">
                  {{ currentButterfly.zIndex ?? '—' }}
                </div>
              </div>

              <div class="col-span-2 rounded-lg bg-base-100 px-2.5 py-1.5">
                <div class="text-base-content/40">Position</div>
                <div class="font-semibold tabular-nums">
                  {{ currentButterfly.x ?? '—' }},
                  {{ currentButterfly.y ?? '—' }}
                </div>
              </div>
            </div>

            <button
              type="button"
              class="btn btn-outline btn-xs mt-2 w-full"
              @click="removeSelectedButterfly"
            >
              Send Away
            </button>
          </template>

          <p v-else class="text-xs text-base-content/40">
            No butterfly selected.
          </p>
        </div>

        <div
          class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-200 p-3"
        >
          <div
            class="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wide text-base-content/50"
          >
            Roster
          </div>

          <div
            v-if="selectableButterflies.length"
            class="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto"
          >
            <button
              v-for="butterfly in selectableButterflies"
              :key="butterfly.id"
              type="button"
              class="flex w-full shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors"
              :class="
                selectedButterflyId === butterfly.id
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-100 hover:bg-base-300'
              "
              @click="selectedButterflyId = butterfly.id"
            >
              <span class="text-base leading-none">🦋</span>
              <span class="min-w-0 flex-1 truncate font-medium">
                {{ butterfly.name || butterfly.id }}
              </span>
              <span class="shrink-0 tabular-nums text-[10px] opacity-50">
                {{ butterfly.x ?? '?' }},{{ butterfly.y ?? '?' }}
              </span>
            </button>
          </div>

          <p v-else class="text-xs text-base-content/40">
            No butterflies in the swarm.
          </p>
        </div>
      </aside>

      <section class="flex min-h-0 flex-col overflow-hidden">
        <div
          class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-4 py-2.5"
        >
          <span class="truncate text-sm font-semibold">
            {{
              currentButterfly?.name || currentButterfly?.id || 'Field Guide'
            }}
          </span>

          <div
            v-if="currentButterfly"
            class="badge shrink-0 text-xs"
            :class="canEditSelected ? 'badge-secondary' : 'badge-ghost'"
          >
            {{ canEditSelected ? 'Editable' : 'Read only' }}
          </div>
        </div>

        <butterfly-guide class="min-h-0 flex-1" :empty-label="emptyLabel" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/butterfly/butterfly-sanctuary.vue
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()
const userStore = useUserStore()

const { butterflies, selectedButterflyId, showNames, showSwarm } =
  storeToRefs(butterflyStore)

const mobilePanel = ref<'roster' | 'guide'>('roster')

const centerHeight = computed(() => displayStore.mainPanelHeight)
const centerWidth = computed(() => displayStore.mainContentWidth)

const isSinglePane = computed(() => {
  return (
    displayStore.viewportSize === 'small' ||
    displayStore.viewportSize === 'medium'
  )
})

const selectableButterflies = computed(() =>
  butterflies.value.filter((b) => !b.isExiting),
)

const activeCount = computed(() => selectableButterflies.value.length)
const currentButterfly = computed(() => butterflyStore.getSelectedButterfly)

const emptyLabel = computed(() => {
  if (!activeCount.value) return 'No butterflies are active. Summon some!'
  return 'Select a butterfly from the roster to open its field guide.'
})

const canEditSelected = computed(() => {
  const butterfly = currentButterfly.value
  if (!butterfly) return false

  const isAdmin = userStore.isAdmin === true || userStore.role === 'ADMIN'
  const isOwner =
    butterfly.userId != null &&
    userStore.userId != null &&
    butterfly.userId === userStore.userId

  return isAdmin || isOwner
})

watch(
  () => isSinglePane.value,
  (singlePane) => {
    if (!singlePane) {
      mobilePanel.value = 'roster'
    }
  },
)

onMounted(async () => {
  if (!butterflyStore.initialized) {
    await butterflyStore.initialize()
  }

  await butterflyStore.initGame()

  if (!selectedButterflyId.value && selectableButterflies.value.length > 0) {
    selectedButterflyId.value = selectableButterflies.value[0]?.id || ''
  }
})

async function summon(count: number) {
  await butterflyStore.addButterflies(count)
  const newest = selectableButterflies.value.at(-1)

  if (newest) {
    selectedButterflyId.value = newest.id
    if (isSinglePane.value) mobilePanel.value = 'guide'
  }
}

function selectButterfly(id: string) {
  selectedButterflyId.value = id
  if (isSinglePane.value) {
    mobilePanel.value = 'guide'
  }
}

function removeRandom() {
  butterflyStore.removeRandomButterfly()

  if (currentButterfly.value?.isExiting) {
    const next = selectableButterflies.value.find(
      (b) => b.id !== currentButterfly.value?.id,
    )
    selectedButterflyId.value = next?.id || ''
  }
}

function removeSelectedButterfly() {
  const butterfly = currentButterfly.value
  if (!butterfly) return

  butterflyStore.markButterflyForExit(butterfly)

  const next = selectableButterflies.value.find((b) => b.id !== butterfly.id)
  selectedButterflyId.value = next?.id || ''

  if (isSinglePane.value && !selectedButterflyId.value) {
    mobilePanel.value = 'roster'
  }
}

function clearButterflies() {
  butterflyStore.clearButterflies()
  selectedButterflyId.value = ''
  if (isSinglePane.value) mobilePanel.value = 'roster'
}

function editSelectedButterfly() {
  const butterfly = currentButterfly.value
  if (!butterfly || !canEditSelected.value) return

  butterflyStore.setInspected(butterfly)
  displayStore.setMainComponent?.('edit-butterfly')
}
</script>
