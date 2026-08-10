<template>
  <section
    class="mx-auto flex w-full max-w-7xl flex-col gap-4 px-1 pb-8 sm:gap-5 sm:px-2"
    aria-label="Brainstorm idea workbench"
    data-testid="brainstorm-manager"
  >
    <form
      class="kr-panel-flat border border-base-content/10 bg-base-100/95 p-4 shadow-xl backdrop-blur sm:p-6"
      data-testid="brainstorm-composer"
      @submit.prevent="generate"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-[min(100%,28rem)] flex-1">
          <div
            class="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-primary"
          >
            <span aria-hidden="true">🧠</span>
            Brainstorm
          </div>
          <h2 class="text-2xl font-black tracking-tight text-base-content sm:text-3xl">
            What are we trying to invent?
          </h2>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-base-content/65">
            Give Brainstorm a premise, problem, joke setup, art target, or half-formed thought.
            It will propose a batch. You keep the sparks and bully the beige ones into doing better.
          </p>
        </div>

        <div class="rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-base-content/75">
          <p class="font-black text-secondary">Human taste stays in charge.</p>
          <p class="mt-1 max-w-56 leading-5">The model makes options. None become anything else until you choose.</p>
        </div>
      </div>

      <div class="mt-5">
        <label for="brainstorm-premise" class="text-sm font-black text-base-content">
          Premise
        </label>
        <textarea
          id="brainstorm-premise"
          v-model="premiseModel"
          class="textarea textarea-bordered mt-2 min-h-28 w-full resize-y bg-base-100 text-base leading-6"
          maxlength="12000"
          placeholder="Invent ten terrible ice cream flavors with an actual comic premise…"
          :disabled="isGenerating"
          data-testid="brainstorm-premise"
          @keydown.meta.enter.prevent="generate"
          @keydown.ctrl.enter.prevent="generate"
        />
      </div>

      <div class="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label for="brainstorm-count" class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
            Ideas
          </label>
          <input
            id="brainstorm-count"
            v-model.number="resultCountModel"
            type="number"
            :min="BRAINSTORM_MIN_RESULTS"
            :max="BRAINSTORM_MAX_RESULTS"
            class="input input-bordered mt-1 w-24 bg-base-100 font-bold"
            :disabled="isGenerating"
            data-testid="brainstorm-count"
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary min-w-36"
          :disabled="!canGenerate"
          data-testid="brainstorm-generate"
        >
          <span v-if="isBatchGenerating" class="loading loading-spinner loading-sm" aria-hidden="true" />
          {{ isBatchGenerating ? 'Brainstorming…' : activeCandidates.length ? 'Fresh batch' : 'Generate ideas' }}
        </button>

        <p class="max-w-xl text-xs leading-5 text-base-content/50">
          {{ resultCountModel }} distinct direction{{ resultCountModel === 1 ? '' : 's' }}. A fresh batch does not erase the previous one.
        </p>
      </div>

      <div class="mt-4" data-testid="brainstorm-creative-directions">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
            Push the batch
          </p>
          <p class="text-xs text-base-content/45">Creative moves, not model knobs.</p>
        </div>
        <div class="mt-2 flex flex-wrap gap-2" role="group" aria-label="Creative direction">
          <button
            v-for="direction in creativeDirections"
            :key="direction.id"
            type="button"
            class="btn btn-sm h-auto min-h-9 rounded-full px-3 py-2"
            :class="mode === direction.id ? 'btn-secondary' : 'btn-ghost border border-base-content/10 bg-base-100'"
            :aria-pressed="mode === direction.id"
            :disabled="isGenerating"
            :data-testid="`brainstorm-direction-${direction.id}`"
            @click="store.setMode(direction.id)"
          >
            {{ direction.label }}
          </button>
        </div>
        <p class="mt-2 max-w-3xl text-xs leading-5 text-base-content/55">
          {{ activeCreativeDirection.description }}
        </p>
      </div>

      <details class="mt-4 rounded-2xl border border-base-content/10 bg-base-200/45 p-3">
        <summary class="cursor-pointer select-none text-sm font-bold text-base-content/75">
          Add constraints or examples
        </summary>
        <div class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4">
          <div>
            <label for="brainstorm-constraints" class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
              Constraints
            </label>
            <textarea
              id="brainstorm-constraints"
              v-model="constraintsModel"
              class="textarea textarea-bordered mt-1 min-h-24 w-full resize-y bg-base-100"
              maxlength="8000"
              placeholder="Each under 15 words. No repeats. Make the danger obvious but cartoonish."
              :disabled="isGenerating"
            />
          </div>
          <div>
            <label for="brainstorm-examples" class="text-xs font-black uppercase tracking-[0.12em] text-base-content/55">
              Your examples
            </label>
            <textarea
              id="brainstorm-examples"
              v-model="examplesText"
              class="textarea textarea-bordered mt-1 min-h-24 w-full resize-y bg-base-100"
              maxlength="12000"
              placeholder="One example per line. These are context, not a mold."
              :disabled="isGenerating"
            />
          </div>
        </div>
      </details>
    </form>

    <div
      v-if="generationError"
      class="alert border border-error/25 bg-error/10 text-base-content"
      role="alert"
      data-testid="brainstorm-error"
    >
      <span aria-hidden="true">⚠</span>
      <div class="min-w-0 flex-1">
        <p class="font-black">{{ errorHeading }}</p>
        <p class="mt-1 break-words text-sm opacity-80">{{ generationError.message }}</p>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" @click="store.clearGenerationError()">
        Dismiss
      </button>
    </div>

    <div
      v-if="batches.length > 1"
      class="kr-panel-flat flex flex-wrap items-center gap-2 border border-base-content/10 bg-base-100/85 p-3"
      aria-label="Brainstorm batch history"
    >
      <span class="mr-1 text-xs font-black uppercase tracking-[0.12em] text-base-content/45">Batches</span>
      <button
        v-for="(batch, index) in batches"
        :key="batch.id"
        type="button"
        class="btn btn-sm"
        :class="batch.id === activeBatchId ? 'btn-primary' : 'btn-ghost'"
        :disabled="isGenerating"
        @click="setActiveBatch(batch.id)"
      >
        {{ index + 1 }} · {{ batch.candidateIds.length }}
      </button>
    </div>

    <div
      v-if="activeCandidates.length"
      class="flex flex-wrap items-center justify-between gap-3 px-1"
    >
      <div>
        <p class="text-xs font-black uppercase tracking-[0.14em] text-base-content/45">Current batch</p>
        <p class="mt-1 text-sm text-base-content/65">
          {{ activeCandidates.length }} candidate{{ activeCandidates.length === 1 ? '' : 's' }} ·
          {{ keptCandidates.length }} kept · {{ rejectedCandidates.length }} rejected
        </p>
      </div>
      <p v-if="isGenerating && generationTargetId" class="text-sm font-bold text-secondary">
        Working on one idea without touching the others…
      </p>
    </div>

    <div
      v-if="activeCandidates.length"
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-start gap-4"
      data-testid="brainstorm-candidates"
    >
      <BrainstormCandidateCard
        v-for="candidate in activeCandidates"
        :key="candidate.id"
        :candidate="candidate"
        :disabled="isGenerating"
        :busy="generationTargetId === candidate.id"
        :busy-action="candidateBusyAction(candidate.id)"
        @keep="keepCandidate(candidate.id)"
        @reject="rejectCandidate(candidate.id)"
        @reset="resetCandidate(candidate.id)"
        @delete="deleteCandidate(candidate.id)"
        @feedback="setCandidateFeedback(candidate.id, $event)"
        @edit="editCandidate(candidate.id, $event)"
        @regenerate="regenerate(candidate.id)"
        @branch="branch(candidate.id)"
      />
    </div>

    <div
      v-else-if="isBatchGenerating"
      class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] gap-4"
      aria-label="Generating Brainstorm candidates"
    >
      <div
        v-for="index in skeletonCount"
        :key="index"
        class="kr-panel-flat min-h-56 animate-pulse border border-base-content/8 bg-base-100/75 p-5"
      >
        <div class="h-4 w-24 rounded bg-base-300" />
        <div class="mt-4 h-5 w-2/3 rounded bg-base-300" />
        <div class="mt-4 h-3 w-full rounded bg-base-200" />
        <div class="mt-2 h-3 w-5/6 rounded bg-base-200" />
        <div class="mt-2 h-3 w-4/6 rounded bg-base-200" />
      </div>
    </div>

    <div
      v-else
      class="kr-panel-flat border border-dashed border-base-content/20 bg-base-100/65 p-7 text-center shadow-sm"
      data-testid="brainstorm-empty"
    >
      <p class="text-3xl" aria-hidden="true">✦</p>
      <h3 class="mt-2 text-xl font-black text-base-content">No candidates yet.</h3>
      <p class="mx-auto mt-2 max-w-2xl text-sm leading-6 text-base-content/60">
        The blank page is currently winning. Give Brainstorm something to push against, then decide which ideas deserve to survive.
      </p>
      <div class="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2" aria-label="Brainstorm starters">
        <button
          v-for="starter in starterPremises"
          :key="starter.label"
          type="button"
          class="btn btn-ghost btn-sm h-auto min-h-10 max-w-full whitespace-normal border border-base-content/10 bg-base-100 px-3 py-2 text-left"
          :disabled="isGenerating"
          @click="applyStarter(starter)"
        >
          <span class="font-black">{{ starter.label }}</span>
          <span class="text-base-content/55">{{ starter.teaser }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  BRAINSTORM_MAX_RESULTS,
  BRAINSTORM_MIN_RESULTS,
} from '@/types/brainstorm'
import { useBrainstormStore } from '@/stores/brainstormStore'

