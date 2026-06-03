<!-- /components/builders/character-builder.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-200 p-3"
  >
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 lg:flex-row lg:items-start lg:justify-between"
    >
      <div class="min-w-0">
        <h2
          class="flex items-center gap-2 text-2xl font-black text-base-content"
        >
          <Icon name="kind-icon:mask" class="h-7 w-7 text-primary" />
          Character Builder
        </h2>

        <p class="mt-1 max-w-3xl text-sm text-base-content/70">
          Build a character by playing prompt cards. Finish a card to place it
          on the sheet. Remove a sheet entry to restore its card. Elegant little
          goblin loop.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button class="btn rounded-xl" type="button" @click="reshuffleDeck">
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Reshuffle
        </button>

        <button class="btn rounded-xl" type="button" @click="resetBuilder">
          <Icon name="kind-icon:trash" class="h-4 w-4" />
          Clear
        </button>

        <button
          class="btn btn-primary rounded-xl"
          type="button"
          :disabled="isSaving || !canSave"
          @click="saveCharacter"
        >
          <Icon name="kind-icon:save" class="h-4 w-4" />
          {{ isSaving ? 'Saving...' : saveButtonLabel }}
        </button>
      </div>
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[1fr_25rem]">
      <character-sheet
        :sheet="sheet"
        :reward-slots="rewardSlotsForCharacterSheet"
        :is-builder-mode="true"
        :can-create-art="canCreateArt"
        :allow-art="true"
        @remove-section="removeSheetSection"
        @remove-reward="removeRewardSlot"
        @select-card="selectCardByKey"
      />

      <aside class="flex min-h-0 flex-col gap-3">
        <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3
            class="flex items-center gap-2 text-lg font-bold text-base-content"
          >
            <Icon name="kind-icon:cards" class="h-5 w-5 text-primary" />
            Active Prompt
          </h3>

          <div v-if="activeCard" class="mt-3 flex flex-col gap-3">
            <div class="rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p
                    class="text-xs font-bold uppercase tracking-[0.18em] text-primary"
                  >
                    {{ activeCard.label }}
                  </p>

                  <h4 class="mt-2 text-xl font-black text-base-content">
                    {{ activeStep.title }}
                  </h4>
                </div>

                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-base-100 text-xl text-primary"
                >
                  {{ activeCard.flourish }}
                </div>
              </div>

              <p class="mt-2 text-sm text-base-content/70">
                {{ activeStep.body }}
              </p>

              <div v-if="activeCard.steps.length > 1" class="mt-3 flex gap-1">
                <span
                  v-for="step in activeCard.steps"
                  :key="step.key"
                  class="h-2 flex-1 rounded-full"
                  :class="
                    step.key === activeStep.key ? 'bg-primary' : 'bg-base-300'
                  "
                />
              </div>
            </div>

            <label v-if="activeStep.inputType === 'short'" class="form-control">
              <span class="label-text font-bold">
                {{ activeStep.inputLabel }}
              </span>

              <input
                v-model="activeValue"
                class="input input-bordered rounded-2xl"
                type="text"
                :placeholder="activeStep.placeholder"
              />
            </label>

            <label
              v-else-if="activeStep.inputType === 'long'"
              class="form-control"
            >
              <span class="label-text font-bold">
                {{ activeStep.inputLabel }}
              </span>

              <textarea
                v-model="activeValue"
                class="textarea textarea-bordered min-h-40 rounded-2xl text-base"
                :placeholder="activeStep.placeholder"
              />
            </label>

            <div
              v-else-if="activeStep.inputType === 'stats'"
              class="flex flex-col gap-3"
            >
              <p class="text-sm text-base-content/70">
                Tap a number block, then choose a stat slot. Each number can
                only be used once.
              </p>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="block in statBlocks"
                  :key="block"
                  class="btn btn-sm rounded-xl"
                  :class="
                    selectedStatBlock === block ? 'btn-primary' : 'btn-outline'
                  "
                  type="button"
                  :disabled="
                    usedDraftStatBlocks.includes(block) &&
                    selectedStatBlock !== block
                  "
                  @click="selectedStatBlock = block"
                >
                  {{ block }}
                </button>
              </div>

              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="stat in draftStats"
                  :key="stat.key"
                  class="grid grid-cols-[1fr_4rem] items-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary hover:bg-primary/10"
                  type="button"
                  @click="assignSelectedStat(stat.key)"
                >
                  <span class="text-sm font-bold text-base-content">
                    {{ stat.name }}
                  </span>

                  <span
                    class="flex h-11 items-center justify-center rounded-2xl bg-base-300 text-xl font-black"
                    :class="
                      stat.value ? 'text-primary' : 'text-base-content/30'
                    "
                  >
                    {{ stat.value || '—' }}
                  </span>
                </button>
              </div>
            </div>

            <div
              v-else-if="activeStep.inputType === 'reward'"
              class="flex flex-col gap-3"
            >
              <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
                <p
                  class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
                >
                  {{ activeRewardSlot?.label || 'Reward' }}
                </p>

                <p class="mt-1 text-sm text-base-content/70">
                  {{ rewardSlotDescription }}
                </p>
              </div>

              <label class="form-control">
                <span class="label-text font-bold">Skill Name</span>

                <input
                  v-model="stagedReward.label"
                  class="input input-bordered rounded-2xl"
                  type="text"
                  placeholder="Moonlit Counterspell, Pocket Sand Theology..."
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Flavor Text</span>

                <textarea
                  v-model="stagedReward.text"
                  class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
                  placeholder="What this skill is, how it feels, and why the character keeps reaching for it."
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Power</span>

                <textarea
                  v-model="stagedReward.power"
                  class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
                  placeholder="What it does in a scene, challenge, or story moment."
                />
              </label>

              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label class="form-control">
                  <span class="label-text font-bold">Icon</span>

                  <input
                    v-model="stagedReward.icon"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    placeholder="kind-icon:bolt"
                  />
                </label>

                <label class="form-control">
                  <span class="label-text font-bold">Image Path</span>

                  <input
                    v-model="stagedReward.imagePath"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    placeholder="/images/skill.webp"
                  />
                </label>
              </div>

              <label class="form-control">
                <span class="label-text font-bold">Art Prompt</span>

                <textarea
                  v-model="stagedReward.artPrompt"
                  class="textarea textarea-bordered min-h-24 rounded-2xl text-base"
                  placeholder="Optional image prompt for later skill art."
                />
              </label>
            </div>

            <div
              v-else-if="activeStep.inputType === 'art'"
              class="flex flex-col gap-3"
            >
              <label class="form-control">
                <span class="label-text font-bold">Character Art Prompt</span>

                <textarea
                  v-model="sheet.artPrompt"
                  class="textarea textarea-bordered min-h-36 rounded-2xl text-base"
                  placeholder="Portrait prompt, costume, mood, expression, visual style..."
                />
              </label>

              <art-builder
                purpose="character"
                :model-id="selectedCharacterId"
                :model-title="sheet.name"
                :prompt="sheet.artPrompt"
                image-role="portrait"
                @update="updateCharacterArt"
              />
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                class="btn btn-secondary rounded-xl"
                type="button"
                @click="suggestForActiveStep"
              >
                <Icon name="kind-icon:dice" class="h-4 w-4" />
                Suggest
              </button>

              <button
                v-if="activeStepIndex > 0"
                class="btn rounded-xl"
                type="button"
                @click="goPreviousStep"
              >
                <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
                Back
              </button>

              <button
                v-if="!isLastStep"
                class="btn btn-primary rounded-xl"
                type="button"
                @click="goNextStep"
              >
                <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
                Next
              </button>

              <button
                v-else
                class="btn btn-primary rounded-xl"
                type="button"
                @click="finishActiveCard"
              >
                <Icon name="kind-icon:check" class="h-4 w-4" />
                Add to Sheet
              </button>

              <button
                class="btn rounded-xl"
                type="button"
                @click="cancelActiveCard"
              >
                <Icon name="kind-icon:x" class="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>

          <div
            v-else
            class="mt-3 rounded-2xl border border-base-300 bg-base-100 p-4 text-sm text-base-content/70"
          >
            Pick a card from the bottom deck. The cards are friendly. Mostly.
          </div>
        </section>

        <section
          class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-4"
        >
          <h3
            class="flex items-center gap-2 text-lg font-bold text-base-content"
          >
            <Icon name="kind-icon:blueprint" class="h-5 w-5 text-primary" />
            Builder Notes
          </h3>

          <div class="mt-3 flex flex-col gap-3">
            <label class="form-control">
              <span class="label-text font-bold">Dream Context</span>

              <select
                v-model.number="selectedDreamId"
                class="select select-bordered rounded-2xl"
              >
                <option :value="0">No dream selected</option>

                <option
                  v-for="dream in dreamOptions"
                  :key="dream.id"
                  :value="dream.id"
                >
                  {{ dream.label }}
                </option>
              </select>
            </label>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <p
                class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
              >
                Save Status
              </p>

              <p class="mt-2 text-sm text-base-content/70">
                {{ saveStatus }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <p
                class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50"
              >
                Required Cards
              </p>

              <div class="mt-2 flex flex-col gap-2">
                <div
                  v-for="card in requiredCards"
                  :key="card.key"
                  class="flex items-center justify-between gap-2 text-sm"
                >
                  <span class="text-base-content/70">
                    {{ card.label }}
                  </span>

                  <Icon
                    :name="
                      completedCards[card.key]
                        ? 'kind-icon:check'
                        : 'kind-icon:circle'
                    "
                    :class="
                      completedCards[card.key]
                        ? 'h-4 w-4 text-success'
                        : 'h-4 w-4 text-base-content/30'
                    "
                  />
                </div>
              </div>
            </div>

            <p
              v-if="saveMessage"
              class="rounded-2xl border border-success/30 bg-success/10 p-3 text-sm text-success"
            >
              {{ saveMessage }}
            </p>

            <p
              v-if="saveError"
              class="rounded-2xl border border-error/30 bg-error/10 p-3 text-sm text-error"
            >
              {{ saveError }}
            </p>
          </div>
        </section>
      </aside>
    </div>

    <footer
      class="shrink-0 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm"
    >
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="card in visibleDeck"
          :key="card.key"
          class="group relative flex min-w-60 max-w-72 shrink-0 items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:bg-primary/10"
          :class="cardButtonClass(card)"
          type="button"
          @click="selectCard(card)"
        >
          <div class="absolute right-3 top-2 text-lg text-primary/30">
            {{ card.flourish }}
          </div>

          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-base-300 group-hover:bg-primary/20"
          >
            <Icon :name="card.icon" class="h-5 w-5 text-primary" />
          </div>

          <div class="min-w-0 pr-5">
            <p class="truncate text-sm font-black text-base-content">
              {{ card.title }}
            </p>

            <p class="line-clamp-2 text-xs text-base-content/60">
              {{ card.prompt }}
            </p>
          </div>
        </button>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Character, Dream, Reward } from '~/prisma/generated/prisma/client'
