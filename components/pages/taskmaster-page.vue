<!-- /components/pages/taskmaster-page.vue -->
<!-- Taskmaster turns real work into a second-person narrative while keeping
     every real-world write explicit and reviewable. Art direction is automatic;
     users choose story ingredients, never image-model settings. -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <header class="flex items-start gap-3">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary"
      >
        <Icon name="kind-icon:gearhammer" class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wide text-secondary/70">
          Taskmaster
        </p>
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

    <div
      v-if="!store.session"
      class="space-y-5 rounded-2xl border border-secondary/20 bg-secondary/5 p-4"
    >
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
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tone in TASKMASTER_TONES"
            :key="tone"
            type="button"
            class="btn btn-sm rounded-xl capitalize"
            :class="
              tone === selectedTone
                ? 'btn-secondary'
                : 'btn-ghost border border-base-300 bg-base-100'
            "
            :aria-pressed="tone === selectedTone"
            @click="selectedTone = tone"
          >
            {{ tone }}
          </button>
        </div>
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

    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
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

      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <NarrativeTranscript
          :beats="store.session.beats"
          :is-streaming="store.isWeaving"
          :streaming-text="store.streamingText"
          streaming-label="Taskmaster is building the next scene…"
          empty-label="Taskmaster is preparing the opening scene."
        />

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
      </div>

      <NarrativeResponseComposer
        v-if="!store.isComplete"
        v-model="answerInput"
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { useProjectStore } from '@/stores/projectStore'
import {
  TASKMASTER_TONES,
  useTaskmasterStore,
  type TaskmasterIngredient,
  type TaskmasterTone,
} from '@/stores/taskmasterStore'
import {
  parseNarrativeTags,
  pickRandomNarrativeIngredient,
  type NarrativeIngredientOption,
} from '@/utils/narrativeIngredients'

const store = useTaskmasterStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const projectStore = useProjectStore()

const taskInput = ref('')
const selectedTone = ref<TaskmasterTone>('adventurous')
const selectedLocationSlug = ref<string | null>(null)
const selectedGrammarSlug = ref<string | null>(null)
const selectedProjectSlug = ref('')
const vibeInput = ref('')
const answerInput = ref('')

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

  await store.beginStory({
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
  await store.answerCurrentBeat(text)
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