const creativeDirections = [
  {
    id: 'freeform',
    label: 'Open field',
    description: 'Follow the premise wherever the strongest distinct ideas lead.',
  },
  {
    id: 'stranger',
    label: 'Stranger',
    description: 'Push beyond the first obvious answers without drifting into random noun soup.',
  },
  {
    id: 'grounded',
    label: 'More grounded',
    description: 'Keep the variety, but favor ideas a human could actually use or build on.',
  },
  {
    id: 'darker-funnier',
    label: 'Darker / funnier',
    description: 'Look for sharper comic premise, escalation, irony, cartoon peril, and darker absurdity where allowed.',
  },
  {
    id: 'shorter',
    label: 'Shorter',
    description: 'Cut throat-clearing and explanations. Keep the strongest useful seed.',
  },
  {
    id: 'different-angle',
    label: 'Different angle',
    description: 'Change the viewpoint, mechanism, relationship, structure, or assumption.',
  },
  {
    id: 'genre-shift',
    label: 'Genre shift',
    description: 'Recast the premise through genuinely different creative grammars, not costume changes.',
  },
  {
    id: 'invert',
    label: 'Invert it',
    description: 'Reverse a central assumption, role, incentive, cause, or expected outcome.',
  },
] as const

const starterPremises = [
  {
    label: 'Bad ice cream',
    teaser: 'Comic premise, not random gross nouns.',
    premise:
      'Invent ten terrible ice cream flavors. Each should have an actual comic premise, not just a random gross ingredient.',
    mode: 'darker-funnier',
  },
  {
    label: 'Useful weirdness',
    teaser: 'Make an ordinary problem less ordinary.',
    premise:
      'Give me eight genuinely different ways to make waiting in a long line more fun without using phones or spending much money.',
    mode: 'different-angle',
  },
  {
    label: 'Cartoon peril',
    teaser: 'Safe does not mean bland.',
    premise:
      'Invent eight family-friendly comedy premises involving ridiculous cartoon peril. Find the joke instead of merely listing accidents.',
    mode: 'darker-funnier',
  },
  {
    label: 'Visual directions',
    teaser: 'Different compositions, not adjective swaps.',
    premise:
      'Give me eight visually distinct portrait concepts for a clockwork librarian who is terrified of overdue books.',
    mode: 'stranger',
  },
] as const

