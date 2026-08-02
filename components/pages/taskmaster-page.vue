<!-- /components/pages/taskmaster-page.vue -->
<!-- Taskmaster turns real work into a second-person narrative while keeping
     every real-world write explicit and reviewable. Art direction is automatic;
     users choose story ingredients, never image-model settings. -->
<template>
  <section
    class="kr-surface gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <header class="flex shrink-0 items-start gap-3">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary"
      >
        <Icon name="kind-icon:gearhammer" class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="text-2xl font-black leading-tight">
          Turn the next real thing into an adventure
        </h2>
        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          Name the real objective, choose the kind of story you want to inhabit,
          and make one honest move at a time. Taskmaster handles narration and
          art direction automatically.
        </p>
      </div>
      <div
        v-if="store.session"
        class="flex shrink-0 flex-wrap justify-end gap-2"
      >
        <button
          v-if="store.canClose"
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          @click="store.closeStory()"
        >
          <Icon name="kind-icon:moon" class="size-4" /> Finish the quest
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          :disabled="store.isWeaving"
          @click="startOver"
        >
          <Icon name="kind-icon:wand" class="size-4" /> New quest
        </button>
      </div>
    </header>

    <LazyKrNarratorStage :stage-image="tabImage" class="shrink-0" />

    <!-- SETUP and PLAN REVIEW scroll as documents — a long form and a full
         checkpoint list both legitimately run past the fold, so the page owns
         the scroll for those two states. The quest itself does not; see below. -->
    <div
      v-if="!store.session || store.session.status === 'draft'"
      class="kr-scroll space-y-4"
    >
      <template v-if="!store.session">
        <TaskmasterSampleTasks />

        <div class="space-y-5 rounded-2xl border border-secondary/20 bg-secondary/5 p-4">
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wide text-secondary/70">
              Build the quest
            </h3>
            <p class="mt-1 text-xs leading-relaxed text-base-content/55">
              Story choices direct the art automatically. Model, sampler, step-count,
              and other generator controls stay out of the way.
            </p>
          </div>

          <label class="form-control w-full">
            <div class="label py-1">
              <span class="label-text text-xs font-bold uppercase tracking-wide">
                What do you need to accomplish?
              </span>
            </div>
            <textarea
              v-model="taskInput"
              rows="2"
              class="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed"
              placeholder="Clean the garage, finish the proposal, decide which feature ships next…"
              :disabled="store.isWeaving"
            />
            <div class="label py-1">
              <span class="label-text-alt text-base-content/45">
                You can enter a task directly, link a project below, or use both.
              </span>
            </div>
          </label>

          <label class="form-control w-full max-w-xl">
            <div class="label py-1">
              <span class="label-text text-xs font-bold uppercase tracking-wide">
                Project or task source (optional)
              </span>
            </div>
            <select
              v-model="selectedProjectSlug"
              class="select select-bordered w-full rounded-xl"
              :disabled="store.isWeaving"
            >
              <option value="">No linked project</option>
              <option
                v-for="project in projectStore.activeProjects"
                :key="project.slug ?? project.id"
                :value="project.slug"
              >
                {{ project.title || project.slug }}
              </option>
            </select>
          </label>

          <div class="space-y-2">
            <p class="text-xs font-bold uppercase tracking-wide text-base-content/55">
              Tone
            </p>
            <kr-choice-list
              layout="row"
              label="Tone"
              :choices="toneChoices"
              :selected-key="selectedTone"
              :disabled="store.isWeaving"
              :show-index="false"
              @select="selectedTone = $event.key as TaskmasterTone"
            />
          </div>

          <NarrativeIngredientPicker
            v-model="selectedLocationSlug"
            :items="locationOptions"
            label="Setting"
            helper="Choose a reusable LOCATION Dream. Artwork is shown when the location already has it."
            empty-label="Anywhere"
            empty-description="Let Taskmaster choose a setting that fits the objective and tone."
            empty-icon="kind-icon:dream"
            empty-state="No active LOCATION Dreams are available yet."
            :disabled="store.isWeaving"
            :loading="dreamStore.loading"
            :error="dreamStore.error"
            :initial-limit="5"
          />

          <NarrativeIngredientPicker
            v-model="selectedGrammarSlug"
            :items="grammarOptions"
            label="Genre, mood, and style"
            helper="Choose from the canonical Facet library. Cards use Facet artwork first and fall back to the Facet icon."
            empty-label="Any adventure"
            empty-description="Let Taskmaster choose the genre and story grammar automatically."
            empty-icon="kind-icon:story"
            empty-state="No active narrative Facets are available yet."
            :disabled="store.isWeaving"
            :loading="facetStore.loading"
            :error="facetStore.error"
            :initial-limit="8"
          />

          <label class="form-control w-full">
            <div class="label py-1">
              <span class="label-text text-xs font-bold uppercase tracking-wide">
                Extra flavor (optional)
              </span>
            </div>
            <input
              v-model="vibeInput"
              type="text"
              placeholder="storm-lit, clockwork, defiant"
              class="input input-bordered w-full rounded-xl bg-base-100"
              :disabled="store.isWeaving"
            />
          </label>

          <p v-if="store.errorMessage" class="text-xs text-error">
            {{ store.errorMessage }}
          </p>

          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="btn btn-secondary rounded-xl"
              :disabled="store.isWeaving || !canBegin"
              @click="begin(false)"
            >
              <span
                v-if="store.isWeaving"
                class="loading loading-dots loading-sm"
              />
              <template v-else>
                <Icon name="kind-icon:gearhammer" class="size-4" /> Begin quest
              </template>
            </button>
            <button
              type="button"
              class="btn btn-ghost rounded-xl border border-base-300 bg-base-100"
              :disabled="store.isWeaving || !canBegin"
              @click="begin(true)"
            >
              <Icon name="kind-icon:wand" class="size-4" /> Surprise me
            </button>
            <p v-if="!canBegin" class="text-xs text-base-content/50">
              Enter an objective or choose a linked project to begin.
            </p>
          </div>
        </div>
      </template>

      <div
        v-else-if="store.session.status === 'draft'"
        class="space-y-4 rounded-2xl border border-secondary/25 bg-secondary/5 p-4"
      >
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-secondary/70">
            Review the practical plan
          </p>
          <h3 class="mt-1 text-xl font-black">The quest starts with real checkpoints</h3>
          <p class="mt-1 text-sm leading-relaxed text-base-content/60">
            Taskmaster will weave these actions into the fiction in order. The plan is
            saved before narration begins, and no external task changes happen without
            an explicit Apply action.
          </p>
        </div>
        <article
          v-for="(checkpoint, index) in store.session.checkpoints"
          :key="checkpoint.id"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start gap-3">
            <span class="badge badge-secondary badge-sm mt-0.5 rounded-xl">
              {{ index + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-bold">{{ checkpoint.title }}</p>
              <p v-if="checkpoint.detail" class="mt-1 text-xs text-base-content/55">
                {{ checkpoint.detail }}
              </p>
              <p class="mt-1 text-[0.7rem] uppercase tracking-wide text-base-content/40">
                {{ checkpoint.sourceKind.replace('-', ' ') }}
              </p>
            </div>
          </div>
        </article>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-secondary rounded-xl"
            :disabled="store.isWeaving || !store.session.checkpoints.length"
            @click="store.startQuest()"
          >
            <Icon name="kind-icon:story" class="size-4" /> Start the adventure
          </button>
          <button
            type="button"
            class="btn btn-ghost rounded-xl border border-base-300 bg-base-100"
            :disabled="store.isWeaving"
            @click="startOver"
          >
            Edit setup
          </button>
        </div>
      </div>
    </div>

    <!-- THE QUEST owns no scroll of its own. The chat window is the single
         scroll region; the objective, the checkpoint rail, the outcome picker
         and the composer stay pinned around it, so the two things a user needs
         at all times — what they are actually doing, and what they answer with
         — never scroll off. -->
    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
      <div class="shrink-0 space-y-3">
        <div
          v-if="store.session.seed.taskTitle"
          class="rounded-2xl border border-info/30 bg-info/5 p-3"
        >
          <p class="text-[0.7rem] font-bold uppercase tracking-wide text-info/80">
            Real objective
          </p>
          <p class="mt-1 text-sm font-semibold">
            {{ store.session.seed.taskTitle }}
          </p>
        </div>

        <!-- The current action stays visible; the full plan is one disclosure
             away. Pinning an unbounded grid of every checkpoint would push the
             story itself off the screen on a long quest. -->
        <section
          v-if="store.session.checkpoints.length"
          class="rounded-2xl border border-secondary/20 bg-secondary/5 p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-[0.7rem] font-bold uppercase tracking-wide text-secondary/75">
                Practical checkpoint plan
              </p>
              <p v-if="store.currentCheckpoint" class="mt-1 text-sm font-semibold">
                Current action: {{ store.currentCheckpoint.title }}
              </p>
              <p v-else class="mt-1 text-xs text-base-content/55">
                All planned checkpoints have an outcome. Review any optional Apply
                actions, then finish the quest.
              </p>
            </div>
            <span class="badge badge-secondary badge-sm rounded-xl">
              {{ store.remainingCheckpoints.length }} remaining
            </span>
          </div>
          <details class="mt-2">
            <summary
              class="cursor-pointer text-[0.7rem] font-bold uppercase tracking-wide text-secondary/60"
            >
              All {{ store.session.checkpoints.length }} checkpoints
            </summary>
            <div class="mt-2 grid gap-2 sm:grid-cols-2">
              <article
                v-for="checkpoint in store.session.checkpoints"
                :key="checkpoint.id"
                class="rounded-xl border border-base-300 bg-base-100 p-2.5 text-xs"
              >
                <div class="flex items-start justify-between gap-2">
                  <p class="font-bold">{{ checkpoint.title }}</p>
                  <span
                    class="badge badge-sm rounded-xl"
                    :class="
                      checkpoint.status === 'completed'
                        ? 'badge-success'
                        : checkpoint.status === 'active'
                          ? 'badge-secondary'
                          : checkpoint.status === 'blocked' ||
                              checkpoint.status === 'needs-info'
                            ? 'badge-warning'
                            : 'badge-ghost'
                    "
                  >
                    {{ checkpoint.status.replace('-', ' ') }}
                  </span>
                </div>
                <p v-if="checkpoint.proposedNote" class="mt-1 text-base-content/55">
                  {{ checkpoint.proposedNote }}
                </p>
              </article>
            </div>
          </details>
        </section>

        <div
          v-if="store.currentHookContext && store.awaitingAnswer"
          class="flex items-start gap-2 rounded-2xl border border-info/30 bg-info/5 p-3"
        >
          <Icon
            name="kind-icon:alert"
            class="mt-0.5 size-4 shrink-0 text-info"
          />
          <div class="min-w-0 flex-1 text-xs leading-relaxed">
            <p class="font-bold text-info">
              This scene connects to:
              <span class="font-normal text-base-content/80">
                {{ store.currentHookContext.title }}
              </span>
            </p>
            <p class="mt-0.5 text-base-content/50">
              Taskmaster never marks work done or approves a decision merely
              because you answered the story.
            </p>
          </div>
        </div>

        <p v-if="store.errorMessage" class="text-xs text-error">
          {{ store.errorMessage }}
        </p>
      </div>

      <KrChatWindow
        class="min-h-0 flex-1"
        :turns="chatTurns"
        label="Story transcript"
        :is-streaming="store.isWeaving"
        :streaming-text="store.streamingText"
        streaming-label="Taskmaster is building the next scene…"
        empty-label="Taskmaster is preparing the opening scene."
      >
        <template #after-turn="{ turn }">
          <NarrativeArtStatus
            v-if="beatForTurn(turn)"
            class="mt-2"
            :art="beatForTurn(turn)?.art"
            :label="`Illustration for ${store.session?.seed.taskTitle || 'this quest'}`"
            @retry="store.retryBeatArt(beatForTurn(turn)!.id)"
          />
        </template>

        <!-- Recap and ledger scroll WITH the quest. They belong to the end of
             the story, and pinning them would eat the fold on completion —
             exactly when the transcript is longest. -->
        <template #footer>
          <div
            v-if="store.isComplete"
            class="space-y-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4"
          >
            <div class="text-center">
              <p class="text-sm font-bold text-secondary">Quest complete</p>
              <p class="mt-1 text-xs text-base-content/60">
                Review any real-world updates below before applying them.
              </p>
            </div>
            <dl
              v-if="sessionRecap.length"
              class="grid gap-2 text-xs leading-relaxed sm:grid-cols-2"
            >
              <div
                v-for="item in sessionRecap"
                :key="item.label"
                class="rounded-xl border border-base-300 bg-base-100 p-3"
              >
                <dt class="font-bold text-base-content/70">{{ item.label }}</dt>
                <dd class="mt-0.5 text-base-content/60">{{ item.value }}</dd>
              </div>
            </dl>
          </div>

          <div
            v-if="store.pendingWriteBacks.length"
            class="space-y-2 rounded-2xl border border-warning/30 bg-warning/5 p-4"
          >
            <div class="flex items-center gap-2">
              <Icon name="kind-icon:gearhammer" class="size-4 text-warning" />
              <h3 class="text-xs font-bold uppercase tracking-wide text-warning">
                Quest ledger
              </h3>
            </div>
            <p class="text-[0.7rem] leading-relaxed text-base-content/50">
              Nothing is written automatically. Apply only the updates you want.
            </p>
            <article
              v-for="item in store.pendingWriteBacks"
              :key="item.beatId"
              class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs leading-relaxed"
            >
              <div class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <p class="font-bold">{{ item.title }}</p>
                  <p class="mt-1 text-base-content/70">“{{ item.answer }}”</p>
                  <p class="mt-1 text-base-content/50">
                    <span class="font-semibold">Apply will:</span>
                    {{ item.proposedWrite }}
                  </p>
                </div>
                <span
                  v-if="item.status === 'written'"
                  class="badge badge-success badge-sm rounded-xl"
                >
                  written
                </span>
                <button
                  v-else
                  type="button"
                  class="btn btn-warning btn-xs rounded-xl"
                  :disabled="item.status === 'queued'"
                  @click="store.applyWriteBack(item.beatId)"
                >
                  <span
                    v-if="item.status === 'queued'"
                    class="loading loading-spinner loading-xs"
                  />
                  <template v-else>Apply</template>
                </button>
              </div>
            </article>
          </div>
        </template>
      </KrChatWindow>
    </div>

    <section
      v-if="
        store.session &&
        store.session.status !== 'draft' &&
        !store.isComplete &&
        store.awaitingAnswer &&
        store.currentCheckpoint
      "
      class="shrink-0 space-y-2 rounded-2xl border border-info/25 bg-info/5 p-3"
    >
      <div>
        <p class="text-[0.7rem] font-bold uppercase tracking-wide text-info/75">
          What happened in the real world?
        </p>
        <p class="mt-1 text-xs text-base-content/55">
          Choose the honest checkpoint outcome, then describe what happened below.
        </p>
      </div>
      <!-- The honest-outcome picker was a fifth hand-rolled pick-one grid. It
           is kr-choice-list now: same four outcomes, same aria-pressed, and the
           helper text rides in as the choice's hint rather than as a second
           span the shared component would have had to learn about. -->
      <kr-choice-list
        layout="row"
        label="Checkpoint outcome"
        :choices="outcomeChoices"
        :selected-key="selectedOutcome"
        :show-index="false"
        @select="selectedOutcome = $event.key as TaskmasterCheckpointOutcome"
      />
    </section>

    <section
      v-if="store.session && store.session.status !== 'draft' && store.canClose"
      class="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/5 p-3"
    >
      <div>
        <p class="text-sm font-bold text-success">All checkpoints have an outcome</p>
        <p class="mt-0.5 text-xs text-base-content/55">
          Finish the quest for a practical recap of completed, blocked, deferred,
          and missing-information items.
        </p>
      </div>
      <button
        type="button"
        class="btn btn-success btn-sm rounded-xl"
        @click="store.closeStory()"
      >
        Finish the quest
      </button>
    </section>

    <NarrativeResponseComposer
      v-if="
        store.session &&
        store.session.status !== 'draft' &&
        !store.isComplete &&
        !store.canClose
      "
      v-model="answerInput"
      class="shrink-0"
      :options="store.currentBeat?.question.options ?? []"
      :disabled="!store.awaitingAnswer"
      :loading="store.isWeaving"
      :placeholder="
        store.awaitingAnswer
          ? 'What do you do?'
          : 'Taskmaster is building the next scene…'
      "
      button-label="Continue"
      hint="Story answers become proposed progress first. Real task changes still require an explicit Apply action."
      @submit="submitAnswer"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { getDashboardTabImagePath } from '@/stores/helpers/dashboardHelper'
import { useProjectStore } from '@/stores/projectStore'
import {
  TASKMASTER_TONES,
  useTaskmasterStore,
  type TaskmasterCheckpointOutcome,
  type TaskmasterIngredient,
  type TaskmasterTone,
} from '@/stores/taskmasterStore'
import type { NarrativeTurn } from '@/components/narrative/kr-chat-window.vue'
import {
  parseNarrativeTags,
  pickRandomNarrativeIngredient,
  type NarrativeIngredientOption,
} from '@/utils/narrativeIngredients'
import {
  beatIdFromTurnId,
  narrativeBeatsToTurns,
} from '@/utils/narrativeTurns'

const store = useTaskmasterStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const projectStore = useProjectStore()

const tabImage = computed(() =>
  getDashboardTabImagePath('scenario', 'taskmaster'),
)

const taskInput = ref('')
const selectedTone = ref<TaskmasterTone>('adventurous')
const selectedLocationSlug = ref<string | null>(null)
const selectedGrammarSlug = ref<string | null>(null)
const selectedProjectSlug = ref('')
const vibeInput = ref('')
const answerInput = ref('')
const selectedOutcome = ref<TaskmasterCheckpointOutcome>('completed')

const checkpointOutcomes: {
  value: TaskmasterCheckpointOutcome
  label: string
  helper: string
}[] = [
  { value: 'completed', label: 'Completed', helper: 'The action is genuinely done.' },
  { value: 'blocked', label: 'Blocked', helper: 'Something external prevents progress.' },
  { value: 'deferred', label: 'Deferred', helper: 'This is intentionally postponed.' },
  { value: 'needs-info', label: 'Needs info', helper: 'A question or missing fact comes next.' },
]

/* The shared list speaks {key,label,hint}. Adapt the product's vocabulary here
   rather than teaching kr-choice-list what a checkpoint outcome is. */
const outcomeChoices = computed(() =>
  checkpointOutcomes.map((outcome) => ({
    key: outcome.value,
    label: outcome.label,
    hint: outcome.helper,
  })),
)

// Tones are stored lowercase; the old buttons leaned on a `capitalize` class.
// Capitalize in the adapter so the shared list needs no per-caller styling.
const toneChoices = computed(() =>
  TASKMASTER_TONES.map((tone) => ({
    key: tone,
    label: tone.charAt(0).toUpperCase() + tone.slice(1),
  })),
)

/* Beats persist as one record per scene; the chat window speaks one message per
   speaker. narrativeBeatsToTurns is shared with Storybook so neither product
   re-derives the mapping. */
const chatTurns = computed(() =>
  narrativeBeatsToTurns(store.session?.beats ?? []),
)

/* The beat a narration turn came from — null for the user's own turns, so a
   scene's illustration renders once rather than beside the answer as well. */
function beatForTurn(turn: NarrativeTurn) {
  const beatId = beatIdFromTurnId(turn.id)
  if (!beatId) return null
  return store.session?.beats.find((beat) => beat.id === beatId) ?? null
}

const canBegin = computed(
  () => Boolean(taskInput.value.trim() || selectedProjectSlug.value),
)

const locationDreams = computed(() =>
  dreamStore.dreams.filter(
    (dream) => dream.dreamType === 'LOCATION' && dream.isActive && dream.slug,
  ),
)

const locationOptions = computed<NarrativeIngredientOption[]>(() =>
  locationDreams.value.map((dream) => ({
    id: dream.id,
    slug: dream.slug || String(dream.id),
    title: dream.title || 'Untitled location',
    description: dream.description,
    flavorText: dream.flavorText,
    imagePath:
      dream.imagePath ||
      dream.highlightImage ||
      dream.ArtImage?.imagePath ||
      null,
    icon: 'kind-icon:dream',
    badge: 'Location',
  })),
)

const storyGrammarKinds = new Set(['GENRE', 'CORE', 'THEME', 'MOOD', 'STYLE'])
const grammarFacets = computed(() =>
  facetStore.activeFacets.filter(
    (facet) => storyGrammarKinds.has(facet.kind) && facet.slug,
  ),
)

const grammarOptions = computed<NarrativeIngredientOption[]>(() =>
  grammarFacets.value.map((facet) => ({
    id: facet.id,
    slug: facet.slug || String(facet.id),
    title: facet.title,
    description: facet.description,
    flavorText: facet.flavorText,
    imagePath: facet.imagePath,
    cardPath: facet.cardPath,
    heroPath: facet.heroPath,
    icon: facet.icon,
    badge: taxonomyLabel(facet.taxonomy),
  })),
)

const sessionRecap = computed(() => {
  const active = store.session
  if (!active || active.status !== 'complete') return []

  const answered = active.beats.filter((beat) => beat.answer?.text)
  const realThreadCount = answered.filter(
    (beat) => beat.question.realWorldKind !== 'preference',
  ).length
  const items: { label: string; value: string }[] = [
    { label: 'Tone', value: active.seed.tone },
  ]

  if (active.seed.taskTitle) {
    items.unshift({ label: 'Objective', value: active.seed.taskTitle })
  }
  if (active.location) {
    items.push({ label: 'Setting', value: active.location.title })
  }
  if (active.genre) items.push({ label: 'Genre', value: active.genre.title })
  if (active.seed.vibeTags.length) {
    items.push({ label: 'Flavor', value: active.seed.vibeTags.join(', ') })
  }
  if (realThreadCount) {
    items.push({
      label: 'Real threads',
      value: `${realThreadCount} answer${realThreadCount === 1 ? '' : 's'} captured`,
    })
  }
  const completed = active.checkpoints.filter(
    (checkpoint) => checkpoint.status === 'completed',
  ).length
  const unresolved = active.checkpoints.length - completed
  items.push({
    label: 'Checkpoint result',
    value: `${completed} completed · ${unresolved} blocked, deferred, or awaiting follow-up`,
  })
  return items
})

function taxonomyLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toIngredient(
  option: NarrativeIngredientOption | undefined,
): TaskmasterIngredient | undefined {
  if (!option) return undefined
  return {
    slug: option.slug,
    title: option.title,
    description: option.description,
    flavorText: option.flavorText,
  }
}

async function begin(surprise: boolean) {
  if (!canBegin.value) return

  const tone = surprise
    ? (TASKMASTER_TONES[
        Math.floor(Math.random() * TASKMASTER_TONES.length)
      ] ?? 'surprising')
    : selectedTone.value
  const location = surprise
    ? toIngredient(pickRandomNarrativeIngredient(locationOptions.value))
    : toIngredient(
        locationOptions.value.find(
          (item) => item.slug === selectedLocationSlug.value,
        ),
      )
  const genre = surprise
    ? toIngredient(pickRandomNarrativeIngredient(grammarOptions.value))
    : toIngredient(
        grammarOptions.value.find(
          (item) => item.slug === selectedGrammarSlug.value,
        ),
      )

  await store.prepareQuest({
    tone,
    taskTitle: taskInput.value.trim() || undefined,
    vibeTags: parseNarrativeTags(vibeInput.value),
    surprise,
    location,
    genre,
    projectSlug: selectedProjectSlug.value || undefined,
  })
}

async function submitAnswer(value: string) {
  const text = value.trim()
  if (!text || !store.awaitingAnswer) return
  answerInput.value = ''
  const outcome = selectedOutcome.value
  selectedOutcome.value = 'completed'
  await store.answerCurrentBeat(text, outcome)
}

function startOver() {
  if (store.isWeaving) return
  store.resetSession()
}

onMounted(() => {
  store.restoreFromLocalStorage()
  if (!dreamStore.hasLoaded || !locationDreams.value.length) {
    void dreamStore.fetchDreams({ dreamType: 'LOCATION', limit: 200 })
  }
  if (!facetStore.loaded) void facetStore.fetchFacets({ take: 250 })
  void store.loadRealSurfaces()
})
</script>
