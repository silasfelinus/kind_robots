<!-- /components/content/prompts/brainstorm-interact.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-300 p-3 text-base-content"
  >
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div
        class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <Icon name="kind-icon:brain" class="h-7 w-7 text-primary" />

            <h1 class="text-2xl font-black text-primary">
              Brainstorm Interact
            </h1>

            <span :class="sourceBadgeClass(currentCreationSource)">
              {{ currentCreationSource }}
            </span>

            <span v-if="activeSourceLabel" class="badge badge-outline">
              {{ activeSourceLabel }}
            </span>
          </div>

          <p class="mt-1 max-w-4xl text-sm text-base-content/65">
            Start from a pitch or prompt, generate more ideas, then accept,
            edit, reject, save, or overwrite. Tiny idea court is now in session.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="
              sourceMode === 'pitch' ? 'btn-primary text-white' : 'btn-outline'
            "
            @click="setSourceMode('pitch')"
          >
            <Icon name="kind-icon:idea" class="h-4 w-4" />
            Pitch
          </button>

          <button
            type="button"
            class="btn btn-sm rounded-2xl"
            :class="
              sourceMode === 'prompt' ? 'btn-primary text-white' : 'btn-outline'
            "
            @click="setSourceMode('prompt')"
          >
            <Icon name="kind-icon:quote" class="h-4 w-4" />
            Prompt
          </button>

          <button
            type="button"
            class="btn btn-sm btn-ghost rounded-2xl"
            @click="resetSession"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>

      <div
        v-if="statusMessage"
        class="rounded-2xl border p-3 text-sm"
        :class="
          statusTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ statusMessage }}
      </div>

      <div
        v-if="pitchStore.lastError || promptStore.lastError"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ pitchStore.lastError || promptStore.lastError }}
      </div>
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_320px]"
    >
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 space-y-3 border-b border-base-300 p-3">
          <div>
            <h2 class="text-lg font-bold text-base-content">Source</h2>

            <p class="text-xs text-base-content/60">
              Pick the seed idea to mutate responsibly.
            </p>
          </div>

          <input
            v-model="sourceSearch"
            class="input input-bordered input-sm w-full rounded-2xl bg-base-200"
            :placeholder="
              sourceMode === 'pitch' ? 'Search pitches...' : 'Search prompts...'
            "
          />

          <select
            v-if="sourceMode === 'pitch'"
            v-model="pitchTypeFilter"
            class="select select-bordered select-sm w-full rounded-2xl bg-base-200"
          >
            <option value="">All pitch types</option>

            <option
              v-for="type in pitchStore.pitchTypes"
              :key="type"
              :value="type"
            >
              {{ type }}
            </option>
          </select>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <template v-if="sourceMode === 'pitch'">
            <button
              v-for="pitch in filteredPitches"
              :key="pitch.id"
              type="button"
              class="mb-2 w-full rounded-2xl border p-3 text-left transition hover:border-primary hover:bg-base-200"
              :class="
                selectedPitch?.id === pitch.id
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-100'
              "
              @click="selectPitch(pitch.id)"
            >
              <div class="flex items-start justify-between gap-2">
                <h3 class="line-clamp-1 text-sm font-bold">
                  {{ pitch.title || 'Untitled Pitch' }}
                </h3>

                <span class="badge badge-xs shrink-0">
                  {{ pitch.PitchType }}
                </span>
              </div>

              <p class="mt-1 line-clamp-3 text-xs text-base-content/65">
                {{ pitch.pitch }}
              </p>

              <div class="mt-2 flex flex-wrap gap-1">
                <span :class="sourceBadgeClass(getPitchSource(pitch))">
                  {{ getPitchSource(pitch) }}
                </span>

                <span
                  class="badge badge-xs"
                  :class="pitch.isPublic ? 'badge-success' : 'badge-warning'"
                >
                  {{ pitch.isPublic ? 'public' : 'private' }}
                </span>
              </div>
            </button>
          </template>

          <template v-else>
            <button
              v-for="prompt in filteredPrompts"
              :key="prompt.id"
              type="button"
              class="mb-2 w-full rounded-2xl border p-3 text-left transition hover:border-primary hover:bg-base-200"
              :class="
                promptStore.selectedPrompt?.id === prompt.id
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-100'
              "
              @click="selectPrompt(prompt.id)"
            >
              <div class="mb-1 flex flex-wrap items-center gap-1">
                <span :class="sourceBadgeClass(getPromptSource(prompt))">
                  {{ getPromptSource(prompt) }}
                </span>

                <span class="badge badge-ghost badge-xs">
                  #{{ prompt.id }}
                </span>
              </div>

              <p
                class="line-clamp-4 text-xs leading-relaxed text-base-content/70"
              >
                {{ prompt.prompt }}
              </p>
            </button>
          </template>

          <div
            v-if="activeSourceList.length === 0"
            class="flex min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-base-300 bg-base-200 p-4 text-center text-base-content/50"
          >
            <Icon name="kind-icon:search" class="h-10 w-10 text-primary/60" />

            <p class="text-sm font-bold">No source items found.</p>

            <p class="text-xs">
              Either the shelf is empty, or the filters are being spicy.
            </p>
          </div>
        </div>
      </aside>

      <main
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <section class="shrink-0 border-b border-base-300 p-4">
          <div
            class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]"
          >
            <div class="min-w-0">
              <h2 class="truncate text-xl font-black text-primary">
                {{ workingTitle }}
              </h2>

              <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
                {{ workingPremise }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="btn btn-sm btn-primary rounded-2xl text-white"
                :disabled="pitchStore.loading || !canGenerate"
                @click="generateCandidates(false)"
              >
                <span
                  v-if="pitchStore.loading"
                  class="loading loading-spinner loading-xs"
                />
                Generate
              </button>

              <button
                type="button"
                class="btn btn-sm btn-secondary rounded-2xl"
                :disabled="pitchStore.loading || !canResubmit"
                @click="generateCandidates(true)"
              >
                Resubmit
              </button>
            </div>
          </div>
        </section>

        <section class="min-h-0 overflow-y-auto bg-base-200 p-3">
          <div class="grid gap-3">
            <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <div
                class="mb-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <h3 class="text-lg font-bold">Examples</h3>

                  <p class="text-xs text-base-content/60">
                    Use examples to shape the next generation.
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-xs btn-outline rounded-2xl"
                  @click="addExample"
                >
                  <Icon name="kind-icon:plus" class="h-3 w-3" />
                  Add
                </button>
              </div>

              <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
                <div
                  v-for="(_, index) in examples"
                  :key="`example-${index}`"
                  class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 rounded-2xl border border-base-300 bg-base-200 p-2"
                >
                  <span
                    class="pt-2.5 text-right font-mono text-xs text-base-content/40"
                  >
                    {{ index + 1 }}
                  </span>

                  <textarea
                    v-model="examples[index]"
                    class="textarea textarea-bordered textarea-sm min-h-20 resize-y rounded-xl bg-base-100 font-mono text-xs"
                    :placeholder="`Example ${index + 1}`"
                    @input="markHumanEdit"
                  />

                  <button
                    type="button"
                    class="btn btn-xs btn-square btn-ghost rounded-xl text-error"
                    @click="removeExample(index)"
                  >
                    <Icon name="kind-icon:x" class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <div
                class="mb-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <h3 class="text-lg font-bold">
                    Responses
                    <span class="badge badge-info badge-sm ml-1">
                      {{ candidates.length }}
                    </span>
                  </h3>

                  <p class="text-xs text-base-content/60">
                    Keep the gold, reject the soup, edit anything salvageable.
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn btn-xs btn-info rounded-2xl"
                    :disabled="!pendingCandidates.length"
                    @click="acceptAllPending"
                  >
                    Accept Pending
                  </button>

                  <button
                    type="button"
                    class="btn btn-xs btn-warning rounded-2xl"
                    :disabled="!pendingCandidates.length"
                    @click="rejectAllPending"
                  >
                    Reject Pending
                  </button>

                  <button
                    type="button"
                    class="btn btn-xs btn-ghost rounded-2xl"
                    :disabled="!candidates.length"
                    @click="clearCandidates"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div
                v-if="candidates.length"
                class="grid grid-cols-1 gap-2 lg:grid-cols-2"
              >
                <article
                  v-for="candidate in candidates"
                  :key="candidate.id"
                  class="rounded-2xl border border-base-300 bg-base-200 p-3"
                  :class="{
                    'border-success/60 bg-success/10':
                      candidate.status === 'accepted',
                    'border-error/60 bg-error/10 opacity-80':
                      candidate.status === 'rejected',
                  }"
                >
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <span
                      class="badge badge-xs"
                      :class="{
                        'badge-ghost': candidate.status === 'pending',
                        'badge-success': candidate.status === 'accepted',
                        'badge-error': candidate.status === 'rejected',
                      }"
                    >
                      {{ candidate.status }}
                    </span>

                    <div class="flex gap-1">
                      <button
                        type="button"
                        class="btn btn-xs btn-primary rounded-xl"
                        :disabled="candidate.status === 'accepted'"
                        @click="acceptCandidate(candidate.id)"
                      >
                        Accept
                      </button>

                      <button
                        type="button"
                        class="btn btn-xs btn-error btn-outline rounded-xl"
                        :disabled="candidate.status === 'rejected'"
                        @click="rejectCandidate(candidate.id)"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  <textarea
                    v-model="candidate.draft"
                    class="textarea textarea-bordered min-h-28 w-full rounded-2xl bg-base-100 text-sm leading-relaxed"
                    @input="editCandidate(candidate.id)"
                  />

                  <label
                    v-if="candidate.status === 'rejected'"
                    class="form-control mt-2"
                  >
                    <span class="label">
                      <span class="label-text text-xs font-bold">
                        Rejection feedback
                      </span>
                    </span>

                    <textarea
                      v-model="candidate.feedback"
                      class="textarea textarea-bordered textarea-sm min-h-16 rounded-2xl bg-base-100 text-xs"
                      placeholder="Why did this one fail?"
                    />
                  </label>

                  <div class="mt-2 flex flex-wrap justify-between gap-2">
                    <button
                      type="button"
                      class="btn btn-xs btn-ghost rounded-xl"
                      @click="useCandidateAsPrompt(candidate)"
                    >
                      Use as Prompt
                    </button>

                    <button
                      type="button"
                      class="btn btn-xs btn-secondary rounded-xl"
                      @click="copyCandidateToExamples(candidate)"
                    >
                      Add Example
                    </button>
                  </div>
                </article>
              </div>

              <div
                v-else
                class="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-base-content/50"
              >
                <Icon
                  name="kind-icon:brain"
                  class="h-14 w-14 text-primary/60"
                />

                <div>
                  <p class="text-lg font-bold">No responses yet.</p>
                  <p class="mt-1 text-sm">
                    Generate candidates and let the idea confetti begin.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <footer
          class="grid shrink-0 grid-cols-1 gap-2 border-t border-base-300 bg-base-100 p-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
        >
          <textarea
            v-model="globalFeedback"
            class="textarea textarea-bordered min-h-16 resize-none rounded-2xl bg-base-200 text-sm"
            placeholder="Optional feedback for resubmitting rejected responses..."
          />

          <button
            type="button"
            class="btn btn-secondary rounded-2xl"
            :disabled="!acceptedCandidates.length"
            @click="saveAcceptedAsNew"
          >
            Save New
          </button>

          <button
            type="button"
            class="btn btn-warning rounded-2xl"
            :disabled="!selectedPitch || !acceptedCandidates.length"
            @click="overwriteSelectedPitch"
          >
            Overwrite
          </button>

          <button
            type="button"
            class="btn btn-primary rounded-2xl text-white"
            :disabled="pitchStore.loading || !canGenerate"
            @click="generateCandidates(false)"
          >
            Generate
          </button>
        </footer>
      </main>

      <aside
        class="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h2 class="mb-3 text-lg font-bold">Generation Settings</h2>

          <div class="grid gap-3">
            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Requests</span>
              </span>

              <input
                v-model.number="pitchStore.numberOfRequests"
                type="number"
                min="1"
                max="100"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Max Tokens</span>
              </span>

              <input
                v-model.number="pitchStore.maxTokens"
                type="number"
                min="100"
                max="4000"
                step="100"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
              />
            </label>

            <label class="form-control">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs font-bold">Temperature</span>
                <span class="font-mono text-xs font-bold text-primary">
                  {{ pitchStore.temperature.toFixed(1) }}
                </span>
              </div>

              <input
                v-model.number="pitchStore.temperature"
                type="range"
                min="0.1"
                max="1.5"
                step="0.1"
                class="range range-primary range-sm"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Public save</span>

              <input
                v-model="saveIsPublic"
                type="checkbox"
                class="toggle toggle-success toggle-sm"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
            >
              <span class="label-text text-sm font-bold">Mature save</span>

              <input
                v-model="saveIsMature"
                type="checkbox"
                class="toggle toggle-warning toggle-sm"
              />
            </label>
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <h2 class="text-lg font-bold">Save Preview</h2>

            <span :class="sourceBadgeClass(saveCreationSource)">
              {{ saveCreationSource }}
            </span>
          </div>

          <pre
            class="max-h-full overflow-auto whitespace-pre-wrap rounded-2xl bg-base-100 p-3 text-xs text-base-content/70"
            >{{ savePreview }}</pre
          >
        </section>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Pitch, Prompt } from '~/prisma/generated/prisma/client'
