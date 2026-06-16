<!-- /components/dreams/dream-maker.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-300 p-3 text-base-content"
  >
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div
        class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <Icon name="kind-icon:dream" class="h-7 w-7 text-primary" />

            <h1 class="text-2xl font-black text-primary">Dreammaker</h1>

            <span :class="sourceBadgeClass(currentCreationSource)">
              {{ currentCreationSource }}
            </span>

            <span v-if="selectedDream" class="badge badge-outline rounded-2xl">
              Dream #{{ selectedDream.id }}
            </span>
          </div>

          <p class="mt-1 max-w-4xl text-sm text-base-content/65">
            Start with a Dream pitch, send it through the text server, accept
            the shiny bits, and save the survivors as Dream seeds.
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            class="btn btn-sm btn-primary rounded-2xl text-white"
            :disabled="dreamStore.loading || !canGenerate"
            @click="generateCandidates(false)"
          >
            <span
              v-if="dreamStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
            Generate
          </button>

          <button
            type="button"
            class="btn btn-sm btn-warning rounded-2xl"
            :disabled="dreamStore.loading || !canResubmit"
            @click="generateCandidates(true)"
          >
            <Icon name="kind-icon:refresh" class="h-4 w-4" />
            Resubmit
          </button>

          <button
            type="button"
            class="btn btn-sm btn-ghost rounded-2xl"
            @click="resetSession"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
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
    </header>

    <div
      class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden xl:grid-cols-[22rem_minmax(0,1fr)_22rem]"
    >
      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="shrink-0 border-b border-base-300 bg-base-200 p-3">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-bold">Dream Seeds</h2>
              <p class="text-xs text-base-content/60">
                Pick an existing Dream or type a fresh pitch.
              </p>
            </div>

            <button
              type="button"
              class="btn btn-xs btn-outline rounded-xl"
              :disabled="dreamStore.loading"
              @click="refreshDreams"
            >
              <Icon name="kind-icon:refresh" class="h-3 w-3" />
            </button>
          </div>

          <label
            class="input input-bordered input-sm mt-3 flex items-center gap-2 rounded-2xl bg-base-100"
          >
            <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
            <input
              v-model="sourceSearch"
              class="grow"
              type="search"
              placeholder="Search Dreams"
            />
          </label>

          <select
            v-model="dreamTypeFilter"
            class="select select-bordered select-sm mt-2 w-full rounded-2xl bg-base-100"
          >
            <option value="">All Dream types</option>
            <option
              v-for="type in dreamStore.dreamTypes"
              :key="type"
              :value="type"
            >
              {{ dreamTypeLabel(type) }}
            </option>
          </select>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto p-2">
          <div v-if="filteredDreams.length" class="grid gap-2">
            <button
              v-for="dream in filteredDreams"
              :key="dream.id"
              type="button"
              class="rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow"
              :class="
                selectedDream?.id === dream.id
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 bg-base-200'
              "
              @click="selectDream(dream.id)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="truncate font-black text-primary">
                    {{ dream.title || 'Untitled Dream' }}
                  </p>
                  <p class="mt-1 line-clamp-2 text-xs text-base-content/65">
                    {{
                      dream.pitch ||
                      dream.description ||
                      dream.flavorText ||
                      'No pitch yet.'
                    }}
                  </p>
                </div>

                <span class="badge badge-sm rounded-xl">
                  {{ dreamTypeLabel(dream.dreamType) }}
                </span>
              </div>
            </button>
          </div>

          <div
            v-else
            class="flex h-full min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/50"
          >
            <Icon name="kind-icon:ghost" class="h-10 w-10 text-primary/60" />
            No Dream seeds found.
          </div>
        </div>
      </aside>

      <main
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
      >
        <section class="border-b border-base-300 bg-base-200 p-3">
          <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase tracking-wide"
                >
                  Dream Title
                </span>
              </span>
              <input
                v-model="seedTitle"
                class="input input-bordered rounded-2xl bg-base-100 text-lg font-bold"
                type="text"
                placeholder="The Drowned Archive"
                @input="markHumanEdit"
              />
            </label>

            <label class="form-control">
              <span class="label py-1">
                <span
                  class="label-text text-xs font-bold uppercase tracking-wide"
                >
                  Save Type
                </span>
              </span>
              <select
                v-model="saveDreamType"
                class="select select-bordered rounded-2xl bg-base-100"
              >
                <option
                  v-for="type in saveDreamTypes"
                  :key="type"
                  :value="type"
                >
                  {{ dreamTypeLabel(type) }}
                </option>
              </select>
            </label>
          </div>

          <label class="form-control mt-3">
            <span class="label py-1">
              <span
                class="label-text text-xs font-bold uppercase tracking-wide"
              >
                Dream Pitch
              </span>
            </span>
            <textarea
              v-model="seedPitch"
              class="textarea textarea-bordered min-h-24 rounded-2xl bg-base-100 text-base leading-relaxed"
              placeholder="A dream city where every door opens into a memory someone tried to forget."
              @input="markHumanEdit"
            />
          </label>

          <label class="form-control mt-3">
            <span class="label py-1">
              <span
                class="label-text text-xs font-bold uppercase tracking-wide"
              >
                Optional Direction
              </span>
            </span>
            <textarea
              v-model="seedDescription"
              class="textarea textarea-bordered min-h-20 rounded-2xl bg-base-100 text-sm leading-relaxed"
              placeholder="Aim for playable locations, emotional hooks, clear story pressure, and weird specificity."
              @input="markHumanEdit"
            />
          </label>
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
                    Use examples to steer the next batch.
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="btn btn-xs btn-outline rounded-2xl"
                    @click="hydrateFromSelectedDream"
                  >
                    Refill
                  </button>

                  <button
                    type="button"
                    class="btn btn-xs btn-secondary rounded-2xl"
                    @click="addExample"
                  >
                    <Icon name="kind-icon:plus" class="h-3 w-3" />
                    Add
                  </button>
                </div>
              </div>

              <div
                v-if="examples.length"
                class="grid grid-cols-1 gap-2 lg:grid-cols-2"
              >
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

              <p
                v-else
                class="rounded-2xl border border-dashed border-base-300 bg-base-200 p-4 text-center text-sm text-base-content/50"
              >
                No examples yet. The muse is standing there with a clipboard.
              </p>
            </section>

            <section class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <div
                class="mb-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <h3 class="text-lg font-bold">
                    Fresh Ideas
                    <span class="badge badge-info badge-sm ml-1 rounded-xl">
                      {{ candidates.length }}
                    </span>
                  </h3>
                  <p class="text-xs text-base-content/60">
                    Accept, reject, edit, save. Tiny dream court is now in
                    session.
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
                      class="badge badge-xs rounded-xl"
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

                  <input
                    v-model="candidate.title"
                    class="input input-bordered input-sm mb-2 w-full rounded-xl bg-base-100 font-bold"
                    placeholder="Idea title"
                    @input="editCandidate(candidate.id)"
                  />

                  <textarea
                    v-model="candidate.pitch"
                    class="textarea textarea-bordered min-h-28 w-full rounded-2xl bg-base-100 text-sm leading-relaxed"
                    placeholder="Idea pitch"
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
                      @click="useCandidateAsSeed(candidate)"
                    >
                      Use as Seed
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
                  name="kind-icon:sparkles"
                  class="h-14 w-14 text-primary/60"
                />

                <div>
                  <p class="text-lg font-bold">No fresh ideas yet.</p>
                  <p class="mt-1 text-sm">
                    Feed the Dreammaker a pitch and let the text server cook.
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
            placeholder="Optional feedback for resubmitting rejected ideas..."
          />

          <button
            type="button"
            class="btn btn-secondary rounded-2xl"
            :disabled="dreamStore.isSaving || !acceptedCandidates.length"
            @click="saveAcceptedAsBrainstorm"
          >
            Save List
          </button>

          <button
            type="button"
            class="btn btn-accent rounded-2xl"
            :disabled="dreamStore.isSaving || !acceptedCandidates.length"
            @click="saveAcceptedAsDreams"
          >
            Save Ideas
          </button>

          <button
            type="button"
            class="btn btn-warning rounded-2xl"
            :disabled="
              dreamStore.isSaving ||
              !selectedDream ||
              !acceptedCandidates.length
            "
            @click="appendAcceptedToSelected"
          >
            Update Selected
          </button>
        </footer>
      </main>

      <aside
        class="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <h2 class="mb-3 text-lg font-bold">Text Server Settings</h2>

          <div class="grid gap-3">
            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Requests</span>
              </span>

              <input
                v-model.number="dreamStore.numberOfRequests"
                type="number"
                min="1"
                max="10"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text text-xs font-bold">Max Tokens</span>
              </span>

              <input
                v-model.number="dreamStore.maxTokens"
                type="number"
                min="300"
                max="4000"
                step="100"
                class="input input-bordered input-sm rounded-2xl bg-base-100"
              />
            </label>

            <label class="form-control">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-xs font-bold">Temperature</span>
                <span class="font-mono text-xs font-bold text-primary">
                  {{ dreamStore.temperature.toFixed(1) }}
                </span>
              </div>

              <input
                v-model.number="dreamStore.temperature"
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
import {
  useDreamStore,
  type DreamType,
  type DreamWithRelations,
} from '@/stores/dreamStore'

