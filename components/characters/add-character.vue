<!-- /components/characters/add-character.vue -->
<template>
  <div
    class="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="text-center">
      <h1 class="text-3xl font-bold text-primary md:text-4xl">
        {{ title }}
      </h1>

      <p class="mt-2 text-sm text-base-content/70">
        {{ subtitle }}
      </p>
    </header>

    <div
      v-if="mode === 'edit' && !characterStore.selectedCharacter"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Select a character before editing.
    </div>

    <template v-else>
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-xl font-bold text-base-content">
                Identity
              </h2>

              <p class="text-sm text-base-content/70">
                Name the little narrative gremlin.
              </p>
            </div>

            <button
              class="btn btn-sm btn-secondary rounded-xl"
              type="button"
              @click="generateRandomCharacter"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Randomize
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Name</span>
              </span>

              <input
                v-model="characterStore.characterForm.name"
                type="text"
                placeholder="Mira Moonbucket"
                class="input input-bordered w-full bg-base-200"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Honorific</span>
              </span>

              <input
                v-model="characterStore.characterForm.honorific"
                type="text"
                placeholder="the Surprisingly Prepared"
                class="input input-bordered w-full bg-base-200"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Species</span>
              </span>

              <input
                v-model="characterStore.characterForm.species"
                type="text"
                placeholder="Goblin, Human, Robot, Moth Oracle..."
                class="input input-bordered w-full bg-base-200"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Class</span>
              </span>

              <input
                v-model="characterStore.characterForm.class"
                type="text"
                placeholder="Detective, Barber Mage, Snack Paladin..."
                class="input input-bordered w-full bg-base-200"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Genre</span>
              </span>

              <input
                v-model="characterStore.characterForm.genre"
                type="text"
                placeholder="Gothic comedy, cozy sci-fi..."
                class="input input-bordered w-full bg-base-200"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Personality</span>
              </span>

              <input
                v-model="characterStore.characterForm.personality"
                type="text"
                placeholder="Brave, theatrical, allergic to subtlety..."
                class="input input-bordered w-full bg-base-200"
              />
            </label>
          </div>
        </div>

        <aside class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">
                Portrait
              </h2>

              <p class="text-sm text-base-content/70">
                Upload or generate character art.
              </p>
            </div>

            <Icon name="kind-icon:person" class="h-8 w-8 text-primary" />
          </div>

          <img
            :src="characterImage"
            alt="Character portrait"
            class="h-72 w-full rounded-2xl border border-base-300 bg-base-300 object-cover"
          />

          <div class="mt-4 flex flex-col gap-3">
            <character-uploader @uploaded="handleUploadedArtImage" />

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Art Prompt</span>
              </span>

              <textarea
                v-model="characterStore.characterForm.artPrompt"
                placeholder="Describe this character visually..."
                class="textarea textarea-bordered min-h-28 w-full bg-base-200"
                :disabled="isKept('artPrompt') || characterStore.isGeneratingArt"
              />
            </label>

            <div class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
              <span class="text-sm font-bold">Keep art prompt</span>

              <input
                v-model="characterStore.keepField.artPrompt"
                type="checkbox"
                class="toggle toggle-primary"
              />
            </div>

            <button
              class="btn btn-primary rounded-xl"
              type="button"
              :disabled="characterStore.isGeneratingArt || !characterStore.characterForm.artPrompt"
              @click="generateArtImage"
            >
              <span
                v-if="characterStore.isGeneratingArt"
                class="loading loading-spinner loading-sm"
              />
              {{ characterStore.isGeneratingArt ? 'Generating...' : 'Generate Art' }}
            </button>
          </div>
        </aside>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-xl font-bold text-base-content">
              AI Update Controls
            </h2>

            <p class="text-sm text-base-content/70">
              Select fields for AI to refresh. Fields marked “keep” are protected.
            </p>
          </div>

          <button
            class="btn btn-sm btn-accent rounded-xl"
            type="button"
            :disabled="fieldsToUpgrade.length === 0"
            @click="generateSelectedFields"
          >
            <Icon name="kind-icon:sparkles" class="h-4 w-4" />
            Update Selected
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="field in aiFields"
            :key="field.key"
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-bold text-base-content">
                  {{ field.label }}
                </p>

                <p class="text-xs text-base-content/60">
                  {{ field.description }}
                </p>
              </div>

              <Icon :name="field.icon" class="h-5 w-5 shrink-0 text-primary" />
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <label class="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-base-100 px-3 py-2 text-sm">
                <span>AI update</span>
                <input
                  v-model="characterStore.useGenerated[field.key]"
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-secondary"
                  :disabled="isKept(field.key)"
                />
              </label>

              <label class="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-base-100 px-3 py-2 text-sm">
                <span>Keep</span>
                <input
                  v-model="characterStore.keepField[field.key]"
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-primary"
                  @change="handleKeepFieldChange(field.key)"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-bold text-base-content">
              Stats
            </h2>

            <p class="text-sm text-base-content/70">
              Reroll the numbers, rename the stats, make the spreadsheet goblin purr.
            </p>
          </div>

          <button
            class="btn btn-sm btn-secondary rounded-xl"
            type="button"
            @click="characterStore.rerollCharacterStats()"
          >
            Reroll Stats
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="index in 6"
            :key="`stat-${index}`"
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <input
              v-model="statNameModels[index]"
              type="text"
              class="input input-bordered input-sm w-full bg-base-100 font-bold uppercase"
            />

            <input
              v-model.number="statValueModels[index]"
              type="number"
              class="input input-bordered mt-2 w-full bg-base-100 text-center text-lg font-bold"
            />
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">
                Backstory
              </h2>

              <p class="text-sm text-base-content/70">
                The dramatic nonsense engine.
              </p>
            </div>

            <label class="flex items-center gap-2 text-sm">
              <span>Keep</span>
              <input
                v-model="characterStore.keepField.backstory"
                type="checkbox"
                class="toggle toggle-primary toggle-sm"
              />
            </label>
          </div>

          <textarea
            v-model="characterStore.characterForm.backstory"
            class="textarea textarea-bordered min-h-48 w-full bg-base-200"
            placeholder="Write the character's backstory..."
            :disabled="isKept('backstory')"
          />
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div
            v-for="field in narrativeFields"
            :key="field.key"
            class="rounded-2xl border border-base-300 bg-base-100 p-4"
          >
            <div class="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 class="text-lg font-bold text-base-content">
                  {{ field.label }}
                </h2>

                <p class="text-sm text-base-content/70">
                  {{ field.description }}
                </p>
              </div>

              <label class="flex items-center gap-2 text-sm">
                <span>Keep</span>
                <input
                  v-model="characterStore.keepField[field.key]"
                  type="checkbox"
                  class="toggle toggle-primary toggle-sm"
                />
              </label>
            </div>

            <textarea
              v-model="narrativeModels[field.key]"
              class="textarea textarea-bordered min-h-28 w-full bg-base-200"
              :placeholder="field.placeholder"
              :disabled="isKept(field.key)"
            />
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div
          v-for="chapter in characterChapters"
          :key="chapter.label"
          class="rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h2 class="mb-3 flex items-center gap-2 text-xl font-semibold">
            <Icon :name="chapter.icon" class="h-5 w-5 text-primary" />
            {{ chapter.intro }}
          </h2>

          <div class="grid gap-4">
            <choice-manager
              v-for="choice of chapter.choices"
              :key="choice"
              :label="choice"
              model="Character"
            />
          </div>
        </div>
      </section>

      <div
        v-if="characterStore.lastError"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ characterStore.lastError }}
      </div>

      <div
        v-if="statusMessage"
        class="rounded-2xl border p-3 text-sm"
        :class="
          statusTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ statusMessage }}
      </div>

      <footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          class="btn btn-ghost rounded-xl"
          type="button"
          @click="emit('cancel')"
        >
          Cancel
        </button>

        <button
          v-if="mode === 'edit'"
          class="btn btn-secondary rounded-xl"
          type="button"
          @click="resetFromSelected"
        >
          Revert
        </button>

        <button
          v-else
          class="btn btn-secondary rounded-xl"
          type="button"
          @click="resetForAdd"
        >
          Reset
        </button>

        <button
          class="btn btn-primary rounded-xl"
          type="button"
          :disabled="characterStore.isSaving || !canSave"
          @click="saveCharacter"
        >
          <span
            v-if="characterStore.isSaving"
            class="loading loading-spinner loading-sm"
          />
          {{ saveLabel }}
        </button>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Character } from '~/prisma/generated/prisma/client'