import { usePitchStore, PitchType } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'

type SourceMode = 'pitch' | 'prompt'
type CreationSourceType = 'HUMAN' | 'AI' | 'HYBRID' | 'UPLOAD' | 'UNKNOWN'
type CandidateStatus = 'pending' | 'accepted' | 'rejected'

type BrainstormCandidate = {
  id: string
  original: string
  draft: string
  status: CandidateStatus
  feedback: string
  wasEdited: boolean
}

type ActionResult<T = unknown> = {
  success: boolean
  message?: string
  data?: T
}

const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const userStore = useUserStore()

const sourceMode = ref<SourceMode>('pitch')
const sourceSearch = ref('')
const pitchTypeFilter = ref('')
const examples = ref<string[]>([])
const candidates = ref<BrainstormCandidate[]>([])
const globalFeedback = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const hasHumanEdits = ref(false)
const generatedThisSession = ref(false)
const saveIsPublic = ref(true)
const saveIsMature = ref(false)

const selectedPitch = computed(() => pitchStore.selectedPitch as Pitch | null)
const selectedPrompt = computed(
  () => promptStore.selectedPrompt as Prompt | null,
)

const activeSourceList = computed(() => {
  return sourceMode.value === 'pitch'
    ? filteredPitches.value
    : filteredPrompts.value
})

