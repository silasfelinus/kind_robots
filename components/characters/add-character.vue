<!-- /components/characters/add-character.vue -->
<template>
  <section
    class="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="text-center">
      <h1 class="text-3xl font-black text-primary md:text-4xl">
        {{ title }}
      </h1>
      <p class="mt-2 text-sm text-base-content/70">
        {{ subtitle }}
      </p>
    </header>

    <div
      v-if="mode === 'edit' && !characterStore.selectedCharacter"
      class="kr-note kr-note-warning"
    >
      Select a character before editing.
    </div>

    <template v-else>
      <section
        class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div
            class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 class="text-xl font-bold text-base-content">
                Character Identity
              </h2>
              <p class="text-sm text-base-content/70">
                Give this person a name, place in the world, and recognizable silhouette.
              </p>
            </div>

            <button
              class="btn btn-sm btn-secondary rounded-xl"
              type="button"
              @click="seedCharacter"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Seed
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text font-bold">Name</span>
              <input
                v-model="characterStore.characterForm.name"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="Moss Lantern"
                :disabled="isKept('name')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Honorific</span>
              <input
                v-model="characterStore.characterForm.honorific"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="the Unreasonably Prepared"
                :disabled="isKept('honorific')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Role</span>
              <input
                v-model="characterStore.characterForm.role"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="guide, rival, archivist..."
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Title</span>
              <input
                v-model="characterStore.characterForm.title"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="Keeper of the Last Teacup"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Class</span>
              <input
                v-model="characterStore.characterForm.class"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="storm librarian"
                :disabled="isKept('class')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Species</span>
              <input
                v-model="characterStore.characterForm.species"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="human, robot, mothfolk..."
                :disabled="isKept('species')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Genre</span>
              <input
                v-model="characterStore.characterForm.genre"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="cozy fantasy"
                :disabled="isKept('genre')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Gender</span>
              <input
                v-model="characterStore.characterForm.gender"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="Optional"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label-text font-bold">Presentation</span>
              <input
                v-model="characterStore.characterForm.presentation"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="How they present visually and socially"
              />
            </label>
          </div>
        </div>

        <aside class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">Portrait</h2>
              <p class="text-sm text-base-content/70">
                Upload, borrow, or generate character art.
              </p>
            </div>
            <Icon name="kind-icon:person" class="h-8 w-8 text-primary" />
          </div>

          <img
            :src="characterImage"
            :alt="characterStore.characterForm.name || 'Character portrait'"
            class="h-72 w-full rounded-2xl border border-base-300 bg-base-300 object-cover"
          />

          <image-upload class="mt-4" />

          <label class="form-control mt-4">
            <span class="label-text font-bold">Art prompt</span>
            <textarea
              v-model="characterStore.characterForm.artPrompt"
              class="textarea textarea-bordered mt-1 min-h-28 w-full bg-base-200"
              placeholder="Describe the portrait you want..."
              :disabled="isKept('artPrompt')"
            />
          </label>

          <div class="mt-4 grid gap-2">
            <button
              class="btn btn-accent rounded-xl"
              type="button"
              :disabled="characterStore.isGeneratingArt"
              @click="generatePortrait"
            >
              <span
                v-if="characterStore.isGeneratingArt"
                class="loading loading-spinner loading-sm"
              />
              <Icon v-else name="kind-icon:magic" class="h-4 w-4" />
              Generate portrait
            </button>

            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="useRandomArtImage"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Random gallery image
            </button>
          </div>
        </aside>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Personality and Voice
          </h2>

          <div class="grid gap-4">
            <label class="form-control">
              <span class="label-text font-bold">Personality</span>
              <textarea
                v-model="characterStore.characterForm.personality"
                class="textarea textarea-bordered mt-1 min-h-32 w-full bg-base-200"
                placeholder="Temperament, habits, contradictions..."
                :disabled="isKept('personality')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Voice</span>
              <textarea
                v-model="characterStore.characterForm.voice"
                class="textarea textarea-bordered mt-1 min-h-28 w-full bg-base-200"
                placeholder="How this character sounds"
                :disabled="isKept('voice')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Sample response</span>
              <textarea
                v-model="characterStore.characterForm.sampleResponse"
                class="textarea textarea-bordered mt-1 min-h-28 w-full bg-base-200"
                placeholder="A line that sounds unmistakably like them"
                :disabled="isKept('sampleResponse')"
              />
            </label>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Story and Motivation
          </h2>

          <div class="grid gap-4">
            <label class="form-control">
              <span class="label-text font-bold">Backstory</span>
              <textarea
                v-model="characterStore.characterForm.backstory"
                class="textarea textarea-bordered mt-1 min-h-36 w-full bg-base-200"
                placeholder="Where they came from and what still follows them"
                :disabled="isKept('backstory')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Drive</span>
              <input
                v-model="characterStore.characterForm.drive"
                type="text"
                class="input input-bordered mt-1 w-full bg-base-200"
                placeholder="What they want badly enough to act"
                :disabled="isKept('drive')"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Quirks</span>
              <textarea
                v-model="characterStore.characterForm.quirks"
                class="textarea textarea-bordered mt-1 min-h-28 w-full bg-base-200"
                placeholder="Odd rules, tells, comforts, and tiny disasters"
                :disabled="isKept('quirks')"
              />
            </label>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div
          class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-xl font-bold text-base-content">Character Stats</h2>
            <p class="text-sm text-base-content/70">
              Rarity-style strengths for adventures and rewards.
            </p>
          </div>

          <button
            class="btn btn-sm btn-secondary rounded-xl"
            type="button"
            @click="characterStore.rerollCharacterStats"
          >
            <Icon name="kind-icon:dice" class="h-4 w-4" />
            Reroll stats
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label
            v-for="stat in statFields"
            :key="stat.key"
            class="form-control"
          >
            <span class="label-text font-bold">{{ stat.label }}</span>
            <select
              v-model="characterStore.characterForm[stat.key]"
              class="select select-bordered mt-1 w-full bg-base-200"
            >
              <option v-for="rarity in rarities" :key="rarity" :value="rarity">
                {{ rarity }}
              </option>
            </select>
          </label>
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div
          class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-xl font-bold text-base-content">
              AI Update Controls
            </h2>
            <p class="text-sm text-base-content/70">
              Choose fields to refresh while protecting the parts already working.
            </p>
          </div>

          <button
            class="btn btn-sm btn-accent rounded-xl"
            type="button"
            :disabled="fieldsToUpgrade.length === 0 || isGeneratingFields"
            @click="generateSelectedFields"
          >
            <span
              v-if="isGeneratingFields"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
            Update selected
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
                <p class="font-bold text-base-content">{{ field.label }}</p>
                <p class="text-xs text-base-content/60">
                  {{ field.description }}
                </p>
              </div>
              <Icon :name="field.icon" class="h-5 w-5 shrink-0 text-primary" />
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <label
                class="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-base-100 px-3 py-2 text-sm"
              >
                <span>AI update</span>
                <input
                  v-model="characterStore.useGenerated[field.key]"
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-secondary"
                  :disabled="isKept(field.key)"
                />
              </label>

              <label
                class="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-base-100 px-3 py-2 text-sm"
              >
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
        <h2 class="mb-3 text-xl font-bold text-base-content">Record Settings</h2>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label class="form-control">
            <span class="label-text font-bold">Level</span>
            <input
              v-model.number="characterStore.characterForm.level"
              type="number"
              min="1"
              class="input input-bordered mt-1 w-full bg-base-200"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Experience</span>
            <input
              v-model.number="characterStore.characterForm.experience"
              type="number"
              min="0"
              class="input input-bordered mt-1 w-full bg-base-200"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Designer</span>
            <input
              v-model="characterStore.characterForm.designer"
              type="text"
              class="input input-bordered mt-1 w-full bg-base-200"
            />
          </label>

          <label
            class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <span class="font-bold">Public</span>
            <input
              v-model="characterStore.characterForm.isPublic"
              type="checkbox"
              class="toggle toggle-primary"
            />
          </label>

          <label
            class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <span class="font-bold">Mature</span>
            <input
              v-model="characterStore.characterForm.isMature"
              type="checkbox"
              class="toggle toggle-warning"
            />
          </label>
        </div>
      </section>

      <div v-if="characterStore.lastError" class="kr-note kr-note-error">
        {{ characterStore.lastError }}
      </div>

      <div
        v-if="statusMessage"
        class="kr-note"
        :class="statusTone === 'error' ? 'kr-note-error' : 'kr-note-success'"
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
          class="btn btn-secondary rounded-xl"
          type="button"
          @click="mode === 'edit' ? resetFromSelected() : resetForAdd()"
        >
          {{ mode === 'edit' ? 'Revert' : 'Reset' }}
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Rarity } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { useCharacterStore, type Character } from '@/stores/characterStore'
import { useUploadStore } from '@/stores/uploadStore'

