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
        <p class="text-xs font-bold uppercase tracking-wide text-base-content/50">
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
                : 'btn-ghost border border-base-300'
            "
            @click="selectedTone = tone"
          >
            {{ tone }}
          </button>
        </div>
      </div>

      <div v-if="locationDreams.length" class="space-y-2">
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-bold uppercase tracking-wide text-base-content/50"
          >
            Setting
          </span>
          <span class="text-[0.7rem] text-base-content/40">
            from LOCATION Dreams
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm rounded-xl"
            :class="
              !selectedLocationSlug
                ? 'btn-secondary'
                : 'btn-ghost border border-base-300'
            "
            @click="selectedLocationSlug = null"
          >
            Anywhere
          </button>
          <button
            v-for="dream in locationDreams"
            :key="dream.slug ?? dream.id"
            type="button"
            class="btn btn-sm rounded-xl"
            :class="
              dream.slug === selectedLocationSlug
                ? 'btn-secondary'
                : 'btn-ghost border border-base-300'
            "
            :title="dream.flavorText ?? dream.description ?? undefined"
            @click="selectedLocationSlug = dream.slug"
          >
            {{ dream.title }}
          </button>
        </div>
      </div>

      <div v-if="genreFacets.length" class="space-y-2">
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-bold uppercase tracking-wide text-base-content/50"
          >
            Genre and style
          </span>
          <span class="text-[0.7rem] text-base-content/40">
            from reusable Facets
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-sm rounded-xl"
            :class="
              !selectedGrammarSlug
                ? 'btn-secondary'
                : 'btn-ghost border border-base-300'
            "
            @click="selectedGrammarSlug = null"
          >
            Any adventure
          </button>
          <button
            v-for="facet in genreFacets"
            :key="facet.slug ?? facet.id"
            type="button"
            class="btn btn-sm rounded-xl"
            :class="
              facet.slug === selectedGrammarSlug
                ? 'btn-secondary'
                : 'btn-ghost border border-base-300'
            "
            :title="facet.flavorText ?? facet.description ?? undefined"
            @click="selectedGrammarSlug = facet.slug"
          >
            {{ facet.title }}
          </button>
        </div>
      </div>

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
          class="input input-bordered w-full rounded-xl"
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
          class="btn btn-ghost rounded-xl border border-base-300"
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
        <article
          v-for="beat in store.session.beats"
          :key="beat.id"
          class="space-y-2"
        >
          <div
            class="whitespace-pre-line rounded-2xl border border-base-300 bg-base-200/60 p-4 text-sm leading-relaxed"
          >
            {{ beat.narrative }}
          </div>
          <div
            v-if="beat.answer"
            class="ml-8 rounded-2xl border border-secondary/30 bg-secondary/10 p-3 text-sm leading-relaxed"
          >
            {{ beat.answer.text }}
          </div>
        </article>

        <div
          v-if="store.isWeaving"
          class="whitespace-pre-line rounded-2xl border border-dashed border-secondary/40 bg-base-200/40 p-4 text-sm leading-relaxed"
        >
          <template v-if="store.streamingText">{{ store.streamingText }}</template>
          <span v-else class="flex items-center gap-2 text-base-content/60">
            <span class="loading loading-dots loading-sm" />
            Taskmaster is building the next scene…
          </span>
        </div>

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

      <form
        v-if="!store.isComplete"
        class="flex items-end gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-3"
        @submit.prevent="submitAnswer"
      >
        <textarea
          v-model="answerInput"
          rows="2"
          class="textarea textarea-bordered min-h-0 w-full flex-1 rounded-xl text-sm leading-relaxed"
          :placeholder="
            store.awaitingAnswer
              ? 'What do you do?'
              : 'Taskmaster is building the next scene…'
          "
          :disabled="!store.awaitingAnswer"
          @keydown.enter.exact.prevent="submitAnswer"
        />
        <button
          type="submit"
          class="btn btn-secondary rounded-xl"
          :disabled="!store.awaitingAnswer || !answerInput.trim()"
        >
          <Icon name="kind-icon:sparkles" class="size-4" /> Continue
        </button>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDreamStore, type DreamWithRelations } from '@/stores/dreamStore'
import { useFacetStore, type FacetWithAliases } from '@/stores/facetStore'
import { useProjectStore } from '@/stores/projectStore'
import {
  TASKMASTER_TONES,
  useTaskmasterStore,
  type TaskmasterIngredient,
  type TaskmasterTone,
} from '@/stores/taskmasterStore'

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

const storyGrammarKinds = new Set(['GENRE', 'CORE', 'THEME', 'MOOD', 'STYLE'])
const genreFacets = computed(() =>
  facetStore.activeFacets.filter(
    (facet) => storyGrammarKinds.has(facet.kind) && facet.slug,
  ),
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

type IngredientSource =
  | Pick<DreamWithRelations, 'slug' | 'title' | 'description' | 'flavorText'>
  | Pick<FacetWithAliases, 'slug' | 'title' | 'description' | 'flavorText'>

function toIngredient(
  source: IngredientSource | undefined,
): TaskmasterIngredient | undefined {
  if (!source?.slug) return undefined
  return {
    slug: source.slug,
    title: source.title,
    description: source.description,
    flavorText: source.flavorText,
  }
}

function pickRandom<T>(items: T[]): T | undefined {
  if (!items.length) return undefined
  return items[Math.floor(Math.random() * items.length)]
}

function parseVibes(): string[] {
  return vibeInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 6)
}

async function begin(surprise: boolean) {
  if (!canBegin.value) return

  const tone = surprise
    ? (TASKMASTER_TONES[
        Math.floor(Math.random() * TASKMASTER_TONES.length)
      ] ?? 'surprising')
    : selectedTone.value
  const location = surprise
    ? toIngredient(pickRandom(locationDreams.value))
    : toIngredient(
        locationDreams.value.find(
          (dream) => dream.slug === selectedLocationSlug.value,
        ),
      )
  const genre = surprise
    ? toIngredient(pickRandom(genreFacets.value))
    : toIngredient(
        genreFacets.value.find(
          (facet) => facet.slug === selectedGrammarSlug.value,
        ),
      )

  await store.beginStory({
    tone,
    taskTitle: taskInput.value.trim() || undefined,
    vibeTags: parseVibes(),
    surprise,
    location,
    genre,
    projectSlug: selectedProjectSlug.value || undefined,
  })
}

async function submitAnswer() {
  const text = answerInput.value.trim()
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
