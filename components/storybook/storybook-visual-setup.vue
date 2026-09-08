<template>
  <section
    class="relative min-h-0 overflow-y-auto rounded-[2rem] border border-base-300 bg-base-100 shadow-xl"
  >
    <div class="pointer-events-none absolute inset-x-0 top-0 h-[34rem] overflow-hidden rounded-t-[2rem]">
      <img
        :src="heroImage"
        alt=""
        class="size-full object-cover opacity-35"
        aria-hidden="true"
      />
      <div
        class="absolute inset-0 bg-linear-to-b from-base-100/10 via-base-100/75 to-base-100"
      />
    </div>

    <div class="relative space-y-7 p-4 sm:p-6 lg:p-8">
      <header class="mx-auto max-w-5xl text-center">
        <p
          class="text-xs font-black uppercase tracking-[0.28em] text-primary/75"
        >
          Storybook
        </p>
        <h1 class="mt-2 text-3xl font-black sm:text-4xl lg:text-5xl">
          Lay out your story
        </h1>
        <p
          class="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-base-content/65 sm:text-base"
        >
          Put the pieces on the table. Pick the people, place, plot, mood, and
          treasures that belong in this tale, then let Storybook weave them
          together.
        </p>
      </header>

      <div
        class="mx-auto grid max-w-7xl grid-cols-[repeat(auto-fit,minmax(min(100%,24rem),1fr))] gap-4"
      >
        <section
          class="rounded-[1.75rem] border border-primary/20 bg-base-100/90 p-4 shadow-lg backdrop-blur sm:p-5"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
            >
              <Icon name="kind-icon:sparkles" class="size-5" />
            </div>
            <div>
              <h2 class="text-lg font-black">The spark</h2>
              <p class="kr-text-dim-xs">
                One premise is enough. Everything else can stay loose.
              </p>
            </div>
          </div>

          <div
            class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3"
          >
            <label class="form-control">
              <span
                class="mb-1 text-[0.68rem] font-black uppercase tracking-wider text-base-content/50"
              >
                Working title
              </span>
              <input
                v-model="store.setupDraft.title"
                type="text"
                class="kr-input rounded-2xl bg-base-100/90"
                placeholder="The Clockwork Orchard"
              />
            </label>

            <label class="form-control">
              <span
                class="mb-1 text-[0.68rem] font-black uppercase tracking-wider text-base-content/50"
              >
                Premise
              </span>
              <textarea
                v-model="store.setupDraft.premise"
                rows="4"
                class="kr-textarea rounded-2xl bg-base-100/90 text-sm leading-relaxed"
                placeholder="Every midnight, the abandoned observatory receives a letter from a star that should not exist…"
              />
            </label>
          </div>
        </section>

        <aside
          class="rounded-[1.75rem] border border-secondary/20 bg-base-100/90 p-4 shadow-lg backdrop-blur sm:p-5"
        >
          <p
            class="text-[0.68rem] font-black uppercase tracking-[0.2em] text-secondary/75"
          >
            Your spread
          </p>
          <div class="mt-3 grid grid-cols-3 gap-2 text-center">
            <div class="rounded-2xl bg-base-200/70 p-2">
              <p class="text-xl font-black">{{ selectedCast.length }}</p>
              <p class="text-[0.65rem] text-base-content/50">cast</p>
            </div>
            <div class="rounded-2xl bg-base-200/70 p-2">
              <p class="text-xl font-black">{{ selectedFacets.length }}</p>
              <p class="text-[0.65rem] text-base-content/50">facets</p>
            </div>
            <div class="rounded-2xl bg-base-200/70 p-2">
              <p class="text-xl font-black">{{ selectedRewards.length }}</p>
              <p class="text-[0.65rem] text-base-content/50">rewards</p>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-1.5 text-xs">
            <span class="kr-badge-ghost-sm rounded-xl capitalize">
              {{ store.setupDraft.narratorStyle }} voice
            </span>
            <span class="kr-badge-ghost-sm rounded-xl">
              {{ structureLabel }}
            </span>
            <span v-if="selectedScenario" class="kr-badge-ghost-sm rounded-xl">
              {{ selectedScenario.title }}
            </span>
            <span v-if="selectedLocation" class="kr-badge-ghost-sm rounded-xl">
              {{ selectedLocation.title }}
            </span>
          </div>

          <button
            type="button"
            class="kr-btn-primary mt-5 w-full justify-center rounded-2xl motion-reduce:transition-none"
            :disabled="!canBegin || store.isWeaving"
            @click="beginStory"
          >
            <span
              v-if="store.isWeaving"
              class="kr-spinner-sm"
            />
            <Icon v-else name="kind-icon:book-open" class="size-4" />
            {{ store.isWeaving ? 'Opening the story…' : 'Open this story' }}
          </button>
          <p class="mt-2 text-center text-[0.68rem] text-base-content/45">
            {{ canBegin ? 'You can always start with fewer cards.' : 'Give the story a premise first.' }}
          </p>
        </aside>
      </div>

      <section class="mx-auto max-w-7xl space-y-3">
        <div>
          <p
            class="text-[0.68rem] font-black uppercase tracking-[0.2em] text-base-content/45"
          >
            How it feels
          </p>
          <h2 class="text-xl font-black">Choose a narrator voice</h2>
        </div>
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3"
        >
          <button
            v-for="option in narratorCards"
            :key="option.value"
            type="button"
            class="group relative aspect-[2/3] overflow-hidden rounded-[1.5rem] border text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 motion-reduce:transform-none motion-reduce:transition-none"
            :class="
              store.setupDraft.narratorStyle === option.value
                ? 'border-primary ring-2 ring-primary/45'
                : 'border-base-300'
            "
            :aria-pressed="store.setupDraft.narratorStyle === option.value"
            @click="store.setupDraft.narratorStyle = option.value"
          >
            <img
              :src="option.image"
              alt=""
              class="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none"
              aria-hidden="true"
            />
            <span
              class="absolute inset-0 bg-linear-to-t from-black/85 via-black/15 to-transparent"
            />
            <span
              v-if="store.setupDraft.narratorStyle === option.value"
              class="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-content shadow"
            >
              <Icon name="kind-icon:check" class="size-4" />
            </span>
            <span class="absolute inset-x-0 bottom-0 p-3 text-white">
              <span class="block text-sm font-black sm:text-base">
                {{ option.label }}
              </span>
              <span class="mt-1 block text-[0.68rem] leading-snug text-white/75">
                {{ option.description }}
              </span>
            </span>
          </button>
        </div>
      </section>

      <section class="mx-auto max-w-7xl space-y-3">
        <div>
          <p
            class="text-[0.68rem] font-black uppercase tracking-[0.2em] text-base-content/45"
          >
            How it unfolds
          </p>
          <h2 class="text-xl font-black">Choose the shape of the tale</h2>
        </div>
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3"
        >
          <button
            v-for="option in structureCards"
            :key="option.value"
            type="button"
            class="group relative min-h-48 overflow-hidden rounded-[1.5rem] border text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 motion-reduce:transform-none motion-reduce:transition-none"
            :class="
              store.setupDraft.structure === option.value
                ? 'border-primary ring-2 ring-primary/45'
                : 'border-base-300'
            "
            :aria-pressed="store.setupDraft.structure === option.value"
            @click="store.setupDraft.structure = option.value"
          >
            <img
              :src="option.image"
              alt=""
              class="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none"
              aria-hidden="true"
            />
            <span
              class="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent"
            />
            <span class="absolute inset-x-0 bottom-0 p-4 text-white">
              <span class="block text-lg font-black">{{ option.label }}</span>
              <span class="mt-1 block text-xs leading-relaxed text-white/80">
                {{ option.description }}
              </span>
            </span>
            <span
              v-if="store.setupDraft.structure === option.value"
              class="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-content shadow"
            >
              <Icon name="kind-icon:check" class="size-4" />
            </span>
          </button>
        </div>
      </section>

      <div class="mx-auto max-w-7xl space-y-6">
        <NarrativeIngredientMultiPicker
          v-model="store.setupDraft.castSlugs"
          :items="characterOptions"
          label="Cast"
          helper="Choose up to five existing characters. Their artwork and identity travel into the story."
          empty-state="No characters are available yet. Storybook can still invent a cast from the premise."
          :loading="characterStore.loading || characterStore.isInitializing"
          :error="characterStore.error"
          :initial-limit="10"
          :max-selections="MAX_CAST_SELECTIONS"
        />

        <NarrativeRoleAssigner
          v-if="selectedCast.length"
          v-model="store.setupDraft.castRoles"
          :members="selectedCast"
        />

        <NarrativeIngredientPicker
          v-model="store.setupDraft.scenarioSlug"
          :items="scenarioOptions"
          label="Plot thread"
          helper="Choose an existing Scenario as the spine of the story, or leave the premise free to lead."
          empty-label="Premise-led story"
          empty-description="No fixed plot thread. Storybook follows the ingredients you place on the table."
          empty-icon="kind-icon:wand"
          empty-state="No Scenarios are available yet."
          :allow-empty="true"
          :loading="scenarioStore.loading"
          :initial-limit="8"
        />

        <NarrativeIngredientPicker
          v-model="store.setupDraft.locationSlug"
          :items="locationOptions"
          label="Primary setting"
          helper="Choose one reusable LOCATION Dream, or let Storybook invent the place."
          empty-label="Invent a new place"
          empty-description="The setting will grow from your premise and selected Facets."
          empty-icon="kind-icon:moon"
          empty-state="No LOCATION Dreams are available yet."
          :loading="dreamStore.loading"
          :error="dreamStore.error"
          :initial-limit="8"
        />

        <NarrativeIngredientMultiPicker
          v-model="store.setupDraft.facetSlugs"
          :items="facetOptions"
          label="Creative Facets"
          helper="Mix genre, mood, theme, style, and art direction. Pick the cards that make this story feel like itself."
          empty-state="No active creative Facets are available yet."
          :loading="facetStore.loading"
          :error="facetStore.error"
          :initial-limit="10"
          :max-selections="MAX_FACET_SELECTIONS"
        />

        <NarrativeIngredientMultiPicker
          v-model="store.setupDraft.rewardSlugs"
          :items="rewardOptions"
          label="Possible treasures"
          helper="Choose up to three Rewards the fiction may discover, grant, spend, or lose."
          empty-state="No active Rewards are available yet. The story can continue without inventory."
          :loading="rewardStore.isLoading || rewardStore.isInitializing"
          :error="rewardStore.error"
          :initial-limit="10"
          :max-selections="MAX_REWARD_SELECTIONS"
        />
      </div>

      <section
        class="mx-auto max-w-7xl rounded-[1.75rem] border border-base-300 bg-base-100/85 p-4 shadow-sm sm:p-5"
      >
        <label class="form-control">
          <span class="font-black">One last note, if you want one</span>
          <span class="kr-text-dim-xs mt-1">
            A boundary, relationship, running gag, or bit of direction the
            narrator should remember.
          </span>
          <textarea
            v-model="store.setupDraft.notes"
            rows="3"
            class="kr-textarea mt-3 rounded-2xl"
            placeholder="Keep the rivalry affectionate. Let every machine feel slightly alive. Avoid a chosen-one prophecy."
          />
        </label>
      </section>

      <footer
        class="sticky bottom-3 z-10 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100/95 p-3 shadow-xl backdrop-blur"
      >
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl motion-reduce:transition-none"
          :disabled="store.isWeaving"
          @click="store.resetSetup()"
        >
          Clear the table
        </button>
        <div class="flex items-center gap-3">
          <p class="kr-text-dim-xs hidden sm:block">
            {{ canBegin ? 'Ready when you are.' : 'A premise unlocks the story.' }}
          </p>
          <button
            type="button"
            class="kr-btn-primary rounded-xl motion-reduce:transition-none"
            :disabled="!canBegin || store.isWeaving"
            @click="beginStory"
          >
            <span
              v-if="store.isWeaving"
              class="kr-spinner-sm"
            />
            <Icon v-else name="kind-icon:book-open" class="size-4" />
            {{ store.isWeaving ? 'Opening…' : 'Open this story' }}
          </button>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import {
  STORYBOOK_STRUCTURES,
  useStorybookStore,
  type StorybookIngredient,
  type StorybookNarratorStyle,
  type StorybookStructure,
} from '@/stores/storybookStore'
import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'
import { isNarrativeRoleKey } from '@/utils/narrativeRoles'
import {
  getTutorialHeroPath,
  getTutorialImagePath,
} from '@/stores/helpers/tutorialCards'

