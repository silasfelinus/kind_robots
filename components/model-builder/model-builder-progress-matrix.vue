<!-- /components/model-builder/model-builder-progress-matrix.vue -->
<template>
  <div class="flex min-h-0 flex-1 flex-col gap-3">
    <div class="flex items-start justify-between gap-2">
      <div>
        <h3 class="text-base font-black text-base-content">3. Build run</h3>
        <p class="mt-1 text-xs text-base-content/60">
          <span class="font-bold text-base-content">{{
            run?.sourceLabel
          }}</span>
          · {{ recipeLabel }} · {{ store.runProgress.committed }}/{{
            store.runProgress.total
          }}
          committed
          <span
            v-if="store.runProgress.failed"
            class="font-semibold text-error"
          >
            · {{ store.runProgress.failed }} failed
          </span>
        </p>
      </div>
      <div class="flex shrink-0 items-center gap-1">
        <button
          type="button"
          class="btn btn-xs btn-primary rounded-xl"
          :disabled="autoBuildAllDisabled"
          :title="autoBuildAllTitle"
          @click="store.autoBuildRun()"
        >
          <span v-if="store.autoBuilding" class="loading loading-dots loading-xs" />
          <template v-else>
            <Icon name="kind-icon:bolt" class="h-3.5 w-3.5" />
            Auto-build all
            <span v-if="busyCount" class="badge badge-xs badge-ghost"
              >{{ busyCount }} busy</span
            >
          </template>
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost rounded-xl text-base-content/60"
          @click="store.resetRun()"
        >
          <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
          New run
        </button>
      </div>
    </div>

    <!-- Source context: what we already have on the record we're building from -->
    <div
      v-if="source"
      class="flex items-start gap-3 kr-panel-flat p-3"
    >
      <div
        class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-base-200"
      >
        <img
          v-if="sourceImage"
          :src="sourceImage"
          :alt="run?.sourceLabel"
          class="h-full w-full object-cover"
          loading="lazy"
        />
        <Icon v-else name="kind-icon:blueprint" class="h-6 w-6 text-base-content/30" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <span class="truncate text-sm font-bold text-base-content">
            {{ run?.sourceLabel }}
          </span>
          <span class="badge badge-xs badge-ghost">{{ run?.sourceType }}</span>
          <span class="text-[10px] text-base-content/35">#{{ run?.sourceId }}</span>
        </div>
        <p
          v-if="sourceBlurb"
          class="mt-0.5 line-clamp-3 text-xs leading-snug text-base-content/60"
        >
          {{ sourceBlurb }}
        </p>
        <p v-else class="mt-0.5 text-xs italic text-base-content/40">
          No description on this record yet.
        </p>
      </div>
    </div>

    <!-- Stage matrix -->
    <div class="overflow-x-auto kr-panel-flat">
      <table class="table table-sm">
        <thead>
          <tr>
            <th class="text-xs">Item</th>
            <th
              v-for="stage in stages"
              :key="stage.key"
              class="text-center text-xs"
            >
              {{ stage.short }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in run?.items"
            :key="item.id"
            class="cursor-pointer transition"
            :class="item.id === selectedItemId ? 'bg-primary/10' : 'hover:bg-base-200'"
            @click="selectedItemId = item.id"
          >
            <td class="max-w-[10rem] p-0 text-xs font-semibold">
              <button
                type="button"
                class="flex w-full items-center gap-1 truncate rounded-lg px-3 py-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
                :aria-pressed="item.id === selectedItemId"
                :aria-label="
                  autoBuildFailed(item)
                    ? `Select ${item.label} — auto-build failed for this item`
                    : `Select ${item.label}`
                "
                @click.stop="selectedItemId = item.id"
              >
                <Icon
                  v-if="autoBuildFailed(item)"
                  name="kind-icon:warning"
                  class="h-3 w-3 shrink-0 text-error"
                  :title="item.error ?? 'Auto-build failed for this item.'"
                  aria-hidden="true"
                />
                <span class="truncate">{{ item.label }}</span>
              </button>
            </td>
            <td
              v-for="stage in stages"
              :key="stage.key"
              class="text-center"
            >
              <span
                role="img"
                class="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                :class="statusClass(item.stages[stage.key].status)"
                :title="item.stages[stage.key].status"
                :aria-label="`${stage.short}: ${item.stages[stage.key].status}`"
              >
                <Icon
                  :name="statusIcon(item.stages[stage.key].status)"
                  class="h-3 w-3"
                  aria-hidden="true"
                />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Batch editor for the selected item's quantity group -->
    <model-builder-batch-editor
      v-if="selectedItem && showBatch"
      :key="selectedItem.outputKey"
      :output-key="selectedItem.outputKey"
      @select-item="selectedItemId = $event"
    />

    <!-- Selected item panel -->
    <model-builder-item-panel
      v-if="selectedItem"
      :key="selectedItem.id"
      :item-id="selectedItem.id"
    />
    <div
      v-else
      class="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/50"
    >
      Select a row to work through its stages.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import { BUILD_STAGES, getRecipe } from '@/stores/helpers/modelBuilderRecipes'
import type { BuildItem, StageStatus } from '@/stores/modelBuilderStore'

const store = useModelBuilderStore()
const stages = BUILD_STAGES

const run = computed(() => store.run)
const recipeLabel = computed(() =>
  run.value ? getRecipe(run.value.recipeKey)?.label : '',
)

// Pre-run advisory (t-038): how many items in the whole run are mid-manual-
// action right now, so a click on "Auto-build all" doesn't surprise the user
// with a lower-than-expected committed count -- those items will just be
// skipped this pass.
const busyCount = computed(
  () =>
    run.value?.items.filter((item) => store.isItemManualActionInFlight(item.id))
      .length ?? 0,
)
// Bug (model-builder/t-029, cycle 25): this button only ever disabled on
// store.autoBuilding (a second whole-run auto-build), never on
// store.batchingOutputKey -- so a group batch operation running from
// model-builder-batch-editor.vue (Draft pitches/fields/prompts, Approve
// fields, or Auto-build group) left this button clickable, letting the user
// start a second, fully concurrent walk over the same run's items. See
// modelBuilderStore.ts's isRunOperationInFlight doc comment for the full
// race this caused.
const batchInProgress = computed(() => store.batchingOutputKey !== null)
const autoBuildAllDisabled = computed(
  () => store.autoBuilding || batchInProgress.value,
)
const autoBuildAllTitle = computed(() => {
  if (batchInProgress.value) {
    return (
      'A batch group operation is already running for this run -- wait ' +
      'for it to finish before Auto-build all.'
    )
  }
  return busyCount.value
    ? `${busyCount.value} item${busyCount.value === 1 ? '' : 's'} in this run ` +
        `${busyCount.value === 1 ? 'has' : 'have'} a manual action in progress ` +
        'right now and will be skipped this pass -- retry after it finishes.'
    : 'Draft, generate, and commit every item automatically'
})

// The source record we're building from — snapshot survives resume; fall back to
// the freshly-picked record.
const source = computed<Record<string, unknown> | null>(
  () => run.value?.sourceSnapshot ?? store.selectedSource ?? null,
)

function str(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

const sourceImage = computed(() => {
  const record = source.value
  if (!record) return ''
  const art = record.ArtImage as
    | { thumbnailPath?: string; imagePath?: string }
    | undefined
  return (
    str(record, 'imagePath') ||
    str(record, 'avatarImage') ||
    art?.thumbnailPath ||
    art?.imagePath ||
    ''
  )
})

const sourceBlurb = computed(() => {
  const record = source.value
  if (!record) return ''
  for (const key of [
    'description',
    'pitch',
    'backstory',
    'flavorText',
    'botIntro',
    'subtitle',
  ]) {
    const value = str(record, key)
    if (value.trim()) return value
  }
  return ''
})

const selectedItemId = ref<string>(run.value?.items[0]?.id ?? '')
const selectedItem = computed(() =>
  run.value?.items.find((item) => item.id === selectedItemId.value),
)

// Show the batch editor when the selected item is part of a quantity/expansion
// group (more than one item sharing its outputKey).
const selectedGroup = computed(() =>
  store.itemGroups.find(
    (group) => group.outputKey === selectedItem.value?.outputKey,
  ),
)
const showBatch = computed(() => (selectedGroup.value?.items.length ?? 0) > 1)

// A failed auto-build reverts its stage back to 'ready' (see autoBuildItem's
// per-stage branches in modelBuilderStore.ts) -- indistinguishable in the
// matrix below from an item that was simply never attempted, unless
// lastAutoBuildOutcome is also checked. Committed always wins over a stale
// 'failed': the single-item "Execute commit" button can fix and commit an
// item without ever going back through autoBuildItem, which would otherwise
// leave this reading a failure that's no longer true. Mirrors the store's
// own runProgress.failed and model-builder-batch-editor.vue's identical
// helper -- all three must agree on what counts as "failed right now".
//
// item.error is also checked, not just lastAutoBuildOutcome (model-builder/
// t-029): lastAutoBuildOutcome is session-only client state -- adaptItem
// never restores it on resume/reopen/reload, by design, since it means
// "what this session's auto-build pass just did." item.error is the
// persisted signal (server column, now actually written -- see
// generateItemAsset/generateItemAssetAsync/pollAsyncArtJob/commitItem's own
// pushItem calls in modelBuilderStore.ts) meant to survive exactly that.
// Without this OR, the warning badge and its tooltip silently disappeared
// the moment a failed run was reopened from History or the page reloaded,
// even though the item was still stuck exactly where it failed.
function autoBuildFailed(item: BuildItem): boolean {
  return (
    item.stages.COMMIT.status !== 'approved' &&
    (item.lastAutoBuildOutcome === 'failed' || Boolean(item.error))
  )
}

function statusClass(status: StageStatus): string {
  switch (status) {
    case 'approved':
      return 'bg-success/20 text-success'
    case 'ready':
      return 'bg-primary/20 text-primary'
    case 'in-progress':
      return 'bg-info/20 text-info animate-pulse'
    case 'rejected':
      return 'bg-error/20 text-error'
    case 'stale':
      return 'bg-warning/20 text-warning'
    default:
      return 'bg-base-300 text-base-content/40'
  }
}

function statusIcon(status: StageStatus): string {
  switch (status) {
    case 'approved':
      return 'kind-icon:check'
    case 'ready':
      return 'kind-icon:pencil'
    case 'in-progress':
      return 'kind-icon:loading'
    case 'rejected':
      return 'kind-icon:x'
    case 'stale':
      return 'kind-icon:refresh'
    default:
      return 'kind-icon:lock'
  }
}
</script>
