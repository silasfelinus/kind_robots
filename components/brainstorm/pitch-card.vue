<!-- /components/content/brainstorm/pitch-card.vue -->
<template>
  <article
    :class="[
      'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-base-200 transition-all hover:shadow-lg',
      compact ? 'gap-2 p-3' : 'gap-4 p-4',
      activeSelected ? 'border-primary bg-primary/10' : 'border-base-300',
    ]"
    @click="selectPitch"
  >
    <div
      v-if="showActions"
      class="absolute right-2 top-2 z-20 flex items-center gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
    >
      <button
        v-if="allowEdit && canEdit"
        class="rounded-full bg-base-100 p-2 text-primary shadow hover:bg-primary hover:text-primary-content"
        type="button"
        title="Edit Pitch"
        @click.stop="startEditing"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
      </button>

      <button
        v-if="allowClone"
        class="rounded-full bg-base-100 p-2 text-secondary shadow hover:bg-secondary hover:text-secondary-content"
        type="button"
        title="Clone Pitch"
        @click.stop="startCloning"
      >
        <Icon name="kind-icon:copy" class="h-4 w-4" />
      </button>

      <button
        v-if="allowDelete && canDelete"
        class="rounded-full bg-base-100 p-2 text-error shadow hover:bg-error hover:text-error-content"
        type="button"
        title="Delete Pitch"
        @click.stop="deletePitch"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
      </button>
    </div>

    <div
      v-if="showImage"
      :class="[
        'relative overflow-hidden rounded-2xl border border-base-300 bg-base-300',
        compact ? 'h-32 w-full' : 'h-48 w-full',
      ]"
    >
      <img
        :src="pitchImage"
        :alt="pitch.title || pitch.pitch || 'Pitch image'"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />

      <div class="absolute left-2 top-2 flex flex-wrap gap-1">
        <span
          class="badge badge-sm"
          :class="pitch.isPublic ? 'badge-success' : 'badge-warning'"
        >
          {{ pitch.isPublic ? 'Public' : 'Private' }}
        </span>

        <span v-if="pitch.isMature" class="badge badge-error badge-sm">
          Mature
        </span>

        <span class="badge badge-primary badge-sm">
          {{ pitch.PitchType || 'Pitch' }}
        </span>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <header class="min-w-0">
        <div class="flex items-start gap-2">
          <Icon
            :name="pitch.icon || fallbackIcon"
            class="mt-1 h-5 w-5 shrink-0 text-primary"
          />

          <div class="min-w-0 flex-1">
            <h2
              :class="[
                'font-black leading-tight text-base-content',
                compact ? 'line-clamp-1 text-base' : 'line-clamp-2 text-xl',
              ]"
            >
              {{ displayTitle }}
            </h2>

            <p
              v-if="pitch.designer"
              class="mt-1 truncate text-xs font-semibold text-base-content/50"
            >
              {{ pitch.designer }}
            </p>
          </div>
        </div>

        <p
          v-if="showPitch"
          :class="[
            'mt-3 text-base-content/75',
            compact ? 'line-clamp-2 text-sm' : 'line-clamp-4 text-sm',
          ]"
        >
          {{ pitch.pitch || 'No pitch text yet.' }}
        </p>

        <p
          v-if="showDescription && pitch.description"
          :class="[
            'mt-2 text-base-content/60',
            compact ? 'line-clamp-2 text-xs' : 'line-clamp-3 text-sm',
          ]"
        >
          {{ pitch.description }}
        </p>
      </header>

      <div v-if="showMeta" class="flex flex-wrap gap-2">
        <span v-if="pitch.creationSource" class="badge badge-outline badge-sm">
          {{ pitch.creationSource }}
        </span>

        <span v-if="promptCount > 0" class="badge badge-secondary badge-sm">
          {{ promptCount }} prompt{{ promptCount === 1 ? '' : 's' }}
        </span>

        <span v-if="artCount > 0" class="badge badge-accent badge-sm">
          {{ artCount }} art
        </span>

        <span v-if="pitch.userId" class="badge badge-ghost badge-sm">
          User {{ pitch.userId }}
        </span>
      </div>

      <div
        v-if="showFlavor && pitch.flavorText"
        class="rounded-2xl border border-base-300 bg-base-100 p-3 text-sm italic text-base-content/70"
      >
        {{ pitch.flavorText }}
      </div>

      <div
        v-if="showExamples && exampleList.length"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div
          class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/45"
        >
          Examples
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            v-for="example in visibleExamples"
            :key="example"
            class="badge badge-outline max-w-full truncate"
            type="button"
            @click.stop="useExample(example)"
          >
            {{ example }}
          </button>
        </div>
      </div>

      <div
        v-if="showPrompts && promptPreviews.length"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div
          class="mb-2 text-xs font-bold uppercase tracking-wide text-base-content/45"
        >
          Attached Prompts
        </div>

        <div class="grid gap-2">
          <button
            v-for="prompt in promptPreviews"
            :key="prompt.id"
            class="rounded-xl bg-base-200 px-3 py-2 text-left text-xs text-base-content/70 transition hover:bg-base-300"
            type="button"
            @click.stop="usePrompt(prompt.prompt)"
          >
            {{ prompt.prompt }}
          </button>
        </div>
      </div>

      <div
        v-if="showLaunchButton"
        class="mt-auto grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3"
      >
        <button
          class="btn btn-sm btn-primary rounded-xl text-white"
          type="button"
          @click.stop="useForPrompt"
        >
          <Icon name="kind-icon:quote" class="h-4 w-4" />
          Use
        </button>

        <button
          class="btn btn-sm btn-secondary rounded-xl"
          type="button"
          @click.stop="generateFromPitch"
        >
          <Icon name="kind-icon:sparkles" class="h-4 w-4" />
          Brainstorm
        </button>

        <button
          class="btn btn-sm btn-outline rounded-xl"
          type="button"
          @click.stop="selectPitch"
        >
          <Icon name="kind-icon:check" class="h-4 w-4" />
          Select
        </button>
      </div>

      <details
        v-if="showDebug"
        class="rounded-2xl border border-base-300 bg-base-100 p-2"
        @click.stop
      >
        <summary class="cursor-pointer text-xs font-bold text-base-content/70">
          Debug
        </summary>

        <pre class="mt-2 max-h-48 overflow-auto text-xs text-base-content/70">{{ JSON.stringify(pitch, null, 2) }}</pre>
      </details>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Art, ArtImage, Pitch, Prompt } from '~/prisma/generated/prisma/client'
