<template>
  <div>
    <!-- Section: Add New Collection -->
    <div class="my-6">
      <h2 class="text-lg font-bold text-primary">➕ Add New Collection</h2>
      <div class="flex items-center gap-4 mt-4">
        <input
          v-model="newCollectionLabel"
          type="text"
          class="input input-bordered w-full"
          placeholder="Enter collection label"
        />
        <button class="btn btn-primary" @click="createCollection">
          Add Collection
        </button>
      </div>
    </div>

    <!-- Section: User's Art Collections -->
    <div v-if="collections.length" class="my-6">
      <h2 class="text-lg font-bold text-primary">🖼️ Your Art Collections</h2>
      <div v-for="collection in collections" :key="collection.id" class="my-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-secondary">{{ collection.label }}</h3>
          <button
            class="btn btn-error btn-sm"
            @click="deleteCollection(collection.id)"
          >
            🗑️ Delete
          </button>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <art-card
            v-for="art in collection.art"
            :key="art.id"
            :art="art"
            @remove="() => removeArtFromCollection(art.id, collection.id)"
          />
        </div>
      </div>
    </div>

    <!-- Section: Uncollected Art -->
    <div class="my-6">
      <h2 class="text-lg font-bold text-primary">🎨 Uncollected Art</h2>
      <div
        v-if="uncollectedArt.length"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
      >
        <art-card
          v-for="art in uncollectedArt"
          :key="art.id"
          :art="art"
          @add="() => addArtToCollection(art.id)"
        />
      </div>
      <div v-else class="text-center text-gray-500">
        No uncollected art available.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore, type ArtCollection } from '@/stores/artStore'

const artStore = useArtStore()

// States
const newCollectionLabel = ref('')
const collections = computed(() => artStore.collections as ArtCollection[])

const uncollectedArt = computed(() => artStore.uncollectedArt as Art[])

// Lifecycle: Fetch initial data
const loadInitialData = async () => {
  try {
    await artStore.fetchCollections()
    await fetchUncollectedArt()
  } catch (error) {
    console.error('Error loading initial data:', error)
  }
}

// Fetch uncollected art
const fetchUncollectedArt = async () => {
  try {
    await artStore.fetchUncollectedArt() // Refresh uncollected art in the store
  } catch (error) {
    console.error('Error fetching uncollected art:', error)
  }
}

// Methods
const createCollection = async () => {
  if (!newCollectionLabel.value.trim()) {
    alert('Collection label cannot be empty.')
    return
  }

  try {
    await artStore.createCollection(newCollectionLabel.value.trim())
    newCollectionLabel.value = ''
  } catch (error) {
    console.error('Error creating collection:', error)
  }
}

const deleteCollection = async (collectionId: number) => {
  if (!confirm('Are you sure you want to delete this collection?')) return

  try {
    await artStore.deleteCollection(collectionId)
    await fetchUncollectedArt() // Refresh uncollected art after deletion
  } catch (error) {
    console.error('Error deleting collection:', error)
  }
}

const addArtToCollection = async (artId: number) => {
  const label = prompt('Enter collection label to add this art:')
  if (!label) return

  try {
    await artStore.addArtToCollection({ artId, label })
    await fetchUncollectedArt() // Refresh uncollected art after addition
  } catch (error) {
    console.error('Error adding art to collection:', error)
  }
}

const removeArtFromCollection = async (artId: number, collectionId: number) => {
  if (!confirm('Are you sure you want to remove this art from the collection?'))
    return

  try {
    await artStore.removeArtFromCollection(artId, collectionId)
    await fetchUncollectedArt() // Refresh uncollected art after removal
  } catch (error) {
    console.error('Error removing art from collection:', error)
  }
}

// Fetch data on mount
loadInitialData()
</script>
