<template>
  <div>
    <!-- Debugging Section -->
    <div class="my-6 p-4 border rounded bg-warning text-gray-800">
      <h2 class="text-lg font-bold">⚙️ Debug Mode</h2>
      <label class="flex items-center gap-2">
        <input
          v-model="debugMode"
          type="checkbox"
          class="checkbox checkbox-primary"
        />
        Enable Debug Mode
      </label>
      <label class="flex items-center gap-2 mt-4">
        <input
          v-model="showAllCollections"
          type="checkbox"
          class="checkbox checkbox-primary"
        />
        Show All Collections
      </label>

      <div v-if="debugMode" class="mt-4">
        <h3 class="font-semibold">Collections Array:</h3>
        <pre class="bg-base-200 p-2 rounded">{{ collections }}</pre>
        <h3 class="font-semibold mt-4">Uncollected Art Array:</h3>
        <pre class="bg-base-200 p-2 rounded">{{ uncollectedArt }}</pre>
        <h3 class="font-semibold mt-4">Highlighted Collection:</h3>
        <pre class="bg-base-200 p-2 rounded">{{
          artStore.currentCollection
        }}</pre>
      </div>
    </div>

    <!-- Add New Collection -->
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

    <!-- Highlighted Collection -->
    <div class="my-6">
      <h2 class="text-lg font-bold text-secondary">
        ⭐ Highlighted Collection
      </h2>
      <div v-if="artStore.currentCollection" class="p-4 bg-base-200 rounded">
        {{ artStore.currentCollection.label }}
      </div>
      <div v-else class="text-gray-500">No collection highlighted.</div>
    </div>

    <!-- User's Art Collections -->
    <div v-if="filteredCollections.length" class="my-6">
      <h2 class="text-lg font-bold text-primary">
        🖼️ {{ showAllCollections ? 'All' : 'Your' }} Art Collections
      </h2>
      <div
        v-for="collection in filteredCollections"
        :key="collection.id"
        class="p-4 border rounded my-4"
      >
        <div class="flex items-center justify-between">
          <h3
            class="font-semibold text-secondary cursor-pointer"
            @click="highlightCollection(collection)"
          >
            {{ collection.label }}
          </h3>
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
          >
            <template #actions>
              <button
                class="btn btn-primary btn-sm"
                @click="openAddToCollectionPopup(art)"
              >
                ➕ Add to Collection
              </button>
            </template>
          </art-card>
        </div>
      </div>
    </div>

    <!-- Popup for Adding Art -->
    <div
      v-if="showAddToCollectionPopup"
      class="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-4 rounded shadow-md">
        <h3 class="font-semibold text-lg mb-4">Add Art to Collection</h3>

        <!-- Select Existing Collection -->
        <label class="block mb-2">Select Existing Collection:</label>
        <select
          v-model="selectedCollectionId"
          class="select select-bordered w-full mb-4"
        >
          <option
            v-for="collection in collections"
            :key="collection.id"
            :value="collection.id"
          >
            {{ collection.label }}
          </option>
          <option :value="null">Create New Collection</option>
        </select>

        <!-- Input for New Collection Label -->
        <div v-if="selectedCollectionId === null">
          <label class="block mb-2">New Collection Label:</label>
          <input
            v-model="newCollectionLabel"
            type="text"
            class="input input-bordered w-full"
            placeholder="Enter new collection label"
          />
        </div>

        <div class="flex gap-4 mt-4">
          <button class="btn btn-primary" @click="addArtToSelectedCollection">
            Confirm
          </button>
          <button class="btn btn-error" @click="closeAddToCollectionPopup">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const userStore = useUserStore()

// States
const newCollectionLabel = ref('')
const debugMode = ref(false)
const showAllCollections = ref(false)
const filteredCollections = computed(() => {
  if (showAllCollections.value) {
    return artStore.collections
  }
  return artStore.collections.filter(
    (collection) => collection.userId === userStore.userId,
  )
})
const collections = computed(() => artStore.collections as ArtCollection[])
const uncollectedArt = computed(() => artStore.uncollectedArt as Art[])
const showAddToCollectionPopup = ref(false)
const selectedCollectionId = ref<number | null>(null)
const currentArt = ref<Art | null>(null)

const openAddToCollectionPopup = (art: Art) => {
  currentArt.value = art
  showAddToCollectionPopup.value = true
}

const closeAddToCollectionPopup = () => {
  showAddToCollectionPopup.value = false
  currentArt.value = null
}

// Lifecycle: Fetch initial data
const loadInitialData = async () => {
  try {
    await artStore.fetchCollections()
    await artStore.fetchUncollectedArt()
  } catch (error) {
    console.error('Error loading initial data:', error)
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

const highlightCollection = (collection: ArtCollection) => {
  artStore.currentCollection = collection
}

const deleteCollection = async (collectionId: number) => {
  if (!confirm('Are you sure you want to delete this collection?')) return

  try {
    await artStore.deleteCollection(collectionId)
  } catch (error) {
    console.error('Error deleting collection:', error)
  }
}

const addArtToSelectedCollection = async () => {
  if (!selectedCollectionId.value || !currentArt.value) return

  try {
    await artStore.addArtToCollection({
      artId: currentArt.value.id,
      collectionId: selectedCollectionId.value,
      label: newCollectionLabel.value,
    })
    closeAddToCollectionPopup()
  } catch (error) {
    console.error('Error adding art to collection:', error)
  }
}

const removeArtFromCollection = async (artId: number, collectionId: number) => {
  if (!confirm('Are you sure you want to remove this art from the collection?'))
    return

  try {
    await artStore.removeArtFromCollection(artId, collectionId)
  } catch (error) {
    console.error('Error removing art from collection:', error)
  }
}

// Fetch data on mount
loadInitialData()
</script>
