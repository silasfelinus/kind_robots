// /components/content/art/art-control.vue
<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">⚙️ Controls</h2>

    <button
      class="btn btn-primary w-full"
      @click="setAsAvatar"
      :disabled="!canUse"
    >
      Set as Avatar
    </button>

    <button
      class="btn btn-accent w-full"
      @click="addToFavorites"
      :disabled="!canUse"
    >
      Add to Favorites
    </button>

    <button class="btn btn-info w-full" @click="copyPrompt" :disabled="!canUse">
      Copy Prompt
    </button>

    <button class="btn w-full" @click="emit('close')">Close Display</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'
import type { Art } from '@/stores/artStore'

const props = defineProps<{ art: Art }>()
const emit = defineEmits(['close'])

const userStore = useUserStore()
const collectionStore = useCollectionStore()

const canUse = computed(() => !!userStore.userId)

const setAsAvatar = async () => {
  try {
    await userStore.updateUserInfo({ artImageId: props.art.artImageId })
    await collectionStore.addArtToCollection({
      artId: props.art.id,
      label: 'avatars',
    })
    alert('Avatar set!')
  } catch (err) {
    console.error('Set avatar error:', err)
  }
}

const addToFavorites = async () => {
  try {
    await collectionStore.addArtToCollection({
      artId: props.art.id,
      label: 'favorites',
    })
    alert('Added to favorites!')
  } catch (err) {
    console.error('Favorites error:', err)
  }
}

const copyPrompt = async () => {
  try {
    await navigator.clipboard.writeText(props.art.promptString || '')
    alert('Prompt copied to clipboard!')
  } catch (err) {
    console.error('Copy failed:', err)
  }
}
</script>
