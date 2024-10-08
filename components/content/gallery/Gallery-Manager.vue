<template>
  <div class="p-4 bg-white rounded shadow">
    <h2 class="text-lg font-bold mb-4">Gallery Management</h2>

    <div class="mb-4">
      <input
        v-model="newGallery.name"
        type="text"
        placeholder="Gallery name"
        class="input input-bordered"
      />
    </div>

    <button class="btn btn-primary" @click="addGallery">Add Gallery</button>

    <div class="grid gap-4 mt-6">
      <div v-for="gallery in galleries" :key="gallery.id" class="card bordered">
        <div class="card-body">
          <h2 class="card-title">
            {{ gallery.name }}
          </h2>

          <div class="card-actions">
            <button
              class="btn btn-ghost btn-xs rounded-btn"
              @click="deleteGallery(gallery.id)"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGalleryStore } from '../../../stores/galleryStore'
import { useErrorStore } from '../../../stores/errorStore'
import { useStatusStore } from '../../../stores/statusStore'

const errorStore = useErrorStore()
const statusStore = useStatusStore()
const galleryStore = useGalleryStore()
const newGallery = ref({ name: '' })

const galleries = galleryStore.$state.galleries

const addGallery = async () => {
  try {
    const userId = 1 // Fetch this from the logged-in user's session/store
    await galleryStore.addGallery({ ...newGallery.value, userId })
    newGallery.value.name = ''
    statusStore.addStatus({
      message: 'Gallery added successfully',
      type: 'success' as StatusType,
    })
  } catch (error) {
    errorStore.addError(ErrorType.GENERAL_ERROR, error)
  }
}

const deleteGallery = async (id: number) => {
  try {
    const userId = 1 // Assuming you fetch this from the logged-in user's session/store
    await galleryStore.deleteGallery(id, userId)
    statusStore.addStatus({
      message: 'Gallery added successfully',
      type: 'success' as StatusType, // Explicitly casting
    })
  } catch (error) {
    errorStore.addError(ErrorType.GENERAL_ERROR, error)
  }
}
</script>

<style scoped>
.rounded-btn {
  border-radius: 9999px;
}
</style>
