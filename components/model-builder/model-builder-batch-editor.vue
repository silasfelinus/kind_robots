<!-- /components/model-builder/model-builder-batch-editor.vue -->
<!--
  Batch editor for a quantity / expansion output (model-builder/t-027). A quantity
  output produces N BuildItems sharing an outputKey; this panel edits them
  together: automate a stage across all N, set one model field to the same value
  on all N, approve/auto-build the whole group — and hands off single-item
  fine-tuning to the existing item panel via the select-item event.
-->
<template>
  <div
    v-if="group"
    class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
  >
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
          :disabled="batching"
          @click="draftAll('pitch')"
        >
          <Icon name="kind-icon:sparkles" class="h-3.5 w-3.5" />
          Draft pitches
        </button>
        <button
          v-if="!isAsset"
          type="button"
          class="btn btn-xs rounded-lg"
          :disabled="batching"
          @click="draftAll('fields')"
        >
          <Icon name="kind-icon:sparkles" class="h-3.5 w-3.5" />
          Draft fields
        </button>
        <button
          v-if="wantArt"
          type="button"
          class="btn btn-xs rounded-lg"
          :disabled="batching"
          @click="draftAll('artPrompt')"
        >
          <Icon name="kind-icon:sparkles" class="h-3.5 w-3.5" />
          Draft prompts
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost rounded-lg"
          :disabled="batching"
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
          :disabled="batching"
          @click="store.batchAutoBuild(group.outputKey)"
        >
          <Icon name="kind-icon:bolt" class="h-3.5 w-3.5" />
          Auto-build group
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
          <span
            class="w-24 shrink-0 truncate text-xs font-semibold text-base-content"
            :title="field.label"
          >
            {{ field.label }}
            <span v-if="field.required" class="text-error">*</span>
          </span>
          <select
            v-if="field.choices"
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
            v-model="batchValues[field.key]"
            type="text"
            :placeholder="field.default || 'value for all'"
            class="input input-bordered input-xs flex-1 bg-base-100"
          />
          <button
            type="button"
            class="btn btn-xs rounded-lg"
            :disabled="batching || !batchValues[field.key]"
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
          <span class="badge badge-xs" :class="commitBadge(item)">
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
import { computed, reactive, ref } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import type { BuildItem, DraftField } from '@/stores/modelBuilderStore'
import { fieldSpecFor } from '@/stores/helpers/modelBuilderFields'

const props = defineProps<{ outputKey: string }>()
const emit = defineEmits<{ (e: 'select-item', itemId: string): void }>()

const store = useModelBuilderStore()

const group = computed(() =>
  store.itemGroups.find((entry) => entry.outputKey === props.outputKey),
)
const batching = computed(() => store.batchingOutputKey === props.outputKey)
const isAsset = computed(() => group.value?.action === 'ASSET_ONLY')
const wantArt = computed(
  () => store.includeArt && group.value?.generation === 'image',
)
const fields = computed(() =>
  group.value ? fieldSpecFor(group.value.targetModel) : [],
)

const onlyEmpty = ref(false)
const batchValues = reactive<Record<string, string>>({})

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

function itemStageSummary(item: BuildItem): string {
  return item.stages.COMMIT.status === 'approved'
    ? 'committed'
    : `${approvedCount(item)}/4`
}

function commitBadge(item: BuildItem): string {
  return item.stages.COMMIT.status === 'approved'
    ? 'badge-success'
    : 'badge-ghost'
}
</script>
