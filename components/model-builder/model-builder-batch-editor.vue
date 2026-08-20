<!-- /components/model-builder/model-builder-batch-editor.vue -->
<!--
  Batch editor for a quantity / expansion output (model-builder/t-027). A quantity
  output produces N BuildItems sharing an outputKey; this panel edits them
  together: automate a stage across all N, set one model field to the same value
  on all N, approve/auto-build the whole group — and hands off single-item
  fine-tuning to the existing item panel via the select-item event.
-->
<template>
  <div v-if="group" class="flex flex-col gap-3 kr-panel-flat p-3">
    <!-- Header -->
    <div class="flex items-start justify-between gap-2">
      <div>
        <h4
          class="flex items-center gap-1.5 text-sm font-black text-base-content"
        >
          <Icon name="kind-icon:layers" class="h-4 w-4 text-primary" />
          Batch edit — {{ group.label }}
        </h4>
        <p class="mt-0.5 text-xs text-base-content/60">
          {{ group.items.length }} {{ group.targetModel }} items · edit them
          together, fine-tune any one below
        </p>
      </div>
      <span
        v-if="batching"
        class="loading loading-dots loading-sm text-primary"
      />
    </div>

    <!-- Automate the whole group -->
    <section class="rounded-xl border border-base-300 bg-base-200 p-2.5">
      <div class="mb-2 flex items-center justify-between gap-2">
        <span
          class="text-xs font-bold uppercase tracking-wide text-base-content/50"
        >
          Automate all {{ group.items.length }}
        </span>
        <label
          class="flex cursor-pointer items-center gap-1 text-[11px] text-base-content/60"
        >
          <input
            v-model="onlyEmpty"
            type="checkbox"
            class="checkbox checkbox-xs"
          />
          Only empty
        </label>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          type="button"
          class="btn btn-xs rounded-lg"
          :disabled="anyBatching || store.autoBuilding"
          @click="draftAll('pitch')"
        >
          <Icon name="kind-icon:sparkles" class="h-3.5 w-3.5" />
          Draft pitches
        </button>
        <button
          v-if="!isAsset"
          type="button"
          class="btn btn-xs rounded-lg"
          :disabled="anyBatching || store.autoBuilding"
          @click="draftAll('fields')"
        >
          <Icon name="kind-icon:sparkles" class="h-3.5 w-3.5" />
          Draft fields
        </button>
        <button
          v-if="wantArt"
          type="button"
          class="btn btn-xs rounded-lg"
          :disabled="anyBatching || store.autoBuilding"
          @click="draftAll('artPrompt')"
        >
          <Icon name="kind-icon:sparkles" class="h-3.5 w-3.5" />
          Draft prompts
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost rounded-lg"
          :disabled="anyBatching || store.autoBuilding"
          @click="
            store.batchApproveStage(group.outputKey, 'FIELDS_AND_PROMPTS')
          "
        >
          <Icon name="kind-icon:check" class="h-3.5 w-3.5" />
          Approve fields
        </button>
        <button
          type="button"
          class="btn btn-xs btn-primary rounded-lg"
          :disabled="anyBatching || store.autoBuilding"
          :title="autoBuildGroupTitle"
          @click="store.batchAutoBuild(group.outputKey)"
        >
          <Icon name="kind-icon:bolt" class="h-3.5 w-3.5" />
          Auto-build group
          <span v-if="busyCount" class="badge badge-xs badge-ghost"
            >{{ busyCount }} busy</span
          >
        </button>
      </div>
    </section>

    <!-- Set one field to the same value on every item -->
    <section
      v-if="!isAsset && fields.length"
      class="rounded-xl border border-base-300 bg-base-200 p-2.5"
    >
      <span
        class="mb-2 block text-xs font-bold uppercase tracking-wide text-base-content/50"
      >
        Set a field on all {{ group.items.length }}
      </span>
      <div class="flex flex-col gap-1.5">
        <div
          v-for="field in fields"
          :key="field.key"
          class="flex items-center gap-2"
        >
          <label
            class="w-24 shrink-0 truncate text-xs font-semibold text-base-content"
            :for="batchFieldId(field.key)"
            :title="field.label"
          >
            {{ field.label }}
            <span v-if="field.required" class="text-error">*</span>
          </label>
          <select
            v-if="field.choices"
            :id="batchFieldId(field.key)"
            v-model="batchValues[field.key]"
            class="select select-bordered select-xs flex-1 bg-base-100"
          >
            <option value="">—</option>
            <option
              v-for="choice in field.choices"
              :key="choice"
              :value="choice"
            >
              {{ choice }}
            </option>
          </select>
          <input
            v-else
            :id="batchFieldId(field.key)"
            v-model="batchValues[field.key]"
            type="text"
            :placeholder="field.default || 'value for all'"
            class="input input-bordered input-xs flex-1 bg-base-100"
          />
          <button
            type="button"
            class="btn btn-xs rounded-lg"
            :disabled="
              anyBatching || store.autoBuilding || !batchValues[field.key]
            "
            :aria-label="`Apply ${field.label} to all ${group.items.length} items`"
            @click="applyField(field.key)"
          >
            Apply
          </button>
        </div>
      </div>
    </section>

    <!-- Per-item fine-tune -->
    <section class="rounded-xl border border-base-300 bg-base-200 p-2.5">
      <span
        class="mb-2 block text-xs font-bold uppercase tracking-wide text-base-content/50"
      >
        Fine-tune individual items
      </span>
      <ul class="flex flex-col gap-1">
        <li
          v-for="item in group.items"
          :key="item.id"
          class="flex items-center gap-2 rounded-lg bg-base-100 px-2 py-1"
        >
          <span
            class="min-w-0 flex-1 truncate text-xs font-semibold text-base-content"
          >
            {{ item.label }}
          </span>
          <span
            class="badge badge-xs"
            :class="commitBadge(item)"
            :title="
              autoBuildFailed(item)
                ? (item.error ?? 'Auto-build failed for this item.')
                : undefined
            "
          >
            {{ itemStageSummary(item) }}
          </span>
          <button
            type="button"
            class="btn btn-xs btn-ghost rounded-lg"
            @click="emit('select-item', item.id)"
          >
            <Icon name="kind-icon:pencil" class="h-3 w-3" />
            Edit
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import type { BuildItem, DraftField } from '@/stores/modelBuilderStore'
import {
  fieldSpecFor,
  readFieldLine,
} from '@/stores/helpers/modelBuilderFields'

