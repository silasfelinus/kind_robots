<!-- /components/storybook/storybook-visual-setup.vue -->
<!--
  SETUP IS A FORM, NOT A SPLASH SCREEN. This used to open with a 34rem hero
  wash, a centred 5xl headline, and a "Your spread" tally card before the
  first input -- roughly a full viewport of chrome above the one thing the
  page actually needs (a premise). Silas, 2026-09-09: "why do we even have
  the top section so large. A single title and premise sounds reasonable.
  spread is unnecessary." The spark card is now the first thing on the page,
  and the sticky footer is the single "Open this story" call to action.

  NO BORROWED TUTORIAL ART. The narrator-voice and structure cards used to be
  full-bleed `getTutorialHeroPath(...)` images. Those are the tutorial channel
  banners -- artwork with STORIES / CHARACTERS / LOCATIONS / BOTS / REWARDS set
  in large type across it. Correct on a tutorial page, wrong here: it labelled
  "Cinematic" with a picture that says STORIES, and it put generated typography
  on screen, which the art guidelines forbid. Choice cards carry an icon and
  their own words instead. If these ever get real art, it must be text-free and
  actually depict the voice or shape being chosen -- not a channel banner
  reused for its dimensions.
-->
<template>
  <!--
    h-full is load-bearing. The host in storybook-library-page.vue is a bounded
    `min-h-0 flex-1 overflow-hidden` flex item, so without an explicit height
    this section sized to its own content, overflow-y-auto had nothing to
    scroll against, and the host simply clipped everything below the fold --
    the page could not be scrolled at all. This is the component's single
    scroll region (verifyLayoutContract `one-scroll`); do not add another.
  -->
  <section
    class="relative h-full min-h-0 overflow-y-auto overscroll-contain rounded-[2rem] border border-base-300 bg-base-100 shadow-xl"
  >
    <div class="space-y-6 p-4 sm:p-5 lg:p-6">
      <section
        class="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4 shadow-sm"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          >
            <Icon name="kind-icon:sparkles" class="size-5" />
          </div>
          <div class="min-w-0">
            <h2 class="kr-text-black-lg">The spark</h2>
            <p class="kr-text-dim-xs">
              One premise is enough. Everything else can stay loose.
            </p>
          </div>
        </div>

        <div
          class="mt-3 grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3"
        >
          <label class="form-control">
            <span
              class="kr-text-eyebrow mb-1 text-[0.68rem] tracking-wider text-base-content/50"
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
              class="kr-text-eyebrow mb-1 text-[0.68rem] tracking-wider text-base-content/50"
            >
              Premise
            </span>
            <textarea
              v-model="store.setupDraft.premise"
              rows="3"
              class="kr-textarea rounded-2xl bg-base-100/90 text-sm leading-relaxed"
              placeholder="Every midnight, the abandoned observatory receives a letter from a star that should not exist…"
            />
          </label>
        </div>
      </section>

      <section class="space-y-2">
        <div class="flex flex-wrap items-baseline gap-2">
          <h2 class="kr-text-black-sm">Narrator voice</h2>
          <p class="kr-text-dim-xs">How it feels to read.</p>
        </div>
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2"
        >
          <button
            v-for="option in narratorCards"
            :key="option.value"
            type="button"
            class="flex items-start gap-3 rounded-2xl border p-3 text-left transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 motion-reduce:transition-none"
            :class="
              store.setupDraft.narratorStyle === option.value
                ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                : 'border-base-300 bg-base-100'
            "
            :aria-pressed="store.setupDraft.narratorStyle === option.value"
            @click="store.setupDraft.narratorStyle = option.value"
          >
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            >
              <Icon :name="option.icon" class="size-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="kr-text-black-sm block">{{ option.label }}</span>
              <span class="kr-text-dim-xs mt-0.5 block leading-snug">
                {{ option.description }}
              </span>
            </span>
            <Icon
              v-if="store.setupDraft.narratorStyle === option.value"
              name="kind-icon:check"
              class="size-4 shrink-0 text-primary"
            />
          </button>
        </div>
      </section>

      <section class="space-y-2">
        <div class="flex flex-wrap items-baseline gap-2">
          <h2 class="kr-text-black-sm">Shape of the tale</h2>
          <p class="kr-text-dim-xs">How it unfolds.</p>
        </div>
        <div
          class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2"
        >
          <button
            v-for="option in structureCards"
            :key="option.value"
            type="button"
            class="flex items-start gap-3 rounded-2xl border p-3 text-left transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 motion-reduce:transition-none"
            :class="
              store.setupDraft.structure === option.value
                ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                : 'border-base-300 bg-base-100'
            "
            :aria-pressed="store.setupDraft.structure === option.value"
            @click="store.setupDraft.structure = option.value"
          >
            <span
              class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"
            >
              <Icon :name="option.icon" class="size-5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="kr-text-black-sm block">{{ option.label }}</span>
              <span class="kr-text-dim-xs mt-0.5 block leading-snug">
                {{ option.description }}
              </span>
            </span>
            <Icon
              v-if="store.setupDraft.structure === option.value"
              name="kind-icon:check"
              class="size-4 shrink-0 text-primary"
            />
          </button>
        </div>
      </section>

      <div class="space-y-6">
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
        class="rounded-[1.5rem] border border-base-300 bg-base-100/85 p-4 shadow-sm"
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
        class="sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100/95 p-3 shadow-xl backdrop-blur"
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
            {{
              canBegin ? 'Ready when you are.' : 'A premise unlocks the story.'
            }}
          </p>
          <button
            type="button"
            class="kr-btn-primary rounded-xl motion-reduce:transition-none"
            :disabled="!canBegin || store.isWeaving"
            @click="beginStory"
          >
            <span v-if="store.isWeaving" class="kr-spinner-sm" />
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
  type StorybookStartInput,
  type StorybookNarratorStyle,
  type StorybookStructure,
} from '@/stores/storybookStore'
import type { NarrativeIngredientOption } from '@/utils/narrativeIngredients'
import { isNarrativeRoleKey } from '@/utils/narrativeRoles'