import { useCharacterStore } from '@/stores/characterStore'
import { characterChapters } from '@/stores/chapters/characterChapters'

type CharacterFieldKey = keyof Character & string

const props = withDefaults(
  defineProps<{
    mode?: 'add' | 'edit'
  }>(),
  {
    mode: 'add',
  },
)

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const characterStore = useCharacterStore()

const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const mode = computed(() => props.mode)

const title = computed(() =>
  mode.value === 'edit' ? 'Edit Character' : 'Character Designer',
)

const subtitle = computed(() =>
  mode.value === 'edit'
    ? 'Tune up this delightful little narrative gremlin.'
    : 'Build a fresh weirdo for the adventure.',
)

const saveLabel = computed(() =>
  mode.value === 'edit' ? 'Save Character' : 'Create Character',
)

const canSave = computed(() =>
  Boolean(characterStore.characterForm.name?.trim()),
)

const characterImage = computed(
  () =>
    characterStore.artImagePath ||
    characterStore.characterForm.imagePath ||
    '/images/character-placeholder.webp',
)

const aiFields: Array<{
  key: CharacterFieldKey
  label: string
  description: string
  icon: string
}> = [
  {
    key: 'name',
    label: 'Name',
    description: 'Refresh the character name.',
    icon: 'kind-icon:person',
  },
  {
    key: 'honorific',
    label: 'Honorific',
    description: 'Refresh the dramatic subtitle.',
    icon: 'kind-icon:crown',
  },
  {
    key: 'species',
    label: 'Species',
    description: 'Refresh the creature type.',
    icon: 'kind-icon:paw',
  },
  {
    key: 'class',
    label: 'Class',
    description: 'Refresh the role or archetype.',
    icon: 'kind-icon:wand',
  },
  {
    key: 'personality',
    label: 'Personality',
    description: 'Refresh the temperament.',
    icon: 'kind-icon:sparkles',
  },
  {
    key: 'backstory',
    label: 'Backstory',
    description: 'Refresh the dramatic history.',
    icon: 'kind-icon:book',
  },
  {
    key: 'quirks',
    label: 'Quirks',
    description: 'Refresh odd habits and details.',
    icon: 'kind-icon:stars',
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Refresh carried items.',
    icon: 'kind-icon:bag',
  },
  {
    key: 'skills',
    label: 'Skills',
    description: 'Refresh talents and actions.',
    icon: 'kind-icon:bolt',
  },
  {
    key: 'artPrompt',
    label: 'Art Prompt',
    description: 'Refresh the visual prompt.',
    icon: 'kind-icon:palette',
  },
]

