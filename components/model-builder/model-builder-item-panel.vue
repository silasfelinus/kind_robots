<!-- /components/model-builder/model-builder-item-panel.vue -->
<template>
  <div
    v-if="item"
    class="flex min-h-0 flex-1 flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3"
  >
    <div class="flex items-center gap-2">
      <h4 class="text-sm font-black text-base-content">{{ item.label }}</h4>
      <span class="badge badge-sm badge-ghost">{{ item.action }}</span>
      <span class="badge badge-sm badge-ghost">{{ item.generation }}</span>
    </div>

    <p
      v-if="item.error"
      class="rounded-lg bg-error/10 px-2 py-1 text-xs font-semibold text-error"
    >
      {{ item.error }}
    </p>

    <!-- Stage: PITCH -->
    <section class="rounded-xl border border-base-300 p-2.5">
      <div class="mb-1.5 flex items-center gap-2">
        <Icon name="kind-icon:lightbulb" class="h-4 w-4 text-primary" />
        <span class="text-xs font-bold uppercase tracking-wide">Pitch</span>
        <span class="badge badge-xs ml-auto" :class="badgeFor('PITCH')">
          {{ item.stages.PITCH.status }}
        </span>
      </div>
      <textarea
        v-model="pitch"
        rows="2"
        class="textarea textarea-bordered w-full rounded-xl text-sm"
        placeholder="Why this output exists and what it should convey…"
        :disabled="!isEditable('PITCH')"
        @change="store.updatePitch(item.id, pitch)"
      />
      <div class="mt-1.5 flex items-center justify-end gap-1.5">
        <button
          v-if="isEditable('PITCH')"
          type="button"
          class="btn btn-xs btn-ghost mr-auto gap-1 rounded-lg text-secondary"
          :disabled="isDrafting('pitch')"
          @click="draft('pitch')"
        >
          <span v-if="isDrafting('pitch')" class="loading loading-dots loading-xs" />
          <template v-else>
            <Icon name="kind-icon:magic" class="h-3.5 w-3.5" />
            Draft with AI
          </template>
        </button>
        <button
          v-if="item.stages.PITCH.status === 'approved'"
          type="button"
          class="btn btn-xs btn-ghost rounded-lg"
          @click="store.reopenStage(item.id, 'PITCH')"
        >
          Edit
        </button>
        <button
          v-else
          type="button"
          class="btn btn-xs btn-primary rounded-lg"
          :disabled="isLocked('PITCH') || !pitch.trim()"
          @click="approve('PITCH')"
        >
          Approve pitch
        </button>
      </div>
    </section>

    <!-- Stage: FIELDS_AND_PROMPTS -->
    <section class="rounded-xl border border-base-300 p-2.5">
      <div class="mb-1.5 flex items-center gap-2">
        <Icon name="kind-icon:list" class="h-4 w-4 text-primary" />
        <span class="text-xs font-bold uppercase tracking-wide">Fields &amp; Prompts</span>
        <span class="badge badge-xs ml-auto" :class="badgeFor('FIELDS_AND_PROMPTS')">
          {{ item.stages.FIELDS_AND_PROMPTS.status }}
        </span>
      </div>
      <div class="mb-0.5 flex items-center justify-between">
        <label class="block text-[10px] uppercase text-base-content/40">
          Proposed fields / relationships
        </label>
        <button
          v-if="isEditable('FIELDS_AND_PROMPTS')"
          type="button"
          class="btn btn-ghost btn-xs h-5 min-h-5 gap-1 rounded-md px-1.5 text-[10px] text-secondary"
          :disabled="isDrafting('fields')"
          @click="draft('fields')"
        >
          <span v-if="isDrafting('fields')" class="loading loading-dots loading-xs" />
          <template v-else>
            <Icon name="kind-icon:magic" class="h-3 w-3" />
            Draft
          </template>
        </button>
      </div>
      <textarea
        v-model="fields"
        rows="2"
        class="textarea textarea-bordered mb-1.5 w-full rounded-xl text-sm"
        placeholder="Schema fields and relationships to write on commit…"
        :disabled="!isEditable('FIELDS_AND_PROMPTS')"
        @change="store.updateFields(item.id, fields)"
      />
      <div class="mb-0.5 flex items-center justify-between">
        <label class="block text-[10px] uppercase text-base-content/40">
          Generation prompt
        </label>
        <button
          v-if="isEditable('FIELDS_AND_PROMPTS')"
          type="button"
          class="btn btn-ghost btn-xs h-5 min-h-5 gap-1 rounded-md px-1.5 text-[10px] text-secondary"
          :disabled="isDrafting('artPrompt')"
          @click="draft('artPrompt')"
        >
          <span v-if="isDrafting('artPrompt')" class="loading loading-dots loading-xs" />
          <template v-else>
            <Icon name="kind-icon:magic" class="h-3 w-3" />
            Draft
          </template>
        </button>
      </div>
      <textarea
        v-model="prompt"
        rows="2"
        class="textarea textarea-bordered w-full rounded-xl text-sm"
        placeholder="The prompt used to generate this asset…"
        :disabled="!isEditable('FIELDS_AND_PROMPTS')"
        @change="store.updatePrompt(item.id, prompt)"
      />
      <div class="mt-1.5 flex justify-end gap-1.5">
        <button
          v-if="item.stages.FIELDS_AND_PROMPTS.status === 'approved'"
          type="button"
          class="btn btn-xs btn-ghost rounded-lg"
          @click="store.reopenStage(item.id, 'FIELDS_AND_PROMPTS')"
        >
          Edit
        </button>
        <button
          v-else
          type="button"
          class="btn btn-xs btn-primary rounded-lg"
          :disabled="isLocked('FIELDS_AND_PROMPTS')"
          @click="approve('FIELDS_AND_PROMPTS')"
        >
          Approve fields &amp; prompts
        </button>
      </div>
    </section>

    <!-- Stage: GENERATE_ASSETS -->
    <section class="rounded-xl border border-base-300 p-2.5">
      <div class="mb-1.5 flex items-center gap-2">
        <Icon name="kind-icon:sparkles" class="h-4 w-4 text-primary" />
        <span class="text-xs font-bold uppercase tracking-wide">Generate Assets</span>
        <span class="badge badge-xs ml-auto" :class="badgeFor('GENERATE_ASSETS')">
          {{ item.stages.GENERATE_ASSETS.status }}
        </span>
      </div>

      <div
        v-if="item.generation !== 'image'"
        class="rounded-lg bg-base-200 px-2 py-1.5 text-xs text-base-content/55"
      >
        {{ item.generation }} generation is defined in the recipe but not yet
        wired into this front-end slice — image outputs run through the live art
        generator below.
      </div>

      <template v-else>
        <div
          v-if="item.imagePath"
          class="mb-1.5 overflow-hidden rounded-xl border border-base-300"
        >
          <img
            :src="item.imagePath"
            :alt="item.label"
            class="max-h-48 w-full object-contain bg-base-200"
          />
        </div>

        <button
          type="button"
          class="btn btn-sm btn-primary w-full rounded-xl"
          :disabled="!isEditable('GENERATE_ASSETS') || isGenerating"
          @click="store.generateItemAsset(item.id)"
        >
          <span v-if="isGenerating" class="loading loading-dots loading-sm" />
          <template v-else>
            <Icon name="kind-icon:sparkles" class="h-4 w-4" />
            {{ item.imagePath ? 'Regenerate candidate' : 'Generate candidate' }}
          </template>
        </button>
      </template>

      <div
        v-if="item.stages.GENERATE_ASSETS.status !== 'locked'"
        class="mt-1.5 flex justify-end gap-1.5"
      >
        <button
          v-if="item.stages.GENERATE_ASSETS.status === 'approved'"
          type="button"
          class="btn btn-xs btn-ghost rounded-lg"
          @click="store.reopenStage(item.id, 'GENERATE_ASSETS')"
        >
          Edit
        </button>
        <button
          v-else
          type="button"
          class="btn btn-xs btn-primary rounded-lg"
          :disabled="!canApproveAssets"
          @click="approve('GENERATE_ASSETS')"
        >
          Keep this asset
        </button>
      </div>
    </section>

    <!-- Stage: COMMIT -->
    <section class="rounded-xl border border-base-300 p-2.5">
      <div class="mb-1.5 flex items-center gap-2">
        <Icon name="kind-icon:check" class="h-4 w-4 text-primary" />
        <span class="text-xs font-bold uppercase tracking-wide">Commit</span>
        <span class="badge badge-xs ml-auto" :class="badgeFor('COMMIT')">
          {{ item.stages.COMMIT.status }}
        </span>
      </div>

      <div
        v-if="preview"
        class="space-y-1 rounded-lg bg-base-200 p-2 text-xs text-base-content/70"
      >
        <div>
          <span class="font-bold text-base-content">{{ preview.action }}</span>
          → {{ preview.targetType }}
        </div>
        <div>{{ preview.summary }}</div>
        <div v-if="preview.fields" class="whitespace-pre-wrap">
          <span class="text-base-content/40">fields:</span> {{ preview.fields }}
        </div>
        <div v-if="preview.artImageId" class="text-base-content/40">
          artImageId: {{ preview.artImageId }}
        </div>
      </div>

      <p class="mt-1 text-[10px] leading-snug text-base-content/40">
        The durable create / update / link / promote runs through the model APIs
        in a later gated milestone. Approving here records the final diff only.
      </p>

      <div class="mt-1.5 flex justify-end">
        <button
          type="button"
          class="btn btn-xs btn-success rounded-lg"
          :disabled="isLocked('COMMIT') || item.stages.COMMIT.status === 'approved'"
          @click="store.approveCommit(item.id)"
        >
          {{ item.stages.COMMIT.status === 'approved' ? 'Approved' : 'Approve commit' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import type { DraftField } from '@/stores/modelBuilderStore'
import type { BuildStageKey } from '@/stores/helpers/modelBuilderRecipes'

const props = defineProps<{ itemId: string }>()
const store = useModelBuilderStore()

const item = computed(() => store.run?.items.find((i) => i.id === props.itemId))

// Local drafts (the parent keys this component by item id, so init-from-item is
// safe — a different row remounts the panel).
const pitch = ref(item.value?.pitch ?? '')
const fields = ref(item.value?.fieldsDraft ?? '')
const prompt = ref(item.value?.promptDraft ?? '')

// Keep the textareas in sync when the store's draft fields change under us —
// e.g. an AI draft writes into the item.
watch(
  () => [item.value?.pitch, item.value?.fieldsDraft, item.value?.promptDraft],
  () => {
    pitch.value = item.value?.pitch ?? ''
    fields.value = item.value?.fieldsDraft ?? ''
    prompt.value = item.value?.promptDraft ?? ''
  },
)

const isGenerating = computed(() => store.generatingItemId === props.itemId)

function isDrafting(field: DraftField): boolean {
  return (
    store.draftingField?.itemId === props.itemId &&
    store.draftingField?.field === field
  )
}

function draft(field: DraftField): void {
  store.draftText(props.itemId, field)
}

const preview = computed(() => store.previewCommit(props.itemId))

const canApproveAssets = computed(() => {
  if (!item.value) return false
  if (isLocked('GENERATE_ASSETS')) return false
  // For image outputs, require a generated candidate first.
  if (item.value.generation === 'image') return Boolean(item.value.artImageId)
  return true
})

function isLocked(stage: BuildStageKey): boolean {
  const status = item.value?.stages[stage].status
  return status === 'locked'
}

// A stage's inputs are editable while it is workable. An approved stage locks
// behind its "Edit" button (which reopens it and stales downstream); a locked
// stage waits on its prerequisite.
function isEditable(stage: BuildStageKey): boolean {
  const status = item.value?.stages[stage].status
  return status === 'ready' || status === 'stale' || status === 'rejected'
}

function approve(stage: BuildStageKey): void {
  store.approveStage(props.itemId, stage)
}

function badgeFor(stage: BuildStageKey): string {
  const status = item.value?.stages[stage].status
  switch (status) {
    case 'approved':
      return 'badge-success'
    case 'ready':
      return 'badge-primary'
    case 'in-progress':
      return 'badge-info'
    case 'rejected':
      return 'badge-error'
    case 'stale':
      return 'badge-warning'
    default:
      return 'badge-ghost'
  }
}
</script>
