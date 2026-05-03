<!-- /components/content/bots/add-bot.vue -->
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
      v-if="mode === 'edit' && !botStore.currentBot"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Select a bot before editing.
    </div>

    <template v-else>
      <section
        class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div
            class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 class="text-xl font-bold text-base-content">Identity</h2>

              <p class="text-sm text-base-content/70">
                Define the bot’s visible profile and general vibe.
              </p>
            </div>

            <button
              class="btn btn-sm btn-secondary rounded-xl"
              type="button"
              @click="seedBot"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Seed
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Name</span>
              </span>

              <input
                v-model="botStore.botForm.name"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="Dotti"
                :disabled="isKept('name')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Subtitle</span>
              </span>

              <input
                v-model="botStore.botForm.subtitle"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="Tiny robot, big opinions"
                :disabled="isKept('subtitle')"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label">
                <span class="label-text font-bold">Description</span>
              </span>

              <textarea
                v-model="botStore.botForm.description"
                class="textarea textarea-bordered min-h-28 w-full bg-base-200"
                placeholder="Describe what this bot does..."
                :disabled="isKept('description')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Tagline</span>
              </span>

              <input
                v-model="botStore.botForm.tagline"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="Now with 30% more charm."
                :disabled="isKept('tagline')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Bot Type</span>
              </span>

              <select
                v-model="botStore.botForm.BotType"
                class="select select-bordered w-full bg-base-200"
              >
                <option value="assistant">assistant</option>
                <option value="character">character</option>
                <option value="tool">tool</option>
                <option value="host">host</option>
                <option value="weird">weird</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Designer</span>
              </span>

              <input
                v-model="botStore.botForm.designer"
                type="text"
                class="input input-bordered w-full bg-base-200"
                :disabled="!canEditDesigner"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Theme</span>
              </span>

              <input
                v-model="botStore.botForm.theme"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="cyber-cafe, moth-oracle, bot-lab..."
              />
            </label>
          </div>
        </div>

        <aside class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">Avatar</h2>

              <p class="text-sm text-base-content/70">
                Use a URL/path or borrow a gallery image.
              </p>
            </div>

            <Icon name="kind-icon:robot" class="h-8 w-8 text-primary" />
          </div>

          <img
            :src="botImage"
            alt="Bot avatar"
            class="h-72 w-full rounded-2xl border border-base-300 bg-base-300 object-cover"
          />

          <div class="mt-4 flex flex-col gap-3">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Avatar Image</span>
              </span>

              <input
                v-model="avatarImageModel"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="/images/bot.webp"
                :disabled="isKept('avatarImage')"
              />
            </label>

            <div
              class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <span class="text-sm font-bold">Keep avatar</span>

              <input
                v-model="keepField.avatarImage"
                type="checkbox"
                class="toggle toggle-primary"
                @change="handleKeepFieldChange('avatarImage')"
              />
            </div>

            <button
              class="btn btn-secondary rounded-xl"
              type="button"
              @click="useRandomGalleryImage"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Random Gallery Image
            </button>
          </div>
        </aside>
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
              Select fields for AI to refresh. Fields marked “keep” are
              protected.
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
              <label
                class="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-base-100 px-3 py-2 text-sm"
              >
                <span>AI update</span>

                <input
                  v-model="useGenerated[field.key]"
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
                  v-model="keepField[field.key]"
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-primary"
                  @change="handleKeepFieldChange(field.key)"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Personality and Prompt
          </h2>

          <div class="grid gap-4">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Personality</span>
              </span>

              <textarea
                v-model="botStore.botForm.personality"
                class="textarea textarea-bordered min-h-32 w-full bg-base-200"
                placeholder="How should this bot behave?"
                :disabled="isKept('personality')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">System Prompt</span>
              </span>

              <textarea
                v-model="botStore.botForm.prompt"
                class="textarea textarea-bordered min-h-44 w-full bg-base-200"
                placeholder="Core model instructions..."
                :disabled="isKept('prompt')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Sample Response</span>
              </span>

              <textarea
                v-model="botStore.botForm.sampleResponse"
                class="textarea textarea-bordered min-h-28 w-full bg-base-200"
                placeholder="Example of how this bot answers..."
                :disabled="isKept('sampleResponse')"
              />
            </label>
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-xl font-bold text-base-content">
            Conversation Intros
          </h2>

          <div class="grid gap-4">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Bot Intro</span>
              </span>

              <textarea
                v-model="botStore.botForm.botIntro"
                class="textarea textarea-bordered min-h-36 w-full bg-base-200"
                placeholder="Opening message from the bot..."
                :disabled="isKept('botIntro')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">User Intro</span>
              </span>

              <textarea
                v-model="botStore.botForm.userIntro"
                class="textarea textarea-bordered min-h-36 w-full bg-base-200"
                placeholder="Suggested first user prompt. Separate quick prompts with |"
                :disabled="isKept('userIntro')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Modules</span>
              </span>

              <textarea
                v-model="botStore.botForm.modules"
                class="textarea textarea-bordered min-h-24 w-full bg-base-200"
                placeholder="Optional module notes..."
              />
            </label>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-4">
          <h2 class="text-xl font-bold text-base-content">Publishing</h2>

          <p class="text-sm text-base-content/70">
            Control visibility and construction status. The text engine is
            chosen at chat time.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label
            class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <span class="label-text font-bold">Public</span>

            <input
              v-model="botStore.botForm.isPublic"
              type="checkbox"
              class="toggle toggle-success"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <span class="label-text font-bold">Under Construction</span>

            <input
              v-model="botStore.botForm.underConstruction"
              type="checkbox"
              class="toggle toggle-warning"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <span class="label-text font-bold">Can Delete</span>

            <input
              v-model="botStore.botForm.canDelete"
              type="checkbox"
              class="toggle toggle-error"
            />
          </label>
        </div>
      </section>

      <div
        v-if="botStore.lastError"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ botStore.lastError }}
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
          :disabled="botStore.isSaving || !canSave"
          @click="saveBot"
        >
          <span
            v-if="botStore.isSaving"
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
import { useBotStore, type BotForm } from '@/stores/botStore'
import { useGalleryStore } from '@/stores/galleryStore'
import { useUserStore } from '@/stores/userStore'