import { useUserStore } from '@/stores/userStore'
import { useRandomStore } from '@/stores/randomStore'
import { handleError, performFetch } from '@/stores/utils'
import type {
  CharacterRewardDraft as SheetCharacterRewardDraft,
  CharacterSheetDraft,
  RewardPromptSlot,
} from '@/stores/helpers/characterHelper'

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type SelectOption = {
  id: number
  label: string
}

type ArtCreatorPayload = {
  prompt?: string
  imagePath?: string | null
  artImageId?: number | null
  artImage?: {
    id: number
    imageData: string | null
    imagePath?: string | null
    path?: string | null
  } | null
}

type PerformFetchResult<T> = {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
}

type CharacterPromptInputType = 'short' | 'long' | 'stats' | 'reward' | 'art'

// Matches schema field names directly — no aliasing
type CharacterStringField =
  | 'name'
  | 'honorific'
  | 'title'
  | 'role'
  | 'genre'
  | 'species'
  | 'class' // schema: class
  | 'alignment'
  | 'gender' // schema: gender
  | 'presentation'
  | 'personality'
  | 'drive'
  | 'backstory'
  | 'achievements'
  | 'quirks'
  | 'artPrompt'

// Three skill slots — common, uncommon, rare
type RewardSlotKey = 'common-skill' | 'uncommon-skill' | 'rare-skill'

// Matches schema Rarity enum
type RarityTier =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC'

// Matches schema RewardType enum (we only assign SKILL here)
type RewardKind = 'SKILL' | 'ITEM' | 'TREASURE' | 'TITLE' | 'POWER' | 'STORY'

type CharacterPromptStep = {
  key: string
  title: string
  body: string
  inputLabel: string
  placeholder: string
  inputType: CharacterPromptInputType
  field?: CharacterStringField
}

type CharacterPromptCard = {
  key: string
  label: string
  title: string
  icon: string
  flourish: string
  prompt: string
  required?: boolean
  rewardSlotKey?: RewardSlotKey
  restoresFields: Array<keyof BuilderSheet | RewardSlotKey>
  unlockWhen?: () => boolean
  steps: CharacterPromptStep[]
}

type CharacterSheetStat = {
  key: string
  name: string
  value: number
}

type BuilderRewardSlot = RewardPromptSlot & {
  key: RewardSlotKey
  label: string
  description: string
  rewardType: RewardKind
  rarity: RarityTier
  icon: string
}