const narrativeFields: Array<{
  key: CharacterFieldKey
  label: string
  description: string
  placeholder: string
}> = [
  {
    key: 'quirks',
    label: 'Quirks',
    description: 'Odd habits, tells, rituals, and suspicious little details.',
    placeholder: "Enter character's quirks...",
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Objects, snacks, tools, cursed receipts, and pocket lint.',
    placeholder: "Enter character's inventory...",
  },
  {
    key: 'skills',
    label: 'Skills',
    description: 'Useful powers, strange talents, and emergency nonsense.',
    placeholder: "Enter character's skills...",
  },
]

const fieldsToUpgrade = computed(() => {
  return aiFields
    .filter((field) => {
      return (
        Boolean(characterStore.useGenerated[field.key]) &&
        !Boolean(characterStore.keepField[field.key])
      )
    })
    .map((field) => field.key)
})

const statNameModels = reactive<Record<number, string>>({})
const statValueModels = reactive<Record<number, number>>({})
const narrativeModels = reactive<Record<string, string>>({})

for (let index = 1; index <= 6; index += 1) {
  const nameKey = `statName${index}` as CharacterFieldKey
  const valueKey = `statValue${index}` as CharacterFieldKey

  Object.defineProperty(statNameModels, index, {
    get() {
      return String(characterStore.characterForm[nameKey] || '')
    },
    set(value: string) {
      characterStore.characterForm[nameKey] = value as never
    },
  })

  Object.defineProperty(statValueModels, index, {
    get() {
      return Number(characterStore.characterForm[valueKey] || 0)
    },
    set(value: number) {
      characterStore.characterForm[valueKey] = value as never
    },
  })
}

