<!-- /components/builder/art-designer.vue -->
<template>
  <section
    class="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-4"
  >
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header class="rounded-xl border border-base-300 bg-base-200/60 p-3">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="flex items-start gap-3">
          <span
            class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
          >
            <Icon :name="contextIcon" class="h-5 w-5" />
          </span>
          <div class="min-w-0">
            <p
              class="text-[0.62rem] font-black uppercase tracking-[0.22em] text-base-content/40"
            >
              {{ contextLabel }} Art Creator
            </p>
            <h3 class="text-lg font-black text-base-content">{{ title }}</h3>
            <p class="text-sm text-base-content/60">{{ description }}</p>
          </div>
        </div>

        <!-- Mode tab strip -->
        <div
          class="flex shrink-0 overflow-hidden rounded-xl border border-base-300 bg-base-100"
        >
          <button
            v-for="tab in modeTabs"
            :key="tab.value"
            class="flex items-center gap-1.5 px-3 py-2 text-xs font-black transition"
            :class="
              mode === tab.value
                ? 'bg-primary text-primary-content'
                : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'
            "
            type="button"
            @click="mode = tab.value"
          >
            <Icon :name="tab.icon" class="h-3.5 w-3.5" />
            {{ tab.label }}
          </button>
        </div>
      </div>
    </header>

    <!-- ── Mode content ──────────────────────────────────────────────────── -->
    <main class="rounded-xl border border-base-300 bg-base-200/40 p-4">
      <!-- Prompt mode -->
      <section
        v-if="mode === 'prompt'"
        class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem]"
      >
        <div class="flex flex-col gap-3">
          <label class="form-control">
            <span class="label-text font-bold">Positive Prompt</span>
            <textarea
              v-model="localPrompt"
              class="textarea textarea-bordered min-h-52 rounded-2xl text-base leading-relaxed"
              :placeholder="promptPlaceholder"
            />
          </label>

          <label class="form-control">
            <span class="label-text font-bold">Negative Prompt</span>
            <textarea
              v-model="localNegativePrompt"
              class="textarea textarea-bordered min-h-24 rounded-2xl text-sm"
              placeholder="text, watermark, logo, signature, blurry, low quality..."
            />
          </label>
        </div>

        <aside
          class="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h4
            class="flex items-center gap-2 text-sm font-black text-base-content"
          >
            <Icon name="kind-icon:sparkles" class="h-4 w-4 text-primary" />
            Prompt Helpers
          </h4>

          <button
            class="btn btn-secondary btn-sm rounded-xl"
            type="button"
            @click="buildContextPrompt"
          >
            <Icon name="kind-icon:wand" class="h-4 w-4" />
            Build Context Prompt
          </button>

          <button
            class="btn btn-ghost btn-sm rounded-xl border border-base-300"
            type="button"
            @click="appendNoText"
          >
            <Icon name="kind-icon:close" class="h-4 w-4" />
            No Text / Watermark
          </button>

          <button
            class="btn btn-ghost btn-sm rounded-xl border border-base-300"
            type="button"
            @click="clearPrompt"
          >
            <Icon name="kind-icon:trash" class="h-4 w-4" />
            Clear Prompt
          </button>

          <div class="mt-1 rounded-xl border border-base-300 bg-base-200 p-3">
            <p
              class="text-[0.58rem] font-black uppercase tracking-widest text-base-content/40"
            >
              Context Hint
            </p>
            <p class="mt-2 text-sm text-base-content/65 leading-relaxed">
              {{ contextHint }}
            </p>
          </div>
        </aside>
      </section>

      <!-- Upload mode -->
      <section v-else-if="mode === 'upload'" class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary"
          >
            <Icon name="kind-icon:save" class="h-4 w-4" />
          </span>
          <div>
            <h4 class="text-sm font-black text-base-content">
              Upload {{ contextLabel }} Art
            </h4>
            <p class="text-xs text-base-content/55">
              Upload an image and connect it to this builder context.
            </p>
          </div>
        </div>
        <image-upload />
      </section>

      <!-- Gallery mode -->
      <section v-else-if="mode === 'gallery'" class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/15 text-secondary"
          >
            <Icon name="kind-icon:gallery" class="h-4 w-4" />
          </span>
          <div>
            <h4 class="text-sm font-black text-base-content">
              Select Existing Art
            </h4>
            <p class="text-xs text-base-content/55">
              Pick an existing image for this {{ contextLabel.toLowerCase() }}.
            </p>
          </div>
        </div>
        <art-gallery />
      </section>

      <!-- Generate mode -->
      <section
        v-else-if="mode === 'generate'"
        class="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem]"
      >
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-3 flex items-center gap-2">
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 text-accent"
            >
              <Icon name="kind-icon:wand" class="h-4 w-4" />
            </span>
            <div>
              <h4 class="text-sm font-black text-base-content">
                Generate {{ contextLabel }} Art
              </h4>
              <p class="text-xs text-base-content/55">
                Sync prompt to art store, then use the generator.
              </p>
            </div>
          </div>
          <generate-button />
        </div>

        <aside
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
        >
          <h4
            class="flex items-center gap-2 text-sm font-black text-base-content"
          >
            <Icon name="kind-icon:settings" class="h-4 w-4 text-primary" />
            Generator Options
          </h4>

          <div class="grid grid-cols-2 gap-2">
            <label class="form-control">
              <span class="label-text text-xs font-bold">Width</span>
              <select
                v-model.number="width"
                class="select select-bordered select-sm rounded-xl"
              >
                <option :value="512">512</option>
                <option :value="768">768</option>
                <option :value="1024">1024</option>
                <option :value="1216">1216</option>
                <option :value="1344">1344</option>
              </select>
            </label>
            <label class="form-control">
              <span class="label-text text-xs font-bold">Height</span>
              <select
                v-model.number="height"
                class="select select-bordered select-sm rounded-xl"
              >
                <option :value="512">512</option>
                <option :value="768">768</option>
                <option :value="1024">1024</option>
                <option :value="1216">1216</option>
                <option :value="1344">1344</option>
              </select>
            </label>
            <label class="form-control">
              <span class="label-text text-xs font-bold">Steps</span>
              <input
                v-model.number="steps"
                class="input input-bordered input-sm rounded-xl"
                type="number"
                min="1"
                max="80"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs font-bold">CFG</span>
              <input
                v-model.number="cfg"
                class="input input-bordered input-sm rounded-xl"
                type="number"
                min="1"
                max="20"
                step="0.5"
              />
            </label>
          </div>

          <label class="form-control">
            <span class="label-text text-xs font-bold">Seed</span>
            <input
              v-model.number="seed"
              class="input input-bordered input-sm rounded-xl"
              type="number"
            />
          </label>

          <!-- Aspect ratio quick buttons -->
          <div class="grid grid-cols-3 gap-1.5">
            <button
              class="btn btn-xs rounded-lg"
              type="button"
              @click="useSquare"
            >
              Square
            </button>
            <button
              class="btn btn-xs rounded-lg"
              type="button"
              @click="useLandscape"
            >
              Wide
            </button>
            <button
              class="btn btn-xs rounded-lg"
              type="button"
              @click="usePortrait"
            >
              Tall
            </button>
          </div>

          <button
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="syncToArtStore"
          >
            <Icon name="kind-icon:sliders" class="h-4 w-4" />
            Apply to Art Store
          </button>

          <div
            v-if="syncMessage"
            class="flex items-center gap-2 rounded-xl border border-info/30 bg-info/10 p-2.5 text-xs font-semibold text-info"
          >
            <Icon name="kind-icon:check" class="h-3.5 w-3.5 shrink-0" />
            {{ syncMessage }}
          </div>
        </aside>
      </section>
    </main>

    <!-- ── Summary strip ──────────────────────────────────────────────── -->
    <section class="rounded-xl border border-base-300 bg-base-200/40 p-3">
      <div class="grid grid-cols-2 gap-2 md:grid-cols-4">
        <article
          v-for="item in summaryItems"
          :key="item.key"
          class="flex items-start gap-2 rounded-xl border border-base-300 bg-base-100 p-2.5"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base-200"
          >
            <img
              v-if="item.image"
              :src="item.image"
              :alt="item.label"
              class="h-full w-full object-cover"
            />
            <Icon v-else :name="item.icon" class="h-5 w-5 text-primary" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[0.58rem] font-black uppercase tracking-widest text-base-content/40"
            >
              {{ item.label }}
            </p>
            <p
              class="mt-0.5 line-clamp-2 text-xs font-semibold text-base-content/80"
            >
              {{ item.value || 'Not selected yet' }}
            </p>
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