withDefaults(
  defineProps<{
    showHeader?: boolean
  }>(),
  {
    showHeader: true,
  },
)

const emit = defineEmits<{
  saved: [ids: number[]]
}>()

type CreationSourceType = 'HUMAN' | 'AI' | 'HYBRID' | 'UPLOAD' | 'UNKNOWN'
type CandidateStatus = 'pending' | 'accepted' | 'rejected'

type DreamIdeaCandidate = {
  id: string
  title: string
  pitch: string
  originalTitle: string
  originalPitch: string
  status: CandidateStatus
  feedback: string
  wasEdited: boolean
}

const dreamStore = useDreamStore()

const sourceSearch = ref('')
const dreamTypeFilter = ref('')
const seedTitle = ref('')
const seedPitch = ref('')
const seedDescription = ref('')
const examples = ref<string[]>([])
const candidates = ref<DreamIdeaCandidate[]>([])
const globalFeedback = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const hasHumanEdits = ref(false)
const generatedThisSession = ref(false)
const saveIsPublic = ref(true)
const saveIsMature = ref(false)
const saveDreamType = ref<DreamType>('PITCH')

const saveDreamTypes: DreamType[] = [
  'PITCH',
  'LOCATION',
  'SCENARIO',
  'CHARACTER',
  'REWARD',
  'WEIRDLANDIA',
  'TEXT',
]

