<!-- /components/storybook/storybook-table.vue -->
<!--
  THE TABLE. One open surface where a story is dealt, not a four-step form.

  Silas, 2026-09-09, rejecting the setup screen this replaces: "too
  text-and-button driven ... one open selection surface ... tarot-deck/tableau
  feeling." And 2026-09-12, on where the line falls: "All selections before the
  story begins should be card hand based" -- clarified as "that doesn't count
  reasonable settings, start story, etc. I just meant all the flavor bits,
  including mode select, narrator, etc."

  So the board holds CARDS for every creative choice (mode, genre, place, hero,
  company, narrator, thread, treasures) and the settings row holds ORDINARY
  CONTROLS for the title, the spark and the length dial. Round 1 of the mockups
  failed by keeping the form and adding cards underneath it; the board and the
  hand are the page.

  Silas, 2026-09-13: "we just want things functional at this point. we can
  tweak what it looks like afterwards." This screen is built for that -- it
  works against the shipped engine end to end, and the visual pass comes after.

  THE HAND IS IN THIS PAGE, not the global workspace hand. Taking that over
  needs stores/helpers/modelCards.ts decks to carry live entity art, which they
  do not; it buys nothing functional and is filed as its own polish task.
-->
<template>
  <section
    class="relative h-full min-h-0 overflow-y-auto overscroll-contain rounded-[2rem] border border-base-300 bg-base-100 shadow-xl"
  >
    <div class="space-y-5 p-4 sm:p-5 lg:p-6">
      <!-- THE BOARD -->
      <div>
        <div class="mb-2 flex items-baseline justify-between gap-3">
          <h2 class="kr-text-black-lg">The table</h2>
          <p class="kr-text-dim-xs">
            {{ readyToOpen ? 'Ready when you are.' : 'Genre, place and hero.' }}
          </p>
        </div>

        <div
          class="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3"
          data-testid="storybook-board"
        >
          <button
            v-for="spec in slotSpecs"
            :key="spec.key"
            type="button"
            class="group flex flex-col gap-1 rounded-2xl border-2 p-2 text-left transition"
            :class="
              spec.key === activeSlot
                ? 'border-primary bg-primary/5'
                : 'border-base-300 bg-base-200/40 hover:border-primary/40'
            "
            :aria-pressed="spec.key === activeSlot"
            @click="activeSlot = spec.key"
          >
            <span class="flex items-center gap-1">
              <Icon :name="spec.icon" class="kr-icon-4 text-primary" />
              <span class="kr-text-semibold-sm">{{ labelFor(spec) }}</span>
              <span
                v-if="spec.required || requiredInMode(spec.key)"
                class="kr-text-dim-xs"
                >*</span
              >
            </span>

            <span
              class="relative flex aspect-[2/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-base-300 bg-base-100"
            >
              <template v-if="placed(spec.key).length">
                <img
                  v-if="artFor(placed(spec.key)[0])"
                  :src="artFor(placed(spec.key)[0]) || undefined"
                  :alt="placed(spec.key)[0]?.title || spec.label"
                  class="kr-img-cover absolute inset-0"
                />
                <span
                  class="absolute inset-x-0 bottom-0 bg-base-100/85 px-1 py-0.5 text-center kr-text-semibold-sm"
                >
                  {{ placed(spec.key)[0]?.title }}
                </span>
                <span
                  v-if="placed(spec.key).length > 1"
                  class="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-primary-content kr-text-dim-xs"
                >
                  +{{ placed(spec.key).length - 1 }}
                </span>
              </template>
              <span v-else class="kr-text-dim-xs px-1 text-center">
                {{ hintFor(spec) }}
              </span>
            </span>
          </button>
        </div>
      </div>

      <!-- THE HAND: the deck for whichever slot is active -->
      <div class="rounded-[1.5rem] border border-base-300 bg-base-200/40 p-3">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 class="kr-text-semibold-sm">
            {{ activeSpec.label }}
            <span class="kr-text-dim-xs">
              · {{ placed(activeSlot).length }} of {{ activeSpec.capacity }}
            </span>
          </h3>
          <input
            v-model="search"
            type="search"
            :placeholder="`Search ${activeSpec.label.toLowerCase()}`"
            class="input input-sm input-bordered w-full sm:w-56"
          />
        </div>

        <p v-if="!activeDeck.length" class="kr-text-dim-xs py-6 text-center">
          Nothing to deal here yet.
        </p>
        <div
          v-else
          class="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2"
          data-testid="storybook-hand"
        >
          <NarrativeIngredientCard
            v-for="card in activeDeck"
            :key="card.slug"
            :item="card"
            :selected="isPlaced(activeSlot, card.slug)"
            @select="toggleCard(activeSlot, card)"
          />
        </div>
      </div>

      <!-- SETTINGS: typed input and dials, never cards -->
      <div
        class="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-3"
      >
        <label class="form-control">
          <span class="kr-text-eyebrow mb-1">Working title</span>
          <input
            v-model="title"
            type="text"
            class="input input-bordered"
            placeholder="Optional"
          />
        </label>

        <label class="form-control">
          <span class="kr-text-eyebrow mb-1">
            {{ isTaskmaster ? 'Objective' : 'Spark' }}
          </span>
          <textarea
            v-model="spark"
            class="textarea textarea-bordered"
            rows="2"
            :placeholder="
              isTaskmaster
                ? 'What are you actually trying to get done?'
                : 'Optional — leave it empty and the narrator invents one.'
            "
          />
        </label>

        <label v-if="!isEndlessChoice" class="form-control">
          <span class="kr-text-eyebrow mb-1">Length</span>
          <select v-model.number="turnBudget" class="select select-bordered">
            <option :value="0">The deck's default</option>
            <option
              v-for="preset in lengthPresets"
              :key="preset.value"
              :value="preset.value"
            >
              {{ preset.label }} — {{ preset.hint }}
            </option>
          </select>
        </label>

        <label v-else class="form-control">
          <span class="kr-text-eyebrow mb-1">Length</span>
          <select v-model.number="turnBudget" class="select select-bordered">
            <option :value="-1">Endless — you decide when it ends</option>
            <option :value="0">The deck's default</option>
            <option
              v-for="preset in lengthPresets"
              :key="preset.value"
              :value="preset.value"
            >
              {{ preset.label }} — {{ preset.hint }}
            </option>
          </select>
        </label>

        <label v-if="placed('narrator').length" class="form-control">
          <span class="kr-text-eyebrow mb-1">Delivery</span>
          <select v-model="narratorStyle" class="select select-bordered">
            <option
              v-for="delivery in deliveries"
              :key="delivery.value"
              :value="delivery.value"
            >
              {{ delivery.label }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="errorMessage" class="kr-text-dim-xs text-error">
        {{ errorMessage }}
      </p>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!readyToOpen || runStore.isOpening"
          @click="openStory"
        >
          <span
            v-if="runStore.isOpening"
            class="loading loading-spinner loading-sm"
          />
          Open this story
        </button>
        <button type="button" class="btn btn-ghost" @click="clearTable">
          Clear the table
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useProjectStore } from '@/stores/projectStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useFacetStore } from '@/stores/facetStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import {
  useStorybookRunStore,
  type StorybookBoard,
  type StorybookRunMode,
} from '@/stores/storybookRunStore'
import { performFetch } from '@/stores/utils'
import {
  LENGTH_PRESETS,
  MODE_CARDS,
  NARRATOR_DELIVERIES,
  STORYBOOK_SLOT_SPECS,
  isGenreFacet,
  type StorybookSlotSpec,
  isPlaceDream,
  toGenreCard,
  toHeroCard,
  toNarratorCard,
  toPlaceCard,
  toThreadCard,
  toTreasureCard,
  type NarratorLike,
  type StorybookSlot,
} from '@/utils/storybookTableDecks'
import {
  narrativeIngredientArtwork,
  type NarrativeIngredientOption,
} from '@/utils/narrativeIngredients'

