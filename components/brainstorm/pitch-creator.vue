<!-- /components/builders/pitch-creator.vue -->
<template>
  <section class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4">
    <div class="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_22rem]">
      <div class="flex flex-col gap-3">
        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h4 class="flex items-center gap-2 text-lg font-bold text-base-content">
            <Icon name="kind-icon:dice" class="h-5 w-5 text-primary" />
            Random Ingredients
          </h4>

          <p class="mt-1 text-sm text-base-content/60">
            Choose the pools, roll the dice, lock the good bits, and let the premise emerge from the fog wearing novelty glasses.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="slot in slots"
              :key="slot.key"
              class="rounded-2xl border border-base-300 bg-base-100 p-3"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="font-bold text-base-content">
                  {{ slot.label }}
                </p>

                <button
                  class="btn btn-xs rounded-xl"
                  type="button"
                  @click="rollSlot(slot.key)"
                >
                  <Icon name="kind-icon:refresh" class="h-3 w-3" />
                  Roll
                </button>
              </div>

              <select
                v-model="slot.pool"
                class="select select-bordered mt-3 w-full rounded-2xl"
              >
                <option
                  v-for="key in randomStore.supportedKeys"
                  :key="key"
                  :value="key"
                >
                  {{ formatKey(key) }}
                </option>
              </select>

              <input
                v-model="slot.value"
                class="input input-bordered mt-3 w-full rounded-2xl"
                type="text"
                :placeholder="`Random ${slot.label.toLowerCase()}`"
              />

              <button
                class="btn btn-xs mt-3 rounded-xl"
                :class="slot.locked ? 'btn-primary' : 'btn-ghost border border-base-300'"
                type="button"
                @click="slot.locked = !slot.locked"
              >
                <Icon
                  :name="slot.locked ? 'kind-icon:lock' : 'kind-icon:unlock'"
                  class="h-3 w-3"
                />
                {{ slot.locked ? 'Locked' : 'Unlocked' }}
              </button>
            </article>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button class="btn btn-primary rounded-xl" type="button" @click="rollUnlocked">
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Roll Unlocked
            </button>

            <button class="btn rounded-xl" type="button" @click="clearSlots">
              <Icon name="kind-icon:trash" class="h-4 w-4" />
              Clear
            </button>

            <button class="btn btn-secondary rounded-xl" type="button" @click="buildPitch">
              <Icon name="kind-icon:wand" class="h-4 w-4" />
              Build Pitch
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
          <h4 class="flex items-center gap-2 text-lg font-bold text-base-content">
            <Icon name="kind-icon:list" class="h-5 w-5 text-primary" />
            Custom Random Lists
          </h4>

          <p class="mt-1 text-sm text-base-content/60">
            Presets and user-created RANDOMLIST pitches can throw extra chaos into the cauldron.
          </p>

          <div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto]">
            <select
              v-model.number="selectedListId"
              class="select select-bordered rounded-2xl"
            >
              <option :value="null">
                Select a random list
              </option>

              <option
                v-for="list in randomStore.filteredLists"
                :key="list.id"
                :value="list.id"
              >
                {{ list.title }}
              </option>
            </select>

            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              :disabled="!selectedList"
              @click="pullFromSelectedList"
            >
              <Icon name="kind-icon:sparkles" class="h-4 w-4" />
              Pull Example
            </button>
          </div>

          <div
            v-if="selectedListExamples.length"
            class="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2"
          >
            <button
              v-for="example in selectedListExamples.slice(0, 8)"
              :key="example"
              class="rounded-2xl border border-base-300 bg-base-100 p-3 text-left text-sm transition hover:border-primary hover:bg-primary hover:text-primary-content"
              type="button"
              @click="addExtraIngredient(example)"
            >
              {{ example }}
            </button>
          </div>
        </div>
      </div>

      <aside class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-4">
        <h4 class="flex items-center gap-2 text-lg font-bold text-base-content">
          <Icon name="kind-icon:blueprint" class="h-5 w-5 text-primary" />
          Generated Pitch
        </h4>

        <label class="form-control">
          <span class="label-text font-bold">Generated Title</span>

          <input
            v-model="generatedTitle"
            class="input input-bordered rounded-2xl"
            type="text"
            placeholder="Generated title"
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Generated Pitch</span>

          <textarea
            v-model="generatedPitch"
            class="textarea textarea-bordered min-h-48 rounded-2xl"
            placeholder="Generated pitch..."
          />
        </label>

        <label class="form-control">
          <span class="label-text font-bold">Generated Art Prompt</span>

          <textarea
            v-model="generatedArtPrompt"
            class="textarea textarea-bordered min-h-32 rounded-2xl"
            placeholder="Generated cover prompt..."
          />
        </label>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-3">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
            Ingredients
          </p>

          <div class="mt-2 flex flex-wrap gap-2">
            <span
              v-for="ingredient in allIngredients"
              :key="ingredient"
              class="badge badge-primary badge-outline"
            >
              {{ ingredient }}
            </span>

            <span
              v-if="!allIngredients.length"
              class="text-sm text-base-content/50"
            >
              No ingredients yet.
            </span>
          </div>
        </div>

        <button
          class="btn btn-primary rounded-xl"
          type="button"
          :disabled="!generatedTitle || !generatedPitch"
          @click="applyPitch"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" />
          Use This Pitch
        </button>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRandomStore } from '@/stores/randomStore'

