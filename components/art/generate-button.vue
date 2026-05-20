<!-- /components/art/generate-button.vue -->
<template>
  <section class="flex w-full flex-col gap-3">
    <button
      class="btn rounded-2xl"
      :class="buttonClass"
      type="button"
      :disabled="!canClick"
      @click="handleGenerate"
    >
      <span
        v-if="artStore.isGenerating"
        class="loading loading-spinner loading-sm"
      />

      <icon
        v-else
        :name="icon"
        class="h-5 w-5"
      />

      {{ artStore.isGenerating ? busyLabel : label }}
    </button>

    <div
      v-if="showMessage && artStore.generationMessage"
      class="rounded-2xl border p-3 text-sm font-semibold"
      :class="
        artStore.generationMessageTone === 'error'
          ? 'border-error/40 bg-error/10 text-error'
          : 'border-success/40 bg-success/10 text-success'
      "
    >
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
    busyLabel: 'Generating...',
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

const resultImage = computed(() => {
  return artStore.lastGeneratedArtImage || artStore.currentArtImage || null
})

const canClick = computed(() => {
  return artStore.canGenerateArt && !artStore.isGenerating
})

const buttonClass = computed(() => {
  return props.compact
    ? 'btn-primary btn-sm text-white'
    : 'btn-primary min-h-14 text-base text-white'
})

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