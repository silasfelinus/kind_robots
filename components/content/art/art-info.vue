// /components/content/art/art-info.vue
<template>
  <div class="space-y-2">
    <h2 class="text-xl font-bold">🖼️ Artwork Info</h2>

    <p v-if="art.promptString" class="text-sm text-base-content">
      <span class="font-semibold">Prompt:</span>
      {{ art.promptString }}
    </p>

    <p v-if="art.negativePrompt" class="text-sm text-base-content">
      <span class="font-semibold">Negative:</span>
      {{ art.negativePrompt }}
    </p>

    <p v-if="art.checkpoint" class="text-sm text-base-content">
      <span class="font-semibold">Model:</span> {{ art.checkpoint }}
    </p>

    <p v-if="art.sampler" class="text-sm text-base-content">
      <span class="font-semibold">Sampler:</span> {{ art.sampler }}
    </p>

    <p v-if="art.seed !== undefined" class="text-sm text-base-content">
      <span class="font-semibold">Seed:</span> {{ art.seed }}
    </p>

    <p v-if="art.steps" class="text-sm text-base-content">
      <span class="font-semibold">Steps:</span> {{ art.steps }}
    </p>

    <p v-if="art.cfg !== undefined" class="text-sm text-base-content">
      <span class="font-semibold">CFG:</span> {{ art.cfg
      }}<span v-if="art.cfgHalf">.5</span>
    </p>

    <p v-if="art.createdAt" class="text-sm text-base-content">
      <span class="font-semibold">Created:</span>
      {{ new Date(art.createdAt).toLocaleString() }}
    </p>

    <div class="flex items-center gap-4 pt-4" v-if="canEdit">
      <label class="label cursor-pointer space-x-2">
        <span class="label-text">Mature</span>
        <input
          type="checkbox"
          class="toggle toggle-error"
          v-model="art.isMature"
        />
      </label>

      <label class="label cursor-pointer space-x-2">
        <span class="label-text">Public</span>
        <input
          type="checkbox"
          class="toggle toggle-success"
          v-model="art.isPublic"
        />
      </label>
    </div>

    <div class="pt-4" v-if="canEdit">
      <button class="btn btn-error btn-sm" @click="deleteArt">
        Delete This Image
      </button>
    </div>

    <pre
      v-if="artImage?.imageData"
      class="bg-base-300 p-2 rounded-md text-xs whitespace-pre-wrap"
      >{{ artImage }}</pre
    >

  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useArtStore } from '@/stores/artStore'
import { computed } from 'vue'
import type { Art, ArtImage } from '@/stores/artStore.ts'

const props = defineProps<{
  art: Art
  artImage?: ArtImage | null
}>()

const userStore = useUserStore()
const collectionStore = useCollectionStore()
const artStore = useArtStore()

const canUse = computed(() => !!userStore.userId)
const canEdit = computed(
  () => userStore.userId === props.art.userId || userStore.isAdmin,
)

const setAsAvatar = async () => {
  try {
    await userStore.updateUserInfo({ artImageId: props.art.artImageId })
    await collectionStore.addArtToCollection({
      artId: props.art.id,
      label: 'avatars',
    })
    alert('Avatar updated!')
  } catch (err) {
    console.error('Set avatar failed:', err)
  }
}

const deleteArt = async () => {
  try {
    if (props.art.artImageId) {
      await artStore.deleteArtImage(props.art.artImageId)
    }
    await artStore.deleteArt(props.art.id)
    userStore.user?.artImageId === props.art.artImageId &&
      (await userStore.updateUserInfo({ artImageId: null }))
    alert('Art deleted')
    artStore.currentArt = null
  } catch (err) {
    console.error('Delete error:', err)
  }
}
</script>

<style scoped></style>
