<!-- /components/builders/character-builder.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="min-w-0">
        <h2 class="flex items-center gap-2 text-2xl font-black text-base-content">
          <Icon name="kind-icon:mask" class="h-7 w-7 text-primary" />
          Character Builder
        </h2>

        <p class="mt-1 max-w-3xl text-sm text-base-content/70">
          Build a character by playing prompt cards. Finish a card to place it on the sheet. Remove a sheet entry to restore its card. Elegant little goblin loop.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          class="btn rounded-xl"
          type="button"
          @click="reshuffleDeck"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Reshuffle
        </button>

        <button
          class="btn rounded-xl"
          type="button"
          @click="resetBuilder"
        >
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
          {{ isSaving ? 'Saving...' : 'Save Character' }}
        </button>
      </div>
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[1fr_25rem]">
      <character-sheet
        :sheet="sheet"
        @remove-section="removeSheetSection"
        @remove-reward="removeRewardSlot"
      />

      <aside class="flex min-h-0 flex-col gap-3">
        <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-lg font-bold text-base-content">
            <Icon name="kind-icon:cards" class="h-5 w-5 text-primary" />
            Active Prompt
          </h3>

          <div
            v-if="activeCard"
            class="mt-3 flex flex-col gap-3"
          >
            <div class="rounded-2xl border border-primary/30 bg-primary/10 p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    {{ activeCard.label }}
                  </p>

                  <h4 class="mt-2 text-xl font-black text-base-content">
                    {{ activeCard.title }}
                  </h4>
                </div>

                <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-base-100 text-xl text-primary">
                  {{ activeCard.flourish }}
                </div>
              </div>

              <p class="mt-2 text-sm text-base-content/70">
                {{ activeStep.body }}
              </p>

              <div
                v-if="activeCard.steps.length > 1"
                class="mt-3 flex gap-1"
              >
                <span
                  v-for="step in activeCard.steps"
                  :key="step.key"
                  class="h-2 flex-1 rounded-full"
                  :class="step.key === activeStep.key ? 'bg-primary' : 'bg-base-300'"
                />
              </div>
            </div>

            <label
              v-if="activeStep.inputType === 'short'"
              class="form-control"
            >
              <span class="label-text font-bold">{{ activeStep.inputLabel }}</span>

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
              <span class="label-text font-bold">{{ activeStep.inputLabel }}</span>

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
                Drag or tap a number block, then choose a stat slot. Each number can only be used once.
              </p>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="block in statBlocks"
                  :key="block"
                  class="btn btn-sm rounded-xl"
                  :class="selectedStatBlock === block ? 'btn-primary' : 'btn-outline'"
                  type="button"
                  :disabled="usedStatBlocks.includes(block) && selectedStatBlock !== block"
                  draggable="true"
                  @click="selectedStatBlock = block"
                  @dragstart="startStatDrag(block)"
                >
                  {{ block }}
                </button>
              </div>

              <div class="grid grid-cols-1 gap-2">
                <button
                  v-for="stat in sheet.stats"
                  :key="stat.key"
                  class="grid grid-cols-[1fr_4rem] items-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-left transition hover:border-primary hover:bg-primary/10"
                  type="button"
                  @click="assignSelectedStat(stat.key)"
                  @dragover.prevent
                  @drop="dropStatBlock(stat.key)"
                >
                  <input
                    v-model="stat.name"
                    class="input input-bordered rounded-2xl"
                    type="text"
                    @click.stop
                  />

                  <span class="flex h-11 items-center justify-center rounded-2xl bg-base-300 text-xl font-black text-primary">
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
                <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                  {{ activeRewardSlot?.label || 'Reward' }}
                </p>

                <p class="mt-1 text-sm text-base-content/70">
                  {{ rewardSlotDescription }}
                </p>
              </div>

              <label class="form-control">
                <span class="label-text font-bold">Reward Name</span>

                <input
                  v-model="stagedReward.label"
                  class="input input-bordered rounded-2xl"
                  type="text"
                  placeholder="Moonlit Counterspell, Apology Dagger..."
                />
              </label>

              <label class="form-control">
                <span class="label-text font-bold">Flavor Text</span>

                <textarea
                  v-model="stagedReward.text"
                  class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
                  placeholder="What this reward is, how it feels, and why the character keeps reaching for it."
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
                    placeholder="/images/reward.webp"
                  />
                </label>
              </div>

              <label class="form-control">
                <span class="label-text font-bold">Art Prompt</span>

                <textarea
                  v-model="stagedReward.artPrompt"
                  class="textarea textarea-bordered min-h-24 rounded-2xl text-base"
                  placeholder="Optional image prompt for later reward art."
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

              <art-creator
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
                @click="rollActiveCard"
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

        <section class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-4">
          <h3 class="flex items-center gap-2 text-lg font-bold text-base-content">
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
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
                Save Status
              </p>

              <p class="mt-2 text-sm text-base-content/70">
                {{ saveStatus }}
              </p>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
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
                    :name="completedCards[card.key] ? 'kind-icon:check' : 'kind-icon:circle'"
                    :class="completedCards[card.key] ? 'h-4 w-4 text-success' : 'h-4 w-4 text-base-content/30'"
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

    <footer class="shrink-0 rounded-2xl border border-base-300 bg-base-200 p-2">
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

          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-base-300 group-hover:bg-primary/20">
            <Icon
              :name="card.icon"
              class="h-5 w-5 text-primary"
            />
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
  CharacterSheetDraft,
  CharacterSheetStat,
} from '@/components/builders/character-sheet.vue'

