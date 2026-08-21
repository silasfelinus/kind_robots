<template>
  <article
    :id="`brainstorm-candidate-${candidate.id}`"
    class="kr-panel-flat flex min-h-64 flex-col border bg-base-100/95 p-4 shadow-md transition sm:p-5"
    :class="statusClass"
    :data-candidate-id="candidate.id"
  >
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span
            class="rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em]"
            :class="statusBadgeClass"
          >
            {{ statusLabel }}
          </span>
          <span
            v-if="returnTypeLabel"
            class="rounded-full bg-accent/10 px-2.5 py-1 text-[0.68rem] font-bold text-accent"
            :title="returnTypeDescription"
            data-testid="brainstorm-return-type-badge"
          >
            {{ returnTypeLabel }}
          </span>
          <span
            v-if="candidate.parentId"
            class="rounded-full bg-secondary/10 px-2.5 py-1 text-[0.68rem] font-bold text-secondary"
          >
            branch
          </span>
          <span
            v-if="candidate.edited"
            class="rounded-full bg-base-200 px-2.5 py-1 text-[0.68rem] font-bold text-base-content/55"
          >
            edited
          </span>
          <label
            v-if="candidate.status === 'kept'"
            class="flex cursor-pointer items-center gap-1.5 rounded-full bg-secondary/10 px-2.5 py-1 text-[0.68rem] font-bold text-secondary"
            data-testid="brainstorm-art-select"
          >
            <input
              type="checkbox"
              class="checkbox checkbox-xs checkbox-secondary"
              :checked="selectedForArt"
              :disabled="disabled || artBusy"
              @change="emit('toggleArtSelection')"
            />
            Select for art
          </label>
          <span
            v-if="artBusy"
            class="flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[0.68rem] font-bold text-secondary"
          >
            <span class="loading loading-spinner loading-xs" />
            Generating art…
          </span>
        </div>

        <template v-if="editing">
          <label class="sr-only" :for="`${candidate.id}-title`">
            Candidate title
          </label>
          <input
            :id="`${candidate.id}-title`"
            v-model="draftTitle"
            class="input input-bordered input-sm w-full font-bold"
            maxlength="120"
            placeholder="Optional title"
            :disabled="disabled"
          />
        </template>
        <h3
          v-else-if="candidate.title"
          class="break-words text-lg font-black leading-snug text-base-content"
        >
          {{ candidate.title }}
        </h3>
      </div>

      <button
        type="button"
        class="btn btn-ghost btn-xs shrink-0"
        :disabled="disabled"
        :aria-label="`Delete candidate${candidate.title ? ` ${candidate.title}` : ''}`"
        @click="emit('delete')"
      >
        ✕
      </button>
    </header>

    <div class="mt-3 flex-1">
      <template v-if="editing">
        <label class="sr-only" :for="`${candidate.id}-text`">
          Candidate text
        </label>
        <textarea
          :id="`${candidate.id}-text`"
          v-model="draftText"
          class="textarea textarea-bordered min-h-32 w-full resize-y leading-6"
          maxlength="4000"
          :disabled="disabled"
          @keydown.meta.enter.prevent="saveEdit"
          @keydown.ctrl.enter.prevent="saveEdit"
        />
        <div class="mt-2 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            :disabled="disabled"
            @click="cancelEdit"
          >
            Cancel edit
          </button>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="disabled || !draftText.trim()"
            @click="saveEdit"
          >
            Save edit
          </button>
        </div>
      </template>
      <p
        v-else
        class="whitespace-pre-wrap break-words text-sm leading-6 text-base-content/80"
      >
        {{ candidate.text }}
      </p>
    </div>

    <div
      v-if="artImageIds.length"
      class="mt-3 flex flex-wrap gap-2"
      data-testid="brainstorm-candidate-art"
    >
      <a
        v-for="imageId in artImageIds"
        :key="imageId"
        :href="`/api/art/images/${imageId}/file`"
        target="_blank"
        rel="noopener"
        class="block size-16 shrink-0 overflow-hidden rounded-lg border border-base-300"
      >
        <img
          :src="`/api/art/images/${imageId}/file`"
          :alt="`Generated art for ${candidate.title || 'this candidate'}`"
          class="size-full object-cover"
          loading="lazy"
        />
      </a>
    </div>

    <p
      v-if="artFailed"
      class="kr-note kr-note-error mt-3 text-xs"
      data-testid="brainstorm-candidate-art-error"
    >
      Art generation failed{{ artError ? `: ${artError}` : '.' }} Select for art
      and try again.
    </p>

    <details
      v-if="candidate.meta.branchOrigin"
      class="mt-4 rounded-2xl border border-secondary/15 bg-secondary/5 p-3"
      data-testid="brainstorm-branch-lineage"
    >
      <summary
        class="cursor-pointer select-none text-xs font-black uppercase tracking-[0.12em] text-secondary/80"
      >
        Branch lineage · parent v{{
          candidate.meta.branchOrigin.revisionIndex + 1
        }}
      </summary>
      <div class="mt-3 text-xs leading-5 text-base-content/65">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-black text-base-content/80">
            {{ candidate.meta.branchOrigin.title || 'Untitled parent' }}
          </span>
          <a
            v-if="parentCandidate"
            class="link link-secondary font-bold"
            :href="`#brainstorm-candidate-${parentCandidate.id}`"
          >
            Jump to parent
          </a>
          <span v-else class="text-base-content/40"
            >Parent no longer in this batch</span
          >
        </div>
        <p
          class="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-base-100/75 p-2"
        >
          {{ candidate.meta.branchOrigin.text }}
        </p>
      </div>
    </details>

    <details
      v-if="candidate.revisions.length > 1"
      class="mt-4 rounded-2xl border border-base-content/10 bg-base-200/35 p-3"
      data-testid="brainstorm-revision-history"
    >
      <summary
        class="cursor-pointer select-none text-xs font-black uppercase tracking-[0.12em] text-base-content/60"
      >
        History · {{ candidate.revisions.length }} versions
      </summary>
      <div class="mt-3 flex flex-col gap-2">
        <div
          v-for="entry in revisionEntries"
          :key="`${candidate.id}-revision-${entry.index}`"
          class="rounded-xl border border-base-content/8 bg-base-100/80 p-3"
        >
          <div class="flex flex-wrap items-center gap-2 text-[0.7rem]">
            <span class="font-black text-base-content/75"
              >v{{ entry.index + 1 }}</span
            >
            <span
              class="rounded-full bg-base-200 px-2 py-0.5 font-bold text-base-content/55"
            >
              {{ revisionReasonLabel(entry.revision.reason) }}
            </span>
            <span
              v-if="revisionReturnTypeLabel(entry.revision.returnType)"
              class="text-accent"
            >
              {{ revisionReturnTypeLabel(entry.revision.returnType) }}
            </span>
            <span class="text-base-content/35">{{
              formatRevisionTime(entry.revision.createdAt)
            }}</span>
            <span
              v-if="entry.current"
              class="ml-auto rounded-full bg-primary/10 px-2 py-0.5 font-black text-primary"
            >
              current
            </span>
          </div>
          <p
            v-if="entry.revision.title"
            class="mt-2 text-xs font-black text-base-content/75"
          >
            {{ entry.revision.title }}
          </p>
          <p
            class="mt-1 max-h-20 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-base-content/60"
          >
            {{ entry.revision.text }}
          </p>
          <div v-if="!entry.current" class="mt-2 flex justify-end">
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              :disabled="disabled"
              @click="emit('restoreRevision', entry.index)"
            >
              Restore this version
            </button>
          </div>
        </div>
      </div>
      <p class="mt-2 text-[0.7rem] leading-5 text-base-content/40">
        Restoring is non-destructive. The restored text becomes a new version
        instead of deleting later work.
      </p>
    </details>

    <div
      v-if="candidate.status === 'rejected'"
      class="mt-4 rounded-2xl border border-error/15 bg-error/5 p-3"
    >
      <label
        :for="`${candidate.id}-feedback`"
        class="text-xs font-black uppercase tracking-[0.12em] text-error/80"
      >
        What missed?
      </label>
      <textarea
        :id="`${candidate.id}-feedback`"
        v-model="feedbackDraft"
        class="textarea textarea-bordered textarea-sm mt-2 min-h-16 w-full resize-y bg-base-100/80"
        maxlength="4000"
        placeholder="Too obvious, wrong tone, keep the premise but change the mechanism…"
        :disabled="disabled"
        @blur="emitFeedback"
      />
    </div>

    <footer
      class="mt-4 flex flex-wrap items-center gap-2 border-t border-base-content/8 pt-4"
    >
      <button
        type="button"
        class="btn btn-sm"
        :class="candidate.status === 'kept' ? 'btn-success' : 'btn-ghost'"
        :disabled="disabled"
        @click="toggleKeep"
      >
        {{ candidate.status === 'kept' ? '✓ Kept' : 'Keep' }}
      </button>

      <button
        type="button"
        class="btn btn-sm"
        :class="candidate.status === 'rejected' ? 'btn-error' : 'btn-ghost'"
        :disabled="disabled"
        @click="toggleReject"
      >
        {{ candidate.status === 'rejected' ? 'Rejected' : 'Reject' }}
      </button>

      <button
        v-if="!editing"
        type="button"
        class="btn btn-ghost btn-sm"
        :disabled="disabled"
        @click="beginEdit"
      >
        Edit
      </button>

      <div class="ml-auto flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-outline btn-sm"
          :disabled="disabled"
          @click="regenerate"
        >
          <span
            v-if="busy && busyAction === 'regenerate'"
            class="loading loading-spinner loading-xs"
          />
          Regenerate
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="disabled"
          @click="branch"
        >
          <span
            v-if="busy && busyAction === 'branch'"
            class="loading loading-spinner loading-xs"
          />
          More like this
        </button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BRAINSTORM_RETURN_TYPES } from '@/types/brainstorm'
