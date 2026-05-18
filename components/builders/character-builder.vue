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
          Build a character by playing prompt cards. Each finished prompt lands on the character sheet. It is less paperwork, more tiny narrative goblin engine.
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

    <div class="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[1fr_24rem]">
      <character-sheet :sheet="sheet" />

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
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                {{ activeCard.label }}
              </p>

              <h4 class="mt-2 text-xl font-black text-base-content">
                {{ activeCard.title }}
              </h4>

              <p class="mt-2 text-sm text-base-content/70">
                {{ activeCard.prompt }}
              </p>
            </div>

            <label
              v-if="activeCard.inputType === 'short'"
              class="form-control"
            >
              <span class="label-text font-bold">{{ activeCard.inputLabel }}</span>

              <input
                v-model="activeValue"
                class="input input-bordered rounded-2xl"
                type="text"
                :placeholder="activeCard.placeholder"
              />
            </label>

            <label
              v-else-if="activeCard.inputType === 'long'"
              class="form-control"
            >
              <span class="label-text font-bold">{{ activeCard.inputLabel }}</span>

              <textarea
                v-model="activeValue"
                class="textarea textarea-bordered min-h-40 rounded-2xl text-base"
                :placeholder="activeCard.placeholder"
              />
            </label>

            <div
              v-else-if="activeCard.inputType === 'stats'"
              class="flex flex-col gap-3"
            >
              <div
                v-for="stat in sheet.stats"
                :key="stat.key"
                class="grid grid-cols-1 gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 sm:grid-cols-[1fr_7rem]"
              >
                <input
                  v-model="stat.name"
                  class="input input-bordered rounded-2xl"
                  type="text"
                />

                <input
                  v-model.number="stat.value"
                  class="input input-bordered rounded-2xl"
                  type="number"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div
              v-else-if="activeCard.inputType === 'art'"
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
                class="btn btn-primary rounded-xl"
                type="button"
                @click="completeActiveCard"
              >
                <Icon name="kind-icon:check" class="h-4 w-4" />
                Add to Sheet
              </button>

              <button
                class="btn rounded-xl"
                type="button"
                @click="skipActiveCard"
              >
                <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
                Skip
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
          class="group flex min-w-56 max-w-64 shrink-0 items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:bg-primary/10"
          :class="cardButtonClass(card)"
          type="button"
          @click="selectCard(card)"
        >
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-base-300 group-hover:bg-primary/20">
            <Icon
              :name="card.icon"
              class="h-5 w-5 text-primary"
            />
          </div>

          <div class="min-w-0">
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
import type { Character, Dream } from '~/prisma/generated/prisma/client'
import { useUserStore } from '@/stores/userStore'
import { useRandomStore } from '@/stores/randomStore'
import { handleError, performFetch } from '@/stores/utils'
import type { CharacterSheetDraft, CharacterSheetStat } from '@/components/builders/character-sheet.vue'

type SelectOption = {
  id: number
  label: string
}

type PromptInputType = 'short' | 'long' | 'stats' | 'art'

