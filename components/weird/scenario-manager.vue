<!-- /components/content/weird/scenario-manager.vue -->
<template>
  <div
    class="flex h-full w-full flex-col overflow-y-auto rounded-2xl bg-base-200 p-4"
  >
    <div class="mb-6 flex items-center justify-between gap-4">
      <div class="flex-1 text-center">
        <h1
          class="inline-block rounded-2xl bg-primary px-3 py-2 text-3xl font-bold text-primary-content"
        >
          Choose Your Own Weird Adventure
        </h1>
      </div>

      <button
        class="btn btn-accent rounded-full shadow-lg hover:shadow-xl"
        type="button"
        @click="toggleAddScenario"
      >
        <Icon name="kind-icon:plus" class="h-6 w-6" />
      </button>
    </div>

    <div
      v-if="isLoadingManager"
      class="mb-6 rounded-2xl border border-info/40 bg-info/10 p-4 text-info"
    >
      Loading weirdness from the database...
    </div>

    <div
      v-if="managerError"
      class="mb-6 rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      {{ managerError }}
    </div>

    <div
      v-if="showAddScenario"
      class="mb-6 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
    >
      <h2 class="mb-4 text-xl font-bold text-base-content">
        Create/Edit Scenario
      </h2>

      <add-scenario />
    </div>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
    >
      <section
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <div
          class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-xl font-bold text-base-content">
              Scenario Gallery
            </h2>

            <p class="text-sm text-base-content/70">
              {{ scenarioSummary }}
            </p>
          </div>

          <button
            class="btn btn-sm btn-secondary rounded-xl"
            type="button"
            :disabled="isLoadingManager"
            @click="refreshManagerData"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            Refresh DB
          </button>
        </div>

        <scenario-gallery />
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <div class="mb-4">
          <h2 class="text-xl font-bold text-base-content">Cast Your Weirdos</h2>

          <p class="text-sm text-base-content/70">
            Pick a character for the current adventure.
          </p>

          <div
            v-if="characterStore.selectedCharacter"
            class="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm text-base-content"
          >
            Selected:
            <span class="font-bold text-primary">
              {{ characterStore.selectedCharacter.name }}
            </span>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-base-300">
          <character-gallery />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'

const characterStore = useCharacterStore()
const choiceStore = useChoiceStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()

const showAddScenario = ref(false)
const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const scenarioSummary = computed(() => {
  const scenarioCount = scenarioStore.scenarios.length
  const characterCount = characterStore.characters.length
  const rewardCount = rewardStore.rewards.length

  return `${scenarioCount} scenarios, ${characterCount} characters, ${rewardCount} rewards loaded. The goblin spreadsheet is satisfied.`
})

function toggleAddScenario() {
  showAddScenario.value = !showAddScenario.value
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await choiceStore.initialize()

    await Promise.all([
      characterStore.initialize({
        force,
        fetchRemote: true,
        createDefaultForm: true,
      }),
      scenarioStore.initialize({
        force,
        fetchRemote: true,
        includeSeeds: true,
      }),
      rewardStore.initialize({
        force,
        fetchRemote: true,
      }),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'Failed to load scenario manager data.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

onMounted(async () => {
  await loadManagerData()
})
</script>