// Matches Reward schema — no rarityType field
type BuilderRewardDraft = SheetCharacterRewardDraft & {
  id: number | null
  slotKey: RewardSlotKey
  label: string
  text: string
  power: string
  collection: string
  rewardType: RewardKind
  rarity: RarityTier
  icon: string
  imagePath: string
  artImageId: number | null
  artPrompt: string
}

// Matches Character schema exactly — no grit, no skills, no inventory, no goalStats
type BuilderSheet = CharacterSheetDraft & {
  id: number | null
  name: string
  honorific: string
  title: string
  role: string
  genre: string
  species: string
  class: string // schema: class
  alignment: string
  gender: string // schema: gender
  presentation: string
  personality: string
  drive: string
  backstory: string
  achievements: string
  quirks: string
  artPrompt: string
  artImageId: number | null
  imagePath: string | null
  userId: number
  designer: string | null
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  stats: CharacterSheetStat[]
  rewards: BuilderRewardDraft[]
  // Schema Rarity fields — derived from stat block allocation
  luck: RarityTier
  might: RarityTier
  wits: RarityTier
  grace: RarityTier
  charm: RarityTier
  empathy: RarityTier
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHARACTER_ENDPOINT = '/api/character'
const REWARD_ENDPOINT = '/api/reward'

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

const userStore = useUserStore()
const randomStore = useRandomStore()

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const selectedCharacterId = ref<number | null>(null)
const selectedDreamId = ref(0)
const dreamOptions = ref<SelectOption[]>([])

const activeCard = ref<CharacterPromptCard | null>(null)
const activeStepIndex = ref(0)
const activeValue = ref('')
const selectedStatBlock = ref<number | null>(null)

const stagedValues = reactive<Record<string, string>>({})
const draftStats = reactive<CharacterSheetStat[]>([])
const completedCards = reactive<Record<string, boolean>>({})

const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const statBlocks = [1, 2, 3, 4, 5, 6]

const defaultRewardSlot: BuilderRewardSlot = {
  key: 'common-skill',
  label: 'Common Skill',
  description: 'A reliable character skill for everyday story problems.',
  rewardType: 'SKILL',
  rarity: 'COMMON',
  icon: 'kind-icon:bolt',
}

const rewardSlots = reactive<BuilderRewardSlot[]>(defaultRewardSlots())

const stagedReward = reactive<BuilderRewardDraft>(
  createEmptyRewardDraft(rewardSlots[0] ?? defaultRewardSlot),
)

const sheet = reactive<BuilderSheet>(
  createEmptyCharacterSheet(userStore.userId || 10),
)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const rewardSlotsForCharacterSheet = computed<RewardPromptSlot[]>(() => {
  return rewardSlots as unknown as RewardPromptSlot[]
})

const saveButtonLabel = computed(() =>
  selectedCharacterId.value ? 'Update Character' : 'Save Character',
)

const promptCards = computed<CharacterPromptCard[]>(() => [
  {
    key: 'role',
    label: 'Story Role',
    title: 'Choose their role',
    icon: 'kind-icon:mask',
    flourish: '⚜',
    prompt:
      'Decide what job they serve in the story, even if they immediately swerve out of it.',
    required: true,
    restoresFields: ['role', 'genre'],
    steps: [
      {
        key: 'role',
        title: 'Story Role',
        body: 'Are they a hero, rival, guide, menace, merchant, villain, or beautifully suspicious side character?',
        inputLabel: 'Character Role',
        placeholder: 'Companion, rival, guide, villain, quest giver...',
        inputType: 'short',
        field: 'role',
      },
      {
        key: 'genre',
        title: 'Genre Flavor',
        body: 'Give the character a genre or vibe. This helps the portrait and backstory stay on target.',
        inputLabel: 'Genre',
        placeholder: 'Gothic comedy, mythic sci-fi, cozy horror...',
        inputType: 'short',
        field: 'genre',
      },
    ],
  },
  {
    key: 'name',
    label: 'Name',
    title: 'Name the troublemaker',
    icon: 'kind-icon:signature',
    flourish: '✒',
    prompt:
      'Give them a name with history, bad timing, and excellent lighting.',
    required: true,
    restoresFields: ['name', 'honorific', 'title'],
    steps: [
      {
        key: 'name',
        title: 'Name',
        body: 'Name the character like they already owe someone a dramatic apology.',
        inputLabel: 'Name',
        placeholder: 'Mira Voss, Buttonwick, Saint Crumble...',
        inputType: 'short',
        field: 'name',
      },
      {
        key: 'honorific',
        title: 'Honorific',
        body: 'Give them a title, address, or tiny social costume.',
        inputLabel: 'Honorific',
        placeholder: 'adventurer, captain, oracle, auntie...',
        inputType: 'short',
        field: 'honorific',
      },
      {
        key: 'title',
        title: 'Title',
        body: 'Optional: add a formal title, rumor-name, or dramatic billing.',
        inputLabel: 'Title',
        placeholder: 'The Lantern of Wrong Tuesdays...',
        inputType: 'short',
        field: 'title',
      },
    ],
  },
  {
    key: 'origin',
    label: 'Origin',
    title: 'Choose species and calling',
    icon: 'kind-icon:species',
    flourish: '❦',
    prompt:
      'What are they, and what do they do when destiny starts knocking on the furniture?',
    required: true,
    restoresFields: ['species', 'class', 'alignment'], // schema field names
    steps: [
      {
        key: 'species',
        title: 'Species',
        body: 'Pick their people, species, origin, or technically complicated biology.',
        inputLabel: 'Species',
        placeholder: 'Human, goblin, ghost, moon-moth, clockwork saint...',
        inputType: 'short',
        field: 'species',
      },
      {
        key: 'characterClass', // step key (UI label key) — stagedValues uses this
        title: 'Class',
        body: 'Give them a class, job, archetype, or suspiciously specific life function.',
        inputLabel: 'Class',
        placeholder: 'Oracle, rogue, plague baker, haunted accountant...',
        inputType: 'short',
        field: 'class', // schema field
      },
      {
        key: 'alignment',
        title: 'Alignment',
        body: 'Choose their moral weather. It does not need to be official. It should be useful.',
        inputLabel: 'Alignment',
        placeholder: 'Chaotic Helpful, Lawful Petty, Neutral Dramatic...',
        inputType: 'short',
        field: 'alignment',
      },
    ],
  },
  {
    key: 'identity',
    label: 'Identity',
    title: 'Choose gender and presentation',
    icon: 'kind-icon:person',
    flourish: '☾',
    prompt:
      'How do they move through the world? Pick identity, presentation, and first impressions.',
    required: true,
    restoresFields: ['gender', 'presentation'], // schema field names
    steps: [
      {
        key: 'genderIdentity', // step key (UI label key)
        title: 'Gender Identity',
        body: 'Choose their gender identity. Keep it direct, respectful, and character-specific.',
        inputLabel: 'Gender Identity',
        placeholder: 'Woman, man, nonbinary, agender, unknown, fluid...',
        inputType: 'short',
        field: 'gender', // schema field
      },
      {
        key: 'presentation',
        title: 'Presentation',
        body: 'How do they present themselves visually and socially?',
        inputLabel: 'Presentation',
        placeholder: 'Glamorous, practical, masked, ceremonial, severe...',
        inputType: 'long',
        field: 'presentation',
      },
    ],
  },
  {
    key: 'personality',
    label: 'Personality',
    title: 'Give them a social operating system',
    icon: 'kind-icon:heart',
    flourish: '✦',
    prompt:
      'How do they talk, panic, charm, lie, sulk, flirt with danger, and avoid lessons?',
    required: true,
    restoresFields: ['personality', 'drive'],
    steps: [
      {
        key: 'personality',
        title: 'Personality',
        body: 'Describe how they behave when the plot starts chewing on the furniture.',
        inputLabel: 'Personality',
        placeholder: 'Warm but evasive. Brave until paperwork appears...',
        inputType: 'long',
        field: 'personality',
      },
      {
        key: 'drive',
        title: 'Drive',
        body: 'What do they want badly enough to make a questionable decision?',
        inputLabel: 'Drive',
        placeholder:
          'To recover a lost name, protect a sibling, overthrow brunch...',
        inputType: 'long',
        field: 'drive',
      },
    ],
  },
  {
    key: 'stats',
    label: 'Stats',
    title: 'Arrange their strengths',
    icon: 'kind-icon:activity',
    flourish: '♛',
    prompt:
      'Place 1 through 6 onto their stats. One tiny number. One heroic number.',
    required: true,
    restoresFields: ['stats'],
    steps: [
      {
        key: 'stats',
        title: 'Stats',
        body: 'Tap a number block, then tap a stat slot to assign it. Each number can only be used once.',
        inputLabel: 'Stats',
        placeholder: '',
        inputType: 'stats',
      },
    ],
  },
  {
    key: 'background',
    label: 'Backstory',
    title: 'Reveal the glorious problem',
    icon: 'kind-icon:story',
    flourish: '§',
    prompt:
      'What happened to them, what do they want, and what emotional furniture are they tripping over?',
    required: true,
    restoresFields: ['backstory', 'achievements', 'quirks'],
    steps: [
      {
        key: 'backstory',
        title: 'Backstory',
        body: 'Write the backstory. Include desire, trouble, history, and one excellent emotional bruise.',
        inputLabel: 'Backstory',
        placeholder: 'They were raised by...',
        inputType: 'long',
        field: 'backstory',
      },
      {
        key: 'achievements',
        title: 'Achievements',
        body: 'Add accomplishments, rumors, failures they keep rebranding, or titles earned the hard way.',
        inputLabel: 'Achievements',
        placeholder: 'Defeated the Tax Hydra, survived brunch with ghosts...',
        inputType: 'long',
        field: 'achievements',
      },
      {
        key: 'quirks',
        title: 'Quirks',
        body: 'Give them memorable habits. These are the details players quote later.',
        inputLabel: 'Quirks',
        placeholder: 'Apologizes to doors. Collects doomed spoons...',
        inputType: 'long',
        field: 'quirks',
      },
    ],
  },
  // Reward cards — SKILL only, three tiers
  {
    key: 'common-skill',
    label: 'Common Skill',
    title: 'Choose a reliable trick',
    icon: 'kind-icon:bolt',
    flourish: '✧',
    prompt:
      'A practical skill they can use often. Useful, flavorful, not universe-breaking.',
    required: true,
    rewardSlotKey: 'common-skill',
    restoresFields: ['common-skill'],
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'common-skill',
        title: 'Common Skill',
        body: 'Create a common skill — something they do reliably when the plot gets chewy.',
        inputLabel: 'Common Skill',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'uncommon-skill',
    label: 'Uncommon Skill',
    title: 'Choose a specialized edge',
    icon: 'kind-icon:comet',
    flourish: '✶',
    prompt: 'A more specific skill that shines in exactly the right moment.',
    required: true,
    rewardSlotKey: 'uncommon-skill',
    restoresFields: ['uncommon-skill'],
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'uncommon-skill',
        title: 'Uncommon Skill',
        body: 'Create an uncommon skill — situational, but memorable when it applies.',
        inputLabel: 'Uncommon Skill',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'rare-skill',
    label: 'Rare Skill',
    title: 'Choose their signature move',
    icon: 'kind-icon:sparkles',
    flourish: '❋',
    prompt:
      'One rare skill that earns a dramatic pause. The table should say "wait, you can do WHAT?"',
    required: true,
    rewardSlotKey: 'rare-skill',
    restoresFields: ['rare-skill'],
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'rare-skill',
        title: 'Rare Skill',
        body: 'Create a rare skill — the signature move that defines this character at the table.',
        inputLabel: 'Rare Skill',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'art',
    label: 'Portrait',
    title: 'Create their portrait',
    icon: 'kind-icon:palette',
    flourish: '▣',
    prompt:
      'Turn the sheet into a portrait prompt. Costume, expression, silhouette, mood, and drama.',
    restoresFields: ['artPrompt', 'imagePath', 'artImageId'],
    unlockWhen: () => canCreateArt.value,
    steps: [
      {
        key: 'art',
        title: 'Portrait Prompt',
        body: 'Build the visual prompt, then generate or select art for this character.',
        inputLabel: 'Art Prompt',
        placeholder: '',
        inputType: 'art',
      },
    ],
  },
])

const visibleDeck = computed(() => {
  return promptCards.value.filter((card) => {
    if (card.unlockWhen && !card.unlockWhen()) return false
    return !completedCards[card.key] || card.key === 'art'
  })
})

const requiredCards = computed(() =>
  promptCards.value.filter((card) => card.required),
)

const activeStep = computed(
  () => activeCard.value?.steps[activeStepIndex.value] ?? emptyStep,
)

const isLastStep = computed(() => {
  if (!activeCard.value) return true
  return activeStepIndex.value >= activeCard.value.steps.length - 1
})

const activeRewardSlot = computed(() => {
  if (!activeCard.value?.rewardSlotKey) return null
  return (
    rewardSlots.find((slot) => slot.key === activeCard.value?.rewardSlotKey) ??
    null
  )
})

const rewardSlotDescription = computed(() => {
  if (!activeRewardSlot.value) return 'Create a skill.'
  return `${activeRewardSlot.value.rarity} SKILL — ${activeRewardSlot.value.description}`
})

const usedDraftStatBlocks = computed(() =>
  draftStats
    .map((stat) => stat.value)
    .filter((value) => statBlocks.includes(value)),
)

const canChooseRewards = computed(() =>
  [
    'role',
    'name',
    'origin',
    'identity',
    'personality',
    'stats',
    'background',
  ].every((key) => completedCards[key]),
)

const canCreateArt = computed(() =>
  [
    'role',
    'name',
    'origin',
    'identity',
    'personality',
    'stats',
    'background',
    'common-skill',
    'uncommon-skill',
    'rare-skill',
  ].every((key) => completedCards[key]),
)

const canSave = computed(() => Boolean(sheet.name.trim()) && canCreateArt.value)

const saveStatus = computed(() => {
  if (selectedCharacterId.value) {
    return `Saved as character #${selectedCharacterId.value}. Tiny legend notarized.`
  }
  if (!canSave.value) {
    return 'Finish identity, stats, background, and the three skill cards before saving.'
  }
  return 'Ready to save.'
})

const selectedDreamLabel = computed(
  () =>
    dreamOptions.value.find((dream) => dream.id === selectedDreamId.value)
      ?.label || '',
)

// Reward skills text — used for art prompt context
const rewardSkillsText = computed(() =>
  sheet.rewards.map((reward) => `${reward.label}: ${reward.power}`).join('\n'),
)

// ---------------------------------------------------------------------------
// Sentinel
// ---------------------------------------------------------------------------

const emptyStep: CharacterPromptStep = {
  key: 'empty',
  title: '',
  body: '',
  inputLabel: '',
  placeholder: '',
  inputType: 'short',
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

function defaultCharacterStats(): CharacterSheetStat[] {
  return [
    { key: 'luck', name: 'Luck', value: 0 },
    { key: 'swol', name: 'Swol', value: 0 },
    { key: 'wits', name: 'Wits', value: 0 },
    { key: 'flexibility', name: 'Flexibility', value: 0 },
    { key: 'rizz', name: 'Rizz', value: 0 },
    { key: 'empathy', name: 'Empathy', value: 0 },
  ]
}

function defaultRewardSlots(): BuilderRewardSlot[] {
  return [
    {
      key: 'common-skill',
      label: 'Common Skill',
      description: 'A reliable skill for everyday story problems.',
      rewardType: 'SKILL',
      rarity: 'COMMON',
      icon: 'kind-icon:bolt',
    },
    {
      key: 'uncommon-skill',
      label: 'Uncommon Skill',
      description: 'A specialized edge that surprises when it lands.',
      rewardType: 'SKILL',
      rarity: 'UNCOMMON',
      icon: 'kind-icon:comet',
    },
    {
      key: 'rare-skill',
      label: 'Rare Skill',
      description: 'The signature move that earns a dramatic pause.',
      rewardType: 'SKILL',
      rarity: 'RARE',
      icon: 'kind-icon:sparkles',
    },
  ]
}

function createEmptyRewardDraft(slot: BuilderRewardSlot): BuilderRewardDraft {
  return {
    id: null,
    slotKey: slot.key,
    label: '',
    text: '',
    power: '',
    collection: 'starting-character-reward',
    rewardType: slot.rewardType,
    rarity: slot.rarity,
    icon: slot.icon,
    imagePath: '',
    artImageId: null,
    artPrompt: '',
  } as BuilderRewardDraft
}

function createEmptyCharacterSheet(userId: number): BuilderSheet {
  return {
    id: null,
    name: '',
    honorific: 'adventurer',
    title: '',
    role: '',
    genre: '',
    species: '',
    class: '', // schema: class
    alignment: '',
    gender: '', // schema: gender
    presentation: '',
    personality: '',
    drive: '',
    backstory: '',
    achievements: '',
    quirks: '',
    artPrompt: '',
    artImageId: null,
    imagePath: null,
    userId,
    designer: null,
    isPublic: true,
    isMature: false,
    isActive: true,
    stats: defaultCharacterStats(),
    rewards: [],
    luck: 'COMMON',
    might: 'COMMON',
    wits: 'COMMON',
    grace: 'COMMON',
    charm: 'COMMON',
    empathy: 'COMMON',
  } as BuilderSheet
}

// ---------------------------------------------------------------------------
// Stat tier helpers
// ---------------------------------------------------------------------------

function statTierByValue(value: number): RarityTier {
  if (value >= 6) return 'MYTHIC'
  if (value === 5) return 'LEGENDARY'
  if (value === 4) return 'EPIC'
  if (value === 3) return 'RARE'
  if (value === 2) return 'UNCOMMON'
  return 'COMMON'
}

function statTierByKey(key: string): RarityTier {
  return statTierByValue(
    sheet.stats.find((stat) => stat.key === key)?.value ?? 0,
  )
}

function syncSheetStatTiers() {
  sheet.luck = statTierByKey('luck')
  sheet.might = statTierByKey('swol')
  sheet.wits = statTierByKey('wits')
  sheet.grace = statTierByKey('flexibility')
  sheet.charm = statTierByKey('rizz')
  sheet.empathy = statTierByKey('empathy')
}

// ---------------------------------------------------------------------------
// Card selection
// ---------------------------------------------------------------------------

function selectCardByKey(key: string) {
  if (key === 'identity-group') return
  const card = promptCards.value.find((item) => item.key === key)
  if (!card) return
  if (card.unlockWhen && !card.unlockWhen()) return
  selectCard(card)
}

function selectCard(card: CharacterPromptCard) {
  activeCard.value = card
  activeStepIndex.value = 0
  selectedStatBlock.value = null
  resetStaging()
  prepareCardStage(card)
  loadActiveStepValue()
}

function prepareCardStage(card: CharacterPromptCard) {
  for (const step of card.steps) {
    if (step.field && typeof sheet[step.field] === 'string') {
      stagedValues[step.key] = String(sheet[step.field] || '')
    }
  }

  if (card.key === 'stats') {
    resetStatRows(
      draftStats,
      sheet.stats.map((stat) => ({ ...stat })),
    )
  }

  if (card.rewardSlotKey) {
    const slot = rewardSlots.find((item) => item.key === card.rewardSlotKey)
    const existing = sheet.rewards.find(
      (reward) => reward.slotKey === card.rewardSlotKey,
    )
    if (existing) {
      Object.assign(stagedReward, existing)
    } else if (slot) {
      Object.assign(stagedReward, createEmptyRewardDraft(slot))
    }
  }

  if (card.key === 'art') {
    buildArtPrompt()
  }
}

function loadActiveStepValue() {
  activeValue.value = stagedValues[activeStep.value.key] || ''
}

function commitActiveStepValue() {
  if (
    activeStep.value.inputType !== 'short' &&
    activeStep.value.inputType !== 'long'
  ) {
    return
  }
  stagedValues[activeStep.value.key] = activeValue.value.trim()
}

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------

function goNextStep() {
  commitActiveStepValue()
  if (!activeCard.value) return
  if (activeStepIndex.value >= activeCard.value.steps.length - 1) return
  activeStepIndex.value += 1
  loadActiveStepValue()
}

function goPreviousStep() {
  commitActiveStepValue()
  if (activeStepIndex.value <= 0) return
  activeStepIndex.value -= 1
  loadActiveStepValue()
}

function finishActiveCard() {
  commitActiveStepValue()
  if (!activeCard.value) return

  if (activeCard.value.key === 'stats') {
    if (!isStatAllocationComplete()) {
      saveError.value =
        'Assign each stat a unique value from 1 to 6 before adding it to the sheet.'
      return
    }
    resetStatRows(
      sheet.stats,
      draftStats.map((stat) => ({ ...stat })),
    )
    syncSheetStatTiers()
    completeCard('stats')
    closeCardAndChooseNext()
    return
  }

  if (activeCard.value.rewardSlotKey) {
    commitRewardCard(activeCard.value.rewardSlotKey)
    completeCard(activeCard.value.key)
    closeCardAndChooseNext()
    return
  }

  if (activeCard.value.key === 'art') {
    completedCards.art = Boolean(
      sheet.artPrompt.trim() || sheet.imagePath || sheet.artImageId,
    )
    closeCardAndChooseNext()
    return
  }

  for (const step of activeCard.value.steps) {
    if (!step.field) continue
    if (typeof sheet[step.field] !== 'string') continue
    ;(sheet[step.field] as string) = stagedValues[step.key] || ''
  }

  completeCard(activeCard.value.key)
  buildArtPrompt()
  closeCardAndChooseNext()
}

function cancelActiveCard() {
  activeCard.value = null
  activeStepIndex.value = 0
  activeValue.value = ''
  selectedStatBlock.value = null
  resetStaging()
}

function closeCardAndChooseNext() {
  const previousKey = activeCard.value?.key

  activeCard.value = null
  activeStepIndex.value = 0
  activeValue.value = ''
  selectedStatBlock.value = null
  resetStaging()

  const next =
    visibleDeck.value.find((card) => card.key !== previousKey) || null
  if (next) {
    selectCard(next)
  }
}

function completeCard(key: string) {
  completedCards[key] = true
  saveError.value = ''
}

// ---------------------------------------------------------------------------
// Section / reward removal
// ---------------------------------------------------------------------------

function removeSheetSection(key: string) {
  if (key === 'identity-group') {
    removeSheetSection('role')
    removeSheetSection('name')
    removeSheetSection('origin')
    removeSheetSection('identity')
    return
  }

  const card = promptCards.value.find((item) => item.key === key)
  if (!card) return

  for (const field of card.restoresFields) {
    if (isRewardSlotKey(field)) {
      removeRewardSlot(field)
      continue
    }
    clearSheetField(field)
  }

  completedCards[card.key] = false
  if (activeCard.value?.key === card.key) {
    cancelActiveCard()
  }
}

function removeRewardSlot(slotKey: string) {
  if (!isRewardSlotKey(slotKey)) return
  const index = sheet.rewards.findIndex((reward) => reward.slotKey === slotKey)
  if (index >= 0) {
    sheet.rewards.splice(index, 1)
  }
  completedCards[slotKey] = false
}

function clearSheetField(field: keyof BuilderSheet) {
  if (field === 'stats') {
    resetStatRows(sheet.stats, defaultCharacterStats())
    syncSheetStatTiers()
    return
  }

  if (field === 'rewards') {
    sheet.rewards.splice(0, sheet.rewards.length)
    return
  }

  if (field === 'imagePath') {
    sheet.imagePath = null
    return
  }

  if (field === 'artImageId') {
    sheet.artImageId = null
    return
  }

  if (field === 'id') {
    sheet.id = null
    selectedCharacterId.value = null
    return
  }

  if (field === 'userId') {
    sheet.userId = userStore.userId || 10
    return
  }

  if (field === 'designer') {
    sheet.designer = getDesignerName()
    return
  }

  if (field === 'isPublic') {
    sheet.isPublic = true
    return
  }
  if (field === 'isMature') {
    sheet.isMature = false
    return
  }
  if (field === 'isActive') {
    sheet.isActive = true
    return
  }

  if (
    field === 'luck' ||
    field === 'might' ||
    field === 'wits' ||
    field === 'grace' ||
    field === 'charm' ||
    field === 'empathy'
  ) {
    sheet[field] = 'COMMON'
    return
  }

  if (typeof sheet[field] === 'string') {
    ;(sheet[field] as string) = field === 'honorific' ? 'adventurer' : ''
  }
}

// ---------------------------------------------------------------------------
// Deck
// ---------------------------------------------------------------------------

function reshuffleDeck() {
  const available = [...visibleDeck.value]
  const next = available[Math.floor(Math.random() * available.length)] || null
  if (next) {
    selectCard(next)
  }
}

// ---------------------------------------------------------------------------
// Suggestions
// ---------------------------------------------------------------------------

function suggestForActiveStep() {
  if (!activeCard.value) return

  const stepKey = activeStep.value.key
  const cardKey = activeCard.value.key

  if (stepKey === 'role') activeValue.value = rollFrom('role', 'companion')
  else if (stepKey === 'genre')
    activeValue.value = rollFrom('genre', 'gothic comedy')
  else if (stepKey === 'name') activeValue.value = rollFrom('name', 'Mira Voss')
  else if (stepKey === 'honorific')
    activeValue.value = rollFrom('honorific', 'adventurer')
  else if (stepKey === 'title')
    activeValue.value = rollFrom('title', 'The Lantern of Wrong Tuesdays')
  else if (stepKey === 'species')
    activeValue.value = rollFrom('species', 'Moon-Moth Human')
  else if (stepKey === 'characterClass')
    activeValue.value = rollFrom('class', 'Oracle')
  else if (stepKey === 'alignment') {
    activeValue.value = `${rollFrom('adjective', 'Chaotic')} ${rollFrom('personality', 'Helpful')}`
  } else if (stepKey === 'genderIdentity')
    activeValue.value = rollFrom('gender', 'unknown')
  else if (stepKey === 'presentation')
    activeValue.value = rollFrom(
      'presentation',
      'ceremonial and slightly dangerous',
    )
  else if (stepKey === 'personality')
    activeValue.value = rollFrom(
      'personality',
      'Warm, theatrical, and allergic to simple answers.',
    )
  else if (stepKey === 'drive')
    activeValue.value = rollFrom(
      'drive',
      'to recover something everyone else insists was never lost',
    )
  else if (stepKey === 'backstory') activeValue.value = buildBackstoryText()
  else if (stepKey === 'achievements')
    activeValue.value = rollFrom(
      'achievement',
      'Survived a duel with a polite ghost.',
    )
  else if (stepKey === 'quirks') {
    activeValue.value = [
      rollFrom('quirk', 'apologizes to furniture'),
      rollFrom('quirk', 'counts exits before compliments'),
    ].join(', ')
  } else if (activeStep.value.inputType === 'stats') rollStats()
  else if (activeStep.value.inputType === 'reward') rollReward(cardKey)
  else if (activeStep.value.inputType === 'art') buildArtPrompt()
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

function assignSelectedStat(statKey: string) {
  if (!selectedStatBlock.value) return

  const target = draftStats.find((stat) => stat.key === statKey)
  if (!target) return

  // Unassign this block from any other slot
  for (const stat of draftStats) {
    if (stat.key !== statKey && stat.value === selectedStatBlock.value) {
      stat.value = 0
    }
  }

  target.value = selectedStatBlock.value
  selectedStatBlock.value = null
}

function isStatAllocationComplete() {
  const values = draftStats.map((stat) => stat.value).sort((a, b) => a - b)
  return values.join(',') === statBlocks.join(',')
}

function rollStats() {
  const shuffled = [...statBlocks].sort(() => Math.random() - 0.5)
  draftStats.forEach((stat, index) => {
    stat.value = shuffled[index] ?? 0
  })
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

function commitRewardCard(slotKey: RewardSlotKey) {
  const slot = rewardSlots.find((item) => item.key === slotKey)
  if (!slot) return

  const reward: BuilderRewardDraft = {
    id: stagedReward.id,
    slotKey,
    label: stagedReward.label.trim() || slot.label,
    text:
      stagedReward.text.trim() ||
      `${slot.label} for ${sheet.name || 'this character'}.`,
    power:
      stagedReward.power.trim() ||
      'Provides a useful advantage when the story calls for it.',
    collection: 'starting-character-reward',
    rewardType: 'SKILL',
    rarity: slot.rarity,
    icon: stagedReward.icon.trim() || slot.icon,
    imagePath: stagedReward.imagePath.trim(),
    artImageId: stagedReward.artImageId,
    artPrompt: stagedReward.artPrompt.trim(),
  } as BuilderRewardDraft

  const index = sheet.rewards.findIndex((item) => item.slotKey === slotKey)
  if (index >= 0) {
    sheet.rewards.splice(index, 1, reward)
  } else {
    sheet.rewards.push(reward)
  }
}

function rollReward(cardKey: string) {
  if (!isRewardSlotKey(cardKey)) return

  const slot = rewardSlots.find((item) => item.key === cardKey)
  if (!slot) return

  const fallbacks: Record<RewardSlotKey, string> = {
    'common-skill': 'Pocket Sand Theology',
    'uncommon-skill': 'Borrowed Conviction',
    'rare-skill': 'Moonlit Counterspell',
  }

  stagedReward.label = rollFrom('reward', fallbacks[slot.key])
  stagedReward.text = `A ${slot.rarity.toLowerCase()} skill that lets ${
    sheet.name || 'this character'
  } turn pressure into possibility.`
  stagedReward.power =
    'Gain an advantage when this skill directly applies to a risky scene.'
  stagedReward.icon = slot.icon
  stagedReward.artPrompt = buildRewardArtPrompt(slot, stagedReward.label)
}

// ---------------------------------------------------------------------------
// Text builders
// ---------------------------------------------------------------------------

function buildBackstoryText() {
  return [
    sheet.name
      ? `${sheet.name} is ${articleFor(
          stagedValues.species || sheet.species,
        )} ${stagedValues.species || sheet.species || 'mysterious being'}.`
      : '',
    stagedValues.characterClass || sheet.class
      ? `They are known as a ${stagedValues.characterClass || sheet.class}.`
      : '',
    stagedValues.role || sheet.role
      ? `Their role in the story is ${stagedValues.role || sheet.role}.`
      : '',
    stagedValues.drive || sheet.drive
      ? `They want ${stagedValues.drive || sheet.drive}.`
      : '',
    stagedValues.personality || sheet.personality
      ? `Personality: ${stagedValues.personality || sheet.personality}`
      : '',
    selectedDreamLabel.value
      ? `They are connected to ${selectedDreamLabel.value}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildArtPrompt() {
  const skillsText = sheet.rewards
    .map((reward) => `${reward.rarity.toLowerCase()} skill: ${reward.label}`)
    .join(', ')

  sheet.artPrompt = [
    `Character portrait of ${sheet.name || 'an unnamed character'}`,
    sheet.species,
    sheet.class, // schema: class
    sheet.presentation,
    sheet.personality,
    sheet.genre,
    skillsText ? `starting skills: ${skillsText}` : '',
    sheet.backstory ? `story context: ${sheet.backstory}` : '',
    'expressive face, strong silhouette, detailed costume, vivid narrative design',
  ]
    .filter(Boolean)
    .join(', ')
}

function buildRewardArtPrompt(slot: BuilderRewardSlot, label: string) {
  return [
    `${slot.rarity.toLowerCase()} skill`,
    label,
    'iconic fantasy game asset',
    'clear silhouette',
    'ornate but readable',
    'transparent background friendly',
  ].join(', ')
}

// ---------------------------------------------------------------------------
// Art update callback
// ---------------------------------------------------------------------------

function updateCharacterArt(payload: ArtCreatorPayload) {
  sheet.artPrompt = payload.prompt || sheet.artPrompt
  sheet.imagePath =
    payload.imagePath ||
    payload.artImage?.imagePath ||
    payload.artImage?.path ||
    sheet.imagePath
  sheet.artImageId =
    payload.artImageId || payload.artImage?.id || sheet.artImageId

  completedCards.art = Boolean(
    sheet.artPrompt.trim() || sheet.imagePath || sheet.artImageId,
  )
}
// ---------------------------------------------------------------------------
// Save
// ---------------------------------------------------------------------------

async function saveCharacter() {
  if (!canSave.value) {
    saveError.value =
      'Finish identity, stats, background, and all three skill cards before saving.'
    return
  }

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    const savedRewards = await saveRewardDrafts()

    const body: Record<string, unknown> = {
      // Identity — schema field names used directly
      name: sheet.name.trim(),
      honorific: sheet.honorific.trim() || 'adventurer',
      title: sheet.title.trim() || null,
      role: sheet.role.trim() || null,
      gender: sheet.gender.trim() || null, // schema: gender
      presentation: sheet.presentation.trim() || null,
      achievements: sheet.achievements.trim() || null,
      alignment: sheet.alignment.trim() || null,
      class: sheet.class.trim() || null, // schema: class
      species: sheet.species.trim() || null,
      genre: sheet.genre.trim() || null,
      // Narrative
      backstory: sheet.backstory.trim() || null,
      drive: sheet.drive.trim() || null,
      quirks: sheet.quirks.trim() || null,
      personality: sheet.personality.trim() || null,
      // Art
      artPrompt: sheet.artPrompt.trim() || null,
      artImageId: sheet.artImageId || null,
      imagePath: sheet.imagePath || null,
      // Progression
      experience: 0,
      level: 1,
      // Rarity stat tiers — derived from block allocation
      luck: sheet.luck,
      might: sheet.might,
      wits: sheet.wits,
      grace: sheet.grace,
      charm: sheet.charm,
      empathy: sheet.empathy,
      // Meta
      userId: sheet.userId || userStore.userId || 10,
      designer: sheet.designer || getDesignerName(),
      isPublic: sheet.isPublic,
      isMature: sheet.isMature,
      isActive: sheet.isActive,
      // Linked rewards
      rewardIds: savedRewards.map((reward) => reward.id).filter(Boolean),
    }

    if (selectedDreamId.value) {
      body.dreamIds = [selectedDreamId.value]
    }

    const method = sheet.id ? 'PATCH' : 'POST'
    const endpoint = sheet.id
      ? `${CHARACTER_ENDPOINT}/${sheet.id}`
      : CHARACTER_ENDPOINT

    const response = (await performFetch<Character>(endpoint, {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Character>

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to save character.')
    }

    sheet.id = response.data.id
    selectedCharacterId.value = response.data.id
    saveMessage.value = `Saved character #${response.data.id}. Plot goblin successfully released.`
  } catch (error) {
    handleError(error, 'saving character from character-builder')
    saveError.value =
      error instanceof Error ? error.message : 'Failed to save character.'
  } finally {
    isSaving.value = false
  }
}

async function saveRewardDrafts() {
  const savedRewards: Reward[] = []

  for (const draft of sheet.rewards) {
    if (draft.id) {
      savedRewards.push(draft as unknown as Reward)
      continue
    }

    const body: Record<string, unknown> = {
      label: draft.label,
      text: draft.text,
      power: draft.power,
      collection: draft.collection || 'starting-character-reward',
      rarity: draft.rarity, // schema: rarity — no rarityType
      rewardType: 'SKILL', // always SKILL for character skills
      icon: draft.icon || fallbackRewardIcon(draft),
      imagePath: draft.imagePath || null,
      artImageId: draft.artImageId || null,
      artPrompt: draft.artPrompt || null,
      userId: sheet.userId || userStore.userId || 10,
      isPublic: true,
      isMature: false,
      isActive: true,
    }

    const response = (await performFetch<Reward>(REWARD_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Reward>

    if (!response.success || !response.data) {
      throw new Error(
        response.message || `Failed to save reward: ${draft.label}`,
      )
    }

    draft.id = response.data.id
    savedRewards.push(response.data)
  }

  return savedRewards
}

// ---------------------------------------------------------------------------
// Dream fetch
// ---------------------------------------------------------------------------

async function fetchDreams() {
  try {
    const response = (await performFetch<Dream[]>(
      '/api/dream',
    )) as PerformFetchResult<Dream[]>

    if (!response.success || !Array.isArray(response.data)) {
      dreamOptions.value = []
      return
    }

    dreamOptions.value = response.data
      .filter((dream) => dream && dream.id)
      .map((dream) => ({
        id: dream.id,
        label: dream.title || `Dream #${dream.id}`,
      }))
  } catch (error) {
    handleError(error, 'fetching dreams for character-builder')
    dreamOptions.value = []
  }
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

function resetBuilder() {
  selectedCharacterId.value = null
  selectedDreamId.value = 0
  activeCard.value = null
  activeStepIndex.value = 0
  activeValue.value = ''
  selectedStatBlock.value = null
  saveMessage.value = ''
  saveError.value = ''

  for (const key of Object.keys(completedCards)) {
    delete completedCards[key]
  }

  const fresh = createEmptyCharacterSheet(userStore.userId || 10)

  sheet.id = fresh.id
  sheet.name = fresh.name
  sheet.honorific = fresh.honorific
  sheet.title = fresh.title
  sheet.role = fresh.role
  sheet.genre = fresh.genre
  sheet.species = fresh.species
  sheet.class = fresh.class // schema: class
  sheet.alignment = fresh.alignment
  sheet.gender = fresh.gender // schema: gender
  sheet.presentation = fresh.presentation
  sheet.personality = fresh.personality
  sheet.drive = fresh.drive
  sheet.backstory = fresh.backstory
  sheet.achievements = fresh.achievements
  sheet.quirks = fresh.quirks
  sheet.artPrompt = fresh.artPrompt
  sheet.artImageId = fresh.artImageId
  sheet.imagePath = fresh.imagePath
  sheet.userId = fresh.userId
  sheet.designer = getDesignerName()
  sheet.isPublic = fresh.isPublic
  sheet.isMature = fresh.isMature
  sheet.isActive = fresh.isActive
  sheet.luck = fresh.luck
  sheet.might = fresh.might
  sheet.wits = fresh.wits
  sheet.grace = fresh.grace
  sheet.charm = fresh.charm
  sheet.empathy = fresh.empathy

  resetStatRows(sheet.stats, fresh.stats)
  sheet.rewards.splice(0, sheet.rewards.length)

  resetStaging()
  reshuffleDeck()
}

function resetStaging() {
  for (const key of Object.keys(stagedValues)) {
    delete stagedValues[key]
  }
  resetStatRows(draftStats, [])
  Object.assign(
    stagedReward,
    createEmptyRewardDraft(rewardSlots[0] ?? defaultRewardSlot),
  )
}

function resetStatRows(
  target: CharacterSheetStat[],
  defaults: CharacterSheetStat[],
) {
  target.splice(0, target.length, ...defaults)
}

// ---------------------------------------------------------------------------
// Guards and helpers
// ---------------------------------------------------------------------------

function isRewardSlotKey(value: unknown): value is RewardSlotKey {
  return (
    typeof value === 'string' && rewardSlots.some((slot) => slot.key === value)
  )
}

function fallbackRewardIcon(draft: BuilderRewardDraft) {
  if (draft.rarity === 'RARE') return 'kind-icon:sparkles'
  if (draft.rarity === 'UNCOMMON') return 'kind-icon:comet'
  return 'kind-icon:bolt'
}

function rollFrom(key: string, fallback: string) {
  try {
    return randomStore.getRandom(key, 1)[0] || fallback
  } catch {
    return fallback
  }
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function articleFor(value: string) {
  const first = (value || '').trim().charAt(0).toLowerCase()
  return ['a', 'e', 'i', 'o', 'u'].includes(first) ? 'an' : 'a'
}

function getDesignerName() {
  const store = userStore as unknown as {
    designer?: string
    designerName?: string
    username?: string
  }
  return store.designer || store.designerName || store.username || null
}

function cardButtonClass(card: CharacterPromptCard) {
  if (activeCard.value?.key === card.key) {
    return 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
  }
  if (completedCards[card.key]) {
    return 'border-success/40 bg-success/10'
  }
  return 'border-base-300 bg-base-100'
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(async () => {
  randomStore.initialize()
  sheet.userId = userStore.userId || 10
  sheet.designer = getDesignerName()
  syncSheetStatTiers()
  await fetchDreams()
  reshuffleDeck()
})
</script>
