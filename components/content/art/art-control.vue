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

    <div class="space-y-2">
      <label class="block font-semibold">Add to Collection</label>
      <select v-model="selectedLabel" class="select select-bordered w-full">
        <option disabled value="">-- Select Existing --</option>
        <option
          v-for="label in userCollections"
          :key="label ?? ''"
          :value="label"
        >
          {{ label }}
        </option>
      </select>

      <input
        v-model="customLabel"
        class="input input-bordered w-full"
        placeholder="Or enter a new label..."
      />

      <button
        class="btn btn-success w-full"
        @click="addToCollection"
        :disabled="!canUse || (!selectedLabel && !customLabel)"
      >
        ➕ Add to Collection
      </button>
    </div>

    <button class="btn w-full" @click="emit('close')">Close Display</button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'
import type { Art } from '@/stores/artStore'

const props = defineProps<{ art: Art }>()
const emit = defineEmits(['close'])

const userStore = useUserStore()
const collectionStore = useCollectionStore()

const selectedLabel = ref('')
const customLabel = ref('')

const canUse = computed(() => !!userStore.userId)

const userCollections = computed(() => {
  return collectionStore.collections
    .filter((col) => col.userId === userStore.userId)
    .map((col) => col.label)
})

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

const addToCollection = async () => {
  const label = customLabel.value || selectedLabel.value
  if (!label) return
  try {
    await collectionStore.addArtToCollection({ artId: props.art.id, label })
    alert(`Added to "${label}" collection!`)
    selectedLabel.value = ''
    customLabel.value = ''
  } catch (err) {
    console.error('Collection error:', err)
  }
}
</script>
