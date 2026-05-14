<!-- /components/content/brainstorm/brainstorm-manager.vue -->
<template>
  <dashboard-shell
    title="Brainstorm Workshop"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading pitches, prompts, art hooks, and idea goblin infrastructure..."
    nav-grid-class="xl:grid-cols-4"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #actions>
      <span v-if="selectedPitch" class="badge badge-primary">
        {{ selectedPitch.title || 'Selected pitch' }}
      </span>

      <span :class="sourceBadgeClass(activeCreationSource)">
        {{ activeCreationSource }}
      </span>
    </template>

    <template #default="{ activeTab: currentTab }">
      <div
        v-if="statusMessage"
        class="mb-3 rounded-2xl border p-3 text-sm"
        :class="
          lastActionSuccess
            ? 'border-success/40 bg-success/10 text-success'
            : 'border-warning/60 bg-warning/10 text-warning'
        "
      >
        {{ statusMessage }}
      </div>

      <div
        v-if="pitchStore.lastError || promptStore.lastError || artStore.error"
        class="mb-3 rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ pitchStore.lastError || promptStore.lastError || artStore.error }}
      </div>

      <section
        v-if="currentTab === 'overview' || currentTab === 'interact'"
        class="grid min-h-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <main
          class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-base-300 bg-base-100"
        >
          <div class="shrink-0 border-b border-base-300 p-3">
            <div
              class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px]"
            >
              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Title</span>
                </span>

                <input
                  v-model="pitchForm.title"
                  class="input input-bordered rounded-2xl bg-base-200 text-base font-bold"
                  placeholder="Vanderbilt Lacrosse"
                  @input="markEdited"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Pitch Type</span>
                </span>

                <select
                  v-model="pitchForm.PitchType"
                  class="select select-bordered rounded-2xl bg-base-200"
                  @change="markEdited"
                >
                  <option
                    v-for="type in pitchStore.pitchTypes"
                    :key="type"
                    :value="type"
                  >
                    {{ type }}
                  </option>
                </select>
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Source</span>
                </span>

                <select
                  v-model="activeCreationSource"
                  class="select select-bordered rounded-2xl bg-base-200"
                  @change="markEdited"
                >
                  <option
                    v-for="source in creationSources"
                    :key="source"
                    :value="source"
                  >
                    {{ source }}
                  </option>
                </select>
              </label>
            </div>
          </div>

          <div class="min-h-0 space-y-4 overflow-y-auto p-3">
            <section class="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Core Pitch</span>
                </span>

                <textarea
                  v-model="pitchForm.pitch"
                  class="textarea textarea-bordered min-h-36 rounded-2xl bg-base-200"
                  placeholder="A wildly specific idea worth expanding..."
                  @input="markEdited"
                />
              </label>

              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">
                    Generator Instructions
                  </span>
                </span>

                <textarea
                  v-model="pitchForm.description"
                  class="textarea textarea-bordered min-h-36 rounded-2xl bg-base-200"
                  placeholder="Tone, rules, vibe, forbidden goblin behavior..."
                  @input="markEdited"
                />
              </label>
            </section>

            <section class="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <label class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Flavor Text</span>
                </span>

                <textarea
                  v-model="pitchForm.flavorText"
                  class="textarea textarea-bordered min-h-32 rounded-2xl bg-base-200"
                  placeholder="A little card sparkle..."
                  @input="markEdited"
                />
              </label>

              <div class="form-control">
                <span class="label">
                  <span class="label-text font-bold">Image Prompt</span>
                </span>

                <div class="grid gap-2">
                  <textarea
                    v-model="pitchForm.artPrompt"
                    class="textarea textarea-bordered min-h-32 rounded-2xl bg-base-200"
                    placeholder="Optional art prompt..."
                    @input="markEdited"
                  />

                  <button
                    type="button"
                    class="btn btn-accent rounded-2xl"
                    :disabled="
                      isGeneratingArt || !pitchForm.artPrompt?.trim()
                    "
                    @click="generateArtImage"
                  >
                    <span
                      v-if="isGeneratingArt"
                      class="loading loading-spinner loading-sm"
                    />
                    <Icon v-else name="kind-icon:palette" class="h-4 w-4" />
                    Get Art Image
                  </button>
                </div>
              </div>
            </section>

            <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="mb-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <h2 class="text-lg font-bold">
                    Sample Lines
                    <span class="badge badge-neutral badge-sm ml-1">
                      {{ examples.length }}
                    </span>
                  </h2>

                  <p class="text-xs text-base-content/60">
                    These examples guide the next brainstorm pass.
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-xs btn-outline rounded-2xl"
                  @click="addExample"
                >
                  <Icon name="kind-icon:plus" class="h-3 w-3" />
                  Add Line
                </button>
              </div>

              <TransitionGroup
                name="example-list"
                tag="div"
                class="grid grid-cols-1 gap-2 lg:grid-cols-2"
              >
                <div
                  v-for="(_, index) in examples"
                  :key="`example-${index}`"
                  class="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 rounded-2xl border border-base-300 bg-base-100 p-2"
                >
                  <span
                    class="pt-2.5 text-right font-mono text-xs text-base-content/40"
                  >
                    {{ index + 1 }}
                  </span>

                  <textarea
                    v-model="examples[index]"
                    class="textarea textarea-bordered textarea-sm min-h-20 resize-y rounded-xl bg-base-200 font-mono text-xs"
                    :placeholder="`Sample line ${index + 1}`"
                    @input="markEdited"
                  />

                  <button
                    type="button"
                    class="btn btn-xs btn-square btn-ghost rounded-xl text-error opacity-70 transition-opacity group-hover:opacity-100"
                    @click="removeExample(index)"
                  >
                    <Icon name="kind-icon:x" class="h-3 w-3" />
                  </button>
                </div>
              </TransitionGroup>
            </section>

            <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
              <div
                class="mb-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <h2 class="text-lg font-bold">AI Candidates</h2>

                  <p class="text-xs text-base-content/60">
                    Accept, reject, resubmit, or promote the best lines.
                  </p>
                </div>

                <button
                  type="button"
                  class="btn btn-info rounded-2xl"
                  :disabled="pitchStore.loading || !canGenerate"
                  @click="generateBrainstorm(false)"
                >
                  <span
                    v-if="pitchStore.loading"
                    class="loading loading-spinner loading-sm"
                  />
                  <Icon v-else name="kind-icon:brain" class="h-4 w-4" />
                  {{ pitchStore.loading ? 'Generating...' : 'Generate Lines' }}
                </button>
              </div>

              <div v-if="candidates.length" class="space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <h3 class="font-bold text-info">
                    Candidates
                    <span class="badge badge-info badge-sm ml-1">
                      {{ pendingCandidates.length }} pending
                    </span>
                  </h3>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="btn btn-xs btn-info rounded-2xl"
                      :disabled="!pendingCandidates.length"
                      @click="acceptAllPendingCandidates"
                    >
                      Accept Pending
                    </button>

                    <button
                      type="button"
                      class="btn btn-xs btn-warning rounded-2xl"
                      :disabled="!pendingCandidates.length"
                      @click="rejectAllCandidates"
                    >
                      Reject Pending
                    </button>

                    <button
                      type="button"
                      class="btn btn-xs btn-primary rounded-2xl"
                      :disabled="
                        pitchStore.loading ||
                        !canGenerate ||
                        !hasRejectedCandidates
                      "
                      @click="generateBrainstorm(true)"
                    >
                      Resubmit Rejected
                    </button>

                    <button
                      type="button"
                      class="btn btn-xs btn-secondary rounded-2xl"
                      :disabled="!acceptedCandidates.length"
                      @click="saveLinesAsPitch"
                    >
                      Save Accepted
                    </button>
                  </div>
                </div>

                <label class="form-control">
                  <span class="label">
                    <span class="label-text text-xs font-bold">
                      Rejection Feedback
                    </span>
                  </span>

                  <textarea
                    v-model="rejectionFeedback"
                    class="textarea textarea-bordered min-h-24 rounded-2xl bg-base-100 text-sm"
                    placeholder="Tell the bot what went wrong and what to do instead..."
                  />
                </label>

                <div class="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  <article
                    v-for="candidate in candidates"
                    :key="candidate.id"
                    class="space-y-2 rounded-2xl border border-base-300 bg-base-100 p-3"
                    :class="{
                      'border-success/60 bg-success/10':
                        candidate.status === 'accepted',
                      'border-error/60 bg-error/10 opacity-80':
                        candidate.status === 'rejected',
                    }"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        class="min-w-0 flex-1 text-left text-sm leading-relaxed"
                        @click="useCandidateAsPrompt(candidate.text)"
                      >
                        {{ candidate.text }}
                      </button>

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
                    </div>

                    <textarea
                      v-if="candidate.status === 'rejected'"
                      v-model="candidate.feedback"
                      class="textarea textarea-bordered textarea-xs min-h-16 rounded-xl bg-base-200 text-xs"
                      placeholder="Optional feedback for this rejected line..."
                    />

                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        class="btn btn-xs btn-primary rounded-xl"
                        :disabled="candidate.status === 'accepted'"
                        @click="acceptCandidate(candidate.id)"
                      >
                        Keep
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
                  </article>
                </div>
              </div>

              <div
                v-else
                class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/55"
              >
                No candidates yet. Press Generate Lines and summon the idea
                moths.
              </div>
            </section>
          </div>

          <footer
            class="flex shrink-0 flex-col gap-2 border-t border-base-300 bg-base-200/60 p-3 sm:flex-row sm:justify-end"
          >
            <button
              type="button"
              class="btn btn-ghost rounded-2xl"
              @click="startFreshPitch"
            >
              Reset
            </button>

            <button
              v-if="selectedPitch"
              type="button"
              class="btn btn-error btn-outline rounded-2xl"
              :disabled="isSaving"
              @click="deleteSelectedPitch"
            >
              <Icon name="kind-icon:trash" class="h-4 w-4" />
              Delete
            </button>

            <button
              type="button"
              class="btn btn-primary rounded-2xl text-white"
              :disabled="isSaving || !canSave"
              @click="savePitch"
            >
              <span
                v-if="isSaving"
                class="loading loading-spinner loading-sm"
              />
              <Icon v-else name="kind-icon:save" class="h-4 w-4" />
              {{ selectedPitch ? 'Update Pitch' : 'Create Pitch' }}
            </button>
          </footer>
        </main>

        <aside
          class="flex min-h-0 flex-col gap-3 overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <h2 class="mb-2 text-lg font-bold">Settings</h2>

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

              <div class="grid grid-cols-2 gap-2">
                <label
                  class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
                >
                  <span class="label-text text-sm font-bold">Public</span>

                  <input
                    v-model="pitchForm.isPublic"
                    type="checkbox"
                    class="toggle toggle-success toggle-sm"
                    @change="markEdited"
                  />
                </label>

                <label
                  class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-3 py-2"
                >
                  <span class="label-text text-sm font-bold">Mature</span>

                  <input
                    v-model="pitchForm.isMature"
                    type="checkbox"
                    class="toggle toggle-warning toggle-sm"
                    @change="markEdited"
                  />
                </label>
              </div>
            </div>
          </section>

          <section
            class="min-h-0 flex-1 overflow-hidden rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="mb-2 flex items-center justify-between gap-2">
              <h2 class="text-lg font-bold">Prompt Preview</h2>

              <button
                type="button"
                class="btn btn-xs btn-ghost rounded-xl"
                @click="sendPreviewToPromptStore"
              >
                Use
              </button>
            </div>

            <pre
              class="max-h-full overflow-auto whitespace-pre-wrap rounded-2xl bg-base-100 p-3 text-xs text-base-content/70"
              >{{ promptPreview }}</pre
            >
          </section>
        </aside>
      </section>

      <section
        v-else-if="currentTab === 'pitches'"
        class="min-h-0 rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <pitch-gallery :show-header="false" />
      </section>

      <section
        v-else-if="currentTab === 'prompts'"
        class="min-h-0 rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <prompt-gallery :show-header="false" />
      </section>

      <section
        v-else-if="currentTab === 'servers'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-7">
          <server-gallery
            class="h-full w-full"
            mode="text"
            variant="dashboard"
            :show-header="false"
            :show-controls="true"
            :show-card-actions="true"
            :show-descriptions="true"
            :show-meta="true"
            :show-capabilities="true"
            :show-use-buttons="true"
            :show-workflow="true"
            :show-defaults="true"
            :show-status="true"
          />
        </div>

        <div class="min-h-0 xl:col-span-5">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <server-interact />
          </div>
        </div>
      </section>

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown brainstorm tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Pitch, Prompt } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { useNavStore } from '@/stores/navStore'
import { usePitchStore, PitchType } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type CreationSourceType = 'HUMAN' | 'AI' | 'HYBRID' | 'UPLOAD' | 'UNKNOWN'
type CandidateStatus = 'pending' | 'accepted' | 'rejected'