const store = useBrainstormStore()
const {
  premise,
  resultCount,
  constraints,
  examples,
  mode,
  activeCandidates,
  keptCandidates,
  rejectedCandidates,
  batches,
  activeBatchId,
  isGenerating,
  canGenerate,
  generationError,
  generationTargetId,
} = storeToRefs(store)

const pendingCandidateAction = ref<{
  id: string
  action: 'regenerate' | 'branch'
} | null>(null)

const premiseModel = computed({
  get: () => premise.value,
  set: (value: string) => store.setPremise(value),
})

const resultCountModel = computed({
  get: () => resultCount.value,
  set: (value: number) => store.setResultCount(value),
})

const constraintsModel = computed({
  get: () => constraints.value,
  set: (value: string) => store.setConstraints(value),
})

const examplesText = computed({
  get: () => examples.value.join('\n'),
  set: (value: string) => store.setExamplesFromText(value),
})

const activeCreativeDirection = computed(
  () => creativeDirections.find((direction) => direction.id === mode.value) || creativeDirections[0],
)

const isBatchGenerating = computed(
  () => isGenerating.value && !generationTargetId.value,
)

const skeletonCount = computed(() => Math.min(resultCount.value, 6))

const errorHeading = computed(() => {
  switch (generationError.value?.kind) {
    case 'auth':
      return 'Sign in to generate ideas'
    case 'mana':
      return 'Brainstorm needs more mana'
    case 'server':
      return 'Text server unavailable'
    case 'malformed':
      return 'That batch failed quality control'
    case 'provider':
      return 'The text provider stumbled'
    case 'validation':
      return 'Brainstorm needs a premise'
    default:
      return 'Brainstorm hit a snag'
  }
})