const emit = defineEmits<{ opened: [runId: number] }>()

const runStore = useStorybookRunStore()
const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const facetStore = useFacetStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const projectStore = useProjectStore()

const slotSpecs = STORYBOOK_SLOT_SPECS
const lengthPresets = LENGTH_PRESETS
const deliveries = NARRATOR_DELIVERIES

const activeSlot = ref<StorybookSlot>('genre')
const search = ref('')
const title = ref('')
const spark = ref('')
const narratorStyle = ref<string>('storybook')
/** 0 = the deck's default, -1 = endless. Anything else is a turn count. */
const turnBudget = ref(0)
const errorMessage = ref('')
const narrators = ref<NarratorLike[]>([])

const board = ref<Record<StorybookSlot, NarrativeIngredientOption[]>>({
  mode: [MODE_CARDS[0] as NarrativeIngredientOption],
  genre: [],
  place: [],
  hero: [],
  company: [],
  narrator: [],
  thread: [],
  treasures: [],
})

/**
 * The reader's conductor-backed projects, as Thread cards for taskmaster mode.
 *
 * Only projects carrying a conductorSlug: that slug is what the server deals
 * checkpoints from, so a Kind Robots project with no Conductor side would put
 * an objective on the board with nothing behind it.
 */
const projectCards = computed<NarrativeIngredientOption[]>(() =>
  projectStore.projects
    .filter((project) => project.conductorSlug)
    .map((project) => ({
      id: project.id,
      slug: project.conductorSlug as string,
      title: project.title || `Project ${project.id}`,
      description: project.description,
      imagePath: project.imagePath,
      icon: 'kind-icon:gearhammer',
      badge: 'Your project',
    })),
)

