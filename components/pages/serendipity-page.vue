<!-- /components/pages/serendipity-page.vue -->
<!-- Serendipity (serendipity/t-002..t-006): themed intro with LOCATION Dreams
     and reusable Facets, the full story weaving loop on chat streams (momentum,
     answer-steered beats, gentle finale), real-task weaving (HONEYDO todos
     and needs-human conductor tasks as in-world questions), and the Story
     ledger's per-item Apply write-back (t-006 wiring approved by Silas
     2026-07-03): honey-dos are marked done, needs-human decisions become
     AGENT todos. The app never edits conductor roadmap YAML. -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <header class="flex items-start gap-3">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary"
      >
        <Icon name="kind-icon:sparkles" class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wide text-secondary/70">
          Serendipity
        </p>
        <h2 class="text-2xl font-black leading-tight">
          Step into a story that helps
        </h2>
        <p class="mt-1 text-sm leading-relaxed text-base-content/70">
          Pick a tone, open the door, and answer what the story asks. You are
          the protagonist.
        </p>
      </div>
      <div v-if="store.session" class="flex shrink-0 gap-2">
        <button
          v-if="store.canClose"
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          @click="store.closeStory()"
        >
          <Icon name="kind-icon:moon" class="size-4" /> Bring it to a close
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl"
          :disabled="store.isWeaving"
          @click="startOver"
        >
          <Icon name="kind-icon:wand" class="size-4" /> New story
        </button>
      </div>
    </header>

    <!-- Intro screen -->
    <div
      v-if="!store.session"
      class="space-y-4 rounded-2xl border border-secondary/20 bg-secondary/5 p-4"
    >
      <h3 class="text-xs font-bold uppercase tracking-wide text-secondary/70">
        Choose your door
      </h3>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="tone in SERENDIPITY_TONES"
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

      <div v-if="locationDreams.length" class="space-y-2">
        <div class="flex items-center gap-2">
          <span
            class="text-xs font-bold uppercase tracking-wide text-base-content/50"
          >
            Place
          </span>
          <span class="text-[0.7rem] text-base-content/40">
            from your LOCATION dreams
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
            Story grammar
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
            Any tale
          </button>
          <button
            v-for="dream in genreFacets"
            :key="dream.slug ?? dream.id"
            type="button"
            class="btn btn-sm rounded-xl"
            :class="
              dream.slug === selectedGrammarSlug
                ? 'btn-secondary'
                : 'btn-ghost border border-base-300'
            "
            :title="dream.flavorText ?? dream.description ?? undefined"
            @click="selectedGrammarSlug = dream.slug"
          >
            {{ dream.title }}
          </button>
        </div>
      </div>

      <p
        v-if="dreamStore.loading"
        class="flex items-center gap-2 text-xs text-base-content/50"
      >
        <span class="loading loading-spinner loading-xs" />
        Gathering places and story grammars…
      </p>

      <label class="form-control w-full max-w-md">
        <div class="label py-1">
          <span class="label-text text-xs font-bold uppercase tracking-wide">
            Project (optional — lets the story help for real)
          </span>
        </div>
        <select
          v-model="selectedProjectSlug"
          class="select select-bordered w-full rounded-xl"
          :disabled="store.isWeaving"
        >
          <option value="">A story just for me</option>
          <option
            v-for="project in projectStore.activeProjects"
            :key="project.slug ?? project.id"
            :value="project.slug"
          >
            {{ project.title || project.slug }}
          </option>
        </select>
      </label>

      <label class="form-control w-full">
        <div class="label py-1">
          <span class="label-text text-xs font-bold uppercase tracking-wide">
            Vibe words (optional, comma separated)
          </span>
        </div>
        <input
          v-model="vibeInput"
          type="text"
          placeholder="moonlit, salt-air, mischievous"
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
          :disabled="store.isWeaving"
          @click="begin(false)"
        >
          <span
            v-if="store.isWeaving"
            class="loading loading-dots loading-sm"
          />
          <template v-else>
            <Icon name="kind-icon:sparkles" class="size-4" /> Open the door
          </template>
        </button>
        <button
          type="button"
          class="btn btn-ghost rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="begin(true)"
        >
          <Icon name="kind-icon:wand" class="size-4" /> Surprise me
        </button>
        <p
          v-if="
            !locationDreams.length &&
            !genreFacets.length &&
            !dreamStore.loading &&
            !facetStore.loading
          "
          class="text-xs text-base-content/50"
        >
          Add LOCATION Dreams or story-grammar Facets to unlock more doors.
        </p>
      </div>
    </div>

    <!-- Story panel -->
    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
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
          <template v-if="store.streamingText">{{
            store.streamingText
          }}</template>
          <span v-else class="flex items-center gap-2 text-base-content/60">
            <span class="loading loading-dots loading-sm" />
            Serendipity is weaving…
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
              This question is really about:
              <span class="font-normal text-base-content/80">{{
                store.currentHookContext.title
              }}</span>
              <span
                class="badge badge-info badge-outline badge-xs ml-1 align-middle"
              >
                {{
                  store.currentHookContext.kind === 'honeydo'
                    ? 'honey-do'
                    : 'needs a human'
                }}
              </span>
            </p>
            <p class="mt-0.5 text-base-content/50">
              Your answer is kept for review — nothing is marked done or
              approved by the story.
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
            <p class="text-sm font-bold text-secondary">The End</p>
            <p class="mt-1 text-xs text-base-content/60">
              This story is complete. Open another door whenever you like.
            </p>
          </div>
          <div
            v-if="sessionRecap.length"
            class="rounded-2xl border border-base-300 bg-base-100 p-3 text-left"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon name="kind-icon:stars" class="size-4 text-secondary" />
              <h3
                class="text-xs font-bold uppercase tracking-wide text-secondary"
              >
                What the story learned
              </h3>
            </div>
            <dl class="grid gap-2 text-xs leading-relaxed sm:grid-cols-2">
              <div
                v-for="item in sessionRecap"
                :key="item.label"
                class="rounded-xl border border-base-300 bg-base-200/50 p-2"
              >
                <dt class="font-bold text-base-content/70">{{ item.label }}</dt>
                <dd class="mt-0.5 text-base-content/60">{{ item.value }}</dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Story ledger: t-006, approved wiring — explicit per-item Apply -->
        <div
          v-if="store.pendingWriteBacks.length"
          class="space-y-2 rounded-2xl border border-warning/30 bg-warning/5 p-4"
        >
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:gearhammer" class="size-4 text-warning" />
            <h3 class="text-xs font-bold uppercase tracking-wide text-warning">
              Story ledger — answers the story collected
            </h3>
          </div>
          <p class="text-[0.7rem] leading-relaxed text-base-content/50">
            Nothing is written automatically. Apply an answer to make it real;
            until then it just waits here.
          </p>
          <article
            v-for="item in store.pendingWriteBacks"
            :key="item.beatId"
            class="rounded-xl border border-base-300 bg-base-100 p-3 text-xs leading-relaxed"
          >
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <p class="font-bold">
                  {{ item.title }}
                  <span
                    class="badge badge-warning badge-outline badge-xs ml-1 align-middle"
                  >
                    {{ item.kind === 'honeydo' ? 'honey-do' : 'needs a human' }}
                  </span>
                </p>
                <p class="mt-1 text-base-content/70">“{{ item.answer }}”</p>
                <p class="mt-1 text-base-content/50">
                  <span class="font-semibold">Apply will:</span>
                  {{ item.proposedWrite }}
                </p>
              </div>
              <div class="shrink-0">
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
            store.awaitingAnswer ? 'Answer the story…' : 'The story is weaving…'
          "
          :disabled="!store.awaitingAnswer"
          @keydown.enter.exact.prevent="submitAnswer"
        />
        <button
          type="submit"
          class="btn btn-secondary rounded-xl"
          :disabled="!store.awaitingAnswer || !answerInput.trim()"
        >
          <Icon name="kind-icon:sparkles" class="size-4" /> Answer
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
  SERENDIPITY_TONES,
  useSerendipityStore,
  type SerendipityIngredient,
  type SerendipityTone,
} from '@/stores/serendipityStore'

