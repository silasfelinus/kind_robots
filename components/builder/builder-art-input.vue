<!-- /components/builder/builder-art-input.vue -->
<template>
  <div class="flex flex-col gap-4">
    <ArtDesigner
      purpose="builder"
      title="Builder Asset Designer"
      description="Create, upload, select, or generate the image asset for this builder sheet."
      :model-id="null"
      :model-title="modelTitle"
      :prompt="artPrompt"
      image-role="builder"
      @update="handleArtUpdate"
    />

    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="btn btn-sm btn-ghost rounded-xl border border-base-300"
        :disabled="store.isSuggesting"
        @click="store.callArtSuggest()"
      >
        <span
          v-if="store.isSuggesting"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
        Refine prompt
      </button>

      <button
        type="button"
        class="btn btn-sm btn-primary rounded-xl"
        :disabled="!artPrompt.trim()"
        @click="store.finishCard()"
      >
        <Icon name="kind-icon:check" class="h-4 w-4" />
        Use this asset
      </button>
    </div>

    <Transition name="builder-art-preview">
      <div
        v-if="imagePath"
        class="relative overflow-hidden rounded-2xl border border-base-300 bg-base-200"
      >
        <img
          :src="imagePath"
          :alt="modelTitle"
          class="max-h-96 w-full object-cover"
        />
        <div
          class="absolute inset-x-0 bottom-0 bg-linear-to-t from-base-100/95 to-transparent p-4"
        >
          <p class="font-black text-base-content">{{ modelTitle }}</p>
          <p class="text-xs text-base-content/60">
            Asset attached to builder sheet.
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ArtDesigner from '@/components/builder/art-designer.vue'
import { useBuilderStore } from '@/stores/builderStore'

const store = useBuilderStore()

const artPrompt = computed(() => String(store.sheet.artPrompt ?? ''))

const imagePath = computed(() =>
  typeof store.sheet.imagePath === 'string' ? store.sheet.imagePath : '',
)

const modelTitle = computed(() =>
  String(
    store.sheet.name ||
      store.sheet.title ||
      store.activeConfig.title ||
      'Builder asset',
  ),
)

function handleArtUpdate(payload: {
  prompt?: string
  artPrompt?: string
  imagePath?: string | null
  artImageId?: number | null
}): void {
  store.updateArt({
    artPrompt: payload.artPrompt ?? payload.prompt,
    imagePath: payload.imagePath,
    artImageId: payload.artImageId,
  })
}
</script>

<style scoped>
.builder-art-preview-enter-active,
.builder-art-preview-leave-active {
  transition: all 180ms ease;
}

.builder-art-preview-enter-from,
.builder-art-preview-leave-to {
  opacity: 0;
  transform: translateY(0.5rem);
}
</style>