const modeTabs = [
  {
    value: 'prompt' as ArtCreatorMode,
    label: 'Prompt',
    icon: 'kind-icon:prompt',
  },
  {
    value: 'upload' as ArtCreatorMode,
    label: 'Upload',
    icon: 'kind-icon:save',
  },
  {
    value: 'gallery' as ArtCreatorMode,
    label: 'Gallery',
    icon: 'kind-icon:gallery',
  },
  {
    value: 'generate' as ArtCreatorMode,
    label: 'Generate',
    icon: 'kind-icon:wand',
  },
]

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
    hint: 'Focus on identity, expression, profile readability, and a strong silhouette.',
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
    hint: 'Sell the premise at a glance. Prioritize bold composition and clear genre signal.',
    placeholder: 'A cinematic cover image for a surreal fantasy world where...',
  },
  dream: {
    label: 'Dream',
    icon: 'kind-icon:moon',
    title: 'Create Dream Art',
    description:
      'Create setting, vibe, location, or cover art for the evolved dream world.',
    role: 'world',
    hint: 'Prioritize setting, atmosphere, visual rules, and story-rich environmental details.',
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
    hint: 'Prioritize personality, pose, clothing, expression, silhouette, and role in the world.',
    placeholder: 'A character portrait of a charming disaster wizard with...',
  },
  reward: {
    label: 'Reward',
    icon: 'kind-icon:gift',
    title: 'Create Reward Art',
    description: 'Create item, relic, skill, power, curse, or story-key art.',
    role: 'object',
    hint: 'Focus on the object or power itself, its texture, symbolism, and story function.',
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
    hint: 'Frame a moment with tension, choice, environment, character stakes, and consequence.',
    placeholder:
      'A dramatic story scene where characters must choose between...',
  },
}

const context = computed(() => contextMap[props.purpose])
const contextLabel = computed(() => context.value.label)
const contextIcon = computed(() => context.value.icon)
const title = computed(() => props.title || context.value.title)
const description = computed(
  () => props.description || context.value.description,
)
const contextHint = computed(() => context.value.hint)
const promptPlaceholder = computed(() => context.value.placeholder)
const resolvedImageRole = computed(() => props.imageRole || context.value.role)

const previewImage = computed(
  () =>
    artStore.selectedArtImage?.imagePath ||
    artStore.selectedArtImage?.imageData ||
    artStore.selectedArtImage?.path ||
    artStore.selectedImage?.imagePath ||
    artStore.selectedImage?.imageData ||
    artStore.selectedImage?.path ||
    artStore.selectedArt?.imagePath ||
    artStore.selectedArt?.path ||
    null,
)

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
      modeTabs.find((t) => t.value === mode.value)?.icon ?? 'kind-icon:prompt',
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
    if (!existing.includes(addition)) existing.push(addition)
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
    promptString: localPrompt.value,
    artPrompt: localPrompt.value,
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
    syncMessage.value = 'No writable art form method found.'
    emitUpdate()
  } catch (error) {
    handleError(error, 'syncing art-designer to artStore')
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