const store = useSerendipityStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const projectStore = useProjectStore()

const selectedTone = ref<SerendipityTone>('cozy')
const selectedLocationSlug = ref<string | null>(null)
const selectedGrammarSlug = ref<string | null>(null)
const selectedProjectSlug = ref('')
const vibeInput = ref('')
const answerInput = ref('')

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
  const answeredBeats = active.beats.filter((beat) => beat.answer?.text)
  const preferenceAnswers = answeredBeats
    .filter((beat) => beat.question.realWorldKind === 'preference')
    .map((beat) => beat.answer?.text.trim())
    .filter(Boolean)
    .slice(0, 3)
  const realThreadCount = answeredBeats.filter(
    (beat) => beat.question.realWorldKind !== 'preference',
  ).length
  const items: { label: string; value: string }[] = [
    { label: 'Tone', value: active.seed.tone },
  ]
  if (active.location)
    items.push({ label: 'Place', value: active.location.title })
  if (active.genre)
    items.push({ label: 'Story grammar', value: active.genre.title })
  if (active.seed.vibeTags.length) {
    items.push({ label: 'Vibes', value: active.seed.vibeTags.join(', ') })
  }
  if (preferenceAnswers.length) {
    items.push({
      label: 'Preference clues',
      value: preferenceAnswers.join(' • '),
    })
  }
  if (realThreadCount) {
    items.push({
      label: 'Real-world threads',
      value: `${realThreadCount} answer${realThreadCount === 1 ? '' : 's'} held for review`,
    })
  }
  return items
})

type IngredientSource =
  | Pick<DreamWithRelations, 'slug' | 'title' | 'description' | 'flavorText'>
  | Pick<FacetWithAliases, 'slug' | 'title' | 'description' | 'flavorText'>

function toIngredient(
  source: IngredientSource | undefined,
): SerendipityIngredient | undefined {
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
  const tone = surprise
    ? (SERENDIPITY_TONES[
        Math.floor(Math.random() * SERENDIPITY_TONES.length)
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
          (dream) => dream.slug === selectedGrammarSlug.value,
        ),
      )
  await store.beginStory({
    tone,
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