type BotFieldKey = keyof BotForm & string

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

const botStore = useBotStore()
const galleryStore = useGalleryStore()
const userStore = useUserStore()

const keepField = reactive<Record<string, boolean>>({})
const useGenerated = reactive<Record<string, boolean>>({})

const isGeneratingFields = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const mode = computed(() => props.mode)

const title = computed(() => (mode.value === 'edit' ? 'Edit Bot' : 'Create Bot'))

const subtitle = computed(() =>
  mode.value === 'edit'
    ? 'Tune the bot’s prompt, personality, avatar, and portable behavior.'
    : 'Build a fresh bot with a clear job, voice, and tiny spark of nonsense.',
)

const saveLabel = computed(() =>
  mode.value === 'edit' ? 'Save Bot' : 'Create Bot',
)

const canSave = computed(() => Boolean(botStore.botForm.name?.trim()))

const canEditDesigner = computed(() => {
  return !botStore.selectedBotId || botStore.botForm.userId === userStore.userId
})

const botImage = computed(() => {
  return (
    botStore.currentImagePath ||
    botStore.botForm.avatarImage ||
    '/images/bot.webp'
  )
})

const avatarImageModel = computed({
  get: () => botStore.botForm.avatarImage || '',
  set: (value: string) => {
    botStore.setCurrentImagePath(value)
  },
})

