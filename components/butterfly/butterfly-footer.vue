<template>
  <!-- /components/navigation/footer/butterfly-footer.vue -->
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 shadow-inner"
    :class="footerState === 'compact' ? 'px-3' : 'p-2 md:p-3'"
  >
    <template v-if="isCompact">
      <div class="flex h-full w-full items-center gap-1 overflow-x-auto">
        <div
          class="badge badge-outline shrink-0 font-mono text-xs tabular-nums"
        >
          {{ activeCount }}
        </div>

        <button
          type="button"
          class="btn btn-sm btn-secondary shrink-0"
          :disabled="activeCount <= 0"
          @click="sendRandomAway"
        >
          Away
        </button>

        <button
          type="button"
          class="btn btn-sm btn-error shrink-0"
          :disabled="totalCount <= 0"
          @click="clearRandomNow"
        >
          Clear
        </button>

        <button
          type="button"
          class="btn btn-sm btn-primary shrink-0"
          @click="summon(1)"
        >
          +1
        </button>

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

        <button
          type="button"
          class="btn btn-sm btn-ghost shrink-0"
          @click="toggleNames"
        >
          {{ showNames ? 'Hide Names' : 'Names' }}
        </button>

        <button
          type="button"
          class="btn btn-sm btn-outline ml-auto shrink-0"
          :disabled="activeCount <= 0"
          @click="sendAllAway"
        >
          Send All
        </button>

        <button
          type="button"
          class="btn btn-sm btn-warning shrink-0"
          :disabled="totalCount <= 0"
          @click="clearAllNow"
        >
          Clear All
        </button>
      </div>
    </template>

    <template v-else>
      <div
        class="grid h-full w-full min-h-0 gap-3 overflow-hidden"
        :class="contentLayoutClass"
      >
        <section class="flex min-h-0 flex-col gap-2 overflow-y-auto">
          <div class="flex shrink-0 items-center justify-between gap-2">
            <span class="text-sm font-semibold tracking-tight">🦋 Swarm</span>
            <div class="flex items-center gap-1">
              <div class="badge badge-outline font-mono text-xs tabular-nums">
                {{ activeCount }} active
              </div>
              <div
                v-if="exitingCount > 0"
                class="badge badge-warning font-mono text-xs tabular-nums"
              >
                {{ exitingCount }} exiting
              </div>
            </div>
          </div>

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
                v-for="butterfly in butterflies"
                :key="butterfly.id"
                :value="butterfly.id"
              >
                {{ butterflyLabel(butterfly) }}
              </option>
            </select>

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
                    {{
                      currentButterfly.isExiting
                        ? 'exiting'
                        : currentButterfly.status || 'random'
                    }}
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

          <div
            class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50"
            >
              Summon
            </div>
            <div class="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                class="btn btn-sm btn-primary"
                @click="summon(1)"
              >
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

          <div
            class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50"
            >
              Send Away
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                class="btn btn-sm btn-secondary"
                :disabled="activeCount <= 0"
                @click="sendRandomAway"
              >
                Random
              </button>
              <button
                type="button"
                class="btn btn-sm btn-secondary"
                :disabled="!currentButterfly || currentButterfly.isExiting"
                @click="sendSelectedAway"
              >
                Selected
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline col-span-2"
                :disabled="activeCount <= 0"
                @click="sendAllAway"
              >
                Send All Away
              </button>
            </div>
          </div>

          <div
            class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50"
            >
              Clear Now
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                class="btn btn-sm btn-error"
                :disabled="totalCount <= 0"
                @click="clearRandomNow"
              >
                Random
              </button>
              <button
                type="button"
                class="btn btn-sm btn-error"
                :disabled="!currentButterfly"
                @click="clearSelectedNow"
              >
                Selected
              </button>
              <button
                type="button"
                class="btn btn-sm btn-warning col-span-2"
                :disabled="totalCount <= 0"
                @click="clearAllNow"
              >
                Clear All Immediately
              </button>
            </div>
          </div>

          <div
            class="shrink-0 rounded-xl border border-base-300 bg-base-100 p-3"
          >
            <div
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50"
            >
              Options
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline w-full"
              @click="toggleNames"
            >
              {{ showNames ? 'Hide Names' : 'Show Names' }}
            </button>
          </div>
        </section>

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
import { useButterflyStore, type Butterfly } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useUserStore } from '@/stores/userStore'

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()
const userStore = useUserStore()

const { butterflies, selectedButterflyId, showNames } =
  storeToRefs(butterflyStore)

const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')

const activeButterflies = computed(() =>
  butterflies.value.filter((butterfly) => !butterfly.isExiting),
)

const exitingButterflies = computed(() =>
  butterflies.value.filter((butterfly) => butterfly.isExiting),
)

const activeCount = computed(() => activeButterflies.value.length)
const exitingCount = computed(() => exitingButterflies.value.length)
const totalCount = computed(() => butterflies.value.length)

const currentButterfly = computed(() => butterflyStore.getSelectedButterfly)

const emptyLabel = computed(() => {
  if (!totalCount.value) return 'No butterflies are active right now.'
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

  if (!selectedButterflyId.value && butterflies.value.length > 0) {
    selectedButterflyId.value = butterflies.value[0]?.id || ''
  }
})

function butterflyLabel(butterfly: Butterfly) {
  const title = butterfly.name || butterfly.id
  const snippet = butterfly.message?.slice(0, 24)?.trim()
  const state = butterfly.isExiting ? ' leaving' : ''
  const pos =
    butterfly.x != null && butterfly.y != null
      ? ` @ ${butterfly.x}, ${butterfly.y}`
      : ''

  return snippet
    ? `${title}${state} — ${snippet}${pos}`
    : `${title}${state}${pos}`
}

function selectFallbackButterfly(excludedId = '') {
  if (
    selectedButterflyId.value &&
    selectedButterflyId.value !== excludedId &&
    butterflies.value.some(
      (butterfly) => butterfly.id === selectedButterflyId.value,
    )
  ) {
    return
  }

  selectedButterflyId.value =
    butterflies.value.find((butterfly) => butterfly.id !== excludedId)?.id || ''
}

async function summon(count: number) {
  await butterflyStore.addButterflies(count)

  const newest = butterflies.value.at(-1)
  if (newest) {
    selectedButterflyId.value = newest.id
  }
}

function sendRandomAway() {
  butterflyStore.sendRandomButterflyAway()
  selectFallbackButterfly()
}

function sendSelectedAway() {
  const butterfly = currentButterfly.value
  if (!butterfly || butterfly.isExiting) return

  butterflyStore.sendButterflyAway(butterfly)
  selectFallbackButterfly(butterfly.id)
}

function sendAllAway() {
  butterflyStore.markAllButterfliesForExit()
  selectedButterflyId.value = ''
}

function clearRandomNow() {
  butterflyStore.clearRandomButterfly()
  selectFallbackButterfly()
}

function clearSelectedNow() {
  const butterfly = currentButterfly.value
  if (!butterfly) return

  butterflyStore.clearButterflyById(butterfly.id)
  selectFallbackButterfly(butterfly.id)
}

function clearAllNow() {
  butterflyStore.clearAllButterflies()
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