type CharacterFieldKey = keyof Character & string
type CharacterStatKey =
  | 'luck'
  | 'might'
  | 'wits'
  | 'grace'
  | 'charm'
  | 'empathy'

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
const artStore = useArtStore()
const uploadStore = useUploadStore()
const isGeneratingFields = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const mode = computed(() => props.mode)
const title = computed(() =>
  mode.value === 'edit' ? 'Edit Character' : 'Create Character',
)
const subtitle = computed(() =>
  mode.value === 'edit'
    ? 'Tune this character without sanding off the weird little edges.'
    : 'Build someone who can walk into a story and immediately make it more interesting.',
)
const saveLabel = computed(() =>
  mode.value === 'edit' ? 'Save Character' : 'Create Character',
)
const canSave = computed(() =>
  Boolean(characterStore.characterForm.name?.trim()),
)
const characterImage = computed(() => {
  return (
    characterStore.artImagePath ||
    characterStore.characterForm.imagePath ||
    '/images/character-placeholder.webp'
  )
})

const rarities: Rarity[] = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
]

const statFields: Array<{ key: CharacterStatKey; label: string }> = [
  { key: 'luck', label: 'Luck' },
  { key: 'might', label: 'Might' },
  { key: 'wits', label: 'Wits' },
  { key: 'grace', label: 'Grace' },
  { key: 'charm', label: 'Charm' },
  { key: 'empathy', label: 'Empathy' },
]

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
    description: 'Refresh their memorable epithet.',
    icon: 'kind-icon:crown',
  },
  {
    key: 'class',
    label: 'Class',
    description: 'Refresh their role or vocation.',
    icon: 'kind-icon:skills',
  },
  {
    key: 'species',
    label: 'Species',
    description: 'Refresh what kind of being they are.',
    icon: 'kind-icon:butterfly',
  },
  {
    key: 'personality',
    label: 'Personality',
    description: 'Refresh temperament and behavior.',
    icon: 'kind-icon:stars',
  },
  {
    key: 'backstory',
    label: 'Backstory',
    description: 'Refresh their history and context.',
    icon: 'kind-icon:book',
  },
  {
    key: 'drive',
    label: 'Drive',
    description: 'Refresh what pushes them forward.',
    icon: 'kind-icon:heart',
  },
  {
    key: 'quirks',
    label: 'Quirks',
    description: 'Refresh their odd little details.',
    icon: 'kind-icon:sparkles',
  },
  {
    key: 'voice',
    label: 'Voice',
    description: 'Refresh how they speak.',
    icon: 'kind-icon:chat',
  },
  {
    key: 'sampleResponse',
    label: 'Sample Response',
    description: 'Refresh an example line.',
    icon: 'kind-icon:quote',
  },
  {
    key: 'artPrompt',
    label: 'Art Prompt',
    description: 'Refresh their portrait prompt.',
    icon: 'kind-icon:image',
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

onMounted(async () => {
  await Promise.all([
    characterStore.initialize({
      fetchRemote: true,
      createDefaultForm: true,
    }),
    artStore.initialize({
      fetchRemote: true,
      hydrateImages: true,
    }),
  ])

  await prepareForm()
  configureCharacterImageUpload()
})

watch(
  () => props.mode,
  async () => {
    await prepareForm()
    configureCharacterImageUpload()
  },
)

watch(
  () => characterStore.selectedCharacter?.id,
  () => {
    configureCharacterImageUpload()
  },
)

async function prepareForm(): Promise<void> {
  statusMessage.value = ''

  if (mode.value === 'edit') {
    await resetFromSelected()
    return
  }

  if (Object.keys(characterStore.characterForm || {}).length === 0) {
    resetForAdd()
  }
}

function configureCharacterImageUpload(): void {
  uploadStore.setTarget({
    model: 'Character',
    modelId:
      characterStore.selectedCharacter?.id ??
      characterStore.characterForm.id ??
      null,
    galleryName: 'characterUploads',
    collectionLabel: 'characters',
    promptString:
      characterStore.characterForm.artPrompt || '[CharacterImage]',
    path: '[CharacterImage]',
    buttonLabel: 'Upload character portrait',
    icon: 'kind-icon:person',
    showPreview: false,
    applyImage: async ({ artImageId }) => {
      characterStore.setArtImageId(artImageId)

      if (mode.value === 'edit' && characterStore.selectedCharacter?.id) {
        const result = await characterStore.saveCharacter()

        if (!result.success) {
          statusTone.value = 'error'
          statusMessage.value =
            result.message || 'Image uploaded, but character update failed.'
          return
        }

        statusTone.value = 'success'
        statusMessage.value = 'Character portrait updated.'
        return
      }

      statusTone.value = 'success'
      statusMessage.value = 'Character portrait added to the form.'
    },
  })
}

function resetForAdd(): void {
  characterStore.startAddingCharacter()
  statusMessage.value = ''
}

async function resetFromSelected(): Promise<void> {
  await characterStore.startEditingCharacter()
  statusMessage.value = ''
}

function isKept(field: string): boolean {
  return Boolean(characterStore.keepField[field])
}

function handleKeepFieldChange(field: string): void {
  if (characterStore.keepField[field]) {
    characterStore.useGenerated[field] = false
  }
}

function seedCharacter(): void {
  const generated = characterStore.generateDefaultCharacter()
  const current = characterStore.characterForm

  characterStore.setCharacterForm({
    ...generated,
    name: current.name || generated.name,
    honorific: current.honorific || generated.honorific,
    class: current.class || generated.class,
    species: current.species || generated.species,
    genre: current.genre || generated.genre,
    personality: current.personality || generated.personality,
    backstory: current.backstory || generated.backstory,
    quirks: current.quirks || generated.quirks,
  })

  statusTone.value = 'success'
  statusMessage.value = 'Character seed applied.'
}

async function useRandomArtImage(): Promise<void> {
  const images = artStore.safeArtImages.length
    ? artStore.safeArtImages
    : artStore.artImages
  const image = images[Math.floor(Math.random() * images.length)]

  if (!image) {
    statusTone.value = 'error'
    statusMessage.value = 'No gallery image was available.'
    return
  }

  characterStore.setCharacterForm({
    artImageId: image.id,
    imagePath: image.imagePath || image.path || null,
  })
  await characterStore.updateArtImagePath()
  statusTone.value = 'success'
  statusMessage.value = 'Random portrait applied.'
}

async function generatePortrait(): Promise<void> {
  statusMessage.value = ''
  await characterStore.generateArtImage()

  if (characterStore.lastError) {
    statusTone.value = 'error'
    statusMessage.value = characterStore.lastError
    return
  }

  statusTone.value = 'success'
  statusMessage.value = 'Character portrait generated.'
}

async function generateSelectedFields(): Promise<void> {
  if (fieldsToUpgrade.value.length === 0) {
    statusTone.value = 'error'
    statusMessage.value = 'Select at least one AI field to update.'
    return
  }

  isGeneratingFields.value = true
  statusMessage.value = ''

  try {
    await characterStore.generateFields(fieldsToUpgrade.value)

    if (characterStore.lastError) {
      throw new Error(characterStore.lastError)
    }

    statusTone.value = 'success'
    statusMessage.value = 'Selected character fields updated.'
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to generate character fields.'
  } finally {
    isGeneratingFields.value = false
  }
}

async function saveCharacter(): Promise<void> {
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
