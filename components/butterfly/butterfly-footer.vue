<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div v-if="isCompact" class="flex h-full w-full min-h-0 flex-col gap-2">
      <div
        class="flex items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
      >
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold">🦋 Swarm Controls</div>
          <div class="text-xs text-base-content/60">
            Compact mode keeps it simple because chaos has enough hobbies.
          </div>
        </div>

        <div class="badge badge-outline shrink-0">{{ activeCount }} active</div>
      </div>

      <div
        class="grid h-full min-h-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        <button
          type="button"
          class="btn btn-secondary h-full min-h-13"
          @click="removeRandom"
        >
          <icon name="kind-icon:minus" class="h-4 w-4" />
          -1
        </button>

        <button
          type="button"
          class="btn btn-primary h-full min-h-13"
          @click="summon(1)"
        >
          <icon name="kind-icon:plus" class="h-4 w-4" />
          +1
        </button>

        <button
          type="button"
          class="btn btn-outline h-full min-h-13"
          @click="summon(5)"
        >
          +5
        </button>

        <button
          type="button"
          class="btn btn-outline h-full min-h-13"
          @click="summon(10)"
        >
          +10
        </button>

        <button
          type="button"
          class="btn btn-outline h-full min-h-13"
          @click="summon(20)"
        >
          +20
        </button>

        <button
          type="button"
          class="btn btn-warning h-full min-h-13"
          :disabled="activeCount <= 0"
          @click="clearButterflies"
        >
          Clear
        </button>
      </div>
    </div>

    <div
      v-else
      class="grid h-full w-full min-h-0 gap-3 overflow-hidden"
      :class="contentLayoutClass"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="truncate text-base font-semibold">
              🦋 Butterfly Footer
            </h2>
            <p class="text-xs text-base-content/70">
              Swarm controls on the left. Butterfly tea on the right.
            </p>
          </div>

          <div class="badge badge-outline shrink-0">
            {{ activeCount }} active
          </div>
        </div>

        <div
          class="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
        >
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div class="mb-2 flex items-center justify-between gap-2">
              <div
                class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
              >
                Current selection
              </div>

              <button
                v-if="canEditSelected"
                type="button"
                class="btn btn-accent btn-xs shrink-0"
                @click="editSelectedButterfly"
              >
                <icon name="kind-icon:pen" class="h-3 w-3" />
                Edit
              </button>
            </div>

            <select
              v-model="selectedButterflyId"
              class="select select-bordered w-full bg-base-100"
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

            <div
              v-if="currentButterfly"
              class="mt-3 grid grid-cols-2 gap-2 text-xs"
            >
              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-base-content/50">Name</div>
                <div class="truncate font-semibold">
                  {{ currentButterfly.name || currentButterfly.id }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-base-content/50">Status</div>
                <div class="font-semibold">
                  {{ currentButterfly.status || 'random' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-base-content/50">Position</div>
                <div class="font-semibold">
                  {{ currentButterfly.x ?? '—' }},
                  {{ currentButterfly.y ?? '—' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-base-content/50">Z Index</div>
                <div class="font-semibold">
                  {{ currentButterfly.zIndex ?? '—' }}
                </div>
              </div>
            </div>

            <div v-else class="mt-3 text-sm text-base-content/60">
              Pick a butterfly to load the guide.
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Swarm actions
            </div>

            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                type="button"
                class="btn btn-secondary"
                @click="removeRandom"
              >
                <icon name="kind-icon:minus" class="h-4 w-4" />
                -1
              </button>

              <button type="button" class="btn btn-primary" @click="summon(1)">
                <icon name="kind-icon:plus" class="h-4 w-4" />
                +1
              </button>

              <button type="button" class="btn btn-outline" @click="summon(5)">
                +5
              </button>

              <button type="button" class="btn btn-outline" @click="summon(10)">
                +10
              </button>

              <button type="button" class="btn btn-outline" @click="summon(20)">
                +20
              </button>

              <button
                type="button"
                class="btn btn-warning"
                :disabled="activeCount <= 0"
                @click="clearButterflies"
              >
                Clear
              </button>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Quick options
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                @click="toggleNames"
              >
                {{ showNames ? 'Hide Names' : 'Show Names' }}
              </button>

              <button
                type="button"
                class="btn btn-outline btn-sm"
                :disabled="!currentButterfly"
                @click="removeSelectedButterfly"
              >
                Send Selected Away
              </button>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Visible</div>
                <div class="font-semibold">
                  {{ activeCount > 0 ? 'Yes' : 'No' }}
                </div>
              </div>

              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-xs text-base-content/50">Names</div>
                <div class="font-semibold">
                  {{ showNames ? 'Shown' : 'Hidden' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="mb-3 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold">
              {{
                currentButterfly?.name || currentButterfly?.id || 'Field Guide'
              }}
            </h3>
            <p class="text-xs text-base-content/70">
              Full live butterfly state, not the sad little diet version.
            </p>
          </div>

          <div
            v-if="currentButterfly"
            class="badge shrink-0"
            :class="canEditSelected ? 'badge-secondary' : 'badge-outline'"
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
    return 'grid-cols-1 xl:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)]'
  }

  return 'grid-cols-1 2xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]'
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
