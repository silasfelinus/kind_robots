<!-- /components/builder/builder-art-input.vue -->
<template>
  <div class="flex flex-col gap-4">
    <art-designer
      :purpose="artPurpose"
      :title="artTitle"
      :description="artDescription"
      :model-id="null"
      :model-title="modelTitle"
      :prompt="artPrompt"
      :image-role="imageRole"
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
            {{ imageRoleLabel }} attached to builder sheet.
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

type ArtDesignerPurpose =
  | 'user'
  | 'pitch'
  | 'dream'
  | 'character'
  | 'reward'
  | 'scenario'
  | 'builder'

type BuilderArtConfig = {
  purpose?: ArtDesignerPurpose
  imageRole?: string
  title?: string
  description?: string
}

type BuilderProjectArtConfig = {
  key?: string
  label?: string
  title?: string
  modelType?: string
  artPurpose?: ArtDesignerPurpose
  artImageRole?: string
  artTitle?: string
  artDescription?: string
}

type BuilderStoreWithArtConfig = ReturnType<typeof useBuilderStore> & {
  activeArtConfig?: BuilderArtConfig
}

const store = useBuilderStore() as BuilderStoreWithArtConfig

const activeConfig = computed(
  () => store.activeConfig as unknown as BuilderProjectArtConfig,
)

const activeArtConfig = computed<BuilderArtConfig | null>(() => {
  return store.activeArtConfig ?? null
})

const artPrompt = computed(() => String(store.sheet.artPrompt ?? ''))

const imagePath = computed(() =>
  typeof store.sheet.imagePath === 'string' ? store.sheet.imagePath : '',
)

const modelTitle = computed(() =>
  String(
    store.sheet.name ||
      store.sheet.title ||
      activeConfig.value.title ||
      'Builder asset',
  ),
)

const artPurpose = computed<ArtDesignerPurpose>(() => {
  if (activeArtConfig.value?.purpose) return activeArtConfig.value.purpose
  if (activeConfig.value.artPurpose) return activeConfig.value.artPurpose
  if (activeConfig.value.key === 'adventure') return 'character'
  if (activeConfig.value.modelType === 'adventure') return 'character'
  if (activeConfig.value.modelType === 'character') return 'character'
  if (activeConfig.value.modelType === 'scenario') return 'scenario'
  if (activeConfig.value.modelType === 'reward') return 'reward'
  if (activeConfig.value.modelType === 'pitch') return 'pitch'
  if (activeConfig.value.modelType === 'dream') return 'dream'
  return 'builder'
})

const imageRole = computed(() => {
  if (activeArtConfig.value?.imageRole) return activeArtConfig.value.imageRole
  if (activeConfig.value.artImageRole) return activeConfig.value.artImageRole
  if (artPurpose.value === 'character') return 'avatar'
  if (artPurpose.value === 'scenario') return 'scene'
  if (artPurpose.value === 'reward') return 'object'
  if (artPurpose.value === 'pitch') return 'cover'
  if (artPurpose.value === 'dream') return 'world'
  return 'builder'
})

const artTitle = computed(() => {
  if (activeArtConfig.value?.title) return activeArtConfig.value.title
  if (activeConfig.value.artTitle) return activeConfig.value.artTitle
  if (artPurpose.value === 'character') return 'Character Avatar Designer'
  return `${activeConfig.value.label || activeConfig.value.title || 'Builder'} Art Designer`
})

const artDescription = computed(() => {
  if (activeArtConfig.value?.description) {
    return activeArtConfig.value.description
  }

  if (activeConfig.value.artDescription) {
    return activeConfig.value.artDescription
  }

  if (artPurpose.value === 'character') {
    return 'Create, upload, select, or generate avatar art for this character.'
  }

  return 'Create, upload, select, or generate art for this builder sheet.'
})

const imageRoleLabel = computed(() => {
  if (imageRole.value === 'avatar') return 'Character avatar'
  if (imageRole.value === 'portrait') return 'Character portrait'
  if (imageRole.value === 'scene') return 'Scene image'
  if (imageRole.value === 'object') return 'Reward image'
  if (imageRole.value === 'cover') return 'Cover image'
  if (imageRole.value === 'world') return 'World image'
  return 'Image asset'
})

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