onMounted(() => {
  store.initializeSession()
})

function applyStarter(starter: (typeof starterPremises)[number]): void {
  store.setPremise(starter.premise)
  store.setMode(starter.mode)
}

function candidateBusyAction(candidateId: string): 'regenerate' | 'branch' | null {
  return pendingCandidateAction.value?.id === candidateId
    ? pendingCandidateAction.value.action
    : null
}

function setActiveBatch(batchId: string): void {
  store.setActiveBatch(batchId)
}

function keepCandidate(candidateId: string): void {
  store.keepCandidate(candidateId)
}

function rejectCandidate(candidateId: string): void {
  store.rejectCandidate(candidateId)
}

function resetCandidate(candidateId: string): void {
  store.resetCandidateStatus(candidateId)
}

function deleteCandidate(candidateId: string): void {
  store.removeCandidate(candidateId)
}

function setCandidateFeedback(candidateId: string, value: string): void {
  store.setCandidateFeedback(candidateId, value)
}

function editCandidate(
  candidateId: string,
  patch: { title: string; text: string },
): void {
  store.editCandidate(candidateId, patch)
}

async function generate(): Promise<void> {
  if (!canGenerate.value) return
  await store.generateBatch()
}

async function regenerate(candidateId: string): Promise<void> {
  pendingCandidateAction.value = { id: candidateId, action: 'regenerate' }
  try {
    await store.regenerateCandidate(candidateId)
  } finally {
    pendingCandidateAction.value = null
  }
}

async function branch(candidateId: string): Promise<void> {
  pendingCandidateAction.value = { id: candidateId, action: 'branch' }
  try {
    await store.branchCandidate(candidateId)
  } finally {
    pendingCandidateAction.value = null
  }
}
</script>