const filteredPitches = computed(() => {
  const query = sourceSearch.value.trim().toLowerCase()

  return pitchStore.pitches.filter((pitch) => {
    const matchesType = pitchTypeFilter.value
      ? pitch.PitchType === pitchTypeFilter.value
      : true

    if (!matchesType) return false

    if (!query) return true

    const haystack = [
      pitch.title,
      pitch.pitch,
      pitch.description,
      pitch.examples,
      pitch.flavorText,
      pitch.artPrompt,
      pitch.PitchType,
      getPitchSource(pitch),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const filteredPrompts = computed(() => {
  const query = sourceSearch.value.trim().toLowerCase()

  return promptStore.prompts.filter((prompt) => {
    if (!query) return true

    const haystack = [
      prompt.prompt,
      String(prompt.id),
      String(prompt.pitchId ?? ''),
      getPromptSource(prompt),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const activeSourceLabel = computed(() => {
  if (sourceMode.value === 'pitch') {
    return selectedPitch.value?.title || selectedPitch.value?.pitch || ''
  }

  return selectedPrompt.value?.prompt
    ? `Prompt #${selectedPrompt.value.id}`
    : ''
})

const workingTitle = computed(() => {
  if (sourceMode.value === 'pitch') {
    return selectedPitch.value?.title || 'Select a pitch'
  }

  if (selectedPrompt.value) {
    return `Prompt #${selectedPrompt.value.id}`
  }

  return 'Select a prompt'
})

const workingPremise = computed(() => {
  if (sourceMode.value === 'pitch') {
    return selectedPitch.value?.pitch || 'Pick a big idea from the shelf.'
  }

  return selectedPrompt.value?.prompt || 'Pick a text prompt to expand.'
})

const currentCreationSource = computed<CreationSourceType>(() => {
  if (generatedThisSession.value && hasHumanEdits.value) return 'HYBRID'
  if (generatedThisSession.value) return 'AI'
  if (hasHumanEdits.value) return 'HYBRID'

  if (sourceMode.value === 'pitch' && selectedPitch.value) {
    return getPitchSource(selectedPitch.value)
  }

  if (sourceMode.value === 'prompt' && selectedPrompt.value) {
    return getPromptSource(selectedPrompt.value)
  }

  return 'HUMAN'
})

const saveCreationSource = computed<CreationSourceType>(() => {
  if (acceptedCandidates.value.some((candidate) => candidate.wasEdited)) {
    return 'HYBRID'
  }

  if (generatedThisSession.value) return hasHumanEdits.value ? 'HYBRID' : 'AI'

  return currentCreationSource.value
})

const pendingCandidates = computed(() => {
  return candidates.value.filter((candidate) => candidate.status === 'pending')
})

const acceptedCandidates = computed(() => {
  return candidates.value.filter((candidate) => candidate.status === 'accepted')
})

const rejectedCandidates = computed(() => {
  return candidates.value.filter((candidate) => candidate.status === 'rejected')
})

const canGenerate = computed(() => {
  return Boolean(workingPremise.value.trim() && activeSourceLabel.value)
})

const canResubmit = computed(() => {
  return Boolean(canGenerate.value && rejectedCandidates.value.length)
})

const acceptedText = computed(() => {
  return acceptedCandidates.value
    .map((candidate) => candidate.draft.trim())
    .filter(Boolean)
    .join(' | ')
})

const savePreview = computed(() => {
  return [
    `Title: ${workingTitle.value}`,
    `Source: ${sourceMode.value}`,
    `Creation source: ${saveCreationSource.value}`,
    `Public: ${saveIsPublic.value ? 'yes' : 'no'}`,
    `Mature: ${saveIsMature.value ? 'yes' : 'no'}`,
    '',
    acceptedText.value || 'No accepted responses yet.',
  ].join('\n')
})

onMounted(async () => {
  await Promise.all([
    pitchStore.initialize({
      fetchRemote: true,
    }),
    promptStore.initialize({
      fetchRemote: true,
    }),
  ])

  hydrateExamplesFromSource()
})

watch(
  () => selectedPitch.value?.id,
  () => {
    if (sourceMode.value === 'pitch') {
      hydrateExamplesFromSource()
      candidates.value = []
    }
  },
)

watch(
  () => selectedPrompt.value?.id,
  () => {
    if (sourceMode.value === 'prompt') {
      hydrateExamplesFromSource()
      candidates.value = []
    }
  },
)

function setSourceMode(mode: SourceMode) {
  sourceMode.value = mode
  hydrateExamplesFromSource()
  candidates.value = []
  statusMessage.value = ''
}

function selectPitch(id: number) {
  void pitchStore.setSelectedPitch(id)
  void pitchStore.setSelectedTitle(id)
  sourceMode.value = 'pitch'
}

async function selectPrompt(id: number) {
  await promptStore.selectPrompt(id)
  sourceMode.value = 'prompt'
}

function hydrateExamplesFromSource() {
  if (sourceMode.value === 'pitch') {
    examples.value = splitExamples(selectedPitch.value?.examples)
    saveIsPublic.value = selectedPitch.value?.isPublic ?? true
    saveIsMature.value = selectedPitch.value?.isMature ?? false
    return
  }

  examples.value = selectedPrompt.value?.prompt
    ? [selectedPrompt.value.prompt]
    : []
  saveIsPublic.value = true
  saveIsMature.value = false
}

function addExample() {
  examples.value.push('')
  markHumanEdit()
}

function removeExample(index: number) {
  examples.value.splice(index, 1)
  markHumanEdit()
}

function markHumanEdit() {
  hasHumanEdits.value = true
}

function editCandidate(id: string) {
  const candidate = candidates.value.find((item) => item.id === id)

  if (!candidate) return

  candidate.wasEdited = candidate.draft.trim() !== candidate.original.trim()
  markHumanEdit()
}

function acceptCandidate(id: string) {
  const candidate = candidates.value.find((item) => item.id === id)

  if (!candidate) return

  candidate.status = 'accepted'
  generatedThisSession.value = true
}

function rejectCandidate(id: string) {
  const candidate = candidates.value.find((item) => item.id === id)

  if (!candidate) return

  candidate.status = 'rejected'
  candidate.feedback = candidate.feedback || globalFeedback.value.trim()
}

function acceptAllPending() {
  pendingCandidates.value.forEach((candidate) => {
    candidate.status = 'accepted'
  })

  generatedThisSession.value = true
  setStatus('Pending responses accepted.')
}

function rejectAllPending() {
  pendingCandidates.value.forEach((candidate) => {
    candidate.status = 'rejected'
    candidate.feedback = candidate.feedback || globalFeedback.value.trim()
  })

  setStatus('Pending responses rejected.')
}

function clearCandidates() {
  candidates.value = []
  pitchStore.apiResponse = ''
  setStatus('Responses cleared.')
}

function copyCandidateToExamples(candidate: BrainstormCandidate) {
  const text = candidate.draft.trim()

  if (!text) return

  examples.value.push(text)
  markHumanEdit()
  setStatus('Candidate added to examples.')
}

function useCandidateAsPrompt(candidate: BrainstormCandidate) {
  const text = candidate.draft.trim()

  if (!text) return

  promptStore.promptField = text
  promptStore.currentPrompt = text
  promptStore.syncToLocalStorage()
  setStatus('Candidate sent to promptStore.')
}

async function generateCandidates(useRejectedFeedback: boolean) {
  if (!canGenerate.value) return

  pitchStore.apiResponse = ''

  const context = buildPitchContext(useRejectedFeedback)
  pitchStore.selectedTitle = context
  pitchStore.selectedPitch = context
  pitchStore.exampleString = joinExamples(examples.value)

  setStatus(
    useRejectedFeedback
      ? 'Resubmitting rejected responses...'
      : 'Generating responses...',
  )

  const result =
    (await pitchStore.fetchBrainstormPitches()) as ActionResult<string> | void

  const responseText = pitchStore.apiResponse?.trim() || result?.data || ''

  if (!responseText.trim()) {
    setStatus(result?.message || 'No responses returned.', 'error')
    return
  }

  const nextCandidates = parseLines(responseText).map((text, index) => {
    return {
      id: `${Date.now()}-${index}`,
      original: text,
      draft: text,
      status: 'pending' as CandidateStatus,
      feedback: '',
      wasEdited: false,
    }
  })

  candidates.value = useRejectedFeedback
    ? [...candidates.value, ...nextCandidates]
    : nextCandidates

  generatedThisSession.value = true
  setStatus(`Generated ${nextCandidates.length} response(s).`)
}

async function saveAcceptedAsNew() {
  if (!acceptedText.value) {
    setStatus('Accept at least one response first.', 'error')
    return
  }

  const result = await pitchStore.createPitch({
    title: buildSaveTitle(),
    pitch: acceptedText.value,
    description: buildSaveDescription(),
    examples: acceptedText.value,
    PitchType: PitchType.BRAINSTORM,
    creationSource: saveCreationSource.value as never,
    isPublic: saveIsPublic.value,
    isMature: saveIsMature.value,
    userId: userStore.userId || 10,
  })

  if (!result.success || !result.data) {
    setStatus(result.message || 'Failed to save brainstorm.', 'error')
    return
  }

  await pitchStore.fetchPitches(true)
  pitchStore.setSelectedPitch(result.data.id)
  pitchStore.setSelectedTitle(result.data.id)
  sourceMode.value = 'pitch'
  setStatus('Accepted responses saved as a new brainstorm.')
}

async function overwriteSelectedPitch() {
  if (!selectedPitch.value || !acceptedText.value) {
    setStatus('Select a pitch and accept responses first.', 'error')
    return
  }

  const result = await pitchStore.updatePitch(selectedPitch.value.id, {
    pitch: acceptedText.value,
    examples: acceptedText.value,
    description: buildSaveDescription(),
    creationSource: saveCreationSource.value as never,
    isPublic: saveIsPublic.value,
    isMature: saveIsMature.value,
  })

  if (!result.success) {
    setStatus(result.message || 'Failed to overwrite brainstorm.', 'error')
    return
  }

  await pitchStore.fetchPitches(true)
  pitchStore.setSelectedPitch(selectedPitch.value.id)
  pitchStore.setSelectedTitle(selectedPitch.value.id)
  setStatus('Selected brainstorm overwritten.')
}

function resetSession() {
  candidates.value = []
  globalFeedback.value = ''
  statusMessage.value = ''
  hasHumanEdits.value = false
  generatedThisSession.value = false
  hydrateExamplesFromSource()
}

function buildPitchContext(useRejectedFeedback: boolean): Pitch {
  const title = workingTitle.value
  const premise = workingPremise.value
  const descriptionParts = [
    sourceMode.value === 'pitch'
      ? selectedPitch.value?.description
      : 'Generate more ideas from this prompt. Keep them specific, varied, and useful.',
    useRejectedFeedback ? buildRejectionFeedbackBlock() : '',
  ].filter(Boolean)

  return {
    ...(selectedPitch.value ?? {}),
    id: selectedPitch.value?.id ?? 0,
    title,
    pitch: premise,
    description: descriptionParts.join('\n\n'),
    examples: joinExamples(examples.value),
    PitchType: PitchType.BRAINSTORM,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: saveIsPublic.value,
    isMature: saveIsMature.value,
    userId: userStore.userId || 10,
    creationSource: currentCreationSource.value,
  } as Pitch
}

function buildRejectionFeedbackBlock() {
  const rejected = rejectedCandidates.value
    .map((candidate, index) => {
      return [
        `${index + 1}. Rejected: ${candidate.draft}`,
        `Feedback: ${candidate.feedback || globalFeedback.value}`,
      ].join('\n')
    })
    .join('\n\n')

  return [
    'Revision feedback:',
    globalFeedback.value.trim(),
    rejected,
    'Do not repeat rejected patterns. Generate fresh candidates that obey the feedback.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function buildSaveTitle() {
  if (sourceMode.value === 'pitch') {
    return selectedPitch.value?.title
      ? `${selectedPitch.value.title} Brainstorm`
      : 'Untitled Brainstorm'
  }

  return selectedPrompt.value?.id
    ? `Prompt ${selectedPrompt.value.id} Brainstorm`
    : 'Prompt Brainstorm'
}

function buildSaveDescription() {
  return [
    `Generated from ${sourceMode.value}.`,
    sourceMode.value === 'pitch'
      ? selectedPitch.value?.description
      : selectedPrompt.value?.prompt,
    globalFeedback.value ? `Session feedback: ${globalFeedback.value}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

type ApiLineObject = {
  text?: unknown
  content?: unknown
  message?: unknown
  data?: unknown
  title?: unknown
  pitch?: unknown
  description?: unknown
}

function isApiLineObject(value: unknown): value is ApiLineObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function stringifyLineSource(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyLineSource(item))
      .filter(Boolean)
      .join('\n')
  }

  if (isApiLineObject(value)) {
    const pitchParts = [value.title, value.pitch, value.description]
      .map((part) => stringifyLineSource(part).trim())
      .filter(Boolean)

    if (pitchParts.length) {
      return pitchParts.join(': ')
    }

    return stringifyLineSource(
      value.text ?? value.content ?? value.message ?? value.data,
    )
  }

  return String(value)
}

function parseLines(value: unknown): string[] {
  return stringifyLineSource(value)
    .split('\n')
    .flatMap((line) => line.split(/(?<=\.)\s+(?=[A-Z])/))
    .map((line) =>
      line
        .replace(/^[-*\d.)\s]+/, '')
        .replace(/^\*\*(product|topic|pitch):\*\*/i, '')
        .replace(/^(product|topic|pitch):/i, '')
        .trim(),
    )
    .filter(Boolean)
    .filter((line) => !isJunkIntroLine(line))
}

function isJunkIntroLine(line: string) {
  const normalized = line.trim().toLowerCase()

  return (
    normalized.startsWith('sure') ||
    normalized.startsWith('here are') ||
    normalized.startsWith('here is') ||
    normalized === 'ideas' ||
    normalized === 'pitches'
  )
}

function splitExamples(value: unknown): string[] {
  const parsed = stringifyLineSource(value)
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return parsed
}

function joinExamples(value: string[]): string {
  return value
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(' | ')
}

function getPitchSource(pitch: Pitch): CreationSourceType {
  return (
    (pitch as Pitch & { creationSource?: CreationSourceType }).creationSource ??
    'UNKNOWN'
  )
}

function getPromptSource(prompt: Prompt): CreationSourceType {
  return (
    (prompt as Prompt & { creationSource?: CreationSourceType })
      .creationSource ?? 'UNKNOWN'
  )
}

function sourceBadgeClass(source: CreationSourceType): string {
  return (
    {
      HUMAN: 'badge badge-success badge-sm',
      AI: 'badge badge-info badge-sm',
      HYBRID: 'badge badge-warning badge-sm',
      UPLOAD: 'badge badge-secondary badge-sm',
      UNKNOWN: 'badge badge-ghost badge-sm',
    }[source] ?? 'badge badge-ghost badge-sm'
  )
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}
</script>