const selectedDream = computed(() => dreamStore.selectedDream)

const filteredDreams = computed(() => {
  const query = sourceSearch.value.trim().toLowerCase()

  return dreamStore.visibleDreams.filter((dream) => {
    const dreamType = String(dream.dreamType ?? '')

    if (dreamTypeFilter.value && dreamType !== dreamTypeFilter.value) {
      return false
    }

    if (!query) return true

    const haystack = [
      dream.title,
      dream.pitch,
      dream.description,
      dream.flavorText,
      dream.examples,
      dream.artPrompt,
      dream.dreamType,
      dream.designer,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})

const cleanExamples = computed(() => {
  return examples.value.map((example) => example.trim()).filter(Boolean)
})

const workingTitle = computed(() => {
  return (
    seedTitle.value.trim() ||
    selectedDream.value?.title ||
    'Untitled Dream Seed'
  )
})

const workingPitch = computed(() => {
  return (
    seedPitch.value.trim() ||
    selectedDream.value?.pitch ||
    selectedDream.value?.description ||
    selectedDream.value?.flavorText ||
    ''
  )
})

const workingDescription = computed(() => {
  return (
    seedDescription.value.trim() ||
    selectedDream.value?.description ||
    selectedDream.value?.flavorText ||
    workingPitch.value
  )
})

const canGenerate = computed(() => Boolean(workingPitch.value.trim()))

const pendingCandidates = computed(() => {
  return candidates.value.filter((candidate) => candidate.status === 'pending')
})

const acceptedCandidates = computed(() => {
  return candidates.value.filter((candidate) => candidate.status === 'accepted')
})

const rejectedCandidates = computed(() => {
  return candidates.value.filter((candidate) => candidate.status === 'rejected')
})

const canResubmit = computed(() => {
  return Boolean(canGenerate.value && rejectedCandidates.value.length)
})

const currentCreationSource = computed<CreationSourceType>(() => {
  if (generatedThisSession.value && hasHumanEdits.value) return 'HYBRID'
  if (generatedThisSession.value) return 'AI'
  if (hasHumanEdits.value) return 'HYBRID'
  return getDreamSource(selectedDream.value)
})

const saveCreationSource = computed<CreationSourceType>(() => {
  if (acceptedCandidates.value.some((candidate) => candidate.wasEdited)) {
    return 'HYBRID'
  }

  if (generatedThisSession.value) return hasHumanEdits.value ? 'HYBRID' : 'AI'
  return currentCreationSource.value
})

const acceptedText = computed(() => {
  return acceptedCandidates.value
    .map(formatCandidate)
    .filter(Boolean)
    .join(' | ')
})

const savePreview = computed(() => {
  return [
    `Seed: ${workingTitle.value}`,
    `Save type: ${dreamTypeLabel(saveDreamType.value)}`,
    `Creation source: ${saveCreationSource.value}`,
    `Public: ${saveIsPublic.value ? 'yes' : 'no'}`,
    `Mature: ${saveIsMature.value ? 'yes' : 'no'}`,
    '',
    acceptedText.value || 'No accepted ideas yet.',
  ].join('\n')
})

onMounted(async () => {
  await dreamStore.initialize()
  hydrateFromSelectedDream()
})

watch(
  () => selectedDream.value?.id,
  () => {
    hydrateFromSelectedDream()
    candidates.value = []
    statusMessage.value = ''
  },
)

function selectDream(id: number) {
  dreamStore.setSelectedDream(id)
  dreamStore.setSelectedTitle(id)
}

async function refreshDreams() {
  await dreamStore.fetchDreams()
  setStatus('Dream seeds refreshed.')
}

function hydrateFromSelectedDream() {
  const dream = selectedDream.value

  if (!dream) {
    saveIsPublic.value = true
    saveIsMature.value = false
    return
  }

  seedTitle.value = dream.title || ''
  seedPitch.value = dream.pitch || dream.description || dream.flavorText || ''
  seedDescription.value = dream.description || dream.flavorText || ''
  examples.value = splitExamples(dream.examples)
  saveIsPublic.value = dream.isPublic ?? true
  saveIsMature.value = dream.isMature ?? false
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

  candidate.wasEdited =
    candidate.title.trim() !== candidate.originalTitle.trim() ||
    candidate.pitch.trim() !== candidate.originalPitch.trim()

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
  setStatus('Pending ideas accepted.')
}

function rejectAllPending() {
  pendingCandidates.value.forEach((candidate) => {
    candidate.status = 'rejected'
    candidate.feedback = candidate.feedback || globalFeedback.value.trim()
  })

  setStatus('Pending ideas rejected.')
}

function clearCandidates() {
  candidates.value = []
  dreamStore.apiResponse = ''
  setStatus('Ideas cleared.')
}

function copyCandidateToExamples(candidate: DreamIdeaCandidate) {
  const text = formatCandidate(candidate)

  if (!text) return

  examples.value.push(text)
  dreamStore.exampleString = joinExamples(examples.value)
  markHumanEdit()
  setStatus('Idea added to examples.')
}

function useCandidateAsSeed(candidate: DreamIdeaCandidate) {
  seedTitle.value = candidate.title.trim() || workingTitle.value
  seedPitch.value = candidate.pitch.trim()
  seedDescription.value = candidate.pitch.trim()
  markHumanEdit()
  setStatus('Idea promoted to the active seed.')
}

async function generateCandidates(useRejectedFeedback: boolean) {
  if (!canGenerate.value) return

  dreamStore.apiResponse = ''
  dreamStore.exampleString = joinExamples(examples.value)

  setStatus(
    useRejectedFeedback
      ? 'Resubmitting rejected ideas through the text server...'
      : 'Generating fresh Dream ideas...',
  )

  const result = (await dreamStore.fetchBrainstormDreams({
    title: workingTitle.value,
    pitch: workingPitch.value,
    description: workingDescription.value,
    examples: cleanExamples.value,
    feedback: useRejectedFeedback
      ? buildRejectionFeedbackBlock()
      : globalFeedback.value,
    useRejectedFeedback,
  })) as { success: boolean; message?: string; data?: unknown }

  const responseText =
    dreamStore.apiResponse?.trim() || stringifyLineSource(result.data) || ''

  if (!result.success || !responseText.trim()) {
    setStatus(result.message || 'No ideas returned.', 'error')
    return
  }

  const nextCandidates = parseCandidates(responseText).map(
    (candidate, index) => {
      return {
        id: `${Date.now()}-${index}`,
        title: candidate.title,
        pitch: candidate.pitch,
        originalTitle: candidate.title,
        originalPitch: candidate.pitch,
        status: 'pending' as CandidateStatus,
        feedback: '',
        wasEdited: false,
      }
    },
  )

  if (!nextCandidates.length) {
    setStatus(
      'The text server responded, but no usable ideas were found.',
      'error',
    )
    return
  }

  candidates.value = useRejectedFeedback
    ? [...candidates.value, ...nextCandidates]
    : nextCandidates

  generatedThisSession.value = true
  setStatus(`Generated ${nextCandidates.length} fresh idea(s).`)
}

async function saveAcceptedAsBrainstorm() {
  if (!acceptedCandidates.value.length) {
    setStatus('Accept at least one idea first.', 'error')
    return
  }

  const result = await dreamStore.createDream({
    title: buildBrainstormTitle(),
    pitch: workingPitch.value,
    description: buildSaveDescription(),
    examples: joinExamples(acceptedCandidates.value.map(formatCandidate)),
    dreamType: 'BRAINSTORM',
    creationSource: saveCreationSource.value as never,
    isPublic: saveIsPublic.value,
    isMature: saveIsMature.value,
    isActive: true,
  })

  if (!result.success || !result.data) {
    setStatus(result.message || 'Failed to save Dream brainstorm.', 'error')
    return
  }

  emit('saved', [result.data.id])
  setStatus('Accepted ideas saved as a Dream brainstorm.')
}

async function saveAcceptedAsDreams() {
  if (!acceptedCandidates.value.length) {
    setStatus('Accept at least one idea first.', 'error')
    return
  }

  const createdIds: number[] = []

  for (const candidate of acceptedCandidates.value) {
    const result = await dreamStore.createDream({
      title: candidate.title.trim() || fallbackTitle(candidate.pitch),
      pitch: candidate.pitch.trim(),
      description: candidate.pitch.trim(),
      examples: joinExamples([formatCandidate(candidate)]),
      dreamType: saveDreamType.value,
      creationSource: saveCreationSource.value as never,
      designer: dreamStore.selectedDream?.designer ?? undefined,
      isPublic: saveIsPublic.value,
      isMature: saveIsMature.value,
      isActive: true,
    })

    if (result.success && result.data?.id) {
      createdIds.push(result.data.id)
    }
  }

  if (!createdIds.length) {
    setStatus('No Dream ideas were saved.', 'error')
    return
  }

  emit('saved', createdIds)
  setStatus(`Saved ${createdIds.length} Dream idea(s).`)
}

async function appendAcceptedToSelected() {
  const dream = selectedDream.value

  if (!dream?.id || !acceptedCandidates.value.length) {
    setStatus('Select a Dream and accept at least one idea first.', 'error')
    return
  }

  const mergedExamples = [
    ...splitExamples(dream.examples),
    ...acceptedCandidates.value.map(formatCandidate),
  ]

  const result = await dreamStore.updateDream(dream.id, {
    examples: joinExamples(mergedExamples),
    description: dream.description || buildSaveDescription(),
    creationSource: saveCreationSource.value as never,
    isPublic: saveIsPublic.value,
    isMature: saveIsMature.value,
  })

  if (!result.success) {
    setStatus(result.message || 'Failed to update selected Dream.', 'error')
    return
  }

  examples.value = mergedExamples
  setStatus('Selected Dream examples updated.')
}

function resetSession() {
  candidates.value = []
  globalFeedback.value = ''
  statusMessage.value = ''
  hasHumanEdits.value = false
  generatedThisSession.value = false
  hydrateFromSelectedDream()
}

function buildRejectionFeedbackBlock() {
  const rejected = rejectedCandidates.value
    .map((candidate, index) => {
      return [
        `${index + 1}. Rejected: ${formatCandidate(candidate)}`,
        `Feedback: ${candidate.feedback || globalFeedback.value}`,
      ].join('\n')
    })
    .join('\n\n')

  return [
    globalFeedback.value.trim(),
    rejected,
    'Do not repeat rejected patterns. Generate fresh candidates that obey the feedback.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function buildBrainstormTitle() {
  return workingTitle.value
    ? `${workingTitle.value} Brainstorm`
    : 'Dream Brainstorm'
}

function buildSaveDescription() {
  return [
    `Generated from Dream pitch: ${workingTitle.value}.`,
    workingDescription.value,
    globalFeedback.value ? `Session feedback: ${globalFeedback.value}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function formatCandidate(
  candidate: Pick<DreamIdeaCandidate, 'title' | 'pitch'>,
) {
  const title = candidate.title.trim()
  const pitch = candidate.pitch.trim()

  if (title && pitch) return `${title}: ${pitch}`
  return title || pitch
}

function parseCandidates(
  value: unknown,
): Array<{ title: string; pitch: string }> {
  const chunks = stringifyLineSource(value)
    .replace(/^EXAMPLES:\|\|/, '')
    .replace(/\|\|"?$/, '')
    .split(/\n|\|/)
    .map((line) => cleanGeneratedLine(line))
    .filter(Boolean)
    .filter((line) => !isJunkIntroLine(line))

  return chunks.map(splitIdeaLine).filter((idea) => idea.pitch)
}

function splitIdeaLine(line: string) {
  const normalized = line.trim()
  const match = normalized.match(/^([^:]{2,90}):\s+(.+)$/)

  if (!match) {
    return {
      title: fallbackTitle(normalized),
      pitch: normalized,
    }
  }

  return {
    title: match[1]?.trim() || fallbackTitle(match[2]),
    pitch: match[2]?.trim() || normalized,
  }
}

type ApiLineObject = {
  text?: unknown
  content?: unknown
  message?: unknown
  data?: unknown
  ideas?: unknown
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

    if (pitchParts.length) return pitchParts.join(': ')

    return stringifyLineSource(
      value.ideas ?? value.text ?? value.content ?? value.message ?? value.data,
    )
  }

  return String(value)
}

function cleanGeneratedLine(value: string) {
  return value
    .replace(/^[-*\d.)\s]+/, '')
    .replace(/^"|"$/g, '')
    .replace(/^\*\*(dream|idea|pitch|title):\*\*/i, '')
    .replace(/^(dream|idea|pitch|title):/i, '')
    .trim()
}

function isJunkIntroLine(line: string) {
  const normalized = line.trim().toLowerCase()

  return (
    normalized.startsWith('sure') ||
    normalized.startsWith('here are') ||
    normalized.startsWith('here is') ||
    normalized === 'ideas' ||
    normalized === 'dream ideas' ||
    normalized === 'pitches'
  )
}

function splitExamples(value: unknown): string[] {
  return stringifyLineSource(value)
    .replace(/^EXAMPLES:\|\|/, '')
    .replace(/\|\|"?$/, '')
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function joinExamples(value: string[]): string {
  return value
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join('|')
}

function fallbackTitle(value?: unknown) {
  const text = stringifyLineSource(value).trim()

  if (!text) return 'Untitled Dream'
  return text.length > 80 ? `${text.slice(0, 77)}...` : text
}

function getDreamSource(
  dream?: Partial<DreamWithRelations> | null,
): CreationSourceType {
  const source = String(dream?.creationSource ?? 'UNKNOWN').toUpperCase()

  if (source === 'HUMAN') return 'HUMAN'
  if (source === 'AI') return 'AI'
  if (source === 'HYBRID') return 'HYBRID'
  if (source === 'UPLOAD') return 'UPLOAD'
  return 'UNKNOWN'
}

function dreamTypeLabel(type?: string | null): string {
  return String(type || 'PITCH')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function sourceBadgeClass(source: CreationSourceType): string {
  return (
    {
      HUMAN: 'badge badge-success badge-sm rounded-xl',
      AI: 'badge badge-info badge-sm rounded-xl',
      HYBRID: 'badge badge-warning badge-sm rounded-xl',
      UPLOAD: 'badge badge-secondary badge-sm rounded-xl',
      UNKNOWN: 'badge badge-ghost badge-sm rounded-xl',
    }[source] ?? 'badge badge-ghost badge-sm rounded-xl'
  )
}

function setStatus(message: string, tone: 'success' | 'error' = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}
</script>
