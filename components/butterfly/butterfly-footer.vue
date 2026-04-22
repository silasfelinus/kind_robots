<!-- /components/navigation/footer/butterfly-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <div
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)]"
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
              Pick an active butterfly and inspect it without losing the swarm.
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
            </div>
          </div>

          <div
            class="mt-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-sm text-base-content/80"
          >
            Keep one butterfly selected and the rest of the chaos becomes way
            less feral.
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
              Active butterfly details and discovery info.
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

        <butterfly-field-guide-card
          class="min-h-0 flex-1"
          :butterfly="selectedButterfly"
          :empty-label="emptyLabel"
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
  if (!butterfly) return
  butterflyStore.setInspected(butterfly)
  displayStore.setMainComponent?.('edit-butterfly')
}
</script>