const props = defineProps<{ outputKey: string }>()
const emit = defineEmits<{ (e: 'select-item', itemId: string): void }>()

const store = useModelBuilderStore()

const group = computed(() =>
  store.itemGroups.find((entry) => entry.outputKey === props.outputKey),
)
const batching = computed(() => store.batchingOutputKey === props.outputKey)

// batchingOutputSingleton (modelBuilderStore.ts) is a single store-wide slot,
// not one per group -- see createOwnedSingleton's own doc comment: claiming
// it is an unconditional overwrite, so it's only reliable as "who owns the
// spinner right now," never as a lock that blocks a second claim. This
// component is keyed by outputKey (progress-matrix.vue's
// `:key="selectedItem.outputKey"`, from t-029's earlier batch-editor-key
// fix), and row clicks that change the selected item/group are never
// disabled -- so switching to a different quantity group while this group's
// batchDraftField/batchSetField/batchAutoBuild is still running unmounts
// this instance and mounts a fresh one for the new group, whose own
// `batching` (scoped to ITS OWN outputKey) reads false even though the old
// group's operation is still in flight. Every action button used to gate
// only on that narrow `batching`, so the new group's buttons stayed
// clickable and could kick off a second, fully concurrent batch operation --
// racing draftText's shared draftingField singleton, defeating
// batchDraftField's "sequentially, so we don't hammer the text server"
// design, and letting the two operations' unscoped setStatus() completion
// toasts silently clobber each other. Mirrors item-panel.vue's
// isAnyDraftInFlight (gates every field's controls on ANY draft being in
// flight, not just the matching one) -- gate every action button here on
// ANY batch operation being in flight anywhere in the run, not just this
// group, so a second one can't start until the first actually finishes.
// `batching` above stays narrow on purpose -- it only drives this group's
// own header spinner.
const anyBatching = computed(() => store.batchingOutputKey !== null)

// Bug (model-builder/t-029, cycle 25): every `:disabled` above used to check
// only `anyBatching` -- ANY group's batch operation -- never
// `store.autoBuilding`, the SEPARATE store-wide flag model-builder-progress-
// matrix.vue's "Auto-build all" sets. Clicking "Auto-build all" while this
// group's own batch controls were still enabled let the user start a
// second, fully concurrent walk over the same run's items: autoBuildRun's
// per-item loop and a batch action here (e.g. "Auto-build group" on a
// DIFFERENT group, or even this same one) both drive items through
// draftText/generateItemAsset/commitItem, so two items in the same run
// could end up mid-generate/mid-commit at the same instant via two
// independent orchestration passes -- the same race class `anyBatching`
// itself exists to prevent for two batch operations, just never extended to
// this sibling whole-run entry point. See modelBuilderStore.ts's
// isRunOperationInFlight doc comment. Added inline (`anyBatching ||
// store.autoBuilding`) at each `:disabled` rather than folded into
// `anyBatching`'s own definition so
// verifyModelBuilderBatchAnyInFlightGuard.ts's existing exact-text check on
// that computed's definition (a DIFFERENT, already-shipped regression
// guard) keeps passing unchanged.
const isAsset = computed(() => group.value?.action === 'ASSET_ONLY')
const wantArt = computed(
  () => store.includeArt && group.value?.generation === 'image',
)
const fields = computed(() =>
  group.value ? fieldSpecFor(group.value.targetModel) : [],
)

