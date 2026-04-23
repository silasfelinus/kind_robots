<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="footerState === 'compact' ? 'px-3' : 'p-2 md:p-3'"
  >
    <!-- ── COMPACT: single toolbar row ─────────────────────────────── -->
    <template v-if="isCompact">
      <div class="flex h-full w-full items-center gap-1">
        <!-- count pill -->
        <div
          class="badge badge-outline shrink-0 font-mono text-xs tabular-nums"
        >
          {{ activeCount }}
        </div>

        <div class="mx-1.5 h-5 w-px shrink-0 bg-base-300" />

        <!-- core +/- -->
        <button
          type="button"
          class="btn btn-sm btn-secondary shrink-0"
          @click="removeRandom"
        >
          <icon name="kind-icon:minus" class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          class="btn btn-sm btn-primary shrink-0"
          @click="summon(1)"
        >
          <icon name="kind-icon:plus" class="h-3.5 w-3.5" />
        </button>

        <div class="mx-1.5 h-5 w-px shrink-0 bg-base-300" />

        <!-- bulk summons -->
        <button
          type="button"
          class="btn btn-sm btn-ghost shrink-0"
          @click="summon(5)"
        >
          +5
        </button>
        <button
          type="button"
          class="btn btn-sm btn-ghost shrink-0"
          @click="summon(10)"
        >
          +10
        </button>
        <button
          type="button"
          class="btn btn-sm btn-ghost shrink-0"
          @click="summon(20)"
        >
          +20
        </button>

        <div class="mx-1.5 h-5 w-px shrink-0 bg-base-300" />

        <!-- names toggle -->
        <button
          type="button"
          class="btn btn-sm btn-ghost shrink-0"
          @click="toggleNames"
        >
          {{ showNames ? 'Hide Names' : 'Names' }}
        </button>

        <!-- clear pushed to the right -->
        <button
          type="button"
          class="btn btn-sm btn-warning ml-auto shrink-0"
          :disabled="activeCount <= 0"
          @click="clearButterflies"
        >
          Clear
        </button>
      </div>
    </template>

    <!-- ── OPEN / PRIORITY: two-column ─────────────────────────────── -->
    <template v-else>
      <div
        class="grid h-full w-full min-h-0 gap-3 overflow-hidden"
        :class="contentLayoutClass"
      >
        <!-- LEFT: controls panel -->
        <section class="flex min-h-0 flex-col gap-2 overflow-y-auto">
          <!-- header row -->
          <div class="flex shrink-0 items-center justify-between gap-2">
            <span class="text-sm font-semibold tracking-tight">🦋 Swarm</span>
            <div class="badge badge-outline font-mono text-xs tabular-nums">
              {{ activeCount }} active
            </div>
          </div>

          <!-- butterfly selector -->
          <div
            class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <span
                class="text-xs font-semibold uppercase tracking-wide text-base-content/50"
              >
                Selection
              </span>
              <button
                v-if="canEditSelected"
                type="button"
                class="btn btn-accent btn-xs"
                @click="editSelectedButterfly"
              >
                <icon name="kind-icon:pen" class="h-3 w-3" />
                Edit
              </button>
            </div>

            <select
              v-model="selectedButterflyId"
              class="select select-bordered select-sm w-full bg-base-100"
            >
              <option value="">Choose a butterfly…</option>
              <option
                v-for="butterfly in selectableButterflies"
                :key="butterfly.id"
                :value="butterfly.id"
              >
                {{ butterflyLabel(butterfly) }}
              </option>
            </select>

            <!-- mini stats grid -->
            <template v-if="currentButterfly">
              <div class="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
                <div class="rounded-lg bg-base-200 px-2.5 py-1.5">
                  <div class="text-base-content/40">Name</div>
                  <div class="truncate font-semibold">
                    {{ currentButterfly.name || currentButterfly.id }}
                  </div>
                </div>
                <div class="rounded-lg bg-base-200 px-2.5 py-1.5">
                  <div class="text-base-content/40">Status</div>
                  <div class="font-semibold">
                    {{ currentButterfly.status || 'random' }}
                  </div>
                </div>
                <div class="rounded-lg bg-base-200 px-2.5 py-1.5">
                  <div class="text-base-content/40">Pos</div>
                  <div class="font-semibold tabular-nums">
                    {{ currentButterfly.x ?? '—' }},
                    {{ currentButterfly.y ?? '—' }}
                  </div>
                </div>
                <div class="rounded-lg bg-base-200 px-2.5 py-1.5">
                  <div class="text-base-content/40">Z</div>
                  <div class="font-semibold">
                    {{ currentButterfly.zIndex ?? '—' }}
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="mt-2 text-xs text-base-content/40">
              Pick a butterfly to see its field guide.
            </p>
          </div>

          <!-- swarm actions -->
          <div
            class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50"
            >
              Actions
            </div>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                class="btn btn-sm btn-secondary col-span-1"
                @click="removeRandom"
              >
                <icon name="kind-icon:minus" class="h-3.5 w-3.5" />−1
              </button>
              <button
                type="button"
                class="btn btn-sm btn-primary col-span-2"
                @click="summon(1)"
              >
                <icon name="kind-icon:plus" class="h-3.5 w-3.5" />+1
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

          <!-- quick options -->
          <div
            class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50"
            >
              Options
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                class="btn btn-sm btn-outline"
                @click="toggleNames"
              >
                {{ showNames ? 'Hide Names' : 'Show Names' }}
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline"
                :disabled="!currentButterfly"
                @click="removeSelectedButterfly"
              >
                Send Away
              </button>
              <button
                type="button"
                class="btn btn-sm btn-warning col-span-2"
                :disabled="activeCount <= 0"
                @click="clearButterflies"
              >
                Clear All
              </button>
            </div>
          </div>
        </section>

        <!-- RIGHT: butterfly guide -->
        <section
          class="flex min-h-0 flex-col overflow-hidden rounded-xl border border-base-300 bg-base-100"
        >
          <div
            class="flex shrink-0 items-center justify-between gap-2 border-b border-base-300 px-3 py-2"
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
    </template>
  </div>
