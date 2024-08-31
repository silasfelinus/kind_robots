<template>
  <div class="user-control">
    <div>
      <label for="avatar">Choose your avatar:</label>
      <div class="avatar-selection">
        <div
          v-for="image in avatarImages"
          :key="image"
          class="avatar-option"
          @click="selectAvatar(image)"
        >
          <img
            :src="image"
            :alt="`Avatar ${image}`"
            :class="{ selected: selectedAvatar === image }"
          />
        </div>
      </div>
    </div>
    <div>
      <label for="username">Username:</label>
      <input
        id="username"
        v-model="username"
        class="mt-2 p-2 border rounded w-full"
      />
    </div>
    <button
      class="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      @click="saveProfile"
    >
      Save Profile
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from './../../../stores/gameStore'
import { useGalleryStore } from './../../../stores/galleryStore'

const gameStore = useGameStore()
const galleryStore = useGalleryStore()
const username = ref(gameStore.user?.username || '')
const selectedAvatar = ref('')

// Load the avatar gallery and set the default avatar
onMounted(async () => {
  await galleryStore.fetchGalleries()
  galleryStore.setGalleryByName('avatar')
  selectedAvatar.value =
    gameStore.currentPlayer?.avatarImage || galleryStore.currentImage
})

// Get avatar images from the gallery
const avatarImages = computed(() => {
  return galleryStore.imagePathsByGalleryName('avatar')
})

// Handle avatar selection
const selectAvatar = (image) => {
  selectedAvatar.value = image
}

// Save the profile including the selected avatar
const saveProfile = async () => {
  await gameStore.updatePlayer(gameStore.currentPlayer?.id, {
    username: username.value,
    avatarImage: selectedAvatar.value,
  })
}
</script>

<style scoped>
.user-control {
  padding: 1rem;
}

.avatar-selection {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
}

.avatar-option {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 50%;
}

.avatar-option img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}

.avatar-option.selected {
  border-color: blue;
}
</style>
