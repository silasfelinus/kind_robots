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

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from './../../../stores/userStore'
import { useGameStore } from './../../../stores/gameStore'
import { useGalleryStore } from './../../../stores/galleryStore'

const userStore = useUserStore()
const gameStore = useGameStore()
const galleryStore = useGalleryStore()
const username = ref(userStore.user?.username || '') // Get initial username from user store
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
const selectAvatar = (image: string) => {
  selectedAvatar.value = image
}

// Save the profile including the selected avatar
const saveProfile = async () => {
  const userId = userStore.user?.id // Get user ID from userStore

  if (userId !== undefined) {
    // Update the User model
    const response = await userStore.updateUserInfo({
      username: username.value,
      avatarImage: selectedAvatar.value, // Use the selected avatar
    })

    if (response.success) {
      console.log('Profile updated successfully')
    } else {
      console.error('Failed to update profile:', response.message)
    }
  } else {
    console.error('User ID is undefined, unable to save profile.')
  }
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