type SelectOption = {
  id: number
  label: string
}

type PromptInputType = 'short' | 'long' | 'stats' | 'reward' | 'art'

type RewardTypeValue = 'SKILL' | 'ITEM'
type RewardRarityValue = 'COMMON' | 'RARE'

type RewardSlotKey =
  | 'common-skill'
  | 'rare-skill'
  | 'common-item'
  | 'rare-item'

type RewardPromptSlot = {
  key: RewardSlotKey
  label: string
  rewardType: RewardTypeValue
  rarityType: RewardRarityValue
  rarity: number
  icon: string
}

type RewardDraft = {
  slotKey: RewardSlotKey
  label: string
  text: string
  power: string
  collection: string
  rewardType: RewardTypeValue
  rarityType: RewardRarityValue
  rarity: number
  icon: string
  imagePath: string
  artImageId: number | null
  artPrompt: string
  id?: number
}

type BuilderCharacterSheetDraft = CharacterSheetDraft & {
  rewards: RewardDraft[]
}

type CharacterPromptStep = {
  key: string
  title: string
  body: string
  inputLabel: string
  placeholder: string
  inputType: PromptInputType
  field?: keyof BuilderCharacterSheetDraft
}

type CharacterPromptCard = {
  key: string
  label: string
  title: string
  icon: string
  flourish: string
  prompt: string
  restoresFields: Array<keyof BuilderCharacterSheetDraft | RewardSlotKey>
  steps: CharacterPromptStep[]
  required?: boolean
  rewardSlotKey?: RewardSlotKey
  unlockWhen?: () => boolean
}

type ArtCreatorPayload = {
  purpose: string
  modelId: number | null
  modelTitle: string
  prompt: string
  negativePrompt?: string
  imageRole: string
  imagePath?: string | null
  artImageId?: number | null
}

type PerformFetchResult<T> = {
  success: boolean
  data?: T
  message?: string
  statusCode?: number
}

const CHARACTER_ENDPOINT = '/api/character'
const REWARD_ENDPOINT = '/api/reward'

const userStore = useUserStore()
const randomStore = useRandomStore()

const selectedCharacterId = ref<number | null>(null)
const selectedDreamId = ref(0)
const dreamOptions = ref<SelectOption[]>([])

const activeCard = ref<CharacterPromptCard | null>(null)
const activeStepIndex = ref(0)
const activeValue = ref('')
const selectedStatBlock = ref<number | null>(null)
const draggedStatBlock = ref<number | null>(null)

const completedCards = reactive<Record<string, boolean>>({})

const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const rewardSlots: RewardPromptSlot[] = [
  {
    key: 'common-skill',
    label: 'Common Skill',
    rewardType: 'SKILL',
    rarityType: 'COMMON',
    rarity: 1,
    icon: 'kind-icon:bolt',
  },
  {
    key: 'rare-skill',
    label: 'Rare Skill',
    rewardType: 'SKILL',
    rarityType: 'RARE',
    rarity: 3,
    icon: 'kind-icon:comet',
  },
  {
    key: 'common-item',
    label: 'Common Item',
    rewardType: 'ITEM',
    rarityType: 'COMMON',
    rarity: 1,
    icon: 'kind-icon:backpack',
  },
  {
    key: 'rare-item',
    label: 'Rare Item',
    rewardType: 'ITEM',
    rarityType: 'RARE',
    rarity: 3,
    icon: 'kind-icon:gem',
  },
]

const stagedReward = reactive<RewardDraft>(createEmptyRewardDraft(rewardSlots[0]))

const sheet = reactive<BuilderCharacterSheetDraft>({
  name: '',
  honorific: 'adventurer',
  title: '',
  role: '',
  genre: '',
  species: '',
  characterClass: '',
  alignment: '',
  genderIdentity: '',
  presentation: '',
  personality: '',
  drive: '',
  backstory: '',
  achievements: '',
  skills: '',
  inventory: '',
  quirks: '',
  artPrompt: '',
  imagePath: null,
  rewards: [],
  stats: [
    { key: 'stat1', name: 'Luck', value: 0 },
    { key: 'stat2', name: 'Swol', value: 0 },
    { key: 'stat3', name: 'Wits', value: 0 },
    { key: 'stat4', name: 'Flexibility', value: 0 },
    { key: 'stat5', name: 'Rizz', value: 0 },
    { key: 'stat6', name: 'Empathy', value: 0 },
  ],
  goalStats: [
    { key: 'goal1', name: 'Principled|Chaotic', value: 0 },
    { key: 'goal2', name: 'Introvert|Extrovert', value: 0 },
    { key: 'goal3', name: 'Passive|Aggressive', value: 0 },
    { key: 'goal4', name: 'Optimist|Pessimist', value: 0 },
  ],
})

