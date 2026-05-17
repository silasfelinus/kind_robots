<!-- /components/builders/art-creator.vue -->
<template>
  <section class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4">
    <header class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200 p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-base-content/50">
            {{ contextLabel }} Art Creator
          </p>

          <h3 class="flex items-center gap-2 text-xl font-bold text-base-content">
            <Icon :name="contextIcon" class="h-6 w-6 text-primary" />
            {{ title }}
          </h3>

          <p class="text-sm text-base-content/70">
            {{ description }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <button
            class="btn btn-sm rounded-xl"
            :class="mode === 'prompt' ? 'btn-primary' : 'btn-ghost border border-base-300'"
            type="button"
            @click="mode = 'prompt'"
          >
            <Icon name="kind-icon:prompt" class="h-4 w-4" />
            Prompt
          </button>

          <button
            class="btn btn-sm rounded-xl"
            :class="mode === 'upload' ? 'btn-primary' : 'btn-ghost border border-base-300'"
            type="button"
            @click="mode = 'upload'"
          >
            <Icon name="kind-icon:save" class="h-4 w-4" />
            Upload
          </button>

          <button
            class="btn btn-sm rounded-xl"
            :class="mode === 'gallery' ? 'btn-primary' : 'btn-ghost border border-base-300'"
            type="button"
            @click="mode = 'gallery'"
          >
            <Icon name="kind-icon:gallery" class="h-4 w-4" />
            Gallery
          </button>

          <button
            class="btn btn-sm rounded-xl"
            :class="mode === 'generate' ? 'btn-primary' : 'btn-ghost border border-base-300'"
            type="button"
            @click="mode = 'generate'"
          >
            <Icon name="kind-icon:wand" class="h-4 w-4" />
            Generate
          </button>
        </div>
      </div>
    </header>

    <main class="rounded-2xl border border-base-300 bg-base-200 p-4">
      <section v-if="mode === 'prompt'" class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem]">
        <div class="flex flex-col gap-3">
          <label class="form-control">
            <span class="label-text font-bold">Positive Prompt</span>

            <textarea
              v-model="localPrompt"
              class="textarea textarea-bordered min-h-52 rounded-2xl text-base"
              :placeholder="promptPlaceholder"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Negative Prompt</span>

            <textarea
              v-model="localNegativePrompt"
              class="textarea textarea-bordered min-h-28 rounded-2xl text-base"
              placeholder="text, watermark, logo, signature, blurry, low quality..."
            />
          </label>
        </div>

        <aside class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
          <h4 class="font-bold text-base-content">
            Prompt Helpers
          </h4>

          <button class="btn btn-secondary rounded-xl" type="button" @click="buildContextPrompt">
            <Icon name="kind-icon:sparkles" class="h-4 w-4" />
            Build Context Prompt
          </button>

          <button class="btn rounded-xl" type="button" @click="appendNoText">
            <Icon name="kind-icon:close" class="h-4 w-4" />
            No Text / Watermark
          </button>

          <button class="btn rounded-xl" type="button" @click="clearPrompt">
            <Icon name="kind-icon:trash" class="h-4 w-4" />
            Clear Prompt
          </button>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-base-content/50">
              Context Hint
            </p>

            <p class="mt-2 text-sm text-base-content/70">
              {{ contextHint }}
            </p>
          </div>
        </aside>
      </section>

      <section v-else-if="mode === 'upload'" class="flex flex-col gap-3">
        <h4 class="flex items-center gap-2 font-bold text-base-content">
          <Icon name="kind-icon:save" class="h-5 w-5 text-primary" />
          Upload {{ contextLabel }} Art
        </h4>

        <p class="text-sm text-base-content/60">
          Upload an image into the ArtImage flow and connect it to this builder context.
        </p>

        <image-upload />
      </section>

      <section v-else-if="mode === 'gallery'" class="flex flex-col gap-3">
        <h4 class="flex items-center gap-2 font-bold text-base-content">
          <Icon name="kind-icon:gallery" class="h-5 w-5 text-primary" />
          Select Existing Art
        </h4>

        <p class="text-sm text-base-content/60">
          Pick an existing uploaded or generated image for this {{ contextLabel.toLowerCase() }}.
        </p>

        <art-gallery />
      </section>

      <section v-else-if="mode === 'generate'" class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem]">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h4 class="flex items-center gap-2 font-bold text-base-content">
            <Icon name="kind-icon:wand" class="h-5 w-5 text-primary" />
            Generate {{ contextLabel }} Art
          </h4>

          <p class="mt-1 text-sm text-base-content/60">
            Sync the prompt and options into the art store, then use the existing generator.
          </p>

          <div class="mt-4">
            <art-generator />
          </div>
        </div>

        <aside class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
          <h4 class="font-bold text-base-content">
            Generator Options
          </h4>

          <div class="grid grid-cols-2 gap-2">
            <label class="form-control">
              <span class="label-text font-bold">Width</span>

              <select v-model.number="width" class="select select-bordered rounded-2xl">
                <option :value="512">512</option>
                <option :value="768">768</option>
                <option :value="1024">1024</option>
                <option :value="1216">1216</option>
                <option :value="1344">1344</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Height</span>

              <select v-model.number="height" class="select select-bordered rounded-2xl">
                <option :value="512">512</option>
                <option :value="768">768</option>
                <option :value="1024">1024</option>
                <option :value="1216">1216</option>
                <option :value="1344">1344</option>
              </select>
            </label>

            <label class="form-control">
              <span class="label-text font-bold">Steps</span>

              <input
                v-model.number="steps"
                class="input input-bordered rounded-2xl"
                type="number"
                min="1"
                max="80"
              />
            </label>

            <label class="form-control">
              <span class="label-text font-bold">CFG</span>

              <input
                v-model.number="cfg"
                class="input input-bordered rounded-2xl"
                type="number"
                min="1"
                max="20"
                step="0.5"
              />
            </label>
          </div>

          <label class="form-control">
            <span class="label-text font-bold">Seed</span>

            <input
              v-model.number="seed"
              class="input input-bordered rounded-2xl"
              type="number"
            />
          </label>

          <div class="grid grid-cols-3 gap-2">
            <button class="btn btn-sm rounded-xl" type="button" @click="useSquare">
              Square
            </button>

            <button class="btn btn-sm rounded-xl" type="button" @click="useLandscape">
              Wide
            </button>

            <button class="btn btn-sm rounded-xl" type="button" @click="usePortrait">
              Tall
            </button>
          </div>

          <button class="btn btn-primary rounded-xl" type="button" @click="syncToArtStore">
            <Icon name="kind-icon:sliders" class="h-4 w-4" />
            Apply to Art Store
          </button>

          <p
            v-if="syncMessage"
            class="rounded-2xl border border-info/30 bg-info/10 p-3 text-sm text-info"
          >
            {{ syncMessage }}
          </p>
        </aside>
      </section>
    </main>

    <section class="rounded-2xl border border-base-300 bg-base-200 p-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="item in summaryItems"
          :key="item.key"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start gap-3">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-base-300">
              <img
                v-if="item.image"
                :src="item.image"
                :alt="item.label"
                class="h-full w-full object-cover"
              />

              <Icon
                v-else
                :name="item.icon"
                class="h-6 w-6 text-primary"
              />
            </div>

            <div class="min-w-0">
              <p class="font-bold text-base-content">
                {{ item.label }}
              </p>

              <p class="mt-1 line-clamp-3 text-sm text-base-content/70">
                {{ item.value || 'Not selected yet' }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { handleError } from '@/stores/utils'

type ArtCreatorPurpose =
  | 'user'
  | 'pitch'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'

type ArtCreatorMode = 'prompt' | 'upload' | 'gallery' | 'generate'

type ArtStoreLike = {
  artForm?: Record<string, unknown>
  form?: Record<string, unknown>
  selectedArtImage?: {
    id?: number
    imagePath?: string | null
    imageData?: string | null
    path?: string | null
  } | null
  selectedImage?: {
    id?: number
    imagePath?: string | null
    imageData?: string | null
    path?: string | null
  } | null
  selectedArt?: {
    id?: number
    imagePath?: string | null
    path?: string | null
  } | null
  updateArtForm?: (patch: Record<string, unknown>) => void
  setArtForm?: (patch: Record<string, unknown>) => void
}

const props = withDefaults(
  defineProps<{
    purpose: ArtCreatorPurpose
    title?: string
    description?: string
    modelId?: number | null
    modelTitle?: string
    prompt?: string
    negativePrompt?: string
    imageRole?: string
  }>(),
  {
    title: '',
    description: '',
    modelId: null,
    modelTitle: '',
    prompt: '',
    negativePrompt: 'text, watermark, logo, signature, blurry, low quality',
    imageRole: '',
  },
)

const emit = defineEmits<{
  update: [
    payload: {
      purpose: ArtCreatorPurpose
      modelId: number | null
      modelTitle: string
      prompt: string
      negativePrompt: string
      imageRole: string
      imagePath: string | null
    },
  ]
}>()

const artStore = useArtStore() as unknown as ArtStoreLike

const mode = ref<ArtCreatorMode>('prompt')
const localPrompt = ref(props.prompt)
const localNegativePrompt = ref(props.negativePrompt)
const width = ref(1024)
const height = ref(1024)
const steps = ref(28)
const cfg = ref(3.5)
const seed = ref(-1)
const syncMessage = ref('')

const contextMap: Record<
  ArtCreatorPurpose,
  {
    label: string
    icon: string
    title: string
    description: string
    role: string
    hint: string
    placeholder: string
  }
> = {
  user: {
    label: 'User',
    icon: 'kind-icon:person',
    title: 'Create User Avatar',
    description:
      'Create or select avatar art for the user identity and designer profile.',
    role: 'avatar',
    hint:
      'Focus on identity, expression, profile readability, and a strong silhouette.',
    placeholder:
      'A friendly robot designer avatar with expressive eyes, butterfly accents, cozy sci-fi lighting...',
  },
  pitch: {
    label: 'Pitch',
    icon: 'kind-icon:idea',
    title: 'Create Pitch Art',
    description:
      'Create a cover or inspiration image for the big-picture pitch.',
    role: 'cover',
    hint:
      'Sell the premise at a glance. Prioritize bold composition and clear genre signal.',
    placeholder:
      'A cinematic cover image for a surreal fantasy world where...',
  },
  dream: {
    label: 'Dream',
    icon: 'kind-icon:moon',
    title: 'Create Dream Art',
    description:
      'Create setting, vibe, location, or cover art for the evolved dream world.',
    role: 'world',
    hint:
      'Prioritize setting, atmosphere, visual rules, and story-rich environmental details.',
    placeholder:
      'A dreamlike location with strange architecture, atmospheric lighting, and story hooks...',
  },
  character: {
    label: 'Character',
    icon: 'kind-icon:mask',
    title: 'Create Character Art',
    description:
      'Create portrait, full-body, or scene art for a playable or chattable character.',
    role: 'portrait',
    hint:
      'Prioritize personality, pose, clothing, expression, silhouette, and role in the world.',
    placeholder:
      'A character portrait of a charming disaster wizard with...',
  },
  reward: {
    label: 'Reward',
    icon: 'kind-icon:gift',
    title: 'Create Reward Art',
    description:
      'Create item, relic, skill, power, curse, or story-key art.',
    role: 'object',
    hint:
      'Focus on the object or power itself, its texture, symbolism, and story function.',
    placeholder:
      'A magical artifact shaped like..., glowing with..., presented as...',
  },
  scenario: {
    label: 'Scenario',
    icon: 'kind-icon:map',
    title: 'Create Scenario Art',
    description:
      'Create a scene image for a branching adventure choice or narrative moment.',
    role: 'scene',
    hint:
      'Frame a moment with tension, choice, environment, character stakes, and consequence.',
    placeholder:
      'A dramatic story scene where characters must choose between...',
  },
}

const context = computed(() => contextMap[props.purpose])
const contextLabel = computed(() => context.value.label)
const contextIcon = computed(() => context.value.icon)
const title = computed(() => props.title || context.value.title)
const description = computed(() => props.description || context.value.description)
const contextHint = computed(() => context.value.hint)
const promptPlaceholder = computed(() => context.value.placeholder)
const resolvedImageRole = computed(() => props.imageRole || context.value.role)

const previewImage = computed(() => {
  return (
    artStore.selectedArtImage?.imagePath ||
    artStore.selectedArtImage?.imageData ||
    artStore.selectedArtImage?.path ||
    artStore.selectedImage?.imagePath ||
    artStore.selectedImage?.imageData ||
    artStore.selectedImage?.path ||
    artStore.selectedArt?.imagePath ||
    artStore.selectedArt?.path ||
    null
  )
})

const summaryItems = computed(() => [
  {
    key: 'purpose',
    label: 'Purpose',
    value: `${contextLabel.value} ${resolvedImageRole.value}`,
    icon: contextIcon.value,
  },
  {
    key: 'mode',
    label: 'Mode',
    value: mode.value,
    icon:
      mode.value === 'upload'
        ? 'kind-icon:save'
        : mode.value === 'gallery'
          ? 'kind-icon:gallery'
          : mode.value === 'generate'
            ? 'kind-icon:wand'
            : 'kind-icon:prompt',
  },
  {
    key: 'prompt',
    label: 'Prompt',
    value: localPrompt.value,
    icon: 'kind-icon:prompt',
  },
  {
    key: 'preview',
    label: 'Preview',
    value: previewImage.value ? 'Image selected' : 'No image selected',
    image: previewImage.value,
    icon: 'kind-icon:image',
  },
])

function buildContextPrompt() {
  const modelTitle = props.modelTitle.trim()
  const base = modelTitle
    ? `Create original ${resolvedImageRole.value} art for "${modelTitle}".`
    : `Create original ${resolvedImageRole.value} art for a Kind Robots ${contextLabel.value.toLowerCase()}.`

  const addition = [
    base,
    contextHint.value,
    'Strong composition, expressive atmosphere, no text, no watermark.',
  ].join(' ')

  localPrompt.value = localPrompt.value.trim()
    ? `${localPrompt.value.trim()}\n\n${addition}`
    : addition

  emitUpdate()
}

function appendNoText() {
  const additions = ['text', 'watermark', 'logo', 'signature']
  const existing = localNegativePrompt.value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  for (const addition of additions) {
    if (!existing.includes(addition)) {
      existing.push(addition)
    }
  }

  localNegativePrompt.value = existing.join(', ')
  emitUpdate()
}

function clearPrompt() {
  localPrompt.value = ''
  emitUpdate()
}

function useSquare() {
  width.value = 1024
  height.value = 1024
}

function useLandscape() {
  width.value = 1344
  height.value = 768
}

function usePortrait() {
  width.value = 768
  height.value = 1344
}

function syncToArtStore() {
  const patch = {
    purpose: props.purpose,
    modelId: props.modelId,
    modelTitle: props.modelTitle,
    imageRole: resolvedImageRole.value,
    prompt: localPrompt.value,
    negativePrompt: localNegativePrompt.value,
    width: width.value,
    height: height.value,
    steps: steps.value,
    cfg: cfg.value,
    seed: seed.value,
  }

  try {
    if (typeof artStore.updateArtForm === 'function') {
      artStore.updateArtForm(patch)
      syncMessage.value = 'Art store options updated.'
      emitUpdate()
      return
    }

    if (typeof artStore.setArtForm === 'function') {
      artStore.setArtForm(patch)
      syncMessage.value = 'Art store form updated.'
      emitUpdate()
      return
    }

    if (artStore.artForm && typeof artStore.artForm === 'object') {
      Object.assign(artStore.artForm, patch)
      syncMessage.value = 'Art form patched directly.'
      emitUpdate()
      return
    }

    if (artStore.form && typeof artStore.form === 'object') {
      Object.assign(artStore.form, patch)
      syncMessage.value = 'Art store form patched directly.'
      emitUpdate()
      return
    }

    syncMessage.value =
      'No writable art form method found. Generator can still use its own store state.'
    emitUpdate()
  } catch (error) {
    handleError(error, 'syncing art-creator to artStore')
    syncMessage.value = 'Could not sync options to art store.'
  }
}

function emitUpdate() {
  emit('update', {
    purpose: props.purpose,
    modelId: props.modelId,
    modelTitle: props.modelTitle,
    prompt: localPrompt.value,
    negativePrompt: localNegativePrompt.value,
    imageRole: resolvedImageRole.value,
    imagePath: previewImage.value,
  })
}

watch(
  () => props.prompt,
  (value) => {
    localPrompt.value = value
  },
)

watch(
  () => props.negativePrompt,
  (value) => {
    localNegativePrompt.value = value
  },
)

watch([localPrompt, localNegativePrompt, previewImage], () => {
  emitUpdate()
})
</script>