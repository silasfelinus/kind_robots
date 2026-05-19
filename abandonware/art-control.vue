<!-- /abandonware/art-control.vue -->
<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">⚙️ Controls</h2>

    <button
      class="btn btn-primary w-full"
      type="button"
      :disabled="!canUse"
      @click="setAsAvatar"
    >
      Set as Avatar
    </button>

    <button
      class="btn btn-accent w-full"
      type="button"
      :disabled="!canUse"
      @click="addToFavorites"
    >
      Add to Favorites
    </button>

    <button
      class="btn btn-info w-full"
      type="button"
      :disabled="!canUse"
      @click="copyPrompt"
    >
      Copy Prompt
    </button>

    <button
      class="btn btn-warning w-full"
      type="button"
      @click="showSwag = !showSwag"
    >
      🎁 Print Swag
    </button>

    <div
      v-if="showSwag"
      class="rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <print-swag :art-image-id="props.artImage.id" @close="showSwag = false" />
    </div>

    <div class="space-y-2">
      <label class="block font-semibold">Add to Collection</label>

      <select v-model="selectedLabel" class="select select-bordered w-full">
        <option disabled value="">-- Select Existing --</option>

        <option v-for="label in userCollections" :key="label" :value="label">
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
        type="button"
        :disabled="!canUse || (!selectedLabel && !customLabel)"
        @click="addToCollection"
      >
        ➕ Add to Collection
      </button>
    </div>

    <art-reactions />

    <button class="btn w-full" type="button" @click="emit('close')">
      Close Display
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import { useUserStore } from '@/stores/userStore'
import { useCollectionStore } from '@/stores/collectionStore'

const props = defineProps<{ artImage: ArtImage }>()
const emit = defineEmits<{
  close: []
}>()

const userStore = useUserStore()
const collectionStore = useCollectionStore()

const selectedLabel = ref('')
const customLabel = ref('')
const showSwag = ref(false)

const canUse = computed(() => Boolean(userStore.userId))

const userCollections = computed(() => {
  return collectionStore.collections
    .filter((collection) => collection.userId === userStore.userId)
    .map((collection) => collection.label)
    .filter((label): label is string => Boolean(label))
})

async function ensureCollectionByLabel(label: string) {
  const userId = Number(userStore.userId ?? userStore.user?.id ?? 10)

  const existing = collectionStore.collections.find((collection) => {
    return collection.userId === userId && collection.label === label
  })

  if (existing) return existing

  return await collectionStore.createCollection(label, userId, true, false)
}

async function setAsAvatar() {
  try {
    await userStore.updateUserInfo({ artImageId: props.artImage.id })

    const collection = await ensureCollectionByLabel('avatars')

    await collectionStore.addArtImageToCollection({
      artImageId: props.artImage.id,
      collectionId: collection.id,
    })

    alert('Avatar set!')
  } catch (error) {
    console.error('Set avatar error:', error)
  }
}

async function addToFavorites() {
  try {
    const collection = await ensureCollectionByLabel('favorites')

    await collectionStore.addArtImageToCollection({
      artImageId: props.artImage.id,
      collectionId: collection.id,
    })

    alert('Added to favorites!')
  } catch (error) {
    console.error('Favorites error:', error)
  }
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(props.artImage.promptString || '')
    alert('Prompt copied to clipboard!')
  } catch (error) {
    console.error('Copy failed:', error)
  }
}

async function addToCollection() {
  const label = customLabel.value.trim() || selectedLabel.value.trim()
  if (!label) return

  try {
    const collection = await ensureCollectionByLabel(label)

    await collectionStore.addArtImageToCollection({
      artImageId: props.artImage.id,
      collectionId: collection.id,
    })

    alert(`Added to "${label}" collection!`)

    selectedLabel.value = ''
    customLabel.value = ''
  } catch (error) {
    console.error('Collection error:', error)
  }
}
</script>
