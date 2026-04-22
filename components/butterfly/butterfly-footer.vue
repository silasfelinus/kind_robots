<!-- /components/navigation/footer/butterfly-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden 2xl:grid-cols-[minmax(19rem,24rem)_minmax(0,1fr)]"
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
              Pick an active butterfly, inspect the full live state, and edit
              when allowed.
            </p>
          </div>

          <div class="badge badge-outline shrink-0">
            {{ activeCount }} active
          </div>
        </div>

        <div
          class="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1"
        >
          <label class="form-control w-full">
            <div
              class="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Current butterflies
            </div>
            <select
              v-model="selectedButterflyId"
              class="select select-bordered w-full bg-base-200"
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
          </label>

          <div
            v-if="selectedButterfly"
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-semibold">
                  {{ selectedButterfly.name || selectedButterfly.id }}
                </div>
                <div class="mt-1 flex flex-wrap gap-2">
                  <div class="badge badge-outline badge-sm">
                    {{ selectedButterfly.status || 'random' }}
                  </div>
                  <div
                    class="badge badge-sm"
                    :class="
                      selectedButterfly.isExiting
                        ? 'badge-warning'
                        : 'badge-success'
                    "
                  >
                    {{ selectedButterfly.isExiting ? 'Exiting' : 'Active' }}
                  </div>
                  <div
                    v-if="selectedIsToggleButterfly"
                    class="badge badge-accent badge-sm"
                  >
                    Toggle
                  </div>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <div
                  class="h-5 w-5 rounded-full border border-base-300"
                  :style="{ background: selectedButterfly.wingTopColor }"
                />
                <div
                  class="h-5 w-5 rounded-full border border-base-300"
                  :style="{ background: selectedButterfly.wingBottomColor }"
                />
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-base-content/50">X / Y</div>
                <div class="font-semibold">
                  {{ selectedButterfly.x }}, {{ selectedButterfly.y }}
                </div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-base-content/50">Goal</div>
                <div class="font-semibold">
                  {{ selectedButterfly.goal?.x ?? '—' }},
                  {{ selectedButterfly.goal?.y ?? '—' }}
                </div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-base-content/50">Z / Base</div>
                <div class="font-semibold">
                  {{ selectedButterfly.zIndex ?? '—' }} /
                  {{ selectedButterfly.baseZIndex ?? '—' }}
                </div>
              </div>
              <div
                class="rounded-xl border border-base-300 bg-base-100 px-3 py-2"
              >
                <div class="text-base-content/50">Scale / Mod</div>
                <div class="font-semibold">
                  {{ selectedButterfly.scale ?? '—' }} /
                  {{ selectedButterfly.scaleMod ?? '—' }}
                </div>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <div
                class="badge"
                :class="canEditSelected ? 'badge-secondary' : 'badge-outline'"
              >
                {{
                  canEditSelected ? 'You can edit this butterfly' : 'Read only'
                }}
              </div>
              <div
                v-if="selectedButterfly.userId != null"
                class="badge badge-outline"
              >
                Owner {{ selectedButterfly.userId }}
              </div>
              <div
                v-if="selectedButterfly.designer"
                class="badge badge-outline"
              >
                {{ selectedButterfly.designer }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="btn btn-primary" @click="addButterfly">
              <icon name="kind-icon:plus" class="h-4 w-4" />
              Add
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              :disabled="!selectedButterfly"
              @click="removeSelectedButterfly"
            >
              <icon name="kind-icon:minus" class="h-4 w-4" />
              Send Away
            </button>
          </div>

          <div class="grid grid-cols-2 gap-2">
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
              :disabled="activeCount <= 0"
              @click="clearButterflies"
            >
              Clear Swarm
            </button>
          </div>

          <div class="grid grid-cols-1 gap-2">
            <button
              type="button"
              class="btn btn-accent btn-sm"
              :disabled="!canEditSelected"
              @click="editSelectedButterfly"
            >
              <icon name="kind-icon:pen" class="h-4 w-4" />
              {{ canEditSelected ? 'Edit Selected Butterfly' : 'Edit Locked' }}
            </button>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Swarm Status
            </div>
            <div class="mt-2 flex flex-col gap-2 text-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/70">Visible</span>
                <span class="font-semibold">
                  {{ activeCount > 0 ? 'Yes' : 'No' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/70">Names</span>
                <span class="font-semibold">
                  {{ showNames ? 'Shown' : 'Hidden' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/70">Selected</span>
                <span class="truncate font-semibold">
                  {{
                    selectedButterfly?.name || selectedButterfly?.id || 'None'
                  }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-2">
                <span class="text-base-content/70">Editable</span>
                <span class="font-semibold">
                  {{ canEditSelected ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </div>

          <div
            class="mt-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
          >
            One selected butterfly, one honest panel, zero mystery meat stats.
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
                selectedButterfly?.name ||
                selectedButterfly?.id ||
                'Field Guide'
              }}
            </h3>
            <p class="text-xs text-base-content/70">
              Full live butterfly state, not the diet version.
            </p>
          </div>

          <button
            v-if="canEditSelected"
            type="button"
            class="btn btn-accent btn-sm shrink-0"
            @click="editSelectedButterfly"
          >
            <icon name="kind-icon:pen" class="h-4 w-4" />
            Edit
          </button>
        </div>

        <butterfly-guide
          class="min-h-0 flex-1"
          :butterfly="selectedButterfly"
          :empty-label="emptyLabel"
          :can-edit="canEditSelected"
          :is-toggle-butterfly="selectedIsToggleButterfly"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const selectableButterflies = computed(() =>
  butterflies.value.filter((butterfly) => !butterfly.isExiting),
)

const selectedButterfly = computed(() => {
  if (!selectedButterflyId.value) return null
  return (
    selectableButterflies.value.find(
      (butterfly) => butterfly.id === selectedButterflyId.value,
    ) || null
  )
})

const activeCount = computed(() => selectableButterflies.value.length)

const emptyLabel = computed(() => {
  if (!activeCount.value) return 'No butterflies are active right now.'
  return 'Choose a butterfly from the dropdown to load its field guide.'
})

const canEditSelected = computed(() => {
  const butterfly = selectedButterfly.value
  if (!butterfly) return false

  const isAdmin = userStore.isAdmin === true || userStore.role === 'ADMIN'

  const isOwner =
    butterfly.userId != null &&
    userStore.userId != null &&
    butterfly.userId === userStore.userId

  return isAdmin || isOwner
})

const selectedIsToggleButterfly = computed(() => {
  const butterfly = selectedButterfly.value
  if (!butterfly) return false
  return butterflyStore.isToggleButterfly(butterfly)
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

async function addButterfly() {
  await butterflyStore.summonSwarm(1)

  const newest = selectableButterflies.value.at(-1)
  if (newest) {
    selectedButterflyId.value = newest.id
  }
}

function removeSelectedButterfly() {
  const butterfly = selectedButterfly.value
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
  const butterfly = selectedButterfly.value
  if (!butterfly || !canEditSelected.value) return
  butterflyStore.setInspected(butterfly)
  displayStore.setMainComponent?.('edit-butterfly')
}
</script>