import type {
  BrainstormCandidate,
  BrainstormCandidateRevision,
  BrainstormReturnTypeId,
  BrainstormRevisionReason,
} from '@/types/brainstorm'

const props = defineProps<{
  candidate: BrainstormCandidate
  parentCandidate?: BrainstormCandidate | null
  disabled?: boolean
  busy?: boolean
  busyAction?: 'regenerate' | 'branch' | 'art' | null
  selectedForArt?: boolean
}>()

const emit = defineEmits<{
  keep: []
  reject: []
  reset: []
  delete: []
  regenerate: []
  branch: []
  restoreRevision: [revisionIndex: number]
  edit: [patch: { title: string; text: string }]
  feedback: [value: string]
  toggleArtSelection: []
}>()

const editing = ref(false)
const draftTitle = ref(props.candidate.title)
const draftText = ref(props.candidate.text)
const feedbackDraft = ref(props.candidate.feedback)

watch(
  () => props.candidate.title,
  (value) => {
    if (!editing.value) draftTitle.value = value
  },
)

watch(
  () => props.candidate.text,
  (value) => {
    if (!editing.value) draftText.value = value
  },
)

watch(
  () => props.candidate.feedback,
  (value) => {
    feedbackDraft.value = value
  },
)

const statusLabel = computed(() => {
  if (props.candidate.status === 'kept') return 'kept'
  if (props.candidate.status === 'rejected') return 'rejected'
  return 'candidate'
})

