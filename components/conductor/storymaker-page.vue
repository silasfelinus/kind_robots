<!-- /components/conductor/storymaker-page.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <header class="flex flex-wrap items-start gap-3">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"
      >
        <Icon name="kind-icon:book" class="size-6" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-wide text-primary/70">
          Storymaker
        </p>
        <h1 class="text-2xl font-black leading-tight">
          Build a world, then step inside it
        </h1>
        <p class="mt-1 max-w-3xl text-sm leading-relaxed text-base-content/65">
          Shape a premise, gather reusable Kind Robots characters and Facets,
          review the story bible, and let a dedicated narrator carry your choices
          forward. Storymaker creates fiction; it never turns the tale into a task list.
        </p>
      </div>
      <div v-if="store.session" class="flex shrink-0 flex-wrap gap-2">
        <button
          v-if="store.canFinish"
          type="button"
          class="btn btn-primary btn-sm rounded-xl"
          @click="store.finishStory()"
        >
          <Icon name="kind-icon:moon" class="size-4" /> Finish this tale
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="startAnother"
        >
          <Icon name="kind-icon:plus" class="size-4" /> New story
        </button>
      </div>
    </header>

    <div v-if="!store.session" class="space-y-4">
      <nav
        class="grid grid-cols-2 gap-2 rounded-2xl border border-base-300 bg-base-200/50 p-2 sm:grid-cols-4"
        aria-label="Story setup progress"
      >
        <button
          v-for="(item, index) in setupSteps"
          :key="item.label"
          type="button"
          class="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition"
          :class="
            setupStep === index
              ? 'bg-primary text-primary-content shadow-sm'
              : index < setupStep
                ? 'bg-success/10 text-success'
                : 'text-base-content/45'
          "
          :disabled="index > furthestStep"
          @click="setupStep = index"
        >
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full border border-current/25"
          >
            <Icon
              v-if="index < setupStep"
              name="kind-icon:check"
              class="size-3.5"
            />
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="truncate">{{ item.label }}</span>
        </button>
      </nav>

      <section
        v-if="setupStep === 0"
        class="space-y-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <div>
          <h2 class="text-lg font-black">The spark</h2>
          <p class="mt-1 text-xs leading-relaxed text-base-content/55">
            Begin with the promise of the story. A sentence is enough; a strange
            paragraph is welcome.
          </p>
        </div>

        <label class="form-control w-full">
          <span class="label-text mb-1 text-xs font-bold uppercase tracking-wide">
            Working title (optional)
          </span>
          <input
            v-model="store.setupDraft.title"
            type="text"
            class="input input-bordered w-full rounded-xl bg-base-100"
            placeholder="The Clockwork Orchard"
          />
        </label>

        <label class="form-control w-full">
          <span class="label-text mb-1 text-xs font-bold uppercase tracking-wide">
            Premise
          </span>
          <textarea
            v-model="store.setupDraft.premise"
            rows="5"
            class="textarea textarea-bordered w-full rounded-xl bg-base-100 text-sm leading-relaxed"
            placeholder="Every midnight, the town's abandoned observatory receives a letter from a star that should not exist…"
          />
          <span class="mt-1 text-[0.7rem] text-base-content/45">
            This is creative direction, not a prompt for model or generator settings.
          </span>
        </label>

        <div class="space-y-2">
          <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/55">
            Narrator voice
          </h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="style in STORYMAKER_NARRATOR_STYLES"
              :key="style"
              type="button"
              class="btn btn-sm rounded-xl capitalize"
              :class="
                store.setupDraft.narratorStyle === style
                  ? 'btn-primary'
                  : 'btn-ghost border border-base-300 bg-base-100'
              "
              :aria-pressed="store.setupDraft.narratorStyle === style"
              @click="store.setupDraft.narratorStyle = style"
            >
              {{ style }}
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="text-xs font-bold uppercase tracking-wide text-base-content/55">
            Shape of the tale
          </h3>
          <div class="grid gap-2 md:grid-cols-3">
            <button
              v-for="structure in STORYMAKER_STRUCTURES"
              :key="structure.value"
              type="button"
              class="rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              :class="
                store.setupDraft.structure === structure.value
                  ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                  : 'border-base-300 bg-base-100'
              "
              :aria-pressed="store.setupDraft.structure === structure.value"
              @click="store.setupDraft.structure = structure.value"
            >
              <span class="text-sm font-black">{{ structure.label }}</span>
              <span class="mt-1 block text-xs leading-relaxed text-base-content/55">
                {{ structure.description }}
              </span>
            </button>
          </div>
        </div>
      </section>

      <section
        v-else-if="setupStep === 1"
        class="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <div>
          <h2 class="text-lg font-black">The cast</h2>
          <p class="mt-1 text-xs leading-relaxed text-base-content/55">
            Choose up to five existing characters. Leaving the cast empty lets
            Storymaker invent whoever the premise requires.
          </p>
        </div>
        <NarrativeIngredientMultiPicker
          v-model="store.setupDraft.castSlugs"
          :items="characterOptions"
          label="Characters"
          helper="Existing character art and personality travel into the story bible."
          empty-state="No characters are available yet. Storymaker can still invent a cast from the premise."
          :loading="characterStore.loading || characterStore.isInitializing"
          :error="characterStore.error"
          :initial-limit="9"
          :max-selections="5"
        />
      </section>

      <section
        v-else-if="setupStep === 2"
        class="space-y-5 rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <div>
          <h2 class="text-lg font-black">The world and its flavor</h2>
          <p class="mt-1 text-xs leading-relaxed text-base-content/55">
            Use canonical Dreams, Facets, and Rewards as ingredients. Their artwork
            becomes part of the setup surface while technical art direction remains automatic.
          </p>
        </div>

        <NarrativeIngredientPicker
          v-model="store.setupDraft.locationSlug"
          :items="locationOptions"
          label="Primary setting"
          helper="Choose one reusable LOCATION Dream, or let the premise decide."
          empty-label="Invent a new place"
          empty-description="Storymaker will derive the setting from the premise and selected Facets."
          empty-icon="kind-icon:moon"
          empty-state="No LOCATION Dreams are available yet."
          :loading="dreamStore.loading"
          :error="dreamStore.error"
          :initial-limit="6"
        />

        <NarrativeIngredientMultiPicker
          v-model="store.setupDraft.facetSlugs"
          :items="facetOptions"
          label="Creative Facets"
          helper="Mix genre, mood, theme, style, and art direction without exposing generator controls."
          empty-state="No active creative Facets are available yet."
          :loading="facetStore.loading"
          :error="facetStore.error"
          :initial-limit="9"
          :max-selections="5"
        />

        <NarrativeIngredientMultiPicker
          v-model="store.setupDraft.rewardSlugs"
          :items="rewardOptions"
          label="Possible story Rewards"
          helper="Choose up to three reusable Rewards the fiction may discover, grant, spend, or lose."
          empty-state="No active Rewards are available yet. The story can continue without inventory."
          :loading="rewardStore.isLoading || rewardStore.isInitializing"
          :error="rewardStore.error"
          :initial-limit="9"
          :max-selections="3"
        />

        <label class="form-control w-full">
          <span class="label-text mb-1 text-xs font-bold uppercase tracking-wide">
            Extra story direction (optional)
          </span>
          <textarea
            v-model="store.setupDraft.notes"
            rows="3"
            class="textarea textarea-bordered w-full rounded-xl bg-base-100 text-sm leading-relaxed"
            placeholder="Keep the rivalry affectionate. Let every machine feel slightly alive. Avoid a chosen-one prophecy."
          />
        </label>
      </section>

      <section
        v-else
        class="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4"
      >
        <div>
          <h2 class="text-lg font-black">Story bible</h2>
          <p class="mt-1 text-xs leading-relaxed text-base-content/55">
            Review the creative contract before Storymaker writes the opening scene.
          </p>
        </div>

        <dl class="grid gap-3 md:grid-cols-2">
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3 md:col-span-2">
            <dt class="text-[0.7rem] font-bold uppercase tracking-wide text-primary/70">
              {{ reviewTitle }}
            </dt>
            <dd class="mt-2 whitespace-pre-line text-sm leading-relaxed">
              {{ store.setupDraft.premise }}
            </dd>
          </div>
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <dt class="text-xs font-bold text-base-content/55">Narration</dt>
            <dd class="mt-1 text-sm capitalize">
              {{ store.setupDraft.narratorStyle }} · {{ structureLabel }}
            </dd>
          </div>
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <dt class="text-xs font-bold text-base-content/55">Setting</dt>
            <dd class="mt-1 text-sm">
              {{ selectedLocation?.title || 'Invented from the premise' }}
            </dd>
          </div>
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <dt class="text-xs font-bold text-base-content/55">Cast</dt>
            <dd class="mt-1 text-sm">
              {{ selectedCast.length ? selectedCast.map((item) => item.title).join(', ') : 'Invented as needed' }}
            </dd>
          </div>
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
            <dt class="text-xs font-bold text-base-content/55">Facets</dt>
            <dd class="mt-1 text-sm">
              {{ selectedFacets.length ? selectedFacets.map((item) => item.title).join(', ') : 'None selected' }}
            </dd>
          </div>
          <div class="rounded-2xl border border-base-300 bg-base-100 p-3 md:col-span-2">
            <dt class="text-xs font-bold text-base-content/55">Possible Rewards</dt>
            <dd class="mt-1 text-sm">
              {{ selectedRewards.length ? selectedRewards.map((item) => item.title).join(', ') : 'No curated inventory pool' }}
            </dd>
          </div>
          <div
            v-if="store.setupDraft.notes.trim()"
            class="rounded-2xl border border-base-300 bg-base-100 p-3 md:col-span-2"
          >
            <dt class="text-xs font-bold text-base-content/55">Additional direction</dt>
            <dd class="mt-1 whitespace-pre-line text-sm leading-relaxed">
              {{ store.setupDraft.notes }}
            </dd>
          </div>
        </dl>

        <div
          class="flex items-start gap-2 rounded-2xl border border-info/30 bg-info/5 p-3 text-xs leading-relaxed"
        >
          <Icon name="kind-icon:palette" class="mt-0.5 size-4 shrink-0 text-info" />
          <span>
            Scene art will be directed from this bible automatically. Storymaker
            will not ask for a model, sampler, dimensions, or step count.
          </span>
        </div>
      </section>

      <p v-if="store.errorMessage" class="text-xs text-error">
        {{ store.errorMessage }}
      </p>

      <footer class="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          class="btn btn-ghost rounded-xl border border-base-300"
          :disabled="setupStep === 0 || store.isWeaving"
          @click="setupStep -= 1"
        >
          <Icon name="kind-icon:chevron-left" class="size-4" /> Back
        </button>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn btn-ghost rounded-xl"
            :disabled="store.isWeaving"
            @click="clearDraft"
          >
            Clear draft
          </button>
          <button
            v-if="setupStep < setupSteps.length - 1"
            type="button"
            class="btn btn-primary rounded-xl"
            :disabled="!canAdvance"
            @click="advanceSetup"
          >
            Continue <Icon name="kind-icon:chevron-right" class="size-4" />
          </button>
          <button
            v-else
            type="button"
            class="btn btn-primary rounded-xl"
            :disabled="!canBegin || store.isWeaving"
            @click="beginStory"
          >
            <span v-if="store.isWeaving" class="loading loading-dots loading-sm" />
            <template v-else>
              <Icon name="kind-icon:sparkles" class="size-4" /> Write the opening scene
            </template>
          </button>
        </div>
      </footer>
    </div>

    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
      <details class="rounded-2xl border border-primary/25 bg-primary/5 p-3">
        <summary class="cursor-pointer text-sm font-black text-primary">
          {{ store.session.bible.title }} · Story bible
        </summary>
        <div class="mt-3 grid gap-2 text-xs leading-relaxed sm:grid-cols-2">
          <p class="rounded-xl border border-base-300 bg-base-100 p-3 sm:col-span-2">
            {{ store.session.bible.premise }}
          </p>
          <p class="rounded-xl border border-base-300 bg-base-100 p-3">
            <span class="font-bold">Cast:</span>
            {{ store.session.bible.cast.map((item) => item.title).join(', ') || 'Invented as needed' }}
          </p>
          <p class="rounded-xl border border-base-300 bg-base-100 p-3">
            <span class="font-bold">World:</span>
            {{ store.session.bible.location?.title || 'Invented from the premise' }}
          </p>
          <p class="rounded-xl border border-base-300 bg-base-100 p-3">
            <span class="font-bold">Facets:</span>
            {{ store.session.bible.facets.map((item) => item.title).join(', ') || 'None selected' }}
          </p>
          <p class="rounded-xl border border-base-300 bg-base-100 p-3">
            <span class="font-bold">Reward pool:</span>
            {{ store.session.bible.rewards.map((item) => item.title).join(', ') || 'None selected' }}
          </p>
        </div>
      </details>

      <StorymakerStatePanel :session="store.session" />

      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <NarrativeTranscript
          :beats="store.session.beats"
          :is-streaming="store.isWeaving"
          :streaming-text="store.streamingText"
          streaming-label="Storymaker is weaving the next scene…"
          empty-label="Storymaker is preparing the opening scene."
        />

        <p v-if="store.errorMessage" class="text-xs text-error">
          {{ store.errorMessage }}
        </p>

        <div
          v-if="store.isComplete"
          class="rounded-2xl border border-success/30 bg-success/5 p-4 text-center"
        >
          <p class="font-black text-success">The tale rests here</p>
          <p class="mt-1 text-xs text-base-content/55">
            The completed session remains saved in this browser until you begin another.
          </p>
        </div>
      </div>

      <NarrativeResponseComposer
        v-if="!store.isComplete"
        v-model="answerInput"
        :disabled="!store.awaitingAnswer"
        :loading="store.isWeaving"
        :placeholder="store.awaitingAnswer ? 'What happens next?' : 'Storymaker is weaving…'"
        button-label="Continue story"
        hint="Your response changes this fictional branch. It does not update projects or real-world tasks."
        @submit="submitAnswer"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { useRewardStore } from '@/stores/rewardStore'