type BrainstormCandidate = {
  id: string
  text: string
  status: CandidateStatus
  feedback: string
}

type ActionResult<T = unknown> = {
  success: boolean
  message?: string
  data?: T
}

type PromptStoreWithCreate = ReturnType<typeof usePromptStore> & {
  createPrompt?: (payload: Partial<Prompt>) => Promise<ActionResult<Prompt>>
  updatePrompt?: (
    id: number,
    payload: Partial<Prompt>,
  ) => Promise<ActionResult<Prompt>>
}

const dashboardKey = 'brainstorm' as const

const pitchStore = usePitchStore()
const promptStore = usePromptStore() as PromptStoreWithCreate
const artStore = useArtStore()
const navStore = useNavStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const creationSources: CreationSourceType[] = [
  'HUMAN',
  'AI',
  'HYBRID',
  'UPLOAD',
  'UNKNOWN',
]

const defaultBrainstormSeed = {
  title: 'Vanderbilt Lacrosse',
  pitch:
    'Vanderbilt Lacrosse is an absurdly wealthy person completely disconnected from reality and normal human experience.',
  description:
    "Create short one-liner humor bits describing Vanderbilt Lacrosse's life. Keep them punchy, specific, surreal, and easy to edit.",
  artPrompt:
    'A satirical portrait of Vanderbilt Lacrosse, an absurdly wealthy aristocrat surrounded by impossible luxury, surreal comedy, gilded nonsense, cinematic lighting',
  flavorText:
    'A billionaire so disconnected from reality that reality sends him invoices.',
  examples: [
    'Vanderbilt Lacrosse got back 2 million dollars on his last income tax.',
    'Vanderbilt Lacrosse owns three planets.',
    'Vanderbilt Lacrosse has personally killed 12 dinosaurs.',
    "When Vanderbilt Lacrosse's money gets dirty, he throws it away.",
  ],
}