const activeSpec = computed(
  () => slotSpecs.find((spec) => spec.key === activeSlot.value) || slotSpecs[0]!,
)

const mode = computed<StorybookRunMode>(
  () => (board.value.mode[0]?.slug as StorybookRunMode) || 'open-ended',
)
const isTaskmaster = computed(() => mode.value === 'taskmaster')
const isEndlessChoice = computed(() => mode.value === 'open-ended')

/**
 * The Thread slot changes job in taskmaster mode -- it is the project the real
 * work is dealt from, and it stops being optional. Renaming the well rather
 * than adding a ninth slot keeps the board the same board in every mode, which
 * is the point of absorbing Taskmaster instead of porting it.
 */
function labelFor(spec: StorybookSlotSpec): string {
  if (spec.key === 'thread' && isTaskmaster.value) return 'Project'
  return spec.label
}

function hintFor(spec: StorybookSlotSpec): string {
  if (spec.key === 'thread' && isTaskmaster.value) {
    return 'Whose real work this quest is'
  }
  return spec.hint
}

function requiredInMode(slot: StorybookSlot): boolean {
  return slot === 'thread' && isTaskmaster.value
}

function placed(slot: StorybookSlot): NarrativeIngredientOption[] {
  return board.value[slot]
}

function isPlaced(slot: StorybookSlot, slug: string): boolean {
  return board.value[slot].some((card) => card.slug === slug)
}

function artFor(card?: NarrativeIngredientOption): string | null {
  return card ? narrativeIngredientArtwork(card) : null
}

/**
 * Play a card into the active slot, or take it back off.
 *
 * A full one-card slot SWAPS rather than refusing: tapping a second hero
 * obviously means "that one instead", and making the reader clear the slot
 * first is the kind of friction the old four-step setup was made of.
 */
function toggleCard(slot: StorybookSlot, card: NarrativeIngredientOption) {
  const spec = slotSpecs.find((entry) => entry.key === slot)!
  const current = board.value[slot]
  const already = current.findIndex((entry) => entry.slug === card.slug)
  if (already >= 0) {
    board.value[slot] = current.filter((_, index) => index !== already)
    return
  }
  board.value[slot] =
    spec.capacity === 1 ? [card] : [...current, card].slice(-spec.capacity)
}

function matches(card: NarrativeIngredientOption): boolean {
  const term = search.value.trim().toLowerCase()
  if (!term) return true
  return `${card.title} ${card.description || ''}`.toLowerCase().includes(term)
}

