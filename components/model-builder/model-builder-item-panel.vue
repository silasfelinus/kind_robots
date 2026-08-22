<!-- /components/model-builder/model-builder-item-panel.vue -->
<template>
  <div v-if="item" class="flex min-h-0 flex-1 flex-col gap-2 kr-panel-flat p-3">
    <div class="flex items-center gap-2">
      <h4 class="text-sm font-black text-base-content">{{ item.label }}</h4>
      <span class="badge badge-sm badge-ghost">{{ item.action }}</span>
      <span class="badge badge-sm badge-ghost">{{ item.generation }}</span>
      <button
        type="button"
        class="btn btn-xs btn-ghost ml-auto gap-1 rounded-lg text-primary"
        :disabled="isAutoBuilding || isManualActionInFlight"
        title="Draft, generate, and commit this item automatically"
        @click="store.autoBuildItem(item.id)"
      >
        <span v-if="isAutoBuilding" class="loading loading-dots loading-xs" />
        <template v-else>
          <Icon name="kind-icon:bolt" class="h-3.5 w-3.5" />
          Auto
        </template>
      </button>
    </div>

    <p
      v-if="item.error"
      role="alert"
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
        :disabled="!isEditable('PITCH') || isAnyDraftInFlight"
        @change="store.updatePitch(item.id, pitch)"
      />
      <div class="mt-1.5 flex items-center justify-end gap-1.5">
        <button
          v-if="isEditable('PITCH')"
          type="button"
          class="btn btn-xs btn-ghost mr-auto gap-1 rounded-lg text-secondary"
          :disabled="isAnyDraftInFlight"
          title="Draft this pitch with AI"
          @click="draft('pitch')"
        >
          <span
            v-if="isDrafting('pitch')"
            class="loading loading-dots loading-xs"
          />
          <template v-else>
            <Icon name="kind-icon:magic" class="h-3.5 w-3.5" />
            Draft with AI
          </template>
        </button>
        <button
          v-if="item.stages.PITCH.status === 'approved'"
          type="button"
          class="btn btn-xs btn-ghost rounded-lg"
          :disabled="isCommitting"
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
        <span class="text-xs font-bold uppercase tracking-wide"
          >Fields &amp; Prompts</span
        >
        <span
          class="badge badge-xs ml-auto"
          :class="badgeFor('FIELDS_AND_PROMPTS')"
        >
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
          :disabled="isAnyDraftInFlight"
          title="Draft the schema fields and relationships with AI"
          @click="draft('fields')"
        >
          <span
            v-if="isDrafting('fields')"
            class="loading loading-dots loading-xs"
          />
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
        :disabled="!isEditable('FIELDS_AND_PROMPTS') || isAnyDraftInFlight"
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
          :disabled="isAnyDraftInFlight"
          title="Draft the generation prompt with AI"
          @click="draft('artPrompt')"
        >
          <span
            v-if="isDrafting('artPrompt')"
            class="loading loading-dots loading-xs"
          />
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
        :disabled="!isEditable('FIELDS_AND_PROMPTS') || isAnyDraftInFlight"
        @change="store.updatePrompt(item.id, prompt)"
      />
      <div class="mt-1.5 flex justify-end gap-1.5">
        <button
          v-if="item.stages.FIELDS_AND_PROMPTS.status === 'approved'"
          type="button"
          class="btn btn-xs btn-ghost rounded-lg"
          :disabled="isCommitting"
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
        <span class="text-xs font-bold uppercase tracking-wide"
          >Generate Assets</span
        >
        <span
          class="badge badge-xs ml-auto"
          :class="badgeFor('GENERATE_ASSETS')"
        >
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

        <div class="flex gap-1.5">
          <button
            type="button"
            class="btn btn-sm btn-primary flex-1 rounded-xl"
            :disabled="
              !isEditable('GENERATE_ASSETS') || isGenerating || isQueued
            "
            :title="
              item.imagePath ? 'Regenerate candidate' : 'Generate candidate'
            "
            @click="store.generateItemAsset(item.id)"
          >
            <span v-if="isGenerating" class="loading loading-dots loading-sm" />
            <template v-else>
              <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              {{
                item.imagePath ? 'Regenerate candidate' : 'Generate candidate'
              }}
            </template>
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline btn-primary rounded-xl"
            :disabled="
              !isEditable('GENERATE_ASSETS') || isGenerating || isQueued
            "
            title="Queue generation and keep working — polls in the background, no need to wait here."
            :aria-label="
              item.imagePath
                ? 'Queue regeneration in background'
                : 'Queue generation in background'
            "
            @click="store.generateItemAssetAsync(item.id)"
          >
            <Icon name="kind-icon:clock" class="h-4 w-4" />
          </button>
        </div>

        <div
          v-if="isQueued"
          class="mt-1.5 flex items-center gap-1.5 rounded-lg bg-base-200 px-2 py-1 text-xs text-base-content/70"
        >
          <span class="loading loading-dots loading-xs" />
          {{ item.queueState === 'rendering' ? 'Rendering…' : 'Queued…' }}
        </div>
      </template>

      <div
        v-if="item.stages.GENERATE_ASSETS.status !== 'locked'"
        class="mt-1.5 flex justify-end gap-1.5"
      >
        <button
          v-if="item.stages.GENERATE_ASSETS.status === 'approved'"
          type="button"
          class="btn btn-xs btn-ghost rounded-lg"
          :disabled="isCommitting"
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
        Commit writes durably and idempotently: ASSET_ONLY promotes the asset,
        UPDATE writes a source field, CREATE makes a private draft record and
        links it. Re-running is safe — it won't duplicate.
      </p>

      <div class="mt-1.5 flex items-center justify-end gap-2">
        <span
          v-if="item.targetId"
          class="mr-auto text-[10px] font-semibold text-success"
        >
          Committed → {{ item.targetType }} #{{ item.targetId }}
        </span>
        <button
          type="button"
          class="btn btn-xs btn-success rounded-lg"
          :disabled="
            isLocked('COMMIT') ||
            item.stages.COMMIT.status === 'approved' ||
            isCommitting ||
            isCommitBlocked
          "
          :title="commitButtonTitle"
          @click="store.commitItem(item.id)"
        >
          <span v-if="isCommitting" class="loading loading-dots loading-xs" />
          <template v-else>
            {{
              item.stages.COMMIT.status === 'approved'
                ? 'Committed'
                : 'Execute commit'
            }}
          </template>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useModelBuilderStore } from '@/stores/modelBuilderStore'
