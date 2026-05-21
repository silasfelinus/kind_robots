<!-- /components/navigation/composition-footer.vue -->
<template>
  <div
    v-if="footerState !== 'hidden'"
    class="flex h-full w-full min-h-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200/80 p-2 shadow-inner md:p-3"
  >
    <!-- Compact mode -->
    <div v-if="isCompact" class="flex h-full w-full min-h-0">
      <div
        class="grid h-full w-full min-h-0 grid-cols-[auto_1fr_auto] items-stretch gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
      >
        <div class="flex items-center gap-2 px-2">
          <Icon name="kind-icon:sparkles" class="h-6 w-6 text-primary" />
          <span class="hidden text-sm font-bold sm:inline">Compositions</span>
        </div>

        <select
          v-model.number="selectedId"
          class="select select-bordered select-sm h-full min-h-0 w-full rounded-2xl"
          @change="selectById"
        >
          <option :value="0">Choose composition</option>
          <option
            v-for="comp in compositionStore.items"
            :key="comp.id"
            :value="comp.id"
          >
            {{ comp.title || `Composition ${comp.id}` }}
          </option>
        </select>

        <button
          class="btn h-full min-h-0 w-24 bg-primary font-semibold text-white hover:bg-primary/90"
          @click="open"
        >
          Open
        </button>
      </div>
    </div>

    <!-- Expanded mode -->
    <div
      v-else
      class="grid h-full w-full min-h-0 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-semibold">✨ Compositions</h2>
          <button
            class="btn btn-sm btn-primary font-semibold text-white"
            @click="open"
          >
            Open
          </button>
        </div>

        <div class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <button
            v-for="comp in compositionStore.items"
            :key="comp.id"
            type="button"
            class="mb-2 flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition"
            :class="
              compositionStore.selected?.id === comp.id
                ? 'border-primary bg-primary/10'
                : 'border-base-300 bg-base-200/60 hover:bg-base-200'
            "
            @click="selectById(comp.id)"
          >
            <Icon
              name="kind-icon:sparkles"
              class="mt-0.5 h-7 w-7 shrink-0 text-primary"
            />
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-bold">
                {{ comp.title || `Composition ${comp.id}` }}
              </div>
              <div class="truncate text-xs text-base-content/55">
                {{ comp.mode || 'both' }} ·
                {{ ingredientCount(comp) }} ingredient{{
                  ingredientCount(comp) !== 1 ? 's' : ''
                }}
              </div>
            </div>
          </button>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3 shadow"
      >
        <div
          class="mb-2 text-sm font-semibold uppercase tracking-wide text-base-content/70"
        >
          Selected Composition
        </div>

        <div
          class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3 text-sm leading-relaxed"
        >
          <div v-if="compositionStore.selected" class="space-y-3">
            <div class="font-bold text-base-content">
              {{ compositionStore.selected.title || 'Untitled Composition' }}
            </div>

            <p class="text-base-content/70">
              {{ compositionStore.selected.description || 'No description.' }}
            </p>

            <!-- Synthesis status -->
            <div class="flex flex-wrap gap-2">
              <span
                v-if="compositionStore.selected.narrativeText"
                class="badge badge-success badge-sm"
                >Narrative ✓</span
              >
              <span v-else class="badge badge-ghost badge-sm"
                >No narrative</span
              >
              <span
                v-if="compositionStore.selected.artPrompt"
                class="badge badge-primary badge-sm"
                >Art Prompt ✓</span
              >
              <span v-else class="badge badge-ghost badge-sm"
                >No art prompt</span
              >
            </div>

            <!-- Narrative preview -->
            <div
              v-if="compositionStore.selected.narrativeText"
              class="rounded-xl bg-base-300 p-2 text-xs text-base-content/70 line-clamp-4"
            >
              {{ compositionStore.selected.narrativeText }}
            </div>
          </div>

          <div v-else class="text-base-content/50">
            No composition selected yet.
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import { useNavStore } from '@/stores/navStore'
import { useCompositionStore } from '@/stores/compositionStore'

const router = useRouter()
const displayStore = useDisplayStore()
const navStore = useNavStore()
const compositionStore = useCompositionStore()

const dashboardKey = 'composition' as const
const footerState = computed(() => displayStore.footerState)
const isCompact = computed(() => footerState.value === 'compact')
const selectedId = ref(0)

function ingredientCount(comp: any): number {
  let count = 0
  if (comp.characterId || comp.characterBlurb) count++
  if (comp.dreamId || comp.dreamBlurb) count++
  if (comp.scenarioId || comp.scenarioBlurb) count++
  if (comp.pitchId || comp.pitchBlurb) count++
  if (comp.rewardId || comp.rewardBlurb) count++
  return count
}

function selectById(idOrEvent: number | Event) {
  const id =
    typeof idOrEvent === 'number'
      ? idOrEvent
      : Number((idOrEvent.target as HTMLSelectElement).value)
  if (!id) {
    compositionStore.deselectModel()
    return
  }
  selectedId.value = id
  compositionStore.selectModel(id)
}

async function open() {
  navStore.setDashboardTab(dashboardKey, 'overview')
  await router.push('/compositions')
}

watch(
  () => compositionStore.selected?.id,
  (id) => {
    selectedId.value = id ?? 0
  },
)

onMounted(async () => {
  await compositionStore.initialize({ fetchRemote: true })
  selectedId.value = compositionStore.selected?.id ?? 0
})
</script>