type CharacterPromptCard = {
  key: string
  label: string
  title: string
  icon: string
  prompt: string
  inputLabel: string
  placeholder: string
  inputType: PromptInputType
  field?: keyof CharacterSheetDraft
  required?: boolean
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

const userStore = useUserStore()
const randomStore = useRandomStore()

const selectedCharacterId = ref<number | null>(null)
const selectedDreamId = ref(0)
const dreamOptions = ref<SelectOption[]>([])

const activeCard = ref<CharacterPromptCard | null>(null)
const activeValue = ref('')

const completedCards = reactive<Record<string, boolean>>({})

const isSaving = ref(false)
const saveMessage = ref('')
const saveError = ref('')

const sheet = reactive<CharacterSheetDraft>({
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
  stats: [
    { key: 'stat1', name: 'Luck', value: 59 },
    { key: 'stat2', name: 'Swol', value: 49 },
    { key: 'stat3', name: 'Wits', value: 72 },
    { key: 'stat4', name: 'Flexibility', value: 93 },
    { key: 'stat5', name: 'Rizz', value: 9 },
    { key: 'stat6', name: 'Empathy', value: 71 },
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
    title: 'What role do they play?',
    icon: 'kind-icon:mask',
    prompt: 'Are they a hero, rival, guide, menace, merchant, villain, or beautifully suspicious side character?',
    inputLabel: 'Character Role',
    placeholder: 'Companion, rival, guide, villain, quest giver...',
    inputType: 'short',
    field: 'role',
    required: true,
  },
  {
    key: 'name',
    label: 'Name',
    title: 'Give them a name',
    icon: 'kind-icon:signature',
    prompt: 'Name the character like they already owe someone a dramatic apology.',
    inputLabel: 'Name',
    placeholder: 'Mira Voss, Buttonwick, Saint Crumble...',
    inputType: 'short',
    field: 'name',
    required: true,
  },
  {
    key: 'species',
    label: 'Species',
    title: 'What are they?',
    icon: 'kind-icon:species',
    prompt: 'Pick their people, species, origin, or “technically complicated” biology.',
    inputLabel: 'Species',
    placeholder: 'Human, goblin, ghost, moon-moth, clockwork saint...',
    inputType: 'short',
    field: 'species',
    required: true,
  },
  {
    key: 'identity',
    label: 'Identity',
    title: 'How do they show up?',
    icon: 'kind-icon:person',
    prompt: 'Set gender identity, presentation, vibe, and how the world reads them.',
    inputLabel: 'Identity and Presentation',
    placeholder: 'Nonbinary, ceremonial, glamorous, masked, practical...',
    inputType: 'long',
    field: 'presentation',
  },
  {
    key: 'class',
    label: 'Class',
    title: 'What is their calling?',
    icon: 'kind-icon:sparkles',
    prompt: 'Give them a class, job, archetype, or suspiciously specific life function.',
    inputLabel: 'Class',
    placeholder: 'Oracle, rogue, plague baker, haunted accountant...',
    inputType: 'short',
    field: 'characterClass',
    required: true,
  },
  {
    key: 'personality',
    label: 'Personality',
    title: 'How do they behave?',
    icon: 'kind-icon:heart',
    prompt: 'Describe how they talk, react, panic, posture, charm, sulk, or lie to themselves.',
    inputLabel: 'Personality',
    placeholder: 'Warm but evasive. Brave until paperwork appears...',
    inputType: 'long',
    field: 'personality',
    required: true,
  },
  {
    key: 'stats',
    label: 'Stats',
    title: 'Tune the stat goblin',
    icon: 'kind-icon:activity',
    prompt: 'Adjust their six core stats. Numbers are narrative spice, not prison bars.',
    inputLabel: 'Stats',
    placeholder: '',
    inputType: 'stats',
    required: true,
  },
  {
    key: 'skills',
    label: 'Skills',
    title: 'What can they do?',
    icon: 'kind-icon:bolt',
    prompt: 'Give them skills, talents, combat tricks, social nonsense, or suspicious hobbies.',
    inputLabel: 'Skills',
    placeholder: 'Sword dancing, lockpicking, ritual accounting...',
    inputType: 'long',
    field: 'skills',
    required: true,
  },
  {
    key: 'inventory',
    label: 'Inventory',
    title: 'What do they carry?',
    icon: 'kind-icon:backpack',
    prompt: 'Add possessions, tools, keepsakes, weapons, snacks, cursed objects, and regrettable receipts.',
    inputLabel: 'Inventory',
    placeholder: 'A silver thimble, three maps, a knife named Kevin...',
    inputType: 'long',
    field: 'inventory',
  },
  {
    key: 'quirks',
    label: 'Quirks',
    title: 'What makes them weird?',
    icon: 'kind-icon:bug',
    prompt: 'Give them memorable habits. The kind of details players quote later.',
    inputLabel: 'Quirks',
    placeholder: 'Apologizes to doors. Collects doomed spoons...',
    inputType: 'long',
    field: 'quirks',
  },
  {
    key: 'background',
    label: 'Background',
    title: 'Where did they come from?',
    icon: 'kind-icon:story',
    prompt: 'Write the backstory. Include desire, trouble, history, and one excellent emotional bruise.',
    inputLabel: 'Backstory',
    placeholder: 'They were raised by...',
    inputType: 'long',
    field: 'backstory',
    required: true,
  },
  {
    key: 'art',
    label: 'Art',
    title: 'Create their portrait',
    icon: 'kind-icon:palette',
    prompt: 'Build the visual prompt, then generate or select art for this character.',
    inputLabel: 'Art Prompt',
    placeholder: '',
    inputType: 'art',
    unlockWhen: () => canCreateArt.value,
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

const canCreateArt = computed(() => {
  return ['name', 'species', 'class', 'personality', 'background'].every((key) => completedCards[key])
})

const canSave = computed(() => {
  return Boolean(sheet.name.trim()) && canCreateArt.value
})

const saveStatus = computed(() => {
  if (selectedCharacterId.value) return `Saved as character #${selectedCharacterId.value}. Tiny legend notarized.`
  if (!canSave.value) return 'Finish the core cards before saving.'
  return 'Ready to save.'
})

function selectCard(card: CharacterPromptCard) {
  activeCard.value = card
  activeValue.value = card.field ? String(sheet[card.field] || '') : ''
}

function completeActiveCard() {
  if (!activeCard.value) return

  if (activeCard.value.inputType === 'stats') {
    completedCards[activeCard.value.key] = true
    replaceActiveCard()
    return
  }

  if (activeCard.value.inputType === 'art') {
    completedCards[activeCard.value.key] = Boolean(sheet.artPrompt.trim() || sheet.imagePath)
    replaceActiveCard()
    return
  }

  if (activeCard.value.key === 'identity') {
    applyIdentityPrompt(activeValue.value)
    completedCards[activeCard.value.key] = true
    replaceActiveCard()
    return
  }

  if (activeCard.value.field) {
    const field = activeCard.value.field
    const value = activeValue.value.trim()

    if (typeof sheet[field] === 'string') {
      ;(sheet[field] as string) = value
    }
  }

  completedCards[activeCard.value.key] = true
  buildArtPrompt()
  replaceActiveCard()
}

function skipActiveCard() {
  replaceActiveCard()
}

function replaceActiveCard() {
  const next = visibleDeck.value.find((card) => card.key !== activeCard.value?.key) || null
  activeCard.value = next
  activeValue.value = next?.field ? String(sheet[next.field] || '') : ''
}

function reshuffleDeck() {
  const available = [...visibleDeck.value]
  const next = available[Math.floor(Math.random() * available.length)] || null

  activeCard.value = next
  activeValue.value = next?.field ? String(sheet[next.field] || '') : ''
}

function rollActiveCard() {
  if (!activeCard.value) return

  const key = activeCard.value.key

  if (key === 'name') {
    activeValue.value = rollFrom('name', 'Mira Voss')
    return
  }

  if (key === 'species') {
    activeValue.value = rollFrom('species', 'Moon-Moth Human')
    return
  }

  if (key === 'class') {
    activeValue.value = rollFrom('class', 'Oracle')
    return
  }

  if (key === 'role') {
    activeValue.value = rollFrom('role', 'companion')
    return
  }

  if (key === 'identity') {
    activeValue.value = [
      `Gender identity: ${rollFrom('gender', 'unknown')}.`,
      `Presentation: ${rollFrom('presentation', 'ceremonial and slightly dangerous')}.`,
    ].join('\n')
    return
  }

  if (key === 'personality') {
    activeValue.value = rollFrom('personality', 'Warm, theatrical, and allergic to simple answers.')
    return
  }

  if (key === 'skills') {
    activeValue.value = [
      rollFrom('skill', 'dangerous etiquette'),
      rollFrom('skill', 'improvised spellwork'),
      rollFrom('skill', 'knife juggling'),
    ].join(', ')
    return
  }

  if (key === 'inventory') {
    activeValue.value = [
      rollFrom('item', 'a cracked mirror'),
      rollFrom('item', 'a ribboned dagger'),
      rollFrom('item', 'three emergency biscuits'),
    ].join(', ')
    return
  }

  if (key === 'quirks') {
    activeValue.value = [
      rollFrom('quirk', 'apologizes to furniture'),
      rollFrom('quirk', 'counts exits before compliments'),
    ].join(', ')
    return
  }

  if (key === 'background') {
    buildBackstory()
    activeValue.value = sheet.backstory
    return
  }

  if (key === 'stats') {
    rollStats()
    return
  }

  if (key === 'art') {
    buildArtPrompt()
  }
}

function applyIdentityPrompt(value: string) {
  const lines = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const genderLine = lines.find((line) => line.toLowerCase().startsWith('gender identity:'))
  const presentationLine = lines.find((line) => line.toLowerCase().startsWith('presentation:'))

  sheet.genderIdentity = genderLine?.replace(/gender identity:/i, '').trim().replace(/\.$/, '') || sheet.genderIdentity
  sheet.presentation = presentationLine?.replace(/presentation:/i, '').trim().replace(/\.$/, '') || value.trim()
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
  sheet.artPrompt = [
    `Character portrait of ${sheet.name || 'an unnamed character'}`,
    sheet.species,
    sheet.characterClass,
    sheet.presentation,
    sheet.personality,
    sheet.genre,
    sheet.backstory ? `story context: ${sheet.backstory}` : '',
    'expressive face, strong silhouette, detailed costume, vivid narrative design',
  ]
    .filter(Boolean)
    .join(', ')
}

function rollStats() {
  for (const stat of sheet.stats) {
    stat.value = randomInt(0, 100)
  }

  for (const goal of sheet.goalStats) {
    goal.value = randomInt(-100, 100)
  }
}

function updateCharacterArt(payload: ArtCreatorPayload) {
  sheet.artPrompt = payload.prompt || sheet.artPrompt
  sheet.imagePath = payload.imagePath || sheet.imagePath
  completedCards.art = Boolean(sheet.artPrompt.trim() || sheet.imagePath)
}

async function saveCharacter() {
  if (!canSave.value) {
    saveError.value = 'Finish the required character cards before saving.'
    return
  }

  isSaving.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
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
      inventory: sheet.inventory.trim() || null,
      quirks: sheet.quirks.trim() || null,
      skills: sheet.skills.trim() || null,
      genre: sheet.genre.trim() || null,
      personality: sheet.personality.trim() || null,
      artPrompt: sheet.artPrompt.trim() || null,
      imagePath: sheet.imagePath || null,
      userId: userStore.userId || 10,
      designer: getDesignerName(),
      isPublic: true,
      isMature: false,
      isActive: true,
      statName1: sheet.stats[0]?.name || 'Luck',
      statValue1: sheet.stats[0]?.value ?? 59,
      statName2: sheet.stats[1]?.name || 'Swol',
      statValue2: sheet.stats[1]?.value ?? 49,
      statName3: sheet.stats[2]?.name || 'Wits',
      statValue3: sheet.stats[2]?.value ?? 72,
      statName4: sheet.stats[3]?.name || 'Flexibility',
      statValue4: sheet.stats[3]?.value ?? 93,
      statName5: sheet.stats[4]?.name || 'Rizz',
      statValue5: sheet.stats[4]?.value ?? 9,
      statName6: sheet.stats[5]?.name || 'Empathy',
      statValue6: sheet.stats[5]?.value ?? 71,
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
  activeValue.value = ''
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

  resetStatRows(sheet.stats, [
    { key: 'stat1', name: 'Luck', value: 59 },
    { key: 'stat2', name: 'Swol', value: 49 },
    { key: 'stat3', name: 'Wits', value: 72 },
    { key: 'stat4', name: 'Flexibility', value: 93 },
    { key: 'stat5', name: 'Rizz', value: 9 },
    { key: 'stat6', name: 'Empathy', value: 71 },
  ])

  resetStatRows(sheet.goalStats, [
    { key: 'goal1', name: 'Principled|Chaotic', value: 0 },
    { key: 'goal2', name: 'Introvert|Extrovert', value: 0 },
    { key: 'goal3', name: 'Passive|Aggressive', value: 0 },
    { key: 'goal4', name: 'Optimist|Pessimist', value: 0 },
  ])
}

function resetStatRows(target: CharacterSheetStat[], defaults: CharacterSheetStat[]) {
  target.splice(0, target.length, ...defaults)
}

const selectedDreamLabel = computed(() => {
  return dreamOptions.value.find((dream) => dream.id === selectedDreamId.value)?.label || ''
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
    return 'border-primary bg-primary/10'
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