const store = useStorybookStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()

const MAX_CAST_SELECTIONS = 5
const MAX_FACET_SELECTIONS = 5
const MAX_REWARD_SELECTIONS = 3

// Icons, not artwork. See the template's header comment: these cards used to
// carry `getTutorialHeroPath(...)` channel banners, which have their channel
// name set in large type across the image, so "Cinematic" was illustrated by a
// picture reading STORIES. Any future art here must be text-free and depict
// the voice it names.
const narratorCards: {
  value: StorybookNarratorStyle
  label: string
  description: string
  icon: string
}[] = [
  {
    value: 'cinematic',
    label: 'Cinematic',
    description: 'Big images, clean momentum, dramatic turns.',
    icon: 'kind-icon:movie',
  },
  {
    value: 'playful',
    label: 'Playful',
    description: 'Bouncy, curious, delighted by strange possibilities.',
    icon: 'kind-icon:party',
  },
  {
    value: 'storybook',
    label: 'Storybook',
    description: 'Warm, lyrical, and made to be read aloud.',
    icon: 'kind-icon:menu-book',
  },
  {
    value: 'mysterious',
    label: 'Mysterious',
    description: 'Shadows, clues, restraint, and unanswered questions.',
    icon: 'kind-icon:moon',
  },
  {
    value: 'intimate',
    label: 'Intimate',
    description: 'Close to the characters and what they notice.',
    icon: 'kind-icon:heart',
  },
]

const structureIcons: Record<StorybookStructure, string> = {
  'short-story': 'kind-icon:feather',
  chaptered: 'kind-icon:bookshelf',
  episodic: 'kind-icon:cards',
  // The endings engine, formerly the separate Da Vinci product.
  life: 'kind-icon:castle',
}

const structureCards = STORYBOOK_STRUCTURES.map((structure) => ({
  ...structure,
  icon: structureIcons[structure.value],
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
  const input: StorybookStartInput = {
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
  }
  // The shape picks the engine. 'life' hands the same ingredients to the
  // endings engine (a server-side LifeRun resolving into one of 1,024 seeded
  // endings); everything else runs the client-side beat loop. One setup
  // screen, one "Open this story" button, two ways a story can be told.
  if (store.setupDraft.structure === 'life') {
    store.beginLife(input)
    return
  }
  await store.beginStory(input)
}
</script>
