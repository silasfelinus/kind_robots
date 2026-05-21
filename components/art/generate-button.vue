<!-- /components/art/generate-button.vue -->
<template>
  <section class="flex w-full flex-col gap-3">
    <button
      class="btn w-full rounded-2xl font-black transition-all duration-200"
      :class="[
        artStore.isGenerating
          ? 'btn-primary cursor-not-allowed opacity-80'
          : canClick
            ? 'btn-primary shadow-lg shadow-primary/25 hover:-translate-y-0.5 hover:shadow-primary/40 active:translate-y-0'
            : 'btn-disabled',
        props.compact ? 'btn-sm text-sm' : 'min-h-14 text-base',
      ]"
      type="button"
      :disabled="!canClick"
      @click="handleGenerate"
    >
      <!-- Generating: three-dot pulse in a row -->
      <span v-if="artStore.isGenerating" class="flex items-center gap-2">
        <span class="loading loading-dots loading-sm" />
        {{ busyLabel }}
      </span>

      <span v-else class="flex items-center gap-2">
        <icon :name="icon" class="h-5 w-5" />
        {{ label }}
      </span>
    </button>

    <div
      v-if="showMessage && artStore.generationMessage"
      class="flex items-start gap-2 rounded-2xl border p-3 text-sm font-semibold"
      :class="
        artStore.generationMessageTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
      <icon
        :name="
          artStore.generationMessageTone === 'error'
            ? 'kind-icon:alert'
            : 'kind-icon:check'
        "
        class="mt-0.5 h-4 w-4 shrink-0"
      />
      {{ artStore.generationMessage }}
    </div>

    <div
      v-if="showResult && resultImage"
      class="rounded-2xl border border-base-300 bg-base-100 p-3"
    >
      <image-card :art-image="resultImage" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useArtStore, type GenerateArtData } from '@/stores/artStore'

const props = withDefaults(
  defineProps<{
    label?: string
    busyLabel?: string
    icon?: string
    compact?: boolean
    showResult?: boolean
    showMessage?: boolean
    overrides?: Partial<GenerateArtData>
  }>(),
  {
    label: 'Generate Image',
    busyLabel: 'Generating…',
    icon: 'kind-icon:sparkles',
    compact: false,
    showResult: true,
    showMessage: true,
    overrides: () => ({}),
  },
)

const emit = defineEmits<{
  generated: [image: ArtImage]
  failed: [message: string]
}>()

const artStore = useArtStore()
const errorStore = useErrorStore()

const resultImage = computed(
  () => artStore.lastGeneratedArtImage || artStore.currentArtImage || null,
)
const canClick = computed(
  () => artStore.canGenerateArt && !artStore.isGenerating,
)

async function handleGenerate() {
  const result = await artStore.generateCurrentArt(props.overrides)
  if (!result.success || !result.data) {
    const message = result.message || 'Generation failed.'
    errorStore.addError(ErrorType.GENERAL_ERROR, message)
    emit('failed', message)
    return
  }
  emit('generated', result.data)
}
</script>