</template>

<script setup lang="ts">
// /components/navigation/footer/butterfly-footer.vue
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()
const userStore = useUserStore()

const { butterflies, selectedButterflyId, showNames } =
  storeToRefs(butterflyStore)

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')

const selectableButterflies = computed(() =>
  butterflies.value.filter((butterfly) => !butterfly.isExiting),
)

const activeCount = computed(() => selectableButterflies.value.length)

const currentButterfly = computed(() => butterflyStore.getSelectedButterfly)

const emptyLabel = computed(() => {
  if (!activeCount.value) return 'No butterflies are active right now.'
  return 'Choose a butterfly from the selector to load its field guide.'
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

const contentLayoutClass = computed(() => {
  if (footerState.value === 'priority') {
    return 'grid-cols-1 xl:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]'
  }
  return 'grid-cols-1 2xl:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]'
})

onMounted(async () => {
  if (!butterflyStore.initialized) {
    await butterflyStore.initialize()
  }

  await butterflyStore.initGame()

  if (!selectedButterflyId.value && selectableButterflies.value.length > 0) {
    selectedButterflyId.value = selectableButterflies.value[0]?.id || ''
  }
})

function butterflyLabel(butterfly: {
  id: string
  name?: string
  message?: string
  x?: number
  y?: number
  zIndex?: number
}) {
  const title = butterfly.name || butterfly.id
  const snippet = butterfly.message?.slice(0, 24)?.trim()
  const pos =
    butterfly.x != null && butterfly.y != null
      ? ` @ ${butterfly.x}, ${butterfly.y}`
      : ''

  return snippet ? `${title} — ${snippet}${pos}` : `${title}${pos}`
}

async function summon(count: number) {
  await butterflyStore.summonSwarm(count)

  const newest = selectableButterflies.value.at(-1)
  if (newest) {
    selectedButterflyId.value = newest.id
  }
}

function removeRandom() {
  butterflyStore.removeRandomButterfly?.()

  if (currentButterfly.value && currentButterfly.value.isExiting) {
    const next = selectableButterflies.value.find(
      (item) => item.id !== currentButterfly.value?.id,
    )
    selectedButterflyId.value = next?.id || ''
  }
}

function removeSelectedButterfly() {
  const butterfly = currentButterfly.value
  if (!butterfly) return

  butterflyStore.markButterflyForExit(butterfly)

  const next = selectableButterflies.value.find(
    (item) => item.id !== butterfly.id,
  )

  selectedButterflyId.value = next?.id || ''
}

function clearButterflies() {
  butterflyStore.clearButterflies()
  selectedButterflyId.value = ''
}

function toggleNames() {
  butterflyStore.setShowNames(!showNames.value)
}

function editSelectedButterfly() {
  const butterfly = currentButterfly.value
  if (!butterfly || !canEditSelected.value) return

  butterflyStore.setInspected(butterfly)
  displayStore.setMainComponent?.('edit-butterfly')
}
</script>