import {
  STORYMAKER_NARRATOR_STYLES,
  STORYMAKER_STRUCTURES,
  useStorymakerStore,
  type StorymakerIngredient,
} from '@/stores/storymakerStore'
import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'

const store = useStorymakerStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const rewardStore = useRewardStore()

const setupStep = ref(0)
const furthestStep = ref(0)
const answerInput = ref('')
const setupSteps = [
  { label: 'Premise' },
  { label: 'Cast' },
  { label: 'World' },
  { label: 'Review' },
]

const characterOptions = computed<NarrativeIngredientOption[]>(() =>
  characterStore.characters.map((character) => ({
    id: character.id,
    slug: `character-${character.id}`,
    title: character.name || `Character ${character.id}`,
    description:
      character.presentation || character.personality || character.backstory,
    flavorText: [character.species, character.class, character.genre]
      .filter(Boolean)
      .join(' · '),
    imagePath: character.imagePath,
    icon: 'kind-icon:mask',
    badge: character.isPublic ? 'Public character' : 'Private character',
  })),
)

const locationOptions = computed<NarrativeIngredientOption[]>(() =>
  dreamStore.dreams
    .filter(
      (dream) => dream.dreamType === 'LOCATION' && dream.isActive && dream.slug,
    )
    .map((dream) => ({
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
      icon: 'kind-icon:moon',
      badge: 'Location',
    })),
)

