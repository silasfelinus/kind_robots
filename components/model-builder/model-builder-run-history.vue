<!-- /components/model-builder/model-builder-run-history.vue -->
<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="text-base font-black text-base-content">Run history</h3>
        <p class="mt-1 text-xs text-base-content/60">
          Your recent Model Builder runs. Reopen one to keep working, or cancel
          what you no longer need.
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="btn btn-xs btn-ghost rounded-xl text-base-content/60"
          :disabled="store.loadingRuns || Boolean(cancellingRunId)"
          @click="store.fetchRuns()"
        >
          <Icon name="kind-icon:refresh" class="h-3.5 w-3.5" aria-hidden="true" />
          Refresh
        </button>
        <button
          type="button"
          class="btn btn-xs btn-primary rounded-xl"
          :disabled="Boolean(cancellingRunId)"
          @click="startNew"
        >
          <Icon name="kind-icon:add" class="h-3.5 w-3.5" aria-hidden="true" />
          New run
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto">
      <div
        v-if="store.loadingRuns"
        class="flex h-full min-h-32 items-center justify-center gap-2 text-sm text-base-content/60"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span class="loading loading-dots loading-md" aria-hidden="true" />
        Loading runs…
      </div>

      <div
        v-else-if="!store.runs.length"
        class="flex h-full min-h-32 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/50"
      >
        <Icon
          name="kind-icon:blueprint"
          class="h-8 w-8 text-primary/50"
          aria-hidden="true"
        />
        No runs yet — start one from a source model.
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="run in store.runs"
          :key="run.id"
          class="flex items-center gap-3 kr-panel-flat p-3 transition hover:border-primary/50"
          :class="
            run.id === store.run?.id ? 'border-primary/60 bg-primary/5' : ''
          "
          :aria-busy="cancellingRunId === run.id"
        >
          <Icon
            :name="sourceIcon(run)"
            class="h-5 w-5 shrink-0 text-primary"
            aria-hidden="true"
          />

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="truncate text-sm font-bold text-base-content">
                {{ run.sourceLabel || `#${run.sourceId}` }}
              </span>
              <span class="badge badge-xs badge-ghost">{{
                run.sourceType
              }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-base-content/55">
              <span>{{ recipeLabel(run) }}</span>
              <span class="text-base-content/30">·</span>
              <span>{{ progress(run) }} committed</span>
            </div>
          </div>

          <button
            v-if="armedRunId !== run.id"
            type="button"
            class="btn btn-xs btn-ghost shrink-0 rounded-lg text-error/70 hover:text-error"
            title="Cancel run"
            :disabled="Boolean(cancellingRunId)"
            :aria-label="`Cancel run ${run.sourceLabel || `#${run.sourceId}`}`"
            @click="armedRunId = run.id"
          >
            <Icon name="kind-icon:trash" class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            v-else
            type="button"
            class="btn btn-xs btn-error shrink-0 rounded-lg"
            :disabled="Boolean(cancellingRunId)"
            :aria-label="`Confirm cancellation of run ${run.sourceLabel || `#${run.sourceId}`}`"
            @click="confirmCancel(run.id)"
            @blur="armedRunId = null"
          >
            <span
              v-if="cancellingRunId === run.id"
              class="loading loading-spinner loading-xs"
              aria-hidden="true"
            />
            <Icon
              v-else
              name="kind-icon:trash"
              class="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {{ cancellingRunId === run.id ? 'Cancelling…' : 'Confirm?' }}
          </button>
          <button
            type="button"
            class="btn btn-xs btn-primary shrink-0 rounded-lg"
            :disabled="Boolean(cancellingRunId)"
            :aria-label="`Open run ${run.sourceLabel || `#${run.sourceId}`}`"
            @click="open(run.id)"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import type { BuildRun } from '@/stores/modelBuilderStore'
import { getRecipe, getSourceType } from '@/stores/helpers/modelBuilderRecipes'

const emit = defineEmits<{ close: [] }>()
const store = useModelBuilderStore()

// Cancel button arms on first click, fires on second — mirrors art-interact.vue's
// delete-confirm pattern so an irreversible PATCH-to-CANCELLED can't fire on a misclick.
const armedRunId = ref<string | null>(null)
const cancellingRunId = ref<string | null>(null)

async function confirmCancel(runId: string): Promise<void> {
  if (cancellingRunId.value) return
  armedRunId.value = null
  cancellingRunId.value = runId
  try {
    await store.cancelRun(runId)
  } finally {
    if (cancellingRunId.value === runId) cancellingRunId.value = null
  }
}

function recipeLabel(run: BuildRun): string {
  return getRecipe(run.recipeKey)?.label ?? run.recipeKey
}

function sourceIcon(run: BuildRun): string {
  return getSourceType(run.sourceType)?.icon ?? 'kind-icon:blueprint'
}

function progress(run: BuildRun): string {
  const total = run.items.length
  const committed = run.items.filter(
    (item) => item.stages.COMMIT?.status === 'approved',
  ).length
  return `${committed}/${total}`
}

async function open(runId: string): Promise<void> {
  await store.openRun(runId)
  if (store.run?.id !== runId) return
  emit('close')
}

function startNew(): void {
  store.resetRun()
  store.goToStep('source')
  emit('close')
}

onMounted(() => {
  store.fetchRuns()
})
</script>