const examples = ref<string[]>(defaultExamples())
const candidates = ref<BrainstormCandidate[]>([])
const rejectionFeedback = ref(
  'These are missing the target. Keep the concept, but make the lines more specific, more surprising, and less generic.',
)

const isSaving = ref(false)
const isGeneratingArt = ref(false)
const statusMessage = ref('')
const lastActionSuccess = ref(true)
const hasHumanEdits = ref(false)
const generatedThisSession = ref(false)
const activeCreationSource = ref<CreationSourceType>('HUMAN')

const pitchForm = reactive<Partial<Pitch>>({
  title: defaultBrainstormSeed.title,
  pitch: defaultBrainstormSeed.pitch,
  description: defaultBrainstormSeed.description,
  flavorText: defaultBrainstormSeed.flavorText,
  artPrompt: defaultBrainstormSeed.artPrompt,
  PitchType: PitchType.TITLE,
  isPublic: true,
  isMature: false,
})

const selectedPitch = computed(() => {
  return pitchStore.selectedPitch as Pitch | null
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

const hasRejectedCandidates = computed(() => {
  return rejectedCandidates.value.length > 0
})

const canSave = computed(() => {
  return Boolean(pitchForm.pitch?.trim() && pitchForm.title?.trim())
})

const canGenerate = computed(() => {
  return Boolean(pitchForm.title?.trim() && pitchForm.pitch?.trim())
})

const promptPreview = computed(() => {
  return buildPromptFragmentString()
})

const managerSummary = computed(() => {
  const pitchCount = pitchStore.pitches?.length ?? 0
  const promptCount = promptStore.prompts?.length ?? 0
  const selected = selectedPitch.value?.title || 'no pitch selected'

  return `${pitchCount} pitches and ${promptCount} prompts loaded. Selected: ${selected}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'servers' || tab === 'overview' || tab === 'interact') {
    serverStore.setCurrentServerMode('text')
    return
  }

  serverStore.setCurrentServerMode('selected')
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      navStore.initialize(),
      pitchStore.initialize({
        force,
        fetchRemote: true,
      }),
      promptStore.initialize({
        force,
        fetchRemote: true,
      }),
      artStore.initialize({
        force,
        hydrateImages: false,
      }),
      serverStore.initialize({
        force,
        fetchRemote: true,
      }),
    ])

    promptStore.setPromptsFromString(buildPromptFragmentString())
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'Failed to load brainstorm manager.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

watch(
  selectedPitch,
  (pitch) => {
    if (!pitch) return

    pitchForm.title = pitch.title ?? ''
    pitchForm.pitch = pitch.pitch ?? ''
    pitchForm.description = pitch.description ?? ''
    pitchForm.flavorText = pitch.flavorText ?? ''
    pitchForm.artPrompt = pitch.artPrompt ?? ''
    pitchForm.PitchType = pitch.PitchType
    pitchForm.isPublic = pitch.isPublic
    pitchForm.isMature = pitch.isMature
    activeCreationSource.value = getPitchSource(pitch)
    examples.value = splitExamples(pitch.examples)
    candidates.value = []
    hasHumanEdits.value = false
    generatedThisSession.value = false
    promptStore.setPromptsFromString(buildPromptFragmentString())
  },
  { immediate: true },
)

function selectPitch(pitchId: number) {
  candidates.value = []
  pitchStore.apiResponse = ''
  pitchStore.setSelectedPitch(pitchId)
  pitchStore.setSelectedTitle(pitchId)
}

function startFreshPitch() {
  pitchStore.selectedPitch = null
  pitchStore.selectedTitle = null
  candidates.value = []

  Object.assign(pitchForm, {
    title: defaultBrainstormSeed.title,
    pitch: defaultBrainstormSeed.pitch,
    description: defaultBrainstormSeed.description,
    flavorText: defaultBrainstormSeed.flavorText,
    artPrompt: defaultBrainstormSeed.artPrompt,
    PitchType: PitchType.TITLE,
    isPublic: true,
    isMature: false,
  })

  examples.value = defaultExamples()
  pitchStore.apiResponse = ''
  promptStore.currentPrompt = defaultBrainstormSeed.artPrompt
  promptStore.setPromptsFromString(buildPromptFragmentString())
  activeCreationSource.value = 'HUMAN'
  statusMessage.value = ''
  hasHumanEdits.value = false
  generatedThisSession.value = false
}

function markEdited() {
  hasHumanEdits.value = true

  if (generatedThisSession.value && activeCreationSource.value === 'AI') {
    activeCreationSource.value = 'HYBRID'
  }

  promptStore.setPromptsFromString(buildPromptFragmentString())
}

function addExample() {
  examples.value.push('')
  markEdited()
}

function removeExample(index: number) {
  examples.value.splice(index, 1)

  if (!examples.value.length) {
    examples.value.push('')
  }

  markEdited()
}

function acceptCandidate(candidateId: string) {
  const candidate = candidates.value.find((item) => item.id === candidateId)

  if (!candidate) return

  candidate.status = 'accepted'
  acceptLine(candidate.text)
}

function rejectCandidate(candidateId: string) {
  const candidate = candidates.value.find((item) => item.id === candidateId)

  if (!candidate) return

  candidate.status = 'rejected'
  candidate.feedback = rejectionFeedback.value.trim()
  setAction(
    'Candidate rejected. Robot has been given notes and a tiny clipboard.',
    true,
  )
}

function rejectAllCandidates() {
  const rejectedCount = pendingCandidates.value.length

  pendingCandidates.value.forEach((candidate) => {
    candidate.status = 'rejected'
    candidate.feedback = rejectionFeedback.value.trim()
  })

  setAction(`Rejected ${rejectedCount} candidate(s).`, true)
}

function acceptAllPendingCandidates() {
  pendingCandidates.value.forEach((candidate) => {
    acceptCandidate(candidate.id)
  })

  setAction('Accepted pending generated lines.', true)
}

function acceptLine(line: string) {
  examples.value.push(line)
  generatedThisSession.value = true
  activeCreationSource.value =
    activeCreationSource.value === 'HUMAN'
      ? 'HYBRID'
      : activeCreationSource.value

  markEdited()
}

function useCandidateAsPrompt(line: string) {
  promptStore.promptField = line
  promptStore.currentPrompt = line
  promptStore.syncToLocalStorage()
  setAction('Candidate sent to promptStore.', true)
}

function sendPreviewToPromptStore() {
  promptStore.currentPrompt = promptPreview.value
  promptStore.setPromptsFromString(promptPreview.value)
  promptStore.syncToLocalStorage()
  setAction('Prompt preview sent to promptStore.', true)
}

async function generateBrainstorm(useRejectionFeedback = false) {
  if (!canGenerate.value) return

  pitchStore.apiResponse = ''

  const feedbackBlock = useRejectionFeedback
    ? buildRejectionFeedbackBlock()
    : ''
  const baseDescription = pitchForm.description?.trim() || ''

  pitchStore.selectedTitle = {
    ...buildPitchContext(),
    description: [baseDescription, feedbackBlock].filter(Boolean).join('\n\n'),
  }

  pitchStore.exampleString = joinExamples(examples.value)
  setAction('Generating lines...', true)

  try {
    const result =
      (await pitchStore.fetchBrainstormPitches()) as ActionResult<string> | void

    const responseText = pitchStore.apiResponse?.trim() || result?.data || ''

    if (responseText.trim()) {
      generatedThisSession.value = true
      activeCreationSource.value = hasHumanEdits.value ? 'HYBRID' : 'AI'
      setCandidatesFromResponse(responseText, !useRejectionFeedback)
      setAction(
        `Generated ${parseLines(responseText).length || 1} candidate(s).`,
        true,
      )
      return
    }

    setAction(
      result?.message ||
        'No brainstorm lines returned. Check /api/botcafe/brainstorm.',
      false,
    )
  } catch (error) {
    setAction(
      error instanceof Error ? error.message : 'Brainstorm request failed.',
      false,
    )
  }
}

async function savePitch() {
  if (!canSave.value) return

  isSaving.value = true
  setAction('Saving pitch...', true)

  const payload = buildPitchPayload()
  const result = selectedPitch.value
    ? await pitchStore.updatePitch(selectedPitch.value.id, payload)
    : await pitchStore.createPitch(payload)

  if (result.success) {
    await pitchStore.fetchPitches(true)

    if (!selectedPitch.value && 'data' in result && result.data?.id) {
      pitchStore.setSelectedPitch(result.data.id)
      pitchStore.setSelectedTitle(result.data.id)
    }

    hasHumanEdits.value = false
    generatedThisSession.value = false
    setAction(selectedPitch.value ? 'Pitch updated.' : 'Pitch created.', true)
  } else {
    setAction(result.message || 'Save failed.', false)
  }

  isSaving.value = false
}

async function saveLinesAsPitch() {
  const lines = joinExamples(
    acceptedCandidates.value.map((candidate) => candidate.text),
  )

  if (!lines) {
    setAction('No accepted lines to save.', false)
    return
  }

  isSaving.value = true

  const result = await pitchStore.createPitch({
    ...buildPitchPayload(),
    pitch: lines,
    examples: lines,
    PitchType: PitchType.BRAINSTORM,
    creationSource: 'AI' as never,
  })

  if (result.success && result.data) {
    await pitchStore.fetchPitches(true)
    pitchStore.setSelectedPitch(result.data.id)
    pitchStore.setSelectedTitle(result.data.id)
    setAction('Accepted lines saved as a brainstorm pitch.', true)
    candidates.value = []
  } else {
    setAction(
      result.message || 'Could not save accepted lines as pitch.',
      false,
    )
  }

  isSaving.value = false
}

async function generateArtImage() {
  const prompt = pitchForm.artPrompt?.trim()

  if (!prompt) return

  isGeneratingArt.value = true
  setAction('Generating pitch image...', true)

  try {
    promptStore.promptField = prompt
    promptStore.currentPrompt = prompt
    promptStore.syncToLocalStorage()

    const result = await artStore.generateArt({
      promptString: prompt,
      pitch: pitchForm.pitch || pitchForm.title || prompt,
      pitchId: selectedPitch.value?.id ?? null,
      userId: userStore.userId || 10,
      designer: userStore.username || 'Kind Designer',
      isPublic: pitchForm.isPublic ?? true,
      isMature: pitchForm.isMature ?? false,
    } as Parameters<typeof artStore.generateArt>[0])

    if (!result.success) {
      throw new Error(result.message || 'Art generation failed.')
    }

    const artImageId = result.data?.artImageId

    if (selectedPitch.value && artImageId) {
      await pitchStore.updatePitch(selectedPitch.value.id, {
        artImageId,
        artPrompt: prompt,
      })
    }

    setAction('Pitch image generated.', true)
  } catch (error) {
    setAction(
      error instanceof Error ? error.message : 'Art image request failed.',
      false,
    )
  } finally {
    isGeneratingArt.value = false
  }
}

async function saveCurrentPrompt() {
  const prompt = promptStore.currentPrompt.trim()

  if (!prompt) return

  await createLinkedPrompt(
    prompt,
    selectedPitch.value?.id,
    selectedPitch.value ? 'HYBRID' : 'HUMAN',
  )
}

async function createLinkedPrompt(
  prompt: string,
  pitchId?: number,
  creationSource: CreationSourceType = 'HUMAN',
) {
  const payload: Partial<Prompt> = {
    prompt,
    pitchId,
    userId: userStore.userId || 10,
    creationSource: creationSource as never,
  }

  if (typeof promptStore.createPrompt === 'function') {
    const result = await promptStore.createPrompt(payload)

    if (!result.success || !result.data) {
      setAction(result.message || 'Prompt save failed.', false)
      return
    }

    promptStore.selectedPrompt = result.data
    promptStore.currentPrompt = prompt
    promptStore.syncToLocalStorage()
    setAction('Prompt saved.', true)
    return
  }

  const created = await promptStore.addPrompt(prompt, userStore.userId || 10, 0)

  if (!created) {
    setAction('Prompt save failed.', false)
    return
  }

  promptStore.selectedPrompt = created
  promptStore.currentPrompt = prompt
  promptStore.syncToLocalStorage()
  setAction('Prompt saved.', true)
}

async function deleteSelectedPitch() {
  if (!selectedPitch.value) return

  isSaving.value = true

  const result = await pitchStore.deletePitch(selectedPitch.value.id)

  setAction(result.message || 'Pitch deleted.', result.success)

  if (result.success) {
    startFreshPitch()
  }

  isSaving.value = false
}

function buildPitchPayload(): Partial<Pitch> {
  return {
    title: pitchForm.title?.trim(),
    pitch: pitchForm.pitch?.trim(),
    description: pitchForm.description?.trim() || undefined,
    flavorText: pitchForm.flavorText?.trim() || undefined,
    artPrompt: pitchForm.artPrompt?.trim() || undefined,
    PitchType: pitchForm.PitchType ?? PitchType.TITLE,
    isPublic: pitchForm.isPublic ?? true,
    isMature: pitchForm.isMature ?? false,
    userId: userStore.userId || 10,
    examples: joinExamples(examples.value) || undefined,
    creationSource: activeCreationSource.value as never,
  }
}

function buildPitchContext(): Pitch {
  return {
    ...(selectedPitch.value ?? {}),
    id: selectedPitch.value?.id ?? 0,
    title: pitchForm.title ?? '',
    pitch: pitchForm.pitch ?? '',
    description: pitchForm.description ?? '',
    examples: joinExamples(examples.value),
    PitchType: pitchForm.PitchType ?? PitchType.TITLE,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: pitchForm.isPublic ?? true,
    isMature: pitchForm.isMature ?? false,
    userId: userStore.userId || 10,
    creationSource: activeCreationSource.value,
  } as Pitch
}

function buildPromptFragmentString() {
  return [
    `Title: ${pitchForm.title || defaultBrainstormSeed.title}`,
    `Premise: ${pitchForm.pitch || defaultBrainstormSeed.pitch}`,
    `Instructions: ${pitchForm.description || defaultBrainstormSeed.description}`,
    `Examples: ${joinExamples(examples.value)}`,
  ].join(' | ')
}

function buildRejectionFeedbackBlock() {
  if (!hasRejectedCandidates.value) return ''

  const rejected = rejectedCandidates.value
    .map((candidate, index) => {
      const feedback = candidate.feedback || rejectionFeedback.value

      return [
        `${index + 1}. Rejected: ${candidate.text}`,
        `Feedback: ${feedback}`,
      ].join('\n')
    })
    .join('\n\n')

  return [
    'Revision feedback:',
    rejectionFeedback.value.trim(),
    rejected,
    'Do not repeat rejected patterns. Generate fresh candidates that obey the feedback.',
  ]
    .filter(Boolean)
    .join('\n\n')
}

function setCandidatesFromResponse(value: unknown, replace = true) {
  const nextCandidates = parseLines(value).map((text, index) => {
    return {
      id: `${Date.now()}-${index}`,
      text,
      status: 'pending' as CandidateStatus,
      feedback: '',
    }
  })

  candidates.value = replace
    ? nextCandidates
    : [...candidates.value, ...nextCandidates]
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
    const directPitchParts = [value.title, value.pitch, value.description]
      .map((part) => stringifyLineSource(part).trim())
      .filter(Boolean)

    if (directPitchParts.length) {
      return directPitchParts.join(': ')
    }

    return stringifyLineSource(
      value.text ?? value.content ?? value.message ?? value.data,
    )
  }

  return String(value)
}

function isJunkIntroLine(line: string): boolean {
  const normalized = line.trim().toLowerCase()

  return (
    normalized.startsWith('sure') ||
    normalized.startsWith('here are') ||
    normalized.startsWith('here is') ||
    normalized.includes('fun product launch ideas') ||
    normalized === 'ideas' ||
    normalized === 'pitches'
  )
}

function parseLines(value?: unknown): string[] {
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

function splitExamples(value?: unknown): string[] {
  const parsed = stringifyLineSource(value)
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)

  return parsed.length ? parsed : defaultExamples()
}

function joinExamples(arr: string[]): string {
  return arr
    .map((entry) => entry.trim())
    .filter(Boolean)
    .join(' | ')
}

function defaultExamples(): string[] {
  return [...defaultBrainstormSeed.examples]
}

function getPitchSource(pitch: Pitch): CreationSourceType {
  return (
    (pitch as Pitch & { creationSource?: CreationSourceType }).creationSource ??
    'UNKNOWN'
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

function setAction(message: string, success = true) {
  statusMessage.value = message
  lastActionSuccess.value = success
}

onMounted(async () => {
  await loadManagerData()
  setTab(activeTab.value)
})
</script>

<style scoped>
.example-list-enter-active,
.example-list-leave-active {
  transition: all 0.15s ease;
}

.example-list-enter-from,
.example-list-leave-to {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