const creativeFacetKinds = new Set([
  'GENRE',
  'CORE',
  'THEME',
  'MOOD',
  'STYLE',
  'ART_DIRECTION',
])
const facetOptions = computed<NarrativeIngredientOption[]>(() =>
  facetStore.activeFacets
    .filter((facet) => creativeFacetKinds.has(facet.kind) && facet.slug)
    .map((facet) => ({
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

const rewardOptions = computed<NarrativeIngredientOption[]>(() =>
  rewardStore.rewards
    .filter((reward) => reward.isActive && reward.slug)
    .map((reward) => ({
      id: reward.id,
      slug: reward.slug || String(reward.id),
      title: reward.name || `Reward ${reward.id}`,
      description: reward.description || reward.effect,
      flavorText: reward.flavorText,
      imagePath: reward.imagePath,
      icon: reward.icon || 'kind-icon:gift',
      badge: `${rarityLabel(reward.rarity)} ${reward.rewardType.toLowerCase()}`,
    })),
)

const selectedCast = computed(() =>
  characterOptions.value.filter((item) =>
    store.setupDraft.castSlugs.includes(item.slug),
  ),
)
const selectedLocation = computed(() =>
  locationOptions.value.find(
    (item) => item.slug === store.setupDraft.locationSlug,
  ),
)
const selectedFacets = computed(() =>
  facetOptions.value.filter((item) =>
    store.setupDraft.facetSlugs.includes(item.slug),
  ),
)
const selectedRewards = computed(() =>
  rewardOptions.value.filter((item) =>
    store.setupDraft.rewardSlugs.includes(item.slug),
  ),
)
const reviewTitle = computed(
  () => store.setupDraft.title.trim() || 'Untitled story',
)
const structureLabel = computed(
  () =>
    STORYMAKER_STRUCTURES.find(
      (item) => item.value === store.setupDraft.structure,
    )?.label || store.setupDraft.structure,
)
const canAdvance = computed(
  () => setupStep.value > 0 || store.setupDraft.premise.trim().length >= 10,
)
const canBegin = computed(() => store.setupDraft.premise.trim().length >= 10)

function taxonomyLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function rarityLabel(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toIngredient(option: NarrativeIngredientOption): StorymakerIngredient {
  const reward = rewardStore.rewards.find(
    (item) => item.slug === option.slug,
  )
  return {
    id: option.id,
    slug: option.slug,
    title: option.title,
    description: option.description,
    flavorText: option.flavorText,
    imagePath: option.cardPath || option.imagePath || option.heroPath || null,
    icon: option.icon,
    rarity: reward?.rarity || null,
    effect: reward?.effect || null,
  }
}

function advanceSetup() {
  if (!canAdvance.value) return
  setupStep.value = Math.min(setupStep.value + 1, setupSteps.length - 1)
  furthestStep.value = Math.max(furthestStep.value, setupStep.value)
}

function clearDraft() {
  store.resetSetup()
  setupStep.value = 0
  furthestStep.value = 0
}

async function beginStory() {
  if (!canBegin.value) return
  await store.beginStory({
    title: store.setupDraft.title,
    premise: store.setupDraft.premise,
    narratorStyle: store.setupDraft.narratorStyle,
    structure: store.setupDraft.structure,
    cast: selectedCast.value.map(toIngredient),
    location: selectedLocation.value
      ? toIngredient(selectedLocation.value)
      : undefined,
    facets: selectedFacets.value.map(toIngredient),
    rewards: selectedRewards.value.map(toIngredient),
    notes: store.setupDraft.notes,
  })
}

async function submitAnswer(value: string) {
  answerInput.value = ''
  await store.answerCurrentBeat(value)
}

function startAnother() {
  if (store.isWeaving) return
  store.resetSession()
  setupStep.value = 0
  furthestStep.value = 0
}

onMounted(() => {
  store.restoreFromLocalStorage()
  void characterStore.initialize({
    fetchRemote: true,
    createDefaultForm: false,
  })
  if (!dreamStore.hasLoaded) {
    void dreamStore.fetchDreams({ dreamType: 'LOCATION', limit: 200 })
  }
  if (!facetStore.loaded) void facetStore.fetchFacets({ take: 250 })
  void rewardStore.initialize({ fetchRemote: true })
})
</script>