for (const field of narrativeFields) {
  Object.defineProperty(narrativeModels, field.key, {
    get() {
      return String(characterStore.characterForm[field.key] || '')
    },
    set(value: string) {
      characterStore.characterForm[field.key] = value as never
    },
  })
}

onMounted(async () => {
  await characterStore.initialize({
    fetchRemote: true,
    createDefaultForm: true,
  })

  prepareForm()
})

watch(
  () => props.mode,
  () => {
    prepareForm()
  },
)

function prepareForm() {
  statusMessage.value = ''

  if (mode.value === 'edit') {
    resetFromSelected()
    return
  }

  const hasFormData = Object.keys(characterStore.characterForm || {}).length > 0

  if (!hasFormData) {
    resetForAdd()
  }
}

function resetForAdd() {
  characterStore.startAddingCharacter()
  void characterStore.generateRandomCharacter()
  statusMessage.value = ''
}

async function resetFromSelected() {
  await characterStore.startEditingCharacter()
  statusMessage.value = ''
}

function isKept(field: string) {
  return Boolean(characterStore.keepField[field])
}

function handleKeepFieldChange(field: string) {
  if (characterStore.keepField[field]) {
    characterStore.useGenerated[field] = false
  }
}

async function generateRandomCharacter() {
  await characterStore.generateRandomCharacter()
  statusTone.value = 'success'
  statusMessage.value = 'Random character generated.'
}

async function generateSelectedFields() {
  if (fieldsToUpgrade.value.length === 0) {
    statusTone.value = 'error'
    statusMessage.value = 'Select at least one AI field to update.'
    return
  }

  try {
    await characterStore.generateFields(fieldsToUpgrade.value)
    statusTone.value = 'success'
    statusMessage.value = `Updated ${fieldsToUpgrade.value.length} field${
      fieldsToUpgrade.value.length === 1 ? '' : 's'
    }.`
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to update fields.'
  }
}

function handleUploadedArtImage(id: number) {
  characterStore.setArtImageId(id)
}

async function generateArtImage() {
  await characterStore.generateArtImage()

  if (characterStore.lastError) {
    statusTone.value = 'error'
    statusMessage.value = characterStore.lastError
    return
  }

  statusTone.value = 'success'
  statusMessage.value = 'Character art generated.'
}

async function saveCharacter() {
  const result = await characterStore.saveCharacter()

  if (!result.success) {
    statusTone.value = 'error'
    statusMessage.value = result.message
    return
  }

  statusTone.value = 'success'
  statusMessage.value = result.message
  emit('saved')
}
</script>