import type { DraftField } from '@/stores/modelBuilderStore'
import { BUILD_STAGES } from '@/stores/helpers/modelBuilderRecipes'
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
// e.g. an AI draft writes into the item. Watched per-field (not as one combined
// array) so a draft/update landing on one field doesn't clobber unsaved edits
// the user is mid-typing in the other two textareas of the same item.
watch(
  () => item.value?.pitch,
  (value) => {
    pitch.value = value ?? ''
  },
)
watch(
  () => item.value?.fieldsDraft,
  (value) => {
    fields.value = value ?? ''
  },
)
watch(
  () => item.value?.promptDraft,
  (value) => {
    prompt.value = value ?? ''
  },
)

const isGenerating = computed(() => store.generatingItemId === props.itemId)
const isQueued = computed(() => Boolean(item.value?.queueState))
const isCommitting = computed(() => store.committingItemId === props.itemId)
const isAutoBuilding = computed(() => store.autoBuildingItemId === props.itemId)

function isDrafting(field: DraftField): boolean {
  return (
    store.draftingField?.itemId === props.itemId &&
    store.draftingField?.field === field
  )
}

// draftingField is a single store-wide slot (see modelBuilderStore.ts's
// createOwnedSingleton comment) -- only one draft can genuinely be in flight
// at a time, for any item/field in the whole run. isDrafting(field) alone
// only reports whether *this exact* field owns that slot right now, so
// gating each textarea/button on isDrafting(field) let a second click (a
// sibling field on this item, or any field on a different item) silently
// steal the slot out from under the first: the first field's isDrafting()
// then flips to false, its textarea/button re-enable while its request is
// still pending, and the eventual response can clobber whatever the user
// typed in the meantime with no warning. Gating on "is *any* draft in
// flight" instead closes that hole -- the spinner still only shows on the
// field actually owning the slot (isDrafting), but nothing else becomes
// editable/clickable until it's released.
const isAnyDraftInFlight = computed(() => store.draftingField !== null)

// A manual single-stage action already in flight for this item blocks Auto
// too -- the store's autoBuildItem guard mirrors this, but the button must
// disable in step or a click here is silently swallowed with no feedback.
const isManualActionInFlight = computed(
  () =>
    isGenerating.value ||
    isQueued.value ||
    isCommitting.value ||
    isAnyDraftInFlight.value,
)

function draft(field: DraftField): void {
  store.draftText(props.itemId, field)
}

const preview = computed(() => store.previewCommit(props.itemId))