// Pre-run advisory (t-038): how many items in this group are mid-manual-action
// right now, so a click on "Auto-build group" doesn't surprise the user with a
// lower-than-expected committed count -- those items will just be skipped.
const busyCount = computed(
  () =>
    group.value?.items.filter((item) =>
      store.isItemManualActionInFlight(item.id),
    ).length ?? 0,
)
const autoBuildGroupTitle = computed(() =>
  busyCount.value
    ? `${busyCount.value} item${busyCount.value === 1 ? '' : 's'} in this group ` +
      `${busyCount.value === 1 ? 'has' : 'have'} a manual action in progress ` +
      'right now and will be skipped this pass -- retry after it finishes.'
    : undefined,
)

const onlyEmpty = ref(false)
const batchValues = reactive<Record<string, string>>({})

// Pre-populate "Set a field on all N" with the group's existing shared value
// (model-builder/t-029, cycle 19 -- suggested lead from cycle 18): every
// item's fieldsDraft already carries a "key: value" blob (seeded by
// defaultFieldsTemplate, drafted by AI, or previously set by this very
// panel), but readFieldLine -- the helper written to read exactly that --
// was never called here, so this panel always started blank even when every
// item in the group already agreed on a value. Only pre-fills a field when
// EVERY item holds the identical non-empty value; any disagreement
// (including one item that was individually edited away from the rest)
// leaves the input blank, same as before this fix, so a stale majority
// value is never silently offered over a real per-item difference. Runs
// once on mount only -- this component remounts on outputKey change (see
// model-builder-progress-matrix.vue's `:key="selectedItem.outputKey"` and
// verifyModelBuilderBatchEditorKeyGuard.ts), so there's no stale-group case
// to re-derive for, and re-running after the user starts editing would
// clobber an in-progress edit with the original shared value.
onMounted(() => {
  const currentGroup = group.value
  if (!currentGroup) return
  for (const field of fields.value) {
    const values = currentGroup.items.map((item) =>
      readFieldLine(item.fieldsDraft, field.key, currentGroup.targetModel),
    )
    const [first, ...rest] = values
    if (first && rest.every((value) => value === first)) {
      batchValues[field.key] = first
    }
  }
})

function batchFieldId(key: string): string {
  return `model-builder-batch-${props.outputKey}-${key}`
}

async function draftAll(field: DraftField): Promise<void> {
  if (!group.value) return
  await store.batchDraftField(group.value.outputKey, field, {
    onlyEmpty: onlyEmpty.value,
  })
}

function applyField(key: string): void {
  if (!group.value) return
  const value = batchValues[key]
  if (!value) return
  store.batchSetField(group.value.outputKey, key, value)
}

function approvedCount(item: BuildItem): number {
  return Object.values(item.stages).filter(
    (stage) => stage.status === 'approved',
  ).length
}

// A failed auto-build reverts its stage back to 'ready' (see autoBuildItem's
// per-stage branches in modelBuilderStore.ts) -- indistinguishable from an
// item that was simply never attempted, unless lastAutoBuildOutcome is also
// checked. Committed always wins over a stale 'failed': the single-item
// "Execute commit" button can fix and commit an item without ever going back
// through autoBuildItem, which would otherwise leave this reading a failure
// that's no longer true.
//
// item.error is also checked (model-builder/t-029, mirrors model-builder-
// progress-matrix.vue's identical helper, which both must keep agreeing
// with): lastAutoBuildOutcome is session-only and never restored on resume,
// while item.error is the persisted signal that survives it -- see
// modelBuilderStore.ts's generateItemAsset/generateItemAssetAsync/
// pollAsyncArtJob/commitItem pushItem calls.
function autoBuildFailed(item: BuildItem): boolean {
  return (
    item.stages.COMMIT.status !== 'approved' &&
    (item.lastAutoBuildOutcome === 'failed' || Boolean(item.error))
  )
}

function itemStageSummary(item: BuildItem): string {
  if (item.stages.COMMIT.status === 'approved') return 'committed'
  if (autoBuildFailed(item)) return 'failed'
  return `${approvedCount(item)}/4`
}

function commitBadge(item: BuildItem): string {
  if (item.stages.COMMIT.status === 'approved') return 'badge-success'
  if (autoBuildFailed(item)) return 'badge-error'
  return 'badge-ghost'
}
</script>
