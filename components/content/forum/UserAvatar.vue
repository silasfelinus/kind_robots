<template>
  <div class="flex items-center justify-center">
    <img
      :src="avatarUrl"
      :alt="`${username}'s avatar`"
      class="rounded-full border-2 border-accent object-cover"
      @error="handleAvatarError"
    />
  </div>
  <div class="text-center mt-2">{{ username }}</div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useUserStore } from '../../../stores/userStore'

// Props
const props = defineProps<{ userId?: number }>()

// User Store
const userStore = useUserStore()

// State
const avatarUrl = ref('/images/kindart.webp') // Default avatar
const effectiveUserId = computed(() => props.userId ?? userStore.userId)
const username = computed(() => userStore.username || 'Guest')

// Helper to determine if the image is base64 or raw data
const isImageData = (data: string): boolean => {
  return data.startsWith('data:image/') || /^[A-Za-z0-9+/]+={0,2}$/.test(data)
}

// Fetch the avatar URL
const fetchAvatar = async () => {
  if (!effectiveUserId.value) {
    console.warn(`[Avatar Component] No valid userId. Using default avatar.`)
    return
  }

  try {
    const userImage = await userStore.userImage(effectiveUserId.value)

    // Check if the userImage is raw data or a URL
    if (userImage && isImageData(userImage)) {
      avatarUrl.value = `data:image/png;base64,${userImage}`
    } else {
      avatarUrl.value = userImage || '/images/kindart.webp'
    }

    console.debug(
      `[Avatar Component] Fetched avatar for userId: ${effectiveUserId.value}`,
    )
  } catch (error) {
    console.error(`[Avatar Component] Failed to fetch avatar:`, error)
  }
}

// Handle avatar loading errors
const handleAvatarError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement
  console.warn(
    `[Avatar Component] Failed to load avatar. Setting default avatar.`,
  )
  imgElement.src = '/images/kindart.webp'
}

// Watch for changes in user.artImageId
watch(
  () => userStore.user?.artImageId, // Watched value
  async (newValue, oldValue) => {
    console.info(
      `[Avatar Component] Detected artImageId change: ${oldValue} -> ${newValue}`,
    )
    await fetchAvatar() // Refetch avatar whenever the artImageId changes
  },
)

// Lifecycle Hook
onMounted(fetchAvatar)
</script>

<style scoped>
img {
  height: auto;
  max-width: 50%; /* Ensures image is no more than 50% of its container */
  aspect-ratio: 1 / 1; /* Maintains a perfect circle */
}
</style>