const aiFields: Array<{
  key: BotFieldKey
  label: string
  description: string
  icon: string
}> = [
  {
    key: 'name',
    label: 'Name',
    description: 'Refresh the bot name.',
    icon: 'kind-icon:robot',
  },
  {
    key: 'subtitle',
    label: 'Subtitle',
    description: 'Refresh the short subtitle.',
    icon: 'kind-icon:quote',
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Refresh the visible description.',
    icon: 'kind-icon:book',
  },
  {
    key: 'tagline',
    label: 'Tagline',
    description: 'Refresh the punchy one-liner.',
    icon: 'kind-icon:sparkles',
  },
  {
    key: 'personality',
    label: 'Personality',
    description: 'Refresh voice and behavior.',
    icon: 'kind-icon:stars',
  },
  {
    key: 'prompt',
    label: 'System Prompt',
    description: 'Refresh model instructions.',
    icon: 'kind-icon:terminal',
  },
  {
    key: 'botIntro',
    label: 'Bot Intro',
    description: 'Refresh bot opening text.',
    icon: 'kind-icon:message',
  },
  {
    key: 'userIntro',
    label: 'User Intro',
    description: 'Refresh suggested user prompt.',
    icon: 'kind-icon:person',
  },
  {
    key: 'sampleResponse',
    label: 'Sample Response',
    description: 'Refresh example output.',
    icon: 'kind-icon:chat',
  },
  {
    key: 'avatarImage',
    label: 'Avatar',
    description: 'Protect or refresh avatar path.',
    icon: 'kind-icon:image',
  },
]

const fieldsToUpgrade = computed(() => {
  return aiFields
    .filter((field) => {
      return Boolean(useGenerated[field.key]) && !Boolean(keepField[field.key])
    })
    .map((field) => field.key)
})

onMounted(async () => {
  await Promise.all([
    botStore.initialize({
      fetchRemote: true,
      initializeServerStore: false,
      createBlankForm: true,
    }),
    galleryStore.initialize(),
  ])

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
    void resetFromSelected()
    return
  }

  const hasFormData = Object.keys(botStore.botForm || {}).length > 0

  if (!hasFormData) {
    resetForAdd()
  }
}

function resetForAdd() {
  botStore.startAddingBot()
  statusMessage.value = ''
}

async function resetFromSelected() {
  await botStore.startEditingBot()
  statusMessage.value = ''
}

function isKept(field: string) {
  return Boolean(keepField[field])
}

function handleKeepFieldChange(field: string) {
  if (keepField[field]) {
    useGenerated[field] = false
  }
}

function seedBot() {
  botStore.setBotForm({
    name: botStore.botForm.name || 'Helpful Goblin',
    subtitle:
      botStore.botForm.subtitle || 'Questionably wise, suspiciously useful',
    description:
      botStore.botForm.description ||
      'A friendly assistant bot that helps users turn messy ideas into useful next steps.',
    personality:
      botStore.botForm.personality ||
      'Friendly, clever, direct, mildly whimsical, and allergic to boring answers.',
    prompt:
      botStore.botForm.prompt ||
      'You are a helpful, creative assistant. Be clear, practical, and charming. Ask questions only when truly needed.',
    botIntro:
      botStore.botForm.botIntro ||
      'Hello. I have arrived with tiny tools and large opinions.',
    userIntro:
      botStore.botForm.userIntro ||
      'Help me turn this idea into something useful.|Make this clearer.|Give me three weird options.',
    tagline: botStore.botForm.tagline || 'Debugging reality, politely.',
  })

  statusTone.value = 'success'
  statusMessage.value = 'Bot seed applied.'
}

async function useRandomGalleryImage() {
  const image = await galleryStore.changeToRandomImage()

  if (image) {
    botStore.setCurrentImagePath(image)
    statusTone.value = 'success'
    statusMessage.value = 'Random avatar applied.'
    return
  }

  statusTone.value = 'error'
  statusMessage.value = 'No gallery image was available.'
}

async function generateSelectedFields() {
  if (fieldsToUpgrade.value.length === 0) {
    statusTone.value = 'error'
    statusMessage.value = 'Select at least one AI field to update.'
    return
  }

  isGeneratingFields.value = true
  statusMessage.value = ''

  try {
    const result = await botStore.generateFields(fieldsToUpgrade.value)

    if (!result.success) {
      throw new Error(result.message)
    }

    statusTone.value = 'success'
    statusMessage.value = result.message
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to generate bot fields.'
  } finally {
    isGeneratingFields.value = false
  }
}

async function saveBot() {
  const result = await botStore.saveBot()

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