const store = useStorybookStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()

const MAX_CAST_SELECTIONS = 5
const MAX_FACET_SELECTIONS = 5
const MAX_REWARD_SELECTIONS = 3

const heroImage = computed(() => getTutorialImagePath('scenario', 'storybook'))

const narratorCards: {
  value: StorybookNarratorStyle
  label: string
  description: string
  image: string
}[] = [
  {
    value: 'cinematic',
    label: 'Cinematic',
    description: 'Big images, clean momentum, dramatic turns.',
    image: getTutorialHeroPath('scenario'),
  },
  {
    value: 'playful',
    label: 'Playful',
    description: 'Bouncy, curious, delighted by strange possibilities.',
    image: getTutorialHeroPath('character'),
  },
  {
    value: 'storybook',
    label: 'Storybook',
    description: 'Warm, lyrical, and made to be read aloud.',
    image: getTutorialHeroPath('dream'),
  },
  {
    value: 'mysterious',
    label: 'Mysterious',
    description: 'Shadows, clues, restraint, and unanswered questions.',
    image: getTutorialHeroPath('bot'),
  },
  {
    value: 'intimate',
    label: 'Intimate',
    description: 'Close to the characters and what they notice.',
    image: getTutorialHeroPath('reward'),
  },
]

const structureArt: Record<StorybookStructure, string> = {
  'short-story': getTutorialHeroPath('reward'),
  chaptered: getTutorialHeroPath('dream'),
  episodic: getTutorialHeroPath('scenario'),
}