const promptCards = computed<CharacterPromptCard[]>(() => [
  {
    key: 'role',
    label: 'Place in the Story',
    title: 'Choose their role',
    icon: 'kind-icon:mask',
    flourish: '⚜',
    prompt: 'Are they a hero, rival, guide, menace, merchant, villain, or beautifully suspicious side character?',
    restoresFields: ['role', 'genre'],
    required: true,
    steps: [
      {
        key: 'role',
        title: 'Story Role',
        body: 'Choose the job they serve in the story. This is their narrative lane, even if they immediately swerve out of it.',
        inputLabel: 'Character Role',
        placeholder: 'Companion, rival, guide, villain, quest giver...',
        inputType: 'short',
        field: 'role',
      },
      {
        key: 'genre',
        title: 'Genre Flavor',
        body: 'Add the genre or vibe this character belongs to. Optional, but very useful for art and backstory.',
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
    prompt: 'Give them a name that sounds like it has history, bad timing, and excellent lighting.',
    restoresFields: ['name', 'honorific', 'title'],
    required: true,
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
    ],
  },
  {
    key: 'species',
    label: 'Origin',
    title: 'Choose species and calling',
    icon: 'kind-icon:species',
    flourish: '❦',
    prompt: 'What are they, and what do they do when destiny starts knocking on the furniture?',
    restoresFields: ['species', 'characterClass', 'alignment'],
    required: true,
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
        key: 'class',
        title: 'Class',
        body: 'Give them a class, job, archetype, or suspiciously specific life function.',
        inputLabel: 'Class',
        placeholder: 'Oracle, rogue, plague baker, haunted accountant...',
        inputType: 'short',
        field: 'characterClass',
      },
      {
        key: 'alignment',
        title: 'Alignment',
        body: 'Choose their moral weather. It does not have to be official. It does have to be funny or useful.',
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
    prompt: 'How do they move through the world? Pick identity, presentation, and the vibe people notice first.',
    restoresFields: ['genderIdentity', 'presentation'],
    required: true,
    steps: [
      {
        key: 'genderIdentity',
        title: 'Gender Identity',
        body: 'Choose their gender identity. Keep it direct, respectful, and character-specific.',
        inputLabel: 'Gender Identity',
        placeholder: 'Woman, man, nonbinary, agender, unknown, fluid...',
        inputType: 'short',
        field: 'genderIdentity',
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
    prompt: 'How do they talk, panic, charm, lie, sulk, flirt with danger, and avoid obvious lessons?',
    restoresFields: ['personality', 'drive'],
    required: true,
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
        placeholder: 'To recover a lost name, protect a sibling, overthrow brunch...',
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
    prompt: 'Drag the numbers 1 through 6 onto the stats. One tiny number. One heroic number. No refunds from fate.',
    restoresFields: ['stats'],
    required: true,
    steps: [
      {
        key: 'stats',
        title: 'Stats',
        body: 'Allocate 1, 2, 3, 4, 5, and 6 across the six stat slots. Each number can only be used once.',
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
    prompt: 'What happened to them, what do they want, and what emotional furniture are they still tripping over?',
    restoresFields: ['backstory', 'achievements', 'quirks'],
    required: true,
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
        body: 'Add one or two accomplishments, rumors, failures they keep rebranding, or titles earned the hard way.',
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
  {
    key: 'common-skill',
    label: 'Common Skill',
    title: 'Choose a reliable trick',
    icon: 'kind-icon:bolt',
    flourish: '✧',
    prompt: 'Pick a practical skill they can use often. Useful, flavorful, and not too universe-breaking.',
    restoresFields: ['common-skill'],
    rewardSlotKey: 'common-skill',
    required: true,
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'common-skill',
        title: 'Common Skill',
        body: 'Create a Reward with type SKILL and rarity COMMON. Simple. Useful. A little spicy.',
        inputLabel: 'Common Skill',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'rare-skill',
    label: 'Rare Skill',
    title: 'Choose their signature move',
    icon: 'kind-icon:comet',
    flourish: '✶',
    prompt: 'Give them one rare skill that feels special. The table should say, wait, you can do WHAT?',
    restoresFields: ['rare-skill'],
    rewardSlotKey: 'rare-skill',
    required: true,
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'rare-skill',
        title: 'Rare Skill',
        body: 'Create a Reward with type SKILL and rarity RARE. This is their signature trick.',
        inputLabel: 'Rare Skill',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'common-item',
    label: 'Common Item',
    title: 'Pack a useful item',
    icon: 'kind-icon:backpack',
    flourish: '◆',
    prompt: 'Choose an everyday item with personality. Useful tools are better when they look mildly cursed.',
    restoresFields: ['common-item'],
    rewardSlotKey: 'common-item',
    required: true,
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'common-item',
        title: 'Common Item',
        body: 'Create a Reward with type ITEM and rarity COMMON. A practical object with a tiny story hook.',
        inputLabel: 'Common Item',
        placeholder: '',
        inputType: 'reward',
      },
    ],
  },
  {
    key: 'rare-item',
    label: 'Rare Item',
    title: 'Claim a strange treasure',
    icon: 'kind-icon:gem',
    flourish: '❖',
    prompt: 'Choose a rare item with story gravity. Loot, leverage, or a very bad idea with excellent branding.',
    restoresFields: ['rare-item'],
    rewardSlotKey: 'rare-item',
    required: true,
    unlockWhen: () => canChooseRewards.value,
    steps: [
      {
        key: 'rare-item',
        title: 'Rare Item',
        body: 'Create a Reward with type ITEM and rarity RARE. Make it feel like a prize and a problem.',
        inputLabel: 'Rare Item',
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
    prompt: 'Turn the sheet into a portrait prompt. Costume, expression, silhouette, mood, and dramatic nonsense encouraged.',
    restoresFields: ['artPrompt', 'imagePath'],
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

const requiredCards = computed(() => {
  return promptCards.value.filter((card) => card.required)
})

const activeStep = computed(() => {
  return activeCard.value?.steps[activeStepIndex.value] ?? emptyStep
})

const isLastStep = computed(() => {
  if (!activeCard.value) return true
  return activeStepIndex.value >= activeCard.value.steps.length - 1
})

const activeRewardSlot = computed(() => {
  if (!activeCard.value?.rewardSlotKey) return null
  return rewardSlots.find((slot) => slot.key === activeCard.value?.rewardSlotKey) ?? null
})

const rewardSlotDescription = computed(() => {
  if (!activeRewardSlot.value) return 'Create a reward.'

  return `${activeRewardSlot.value.rarityType} ${activeRewardSlot.value.rewardType}, rarity ${activeRewardSlot.value.rarity}.`
})

const usedStatBlocks = computed(() => {
  return sheet.stats
    .map((stat) => stat.value)
    .filter((value) => statBlocks.includes(value))
})

const canChooseRewards = computed(() => {
  return ['role', 'name', 'species', 'identity', 'personality', 'stats', 'background'].every((key) => completedCards[key])
})

const canCreateArt = computed(() => {
  return [
    'role',
    'name',
    'species',
    'identity',
    'personality',
    'stats',
    'background',
    'common-skill',
    'rare-skill',
    'common-item',
    'rare-item',
  ].every((key) => completedCards[key])
})

const canSave = computed(() => {
  return Boolean(sheet.name.trim()) && canCreateArt.value
})

const saveStatus = computed(() => {
  if (selectedCharacterId.value) return `Saved as character #${selectedCharacterId.value}. Tiny legend notarized.`
  if (!canSave.value) return 'Finish identity, stats, background, and the four reward cards before saving.'
  return 'Ready to save.'
})

const statBlocks = [1, 2, 3, 4, 5, 6]

const emptyStep: CharacterPromptStep = {
  key: 'empty',
  title: '',
  body: '',
  inputLabel: '',
  placeholder: '',
  inputType: 'short',
}

function selectCard(card: CharacterPromptCard) {
  activeCard.value = card
  activeStepIndex.value = 0
  loadStepValue()
  prepareRewardStage(card)
}

function goNextStep() {
  commitCurrentStepToStage()

  if (!activeCard.value) return
  if (activeStepIndex.value >= activeCard.value.steps.length - 1) return

  activeStepIndex.value += 1
  loadStepValue()
}

function goPreviousStep() {
  commitCurrentStepToStage()

  if (activeStepIndex.value <= 0) return

  activeStepIndex.value -= 1
  loadStepValue()
}

function finishActiveCard() {
  commitCurrentStepToStage()

  if (!activeCard.value) return

  if (activeCard.value.rewardSlotKey) {
    commitRewardCard(activeCard.value.rewardSlotKey)
    completeCard(activeCard.value.key)
    replaceActiveCard()
    return
  }

  if (activeStep.value.inputType === 'stats') {
    if (!isStatAllocationComplete()) {
      saveError.value = 'Assign each stat a unique value from 1 to 6 before adding it to the sheet.'
      return
    }

    completeCard(activeCard.value.key)
    replaceActiveCard()
    return
  }

  if (activeStep.value.inputType === 'art') {
    completedCards.art = Boolean(sheet.artPrompt.trim() || sheet.imagePath)
    replaceActiveCard()
    return
  }

  completeCard(activeCard.value.key)
  buildArtPrompt()
  replaceActiveCard()
}

function cancelActiveCard() {
  activeCard.value = null
  activeStepIndex.value = 0
  activeValue.value = ''
  selectedStatBlock.value = null
  draggedStatBlock.value = null
  resetStagedReward()
}

function completeCard(key: string) {
  completedCards[key] = true
  saveError.value = ''
}

function skipActiveCard() {
  replaceActiveCard()
}

function replaceActiveCard() {
  const previousKey = activeCard.value?.key
  const next = visibleDeck.value.find((card) => card.key !== previousKey) || null

  activeCard.value = next
  activeStepIndex.value = 0
  activeValue.value = ''

  if (next) {
    loadStepValue()
    prepareRewardStage(next)
  } else {
    resetStagedReward()
  }
}

function reshuffleDeck() {
  const available = [...visibleDeck.value]
  const next = available[Math.floor(Math.random() * available.length)] || null

  activeCard.value = next
  activeStepIndex.value = 0
  activeValue.value = ''

  if (next) {
    loadStepValue()
    prepareRewardStage(next)
  }
}

function loadStepValue() {
  const step = activeStep.value

  if (step.inputType === 'reward' || step.inputType === 'stats' || step.inputType === 'art') {
    activeValue.value = ''
    return
  }

  if (step.field && typeof sheet[step.field] === 'string') {
    activeValue.value = String(sheet[step.field] || '')
    return
  }

  activeValue.value = ''
}

function commitCurrentStepToStage() {
  const step = activeStep.value

  if (!step.field) return
  if (step.inputType !== 'short' && step.inputType !== 'long') return
  if (typeof sheet[step.field] !== 'string') return

  ;(sheet[step.field] as string) = activeValue.value.trim()
}

function prepareRewardStage(card: CharacterPromptCard) {
  if (!card.rewardSlotKey) return

  const slot = rewardSlots.find((item) => item.key === card.rewardSlotKey)

  if (!slot) return

  const existing = sheet.rewards.find((reward) => reward.slotKey === slot.key)

  if (existing) {
    Object.assign(stagedReward, existing)
    return
  }

  Object.assign(stagedReward, createEmptyRewardDraft(slot))
}

function commitRewardCard(slotKey: RewardSlotKey) {
  const slot = rewardSlots.find((item) => item.key === slotKey)

  if (!slot) return

  const reward: RewardDraft = {
    slotKey,
    label: stagedReward.label.trim() || slot.label,
    text: stagedReward.text.trim() || `${slot.label} for ${sheet.name || 'this character'}.`,
    power: stagedReward.power.trim() || 'Provides a useful advantage when the story calls for it.',
    collection: 'starting-character-reward',
    rewardType: slot.rewardType,
    rarityType: slot.rarityType,
    rarity: slot.rarity,
    icon: stagedReward.icon.trim() || slot.icon,
    imagePath: stagedReward.imagePath.trim(),
    artImageId: stagedReward.artImageId,
    artPrompt: stagedReward.artPrompt.trim(),
    id: stagedReward.id,
  }

  const index = sheet.rewards.findIndex((item) => item.slotKey === slotKey)

  if (index >= 0) {
    sheet.rewards.splice(index, 1, reward)
  } else {
    sheet.rewards.push(reward)
  }
}

function rollActiveCard() {
  if (!activeCard.value) return

  const stepKey = activeStep.value.key
  const cardKey = activeCard.value.key

  if (stepKey === 'name') {
    activeValue.value = rollFrom('name', 'Mira Voss')
    return
  }

  if (stepKey === 'honorific') {
    activeValue.value = rollFrom('honorific', 'adventurer')
    return
  }

  if (stepKey === 'role') {
    activeValue.value = rollFrom('role', 'companion')
    return
  }

  if (stepKey === 'genre') {
    activeValue.value = rollFrom('genre', 'gothic comedy')
    return
  }

  if (stepKey === 'species') {
    activeValue.value = rollFrom('species', 'Moon-Moth Human')
    return
  }

  if (stepKey === 'class') {
    activeValue.value = rollFrom('class', 'Oracle')
    return
  }

  if (stepKey === 'alignment') {
    activeValue.value = `${rollFrom('adjective', 'Chaotic')} ${rollFrom('personality', 'Helpful')}`
    return
  }

  if (stepKey === 'genderIdentity') {
    activeValue.value = rollFrom('gender', 'unknown')
    return
  }

  if (stepKey === 'presentation') {
    activeValue.value = rollFrom('presentation', 'ceremonial and slightly dangerous')
    return
  }

  if (stepKey === 'personality') {
    activeValue.value = rollFrom('personality', 'Warm, theatrical, and allergic to simple answers.')
    return
  }

  if (stepKey === 'drive') {
    activeValue.value = rollFrom('drive', 'to recover something everyone else insists was never lost')
    return
  }

  if (stepKey === 'backstory') {
    buildBackstory()
    activeValue.value = sheet.backstory
    return
  }

  if (stepKey === 'achievements') {
    activeValue.value = rollFrom('achievement', 'Survived a duel with a polite ghost.')
    return
  }

  if (stepKey === 'quirks') {
    activeValue.value = [
      rollFrom('quirk', 'apologizes to furniture'),
      rollFrom('quirk', 'counts exits before compliments'),
    ].join(', ')
    return
  }

  if (activeStep.value.inputType === 'stats') {
    rollStats()
    return
  }

  if (activeStep.value.inputType === 'reward') {
    rollReward(cardKey)
    return
  }

  if (activeStep.value.inputType === 'art') {
    buildArtPrompt()
  }
}

function rollReward(cardKey: string) {
  const slot = rewardSlots.find((item) => item.key === cardKey)

  if (!slot) return

  const fallbackLabel =
    slot.rewardType === 'SKILL'
      ? slot.rarityType === 'RARE'
        ? 'Moonlit Counterspell'
        : 'Pocket Sand Theology'
      : slot.rarityType === 'RARE'
        ? 'The Apology Dagger'
        : 'Emergency Biscuit Tin'

  stagedReward.label = rollFrom('reward', fallbackLabel)
  stagedReward.text =
    slot.rewardType === 'SKILL'
      ? `A ${slot.rarityType.toLowerCase()} skill that lets ${sheet.name || 'this character'} turn pressure into possibility.`
      : `A ${slot.rarityType.toLowerCase()} item with practical use and suspicious narrative gravity.`
  stagedReward.power =
    slot.rewardType === 'SKILL'
      ? 'Gain an advantage when this skill directly applies to a risky scene.'
      : 'Use this item to solve, complicate, or dramatically reframe a scene.'
  stagedReward.icon = slot.icon
  stagedReward.artPrompt = buildRewardArtPrompt(slot, stagedReward.label)
}

function buildBackstory() {
  const parts = [
    sheet.name ? `${sheet.name} is ${articleFor(sheet.species)} ${sheet.species || 'mysterious being'}.` : '',
    sheet.characterClass ? `They are known as a ${sheet.characterClass}.` : '',
    sheet.role ? `Their role in the story is ${sheet.role}.` : '',
    sheet.drive ? `They want ${sheet.drive}.` : '',
    sheet.personality ? `Personality: ${sheet.personality}` : '',
    selectedDreamLabel.value ? `They are connected to ${selectedDreamLabel.value}.` : '',
  ]

  sheet.backstory = parts.filter(Boolean).join(' ')
}

function buildArtPrompt() {
  const rewardText = sheet.rewards
    .map((reward) => `${reward.rarityType.toLowerCase()} ${reward.rewardType.toLowerCase()}: ${reward.label}`)
    .join(', ')

  sheet.artPrompt = [
    `Character portrait of ${sheet.name || 'an unnamed character'}`,
    sheet.species,
    sheet.characterClass,
    sheet.presentation,
    sheet.personality,
    sheet.genre,
    rewardText ? `starting rewards: ${rewardText}` : '',
    sheet.backstory ? `story context: ${sheet.backstory}` : '',
    'expressive face, strong silhouette, detailed costume, vivid narrative design',
  ]
    .filter(Boolean)
    .join(', ')
}

function buildRewardArtPrompt(slot: RewardPromptSlot, label: string) {
  return [
    `${slot.rarityType.toLowerCase()} ${slot.rewardType.toLowerCase()} reward`,
    label,
    'iconic fantasy game asset',
    'clear silhouette',
    'ornate but readable',
    'transparent background friendly',
  ].join(', ')
}

function startStatDrag(block: number) {
  draggedStatBlock.value = block
}

function dropStatBlock(statKey: string) {
  if (!draggedStatBlock.value) return

  assignStatBlock(statKey, draggedStatBlock.value)
  draggedStatBlock.value = null
}

function assignSelectedStat(statKey: string) {
  if (!selectedStatBlock.value) return

  assignStatBlock(statKey, selectedStatBlock.value)
  selectedStatBlock.value = null
}

function assignStatBlock(statKey: string, block: number) {
  const target = sheet.stats.find((stat) => stat.key === statKey)

  if (!target) return

  for (const stat of sheet.stats) {
    if (stat.key !== statKey && stat.value === block) {
      stat.value = 0
    }
  }

  target.value = block
}

function isStatAllocationComplete() {
  const values = sheet.stats.map((stat) => stat.value).sort((a, b) => a - b)
  return values.join(',') === statBlocks.join(',')
}

function rollStats() {
  const shuffled = [...statBlocks].sort(() => Math.random() - 0.5)

  sheet.stats.forEach((stat, index) => {
    stat.value = shuffled[index] ?? 0
  })

  for (const goal of sheet.goalStats) {
    goal.value = randomInt(-100, 100)
  }
}

function updateCharacterArt(payload: ArtCreatorPayload) {
  sheet.artPrompt = payload.prompt || sheet.artPrompt
  sheet.imagePath = payload.imagePath || sheet.imagePath
  completedCards.art = Boolean(sheet.artPrompt.trim() || sheet.imagePath)
}

function removeSheetSection(key: string) {
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

function clearSheetField(field: keyof BuilderCharacterSheetDraft) {
  if (field === 'stats') {
    resetStatRows(sheet.stats, [
      { key: 'stat1', name: 'Luck', value: 0 },
      { key: 'stat2', name: 'Swol', value: 0 },
      { key: 'stat3', name: 'Wits', value: 0 },
      { key: 'stat4', name: 'Flexibility', value: 0 },
      { key: 'stat5', name: 'Rizz', value: 0 },
      { key: 'stat6', name: 'Empathy', value: 0 },
    ])
    return
  }

  if (field === 'goalStats') {
    resetStatRows(sheet.goalStats, [
      { key: 'goal1', name: 'Principled|Chaotic', value: 0 },
      { key: 'goal2', name: 'Introvert|Extrovert', value: 0 },
      { key: 'goal3', name: 'Passive|Aggressive', value: 0 },
      { key: 'goal4', name: 'Optimist|Pessimist', value: 0 },
    ])
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

  if (typeof sheet[field] === 'string') {
    ;(sheet[field] as string) = field === 'honorific' ? 'adventurer' : ''
  }
}

async function saveCharacter() {
  if (!canSave.value) {
    saveError.value = 'Finish identity, stats, background, and all four reward cards before saving.'
    return
  }

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    const savedRewards = await saveRewardDrafts()

    const body: Partial<Character> & Record<string, unknown> = {
      name: sheet.name.trim(),
      honorific: sheet.honorific.trim() || 'adventurer',
      title: sheet.title.trim() || null,
      role: sheet.role.trim() || null,
      genderIdentity: sheet.genderIdentity.trim() || null,
      presentation: sheet.presentation.trim() || null,
      achievements: sheet.achievements.trim() || null,
      alignment: sheet.alignment.trim() || null,
      experience: 0,
      level: 1,
      class: sheet.characterClass.trim() || null,
      species: sheet.species.trim() || null,
      backstory: sheet.backstory.trim() || null,
      drive: sheet.drive.trim() || null,
      inventory: rewardInventoryText.value,
      quirks: sheet.quirks.trim() || null,
      skills: rewardSkillText.value,
      genre: sheet.genre.trim() || null,
      personality: sheet.personality.trim() || null,
      artPrompt: sheet.artPrompt.trim() || null,
      imagePath: sheet.imagePath || null,
      userId: userStore.userId || 10,
      designer: getDesignerName(),
      isPublic: true,
      isMature: false,
      isActive: true,
      rewardIds: savedRewards.map((reward) => reward.id).filter(Boolean),
      statName1: sheet.stats[0]?.name || 'Luck',
      statValue1: sheet.stats[0]?.value ?? 0,
      statName2: sheet.stats[1]?.name || 'Swol',
      statValue2: sheet.stats[1]?.value ?? 0,
      statName3: sheet.stats[2]?.name || 'Wits',
      statValue3: sheet.stats[2]?.value ?? 0,
      statName4: sheet.stats[3]?.name || 'Flexibility',
      statValue4: sheet.stats[3]?.value ?? 0,
      statName5: sheet.stats[4]?.name || 'Rizz',
      statValue5: sheet.stats[4]?.value ?? 0,
      statName6: sheet.stats[5]?.name || 'Empathy',
      statValue6: sheet.stats[5]?.value ?? 0,
      goalStat1Name: sheet.goalStats[0]?.name || 'Principled|Chaotic',
      goalStat1Value: sheet.goalStats[0]?.value ?? 0,
      goalStat2Name: sheet.goalStats[1]?.name || 'Introvert|Extrovert',
      goalStat2Value: sheet.goalStats[1]?.value ?? 0,
      goalStat3Name: sheet.goalStats[2]?.name || 'Passive|Aggressive',
      goalStat3Value: sheet.goalStats[2]?.value ?? 0,
      goalStat4Name: sheet.goalStats[3]?.name || 'Optimist|Pessimist',
      goalStat4Value: sheet.goalStats[3]?.value ?? 0,
    }

    if (selectedDreamId.value) {
      body.dreamIds = [selectedDreamId.value]
    }

    const response = (await performFetch<Character>(CHARACTER_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })) as PerformFetchResult<Character>

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to save character.')
    }

    selectedCharacterId.value = response.data.id
    saveMessage.value = `Saved character #${response.data.id}. Plot goblin successfully released.`
  } catch (error) {
    handleError(error, 'saving character from character-builder')
    saveError.value = error instanceof Error ? error.message : 'Failed to save character.'
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

    const body: Partial<Reward> & Record<string, unknown> = {
      label: draft.label,
      text: draft.text,
      power: draft.power,
      collection: draft.collection || 'starting-character-reward',
      rarity: draft.rarity,
      rarityType: draft.rarityType,
      rewardType: draft.rewardType,
      icon: draft.icon || fallbackRewardIcon(draft),
      imagePath: draft.imagePath || null,
      artImageId: draft.artImageId || null,
      artPrompt: draft.artPrompt || null,
      userId: userStore.userId || 10,
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
      throw new Error(response.message || `Failed to save reward: ${draft.label}`)
    }

    draft.id = response.data.id
    savedRewards.push(response.data)
  }

  return savedRewards
}

async function fetchDreams() {
  try {
    const response = (await performFetch<Dream[]>('/api/dream')) as PerformFetchResult<Dream[]>

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

function resetBuilder() {
  selectedCharacterId.value = null
  selectedDreamId.value = 0
  activeCard.value = null
  activeStepIndex.value = 0
  activeValue.value = ''
  selectedStatBlock.value = null
  draggedStatBlock.value = null
  saveMessage.value = ''
  saveError.value = ''

  for (const key of Object.keys(completedCards)) {
    delete completedCards[key]
  }

  sheet.name = ''
  sheet.honorific = 'adventurer'
  sheet.title = ''
  sheet.role = ''
  sheet.genre = ''
  sheet.species = ''
  sheet.characterClass = ''
  sheet.alignment = ''
  sheet.genderIdentity = ''
  sheet.presentation = ''
  sheet.personality = ''
  sheet.drive = ''
  sheet.backstory = ''
  sheet.achievements = ''
  sheet.skills = ''
  sheet.inventory = ''
  sheet.quirks = ''
  sheet.artPrompt = ''
  sheet.imagePath = null
  sheet.rewards.splice(0, sheet.rewards.length)

  resetStagedReward()

  resetStatRows(sheet.stats, [
    { key: 'stat1', name: 'Luck', value: 0 },
    { key: 'stat2', name: 'Swol', value: 0 },
    { key: 'stat3', name: 'Wits', value: 0 },
    { key: 'stat4', name: 'Flexibility', value: 0 },
    { key: 'stat5', name: 'Rizz', value: 0 },
    { key: 'stat6', name: 'Empathy', value: 0 },
  ])

  resetStatRows(sheet.goalStats, [
    { key: 'goal1', name: 'Principled|Chaotic', value: 0 },
    { key: 'goal2', name: 'Introvert|Extrovert', value: 0 },
    { key: 'goal3', name: 'Passive|Aggressive', value: 0 },
    { key: 'goal4', name: 'Optimist|Pessimist', value: 0 },
  ])

  reshuffleDeck()
}

function resetStatRows(target: CharacterSheetStat[], defaults: CharacterSheetStat[]) {
  target.splice(0, target.length, ...defaults)
}

function createEmptyRewardDraft(slot: RewardPromptSlot): RewardDraft {
  return {
    slotKey: slot.key,
    label: '',
    text: '',
    power: '',
    collection: 'starting-character-reward',
    rewardType: slot.rewardType,
    rarityType: slot.rarityType,
    rarity: slot.rarity,
    icon: slot.icon,
    imagePath: '',
    artImageId: null,
    artPrompt: '',
  }
}

function resetStagedReward() {
  Object.assign(stagedReward, createEmptyRewardDraft(rewardSlots[0]))
}

function fallbackRewardIcon(reward: Pick<RewardDraft, 'rewardType' | 'rarityType'>) {
  if (reward.rewardType === 'SKILL' && reward.rarityType === 'RARE') return 'kind-icon:comet'
  if (reward.rewardType === 'SKILL') return 'kind-icon:bolt'
  if (reward.rewardType === 'ITEM' && reward.rarityType === 'RARE') return 'kind-icon:gem'
  return 'kind-icon:backpack'
}

function isRewardSlotKey(value: unknown): value is RewardSlotKey {
  return typeof value === 'string' && rewardSlots.some((slot) => slot.key === value)
}

const selectedDreamLabel = computed(() => {
  return dreamOptions.value.find((dream) => dream.id === selectedDreamId.value)?.label || ''
})

const rewardSkillText = computed(() => {
  return sheet.rewards
    .filter((reward) => reward.rewardType === 'SKILL')
    .map((reward) => `${reward.label}: ${reward.power}`)
    .join('\n')
})

const rewardInventoryText = computed(() => {
  return sheet.rewards
    .filter((reward) => reward.rewardType === 'ITEM')
    .map((reward) => `${reward.label}: ${reward.text}`)
    .join('\n')
})

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
  const first = value.trim().charAt(0).toLowerCase()
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

onMounted(async () => {
  randomStore.initialize()
  await fetchDreams()
  reshuffleDeck()
})
</script>