const canApproveAssets = computed(() => {
  if (!item.value) return false
  if (isLocked('GENERATE_ASSETS')) return false
  // Async finalization clears queueState before its final image network round-trip.
  // Keep the old candidate unapprovable until GENERATE_ASSETS actually leaves
  // in-progress, otherwise the user can approve the old image and force the
  // newly-rendered replacement to be discarded by the store's safety guard.
  if (item.value.stages.GENERATE_ASSETS.status === 'in-progress') return false
  // A regenerate in flight means the current artImageId is about to be
  // replaced — approving now would commit a candidate the user never saw.
  if (isGenerating.value || isQueued.value) return false
  // 'stale' means an upstream edit (reopening PITCH/FIELDS_AND_PROMPTS) marked
  // this stage stale via markDownstreamStale after a candidate was already
  // generated — but markDownstreamStale never clears artImageId/imagePath, so
  // the item still carries the pre-edit candidate. Without this check, "Keep
  // this asset" stayed clickable and approveStage would commit that stale
  // image straight through with no re-review, silently pairing it with the
  // just-edited (different) pitch/fields/prompt. Require a fresh regenerate
  // first — isEditable('GENERATE_ASSETS') already keeps Generate/Regenerate
  // enabled while stale.
  if (item.value.stages.GENERATE_ASSETS.status === 'stale') return false
  // ASSET_ONLY items always write artImageId on commit (see
  // server/api/model-builder/items/[id]/commit.post.ts), regardless of
  // generation kind. Gating this only on generation === 'image' let
  // ASSET_ONLY + non-image-kind outputs (e.g. 'plan'/'three-d' recipe
  // entries like launch-plan, three-d-reference, reward-3d — several
  // defaultOn) approve GENERATE_ASSETS with no candidate ever generated,
  // since those kinds have no wired generator and always fall through
  // this check. "Keep this asset" then looked identical to a real
  // approval, COMMIT unlocked, and the server-side commit threw
  // "Generate and keep an asset before committing" -- a dead end, since
  // reopening the stage just re-shows the same always-enabled button.
  // Text-generation UPDATE/CREATE items never need artImageId to commit
  // (they commit on `text` instead), so this must key off `action`, not
  // `generation`, to keep those correctly approvable.
  if (item.value.action === 'ASSET_ONLY') return Boolean(item.value.artImageId)
  return true
})

// Bug (model-builder/t-029, cycle 50): the Execute-commit button previously
// disabled only on isLocked('COMMIT') || approved || isCommitting -- it
// stayed clickable while COMMIT.status === 'stale' (an upstream edit
// reopened an earlier stage after this item had already been ready/approved
// to commit -- see markDownstreamStale). server/api/model-builder/items/
// [id]/commit.post.ts independently requires every OTHER stage to be
// status === 'approved' before committing (dryRun aside), so a stale-commit
// click was previously a guaranteed round-trip to that 400, with the caught
// error resetting COMMIT to 'ready' via finishCommit -- silently discarding
// the accurate "an upstream stage still needs to be redone" signal the
// 'stale' badge was showing (the same "badge lying about what's actually
// stored" class of bug this file's updatePitch/updateFields/updatePrompt
// comment above already treats as real).
//
// The fix must NOT simply add `item.stages.COMMIT.status === 'stale'` to
// the disabled list: 'stale' is COMMIT's only recovery path in this store.
// approveStage's "unlock the next stage" branch only flips a *locked* next
// stage to 'ready' (`if (next && item.stages[next.key].status === 'locked')
// ...`) -- it never un-stales one, so once COMMIT goes 'stale' there is no
// other code path that ever moves it back to 'ready'/'approved' short of a
// commitItem() call itself succeeding. Disabling on status === 'stale'
// verbatim would permanently soft-lock the item: re-approving the upstream
// stage that caused the staleness would leave COMMIT stuck at 'stale'
// forever with no enabled button left to clear it.
//
// Mirroring the server's own gate instead -- every other stage must be
// 'approved' -- closes the guaranteed-400 round-trip without that soft-lock:
// the button re-enables the instant the real prerequisite is satisfied,
// regardless of whether COMMIT's own badge still reads 'stale' or 'ready'.
const commitBlockedStage = computed(() => {
  if (!item.value) return undefined
  const stages = item.value.stages
  return BUILD_STAGES.find(
    (stage) =>
      stage.key !== 'COMMIT' && stages[stage.key].status !== 'approved',
  )
})
const isCommitBlocked = computed(() => Boolean(commitBlockedStage.value))
const commitButtonTitle = computed(() =>
  commitBlockedStage.value
    ? `${commitBlockedStage.value.label} must be approved before committing.`
    : 'Execute commit',
)

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