const structureCards = STORYBOOK_STRUCTURES.map((structure) => ({
  ...structure,
  image: structureArt[structure.value],
}))

const characterOptions = computed<NarrativeIngredientOption[]>(() =>
  characterStore.browseCharacters.map((character) => ({
    id: character.id,
    slug: character.slug || `character-${character.id}`,
    title: character.name || `Character ${character.id}`,
    description: character.presentation || character.role || character.class,
    flavorText: [character.species, character.class, character.genre]
      .filter(Boolean)
      .join(' · '),
    imagePath: character.imagePath,
    icon: 'kind-icon:mask',
    badge: character.isPublic ? 'Public character' : 'Private character',
  })),
)

const scenarioOptions = computed<NarrativeIngredientOption[]>(() =>
  scenarioStore.scenarios
    .filter((scenario) => scenario.slug)
    .map((scenario) => ({
      id: scenario.id,
      slug: scenario.slug || String(scenario.id),
      title: scenario.title || 'Untitled scenario',
      description: scenario.description,
      imagePath: scenario.imagePath,
      icon: 'kind-icon:map',
      badge: scenario.genres || undefined,
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

const creativeFacetTaxonomies = new Set([
  'GENRE',
  'CORE',
  'THEME',
  'MOOD',
  'STYLE',
  'ART_DIRECTION',
])

const facetOptions = computed<NarrativeIngredientOption[]>(() =>
  facetStore.activeFacets
    .filter(
      (facet) => creativeFacetTaxonomies.has(facet.taxonomy) && facet.slug,
    )
    .map((facet) => ({
      id: facet.id,
      slug: facet.slug || String(facet.id),
      title: facet.title,
      description: facet.description,
      flavorText: facet.flavorText,
      imagePath: facet.imagePath,
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
const selectedScenario = computed(() =>
  scenarioOptions.value.find(
    (item) => item.slug === store.setupDraft.scenarioSlug,
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

const canBegin = computed(() => store.setupDraft.premise.trim().length >= 10)
const structureLabel = computed(
  () =>
    STORYBOOK_STRUCTURES.find(
      (structure) => structure.value === store.setupDraft.structure,
    )?.label || store.setupDraft.structure,
)

function taxonomyLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function rarityLabel(value: string): string {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function assignedRole(slug: string): string | null {
  const key = store.setupDraft.castRoles?.[slug]
  return key && isNarrativeRoleKey(key) ? key : null
}

function toIngredient(option: NarrativeIngredientOption): StorybookIngredient {
  const reward = rewardStore.rewards.find((item) => item.slug === option.slug)
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

async function beginStory(): Promise<void> {
  if (!canBegin.value || store.isWeaving) return
  await store.beginStory({
    title: store.setupDraft.title,
    premise: store.setupDraft.premise,
    narratorStyle: store.setupDraft.narratorStyle,
    structure: store.setupDraft.structure,
    cast: selectedCast.value.map((member) => ({
      ...toIngredient(member),
      roleKey: assignedRole(member.slug),
    })),
    location: selectedLocation.value
      ? toIngredient(selectedLocation.value)
      : undefined,
    facets: selectedFacets.value.map(toIngredient),
    rewards: selectedRewards.value.map(toIngredient),
    scenario: selectedScenario.value
      ? toIngredient(selectedScenario.value)
      : undefined,
    notes: store.setupDraft.notes,
  })
}
</script>