type PitchCreatorPayload = {
  title: string
  pitch: string
  artPrompt: string
  ingredients: string[]
}

type PitchSlot = {
  key: string
  label: string
  pool: string
  value: string
  locked: boolean
}

const props = withDefaults(
  defineProps<{
    promptNotes?: string
  }>(),
  {
    promptNotes: '',
  },
)

const emit = defineEmits<{
  apply: [payload: PitchCreatorPayload]
}>()

const randomStore = useRandomStore()

const selectedListId = ref<number | null>(null)
const extraIngredients = ref<string[]>([])
const generatedTitle = ref('')
const generatedPitch = ref('')
const generatedArtPrompt = ref('')

const slots = reactive<PitchSlot[]>([
  {
    key: 'genre',
    label: 'Genre',
    pool: 'genre',
    value: '',
    locked: false,
  },
  {
    key: 'mood',
    label: 'Mood',
    pool: 'adjective',
    value: '',
    locked: false,
  },
  {
    key: 'subject',
    label: 'Subject',
    pool: 'noun',
    value: '',
    locked: false,
  },
  {
    key: 'being',
    label: 'Being',
    pool: 'species',
    value: '',
    locked: false,
  },
  {
    key: 'object',
    label: 'Object',
    pool: 'item',
    value: '',
    locked: false,
  },
  {
    key: 'twist',
    label: 'Twist',
    pool: 'quirk',
    value: '',
    locked: false,
  },
])

const selectedList = computed(() => {
  return (
    randomStore.filteredLists.find((list) => list.id === selectedListId.value) ??
    null
  )
})

const selectedListExamples = computed(() => {
  if (!selectedList.value) return []

  return randomStore.getExamplesForList(selectedList.value)
})

const slotIngredients = computed(() => {
  return slots
    .map((slot) => slot.value.trim())
    .filter((value) => value.length > 0)
})

const allIngredients = computed(() => {
  return Array.from(new Set([...slotIngredients.value, ...extraIngredients.value]))
})

function formatKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function rollSlot(slotKey: string) {
  const slot = slots.find((item) => item.key === slotKey)
  if (!slot) return

  const [value] = randomStore.getRandom(slot.pool, 1)
  if (!value) return

  slot.value = value
}

function rollUnlocked() {
  for (const slot of slots) {
    if (!slot.locked) {
      rollSlot(slot.key)
    }
  }

  if (!generatedTitle.value && !generatedPitch.value) {
    buildPitch()
  }
}

function clearSlots() {
  for (const slot of slots) {
    if (!slot.locked) {
      slot.value = ''
    }
  }

  extraIngredients.value = []
  generatedTitle.value = ''
  generatedPitch.value = ''
  generatedArtPrompt.value = ''
}

function addExtraIngredient(value: string) {
  const cleaned = value.trim()
  if (!cleaned) return

  if (!extraIngredients.value.includes(cleaned)) {
    extraIngredients.value.push(cleaned)
  }
}

function pullFromSelectedList() {
  if (!selectedListExamples.value.length) return

  const [value] = randomStore.pickRandomFromArray(selectedListExamples.value, 1)
  if (value) {
    addExtraIngredient(value)
  }
}

function valueFor(key: string) {
  return slots.find((slot) => slot.key === key)?.value.trim() || ''
}

function buildPitch() {
  const genre = valueFor('genre') || 'fantasy'
  const mood = valueFor('mood') || 'strange'
  const subject = valueFor('subject') || 'world'
  const being = valueFor('being') || 'misfit'
  const object = valueFor('object') || 'artifact'
  const twist = valueFor('twist') || 'nobody understands the rules'

  const titleStart = formatTitlePiece(mood)
  const titleSubject = formatTitlePiece(subject)
  const titleObject = formatTitlePiece(object)

  generatedTitle.value = `The ${titleStart} ${titleSubject} of ${titleObject}`

  generatedPitch.value = [
    `A ${mood} ${genre} story-world where a ${being} becomes entangled with a ${subject} built around a mysterious ${object}.`,
    `The central problem is that ${twist}, forcing characters to improvise, bargain, rebel, or make spectacularly questionable choices.`,
    props.promptNotes.trim() ? `Creator notes: ${props.promptNotes.trim()}` : '',
    extraIngredients.value.length
      ? `Bonus ingredients: ${extraIngredients.value.join(', ')}.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')

  generatedArtPrompt.value = [
    `Original cinematic cover image for "${generatedTitle.value}".`,
    `A ${mood} ${genre} setting featuring visual hints of ${subject}, ${being}, and ${object}.`,
    extraIngredients.value.length
      ? `Include subtle inspiration from: ${extraIngredients.value.join(', ')}.`
      : '',
    'Strong composition, expressive atmosphere, no text, no watermark.',
  ]
    .filter(Boolean)
    .join(' ')
}

function formatTitlePiece(value: string) {
  const cleaned = value.trim()
  if (!cleaned) return 'Strange'

  return cleaned
    .split(/\s+/)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function applyPitch() {
  emit('apply', {
    title: generatedTitle.value.trim(),
    pitch: generatedPitch.value.trim(),
    artPrompt: generatedArtPrompt.value.trim(),
    ingredients: allIngredients.value,
  })
}

onMounted(async () => {
  randomStore.initialize()
  await randomStore.fetchRandomLists()

  rollUnlocked()
})
</script>