const statusClass = computed(() => {
  if (props.candidate.status === 'kept') return 'border-success/35'
  if (props.candidate.status === 'rejected') return 'border-error/30 opacity-90'
  return 'border-base-content/10'
})

const statusBadgeClass = computed(() => {
  if (props.candidate.status === 'kept') return 'bg-success/15 text-success'
  if (props.candidate.status === 'rejected') return 'bg-error/12 text-error'
  return 'bg-primary/10 text-primary'
})

const artBusy = computed(
  () => Boolean(props.busy) && props.busyAction === 'art',
)
const artImageIds = computed(() => props.candidate.meta.art?.imageIds ?? [])
// brainstorm/t-017: meta.art.status/error persist past a page reload, unlike
// artBusy (this session's own in-flight generation flag) -- so a failed
// attempt from an earlier session stays visible instead of silently looking
// identical to "art never requested." Only surfaced once nothing in *this*
// session is actively generating, so a live retry's spinner takes priority
// over the stale error it's in the middle of replacing.
const artFailed = computed(
  () => !artBusy.value && props.candidate.meta.art?.status === 'failed',
)
const artError = computed(() => props.candidate.meta.art?.error || null)

const returnType = computed(() =>
  BRAINSTORM_RETURN_TYPES.find(
    (entry) => entry.id === props.candidate.meta.returnType,
  ),
)
const returnTypeLabel = computed(() => returnType.value?.label || '')
const returnTypeDescription = computed(
  () => returnType.value?.description || '',
)

const revisionEntries = computed(() =>
  props.candidate.revisions
    .map((revision, index) => ({
      revision,
      index,
      current: index === props.candidate.revisions.length - 1,
    }))
    .reverse(),
)

function revisionReasonLabel(reason: BrainstormRevisionReason): string {
  switch (reason) {
    case 'generated':
      return 'generated'
    case 'edited':
      return 'edited'
    case 'regenerated':
      return 'regenerated'
    case 'branched':
      return 'branch created'
    case 'restored':
      return 'restored'
  }
}

function revisionReturnTypeLabel(
  returnTypeId: BrainstormReturnTypeId | null | undefined,
): string {
  if (!returnTypeId) return ''
  return (
    BRAINSTORM_RETURN_TYPES.find((entry) => entry.id === returnTypeId)?.label ||
    ''
  )
}

function formatRevisionTime(
  value: BrainstormCandidateRevision['createdAt'],
): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function toggleKeep(): void {
  if (props.candidate.status === 'kept') emit('reset')
  else emit('keep')
}

function toggleReject(): void {
  if (props.candidate.status === 'rejected') emit('reset')
  else emit('reject')
}

function beginEdit(): void {
  draftTitle.value = props.candidate.title
  draftText.value = props.candidate.text
  editing.value = true
}

function cancelEdit(): void {
  draftTitle.value = props.candidate.title
  draftText.value = props.candidate.text
  editing.value = false
}

function saveEdit(): void {
  const text = draftText.value.trim()
  if (!text) return
  emit('edit', { title: draftTitle.value.trim(), text })
  editing.value = false
}

function emitFeedback(): void {
  emit('feedback', feedbackDraft.value)
}

function regenerate(): void {
  emitFeedback()
  emit('regenerate')
}

function branch(): void {
  emitFeedback()
  emit('branch')
}
</script>