import { useArtStore } from '@/stores/artStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useUserStore } from '@/stores/userStore'

type PitchWithRelations = Pitch & {
  Prompts?: Prompt[]
  Art?: Art[]
}

const props = withDefaults(
  defineProps<{
    pitch: PitchWithRelations
    selected?: boolean
    compact?: boolean
    showImage?: boolean
    showActions?: boolean
    showPitch?: boolean
    showDescription?: boolean
    showFlavor?: boolean
    showExamples?: boolean
    showPrompts?: boolean
    showMeta?: boolean
    showLaunchButton?: boolean
    showDebug?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
    fallbackImage?: string
    fallbackIcon?: string
    maxExamples?: number
    maxPrompts?: number
  }>(),
  {
    selected: false,
    compact: false,
    showImage: true,
    showActions: true,
    showPitch: true,
    showDescription: true,
    showFlavor: true,
    showExamples: true,
    showPrompts: true,
    showMeta: true,
    showLaunchButton: true,
    showDebug: false,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    fallbackImage: '/images/backtree.webp',
    fallbackIcon: 'kind-icon:idea',
    maxExamples: 6,
    maxPrompts: 4,
  },
)

const emit = defineEmits<{
  edit: [id: number]
  clone: [id: number]
  delete: [id: number]
  brainstorm: [id: number]
}>()

const artStore = useArtStore()
const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const userStore = useUserStore()

const localArtImage = ref<ArtImage | null>(null)
const isLoadingImage = ref(false)

const activeSelected = computed(() => {
  return props.selected || pitchStore.selectedPitch?.id === props.pitch.id
})

const canEdit = computed(() => {
  return userStore.isAdmin || props.pitch.userId === userStore.userId
})

const canDelete = computed(() => {
  return canEdit.value
})

const displayTitle = computed(() => {
  return props.pitch.title || props.pitch.pitch || 'Untitled Pitch'
})

const promptCount = computed(() => {
  return props.pitch.Prompts?.length || 0
})

const artCount = computed(() => {
  return props.pitch.Art?.length || pitchStore.galleryArt[props.pitch.id]?.length || 0
})

const promptPreviews = computed(() => {
  return (props.pitch.Prompts || []).slice(0, props.maxPrompts)
})

const exampleList = computed(() => {
  const raw = props.pitch.examples || ''

  return raw
    .split(/\n|\||;/)
    .map((entry) => entry.trim())
    .filter(Boolean)
})

const visibleExamples = computed(() => {
  return exampleList.value.slice(0, props.maxExamples)
})

const pitchImage = computed(() => {
  if (localArtImage.value?.imageData) {
    return `data:image/${localArtImage.value.fileType};base64,${localArtImage.value.imageData}`
  }

  return (
    props.pitch.highlightImage ||
    props.pitch.imagePrompt ||
    props.fallbackImage
  )
})

async function loadPitchImage() {
  if (!props.pitch.artImageId) {
    localArtImage.value = null
    return
  }

  isLoadingImage.value = true

  try {
    const image = await artStore.getArtImageById(props.pitch.artImageId)
    localArtImage.value = image || null
  } finally {
    isLoadingImage.value = false
  }
}

function selectPitch() {
  pitchStore.setSelectedPitch(props.pitch.id)

  if (props.pitch.PitchType === 'TITLE') {
    pitchStore.setSelectedTitle(props.pitch.id)
  }
}

async function startEditing() {
  await pitchStore.startEditingPitch(props.pitch.id)
  emit('edit', props.pitch.id)
}

async function startCloning() {
  await pitchStore.startCloningPitch(props.pitch.id)
  emit('clone', props.pitch.id)
}

async function deletePitch() {
  const result = await pitchStore.deletePitchById(props.pitch.id)

  if (result.success) {
    emit('delete', props.pitch.id)
  }
}

function useExample(example: string) {
  promptStore.promptField = example
  promptStore.currentPrompt = example
  promptStore.syncToLocalStorage()
}

function usePrompt(prompt: string) {
  promptStore.promptField = prompt
  promptStore.currentPrompt = prompt
  promptStore.syncToLocalStorage()
}

function useForPrompt() {
  const prompt =
    props.pitch.imagePrompt ||
    props.pitch.pitch ||
    props.pitch.description ||
    props.pitch.title ||
    ''

  promptStore.promptField = prompt
  promptStore.currentPrompt = prompt
  promptStore.syncToLocalStorage()
  selectPitch()
}

async function generateFromPitch() {
  selectPitch()
  await pitchStore.fetchBrainstormPitches()
  emit('brainstorm', props.pitch.id)
}

onMounted(async () => {
  await loadPitchImage()
})

watch(
  () => props.pitch.artImageId,
  async () => {
    await loadPitchImage()
  },
)
</script>