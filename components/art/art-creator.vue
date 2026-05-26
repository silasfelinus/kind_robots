<!-- /components/art/art-creator.vue -->
<template>
  <section class="flex w-full flex-col gap-3">
    <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
      <div
        class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="flex min-w-0 items-start gap-3">
          <span
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          >
            <icon :name="displayIcon" class="h-6 w-6" />
          </span>

          <div class="min-w-0">
            <p class="truncate text-sm font-black text-primary">
              {{ displayTitle }}
            </p>
            <p class="mt-1 text-xs font-semibold text-base-content/55">
              {{ statusLabel }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="btn rounded-2xl font-black"
          :class="canGenerate ? 'btn-primary' : 'btn-disabled'"
          :disabled="!canGenerate"
          @click="generateImage"
        >
          <span v-if="artStore.isGenerating" class="flex items-center gap-2">
            <span class="loading loading-dots loading-sm" />
            Generating…
          </span>

          <span v-else class="flex items-center gap-2">
            <icon name="kind-icon:sparkles" class="h-5 w-5" />
            Generate
          </span>
        </button>
      </div>

      <div
        v-if="promptPreview"
        class="mt-3 rounded-2xl border border-base-300 bg-base-100 p-3 text-xs leading-relaxed text-base-content/70"
      >
        {{ promptPreview }}
      </div>

      <div
        v-if="message"
        class="mt-3 flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold"
        :class="
          messageTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        <icon
          :name="
            messageTone === 'error' ? 'kind-icon:alert' : 'kind-icon:check'
          "
          class="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>{{ message }}</span>
      </div>
    </div>

    <Transition name="art-creator-reveal">
      <div
        v-if="generatedImage"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <image-card :art-image="generatedImage" />
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useArtStore, type GenerateArtData } from '@/stores/artStore'

const props = withDefaults(
  defineProps<{
    purpose?: string
    modelId?: number | null
    modelTitle?: string
    prompt?: string
    imageRole?: string
    icon?: string
    showPreview?: boolean
    overrides?: Partial<GenerateArtData>
  }>(),
  {
    purpose: 'art',
    modelId: null,
    modelTitle: 'Untitled',
    prompt: '',
    imageRole: 'image',
    icon: '',
    showPreview: true,
    overrides: () => ({}),
  },
)

const emit = defineEmits<{
  update: [
    payload: {
      prompt?: string
      imagePath?: string | null
      artImageId?: number | null
      artImage?: ArtImage | null
    },
  ]
  generated: [image: ArtImage]
  failed: [message: string]
}>()

const artStore = useArtStore()
const errorStore = useErrorStore()

const localMessage = ref('')
const localMessageTone = ref<'success' | 'error'>('success')
const generatedImage = ref<ArtImage | null>(null)

const cleanPrompt = computed(() => props.prompt.trim())

const displayIcon = computed(() => {
  if (props.icon) return props.icon
  if (props.imageRole === 'portrait') return 'kind-icon:portrait'
  if (props.purpose === 'character') return 'kind-icon:character'
  return 'kind-icon:image'
})

const displayTitle = computed(() => {
  const role = props.imageRole || 'image'
  const title = props.modelTitle?.trim() || 'Untitled'
  return `${title} ${role}`
})

const promptPreview = computed(() => {
  if (!props.showPreview || !cleanPrompt.value) return ''
  return cleanPrompt.value.length > 260
    ? `${cleanPrompt.value.slice(0, 260)}…`
    : cleanPrompt.value
})

const hasGenerationSetup = computed(() => {
  return Boolean(artStore.artForm.serverId && artStore.selectedCheckpointName)
})

const canGenerate = computed(() => {
  return Boolean(
    cleanPrompt.value && hasGenerationSetup.value && !artStore.isGenerating,
  )
})

const statusLabel = computed(() => {
  if (!cleanPrompt.value) return 'No prompt yet. The muse is staring at a wall.'
  if (!hasGenerationSetup.value)
    return 'Needs an art server and checkpoint selected.'
  if (artStore.isGenerating)
    return 'Pixel goblin currently negotiating with reality.'
  return 'Ready to generate.'
})

const message = computed(() => {
  return localMessage.value || artStore.generationMessage
})

const messageTone = computed(() => {
  return localMessage.value
    ? localMessageTone.value
    : artStore.generationMessageTone
})

function getImagePath(image: ArtImage): string | null {
  const record = image as ArtImage & {
    imageData?: string | null
    imagePath?: string | null
    path?: string | null
    fileType?: string | null
  }

  if (record.imagePath) return record.imagePath
  if (record.path) return record.path

  if (record.imageData) {
    const fileType = record.fileType || 'png'
    return `data:image/${fileType};base64,${record.imageData}`
  }

  return null
}

function setLocalMessage(tone: 'success' | 'error', text: string) {
  localMessageTone.value = tone
  localMessage.value = text
}

function syncPromptToArtForm() {
  if (!cleanPrompt.value) return

  artStore.setArtForm({
    promptString: cleanPrompt.value,
    title: props.modelTitle || props.imageRole || props.purpose,
    pitch: props.imageRole,
    ...props.overrides,
  })
}

async function generateImage() {
  syncPromptToArtForm()

  if (!cleanPrompt.value) {
    const message = 'Add a prompt before generating.'
    setLocalMessage('error', message)
    emit('failed', message)
    return
  }

  if (!hasGenerationSetup.value) {
    const message = 'Select an art server and checkpoint before generating.'
    setLocalMessage('error', message)
    errorStore.addError(ErrorType.GENERAL_ERROR, message)
    emit('failed', message)
    return
  }

  const result = await artStore.generateCurrentArt({
    ...props.overrides,
    promptString: cleanPrompt.value,
    title: props.modelTitle || props.imageRole || props.purpose,
    pitch: props.imageRole,
  })

  if (!result.success || !result.data) {
    const message = result.message || 'Image generation failed.'
    setLocalMessage('error', message)
    errorStore.addError(ErrorType.GENERAL_ERROR, message)
    emit('failed', message)
    return
  }

  const imagePath = getImagePath(result.data)

  generatedImage.value = result.data
  setLocalMessage('success', result.message || 'Image generated.')

  emit('update', {
    prompt: cleanPrompt.value,
    imagePath,
    artImageId: result.data.id,
    artImage: result.data,
  })

  emit('generated', result.data)
}

watch(
  () => props.prompt,
  () => {
    syncPromptToArtForm()
  },
)

onMounted(async () => {
  await artStore.prepareArtGenerator()
  syncPromptToArtForm()
})
</script>

<style scoped>
.art-creator-reveal-enter-active {
  transition:
    opacity 300ms ease,
    transform 300ms cubic-bezier(0.34, 1.2, 0.64, 1);
}

.art-creator-reveal-leave-active {
  transition: opacity 180ms ease;
}

.art-creator-reveal-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.art-creator-reveal-leave-to {
  opacity: 0;
}
</style>