const activeDeck = computed<NarrativeIngredientOption[]>(() => {
  const deck = (() => {
    switch (activeSlot.value) {
      case 'mode':
        return MODE_CARDS as NarrativeIngredientOption[]
      case 'genre':
        return facetStore.activeFacets.filter(isGenreFacet).map(toGenreCard)
      case 'place':
        return dreamStore.dreams.filter(isPlaceDream).map(toPlaceCard)
      case 'hero':
      case 'company':
        return characterStore.browseCharacters.map(toHeroCard)
      case 'narrator':
        return narrators.value.map(toNarratorCard)
      case 'thread':
        // In taskmaster mode the Thread slot is where the real work comes
        // from, so it deals the reader's own projects instead of Scenarios
        // (storybook/t-046). Silas chose that scope on 2026-09-13: one
        // project's work, because a quest that sweeps up every loose to-do
        // stops having an objective.
        return isTaskmaster.value
          ? projectCards.value
          : scenarioStore.scenarios
              .filter((scenario) => scenario.slug)
              .map(toThreadCard)
      case 'treasures':
        return rewardStore.rewards
          .filter((reward) => reward.isActive && reward.slug)
          .map(toTreasureCard)
      default:
        return []
    }
  })()
  return deck.filter(matches)
})

const readyToOpen = computed(() =>
  slotSpecs
    .filter((spec) => spec.required)
    .every((spec) => board.value[spec.key].length > 0),
)

function clearTable() {
  board.value = {
    mode: [MODE_CARDS[0] as NarrativeIngredientOption],
    genre: [],
    place: [],
    hero: [],
    company: [],
    narrator: [],
    thread: [],
    treasures: [],
  }
  title.value = ''
  spark.value = ''
  turnBudget.value = 0
  errorMessage.value = ''
  activeSlot.value = 'genre'
}

async function openStory() {
  errorMessage.value = ''
  const hero = board.value.hero[0]
  if (!hero) return

  // Said here rather than let the server say it: a taskmaster quest with no
  // objective is a story with nothing to serve, and one with no project has no
  // real work in it.
  if (isTaskmaster.value && !spark.value.trim()) {
    errorMessage.value =
      'A taskmaster quest needs an objective: say what you are trying to get done.'
    return
  }
  if (isTaskmaster.value && !board.value.thread[0]) {
    errorMessage.value =
      'Deal a project into the Thread slot — that is where the real work comes from.'
    return
  }

  const payload: StorybookBoard = {
    mode: mode.value,
    // The Genre card IS the deck: a genre facet's slug is its deck key.
    deckKey: isTaskmaster.value
      ? 'taskmaster'
      : `genre-${board.value.genre[0]?.slug}`,
    title: title.value.trim() || null,
    spark: spark.value.trim() || null,
    narratorStyle: narratorStyle.value,
    botId: board.value.narrator[0]?.id
      ? Number(board.value.narrator[0]!.id)
      : null,
    castSlugs: [hero.slug, ...board.value.company.map((card) => card.slug)],
    locationSlug: board.value.place[0]?.slug ?? null,
    facetSlugs: board.value.genre.map((card) => card.slug),
    // The Thread card is a project in taskmaster mode and a Scenario in every
    // other, so it goes into a different field depending on which.
    projectSlug: isTaskmaster.value
      ? (board.value.thread[0]?.slug ?? null)
      : null,
    scenarioSlug: isTaskmaster.value
      ? null
      : (board.value.thread[0]?.slug ?? null),
    rewardSlugs: board.value.treasures.map((card) => card.slug),
  }

  // 0 means "whatever the deck says", so it is omitted rather than sent as a
  // number; -1 is the reader asking for an endless run, which is an explicit
  // null on the wire.
  if (turnBudget.value === -1) payload.turnBudget = null
  else if (turnBudget.value > 0) payload.turnBudget = turnBudget.value

  const opened = await runStore.openStory(payload)
  if (!opened) {
    errorMessage.value = runStore.errorMessage || 'That story would not open.'
    return
  }
  if (runStore.run) emit('opened', runStore.run.id)
}

onMounted(async () => {
  // allSettled, not all: one slow or failing deck must not leave the whole
  // table empty. A board missing its treasures still opens a story.
  await Promise.allSettled([
    projectStore.fetchProjects(),
    characterStore.initialize(),
    dreamStore.initialize(),
    facetStore.fetchFacets(),
    rewardStore.initialize(),
    scenarioStore.initialize(),
  ])
  const response = await performFetch<NarratorLike[]>('/api/narrators')
  if (response.success && response.data) narrators.value = response.data
})
</script>
