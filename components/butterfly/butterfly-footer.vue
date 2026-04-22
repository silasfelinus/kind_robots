<!-- /components/navigation/footer/butterfly-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden"
      :class="
        isPriority
          ? 'xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]'
          : 'xl:grid-cols-[minmax(18rem,24rem)_minmax(16rem,22rem)]'
      "
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
              Pick an active butterfly and send it to the guide.
            </p>
          </div>

          <div class="badge badge-outline shrink-0">
            {{ activeCount }} active
          </div>
        </div>

        <div class="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
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

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <div
              class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
            >
              Selected
            </div>
            <div class="mt-2 text-sm font-semibold">
              {{ selectedButterfly?.name || selectedButterfly?.id || 'None' }}
            </div>
            <div class="mt-1 text-xs text-base-content/60">
              {{ activeCount }} butterflies currently visible
            </div>
          </div>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <template v-if="isPriority">
          <butterfly-guide class="h-full w-full" />
        </template>

        <template v-else>
          <div class="flex h-full min-h-0 flex-col overflow-hidden">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate text-base font-semibold">
                  {{
                    selectedButterfly?.name ||
                    selectedButterfly?.id ||
                    'Butterfly Summary'
                  }}
                </h3>
                <p class="text-xs text-base-content/70">
                  Lightweight preview. Open priority mode for the full guide.
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

            <div
              class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-4"
            >
              <div
                v-if="!selectedButterfly"
                class="flex h-full items-center justify-center text-center text-sm text-base-content/60"
              >
                {{ emptyLabel }}
              </div>

              <div v-else class="flex h-full min-h-0 flex-col gap-3">
                <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
                  <div class="text-xs uppercase text-base-content/50">
                    Message
                  </div>
                  <div class="mt-2 text-sm">
                    {{
                      selectedButterfly.message ||
                      'No butterfly gossip recorded.'
                    }}
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div
                    class="rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-sm"
                  >
                    <div class="text-xs text-base-content/50">Speed</div>
                    <div class="font-semibold">
                      {{ selectedButterfly.speed ?? '—' }}
                    </div>
                  </div>
                  <div
                    class="rounded-xl border border-base-300 bg-base-100 px-3 py-2 text-sm"
                  >
                    <div class="text-xs text-base-content/50">Rarity</div>
                    <div class="font-semibold">
                      {{ selectedButterfly.rarity ?? '—' }}
                    </div>
                  </div>
                </div>

                <div class="mt-auto text-xs text-base-content/50">
                  Priority mode shows the full field guide.
                </div>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useButterflyStore } from '@/stores/butterflyStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useSmartbarStore } from '@/stores/smartbarStore'
import { useUserStore } from '@/stores/userStore'

const butterflyStore = useButterflyStore()
const displayStore = useDisplayStore()
const smartbarStore = useSmartbarStore()
const userStore = useUserStore()

const { butterflies, selectedButterflyId, showNames } =
  storeToRefs(butterflyStore)

const footerState = computed(() => displayStore.footerState)
const isPriority = computed(() => footerState.value === 'priority')

const showSwarm = computed({
  get: () => smartbarStore.showSwarm,
  set: (value: boolean) => {
    smartbarStore.showSwarm = value
  },
})

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
  return 'Choose a butterfly from the dropdown to load its guide.'
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
}) {
  const title = butterfly.name || butterfly.id
  const snippet = butterfly.message?.slice(0, 36)?.trim()
  return snippet ? `${title} — ${snippet}` : title
}

async function addButterfly() {
  await butterflyStore.addButterfly()
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
  if (!butterfly) return
  butterflyStore.setInspected(butterfly)
}
</script>
